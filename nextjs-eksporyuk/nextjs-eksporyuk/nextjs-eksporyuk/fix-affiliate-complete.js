/**
 * FIX AFFILIATE CONVERSIONS - COMPLETE
 * 1. Create AffiliateProfile for missing affiliates
 * 2. Create AffiliateConversion records
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

const COMMISSION_MAP = {
  2: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0,
  16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0,
  26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0, 33: 0, 34: 0, 35: 0,
  36: 0, 37: 0, 38: 0, 39: 0, 4040: 0,
  16219: 97000, 19044: 80000, 18728: 100000, 18608: 150000,
  18585: 50000, 16279: 200000, 10063: 100000, 4254: 200000,
  7046: 50000, 4251: 150000, 18587: 130000, 2063: 50000,
  4047: 275000, 10061: 300000, 4043: 325000, 18609: 45000,
  18739: 45000, 19247: 100000
};

function generateShortCode(length = 8) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

async function main() {
  console.log('\n=== FIX AFFILIATE COMPLETE ===\n');
  
  // Load Sejoli data
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const data = JSON.parse(fs.readFileSync(sejoliPath, 'utf-8'));
  
  // Build affiliate_code -> email map
  const affiliateByCode = new Map();
  data.affiliates.forEach(a => {
    affiliateByCode.set(String(a.affiliate_code), {
      email: a.user_email?.toLowerCase(),
      name: a.display_name
    });
  });
  console.log('Sejoli affiliates:', affiliateByCode.size);
  
  // Get all users and map by email
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const userByEmail = new Map();
  allUsers.forEach(u => {
    if (u.email) {
      userByEmail.set(u.email.toLowerCase(), u);
    }
  });
  console.log('Users in DB:', allUsers.length);
  
  // Get existing profiles
  const existingProfiles = await prisma.affiliateProfile.findMany({
    select: { id: true, userId: true, affiliateCode: true, shortLink: true }
  });
  const profileByUserId = new Map(existingProfiles.map(p => [p.userId, p]));
  const usedCodes = new Set(existingProfiles.map(p => p.affiliateCode));
  const usedShortLinks = new Set(existingProfiles.map(p => p.shortLink));
  console.log('Existing profiles:', existingProfiles.length);
  
  // Get existing conversions
  const existingConversions = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  });
  const hasConversion = new Set(existingConversions.map(c => c.transactionId));
  console.log('Existing conversions:', hasConversion.size);
  
  // Get SUCCESS transactions with affiliate_id
  const transactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' }
  });
  
  const txNeedingConversion = transactions.filter(tx => {
    if (hasConversion.has(tx.id)) return false;
    const meta = tx.metadata;
    const affId = meta?.affiliate_id || meta?.original?.affiliate_id;
    return affId && affId !== '0' && affId !== 0;
  });
  console.log('Transactions needing conversion:', txNeedingConversion.length);
  
  // STEP 1: Create missing affiliate profiles
  console.log('\n--- Creating Missing Profiles ---');
  
  // Collect unique affiliate codes that need profiles
  const neededAffiliateCodes = new Set();
  txNeedingConversion.forEach(tx => {
    const meta = tx.metadata;
    const code = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    neededAffiliateCodes.add(code);
  });
  console.log('Unique affiliate codes needed:', neededAffiliateCodes.size);
  
  let profilesCreated = 0;
  for (const code of neededAffiliateCodes) {
    const affData = affiliateByCode.get(code);
    if (!affData?.email) continue;
    
    const user = userByEmail.get(affData.email);
    if (!user) continue;
    
    // Skip if profile already exists
    if (profileByUserId.has(user.id)) continue;
    
    // Generate unique codes
    let affiliateCode = `AFF${code}`;
    let suffix = 1;
    while (usedCodes.has(affiliateCode)) {
      affiliateCode = `AFF${code}_${suffix++}`;
    }
    
    let shortLink = generateShortCode();
    while (usedShortLinks.has(shortLink)) {
      shortLink = generateShortCode();
    }
    
    try {
      const profile = await prisma.affiliateProfile.create({
        data: {
          userId: user.id,
          affiliateCode: affiliateCode,
          shortLink: shortLink,
          isActive: true,
          applicationStatus: 'APPROVED'
        }
      });
      
      profilesCreated++;
      profileByUserId.set(user.id, profile);
      usedCodes.add(affiliateCode);
      usedShortLinks.add(shortLink);
    } catch (err) {
      console.log('Profile create error for', affData.email, ':', err.message.substring(0, 50));
    }
  }
  console.log('Profiles created:', profilesCreated);
  
  // Build email -> profile map (including new ones)
  const profileIdByEmail = new Map();
  for (const [userId, profile] of profileByUserId) {
    const user = allUsers.find(u => u.id === userId);
    if (user?.email) {
      profileIdByEmail.set(user.email.toLowerCase(), profile.id);
    }
  }
  console.log('Profile email map:', profileIdByEmail.size);
  
  // STEP 2: Create conversions
  console.log('\n--- Creating Conversions ---');
  
  let created = 0;
  let totalCommission = 0;
  let stats = { noAffData: 0, noProfile: 0, error: 0 };
  
  for (const tx of txNeedingConversion) {
    const meta = tx.metadata;
    const affiliateCode = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    const productId = Number(meta?.product_id || meta?.original?.product_id || 0);
    
    const affData = affiliateByCode.get(affiliateCode);
    if (!affData?.email) {
      stats.noAffData++;
      continue;
    }
    
    const profileId = profileIdByEmail.get(affData.email);
    if (!profileId) {
      stats.noProfile++;
      continue;
    }
    
    const commission = COMMISSION_MAP[productId] || 0;
    const amount = Number(tx.amount);
    const rate = amount > 0 ? (commission / amount) * 100 : 0;
    
    try {
      await prisma.affiliateConversion.create({
        data: {
          transactionId: tx.id,
          affiliateId: profileId,
          commissionAmount: commission,
          commissionRate: rate,
          paidOut: true,
          paidOutAt: tx.paidAt || tx.createdAt
        }
      });
      created++;
      totalCommission += commission;
    } catch (err) {
      stats.error++;
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Profiles created:', profilesCreated);
  console.log('Conversions created:', created);
  console.log('Commission added:', 'Rp', totalCommission.toLocaleString('id-ID'));
  console.log('Stats:', stats);
  
  // Final stats
  const final = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  console.log('\n=== FINAL TOTALS ===');
  console.log('Total conversions:', final._count.id);
  console.log('Total commission:', 'Rp', Number(final._sum.commissionAmount || 0).toLocaleString('id-ID'));
  
  await prisma.$disconnect();
}

main().catch(console.error);
