/**
 * FIX AFFILIATE CONVERSIONS - FINAL
 * Strategy: Only use existing profiles, link by email
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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

async function main() {
  console.log('\n=== FIX AFFILIATE CONVERSIONS - FINAL ===\n');
  
  // Load Sejoli affiliates
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const data = JSON.parse(fs.readFileSync(sejoliPath, 'utf-8'));
  
  const affiliateByCode = new Map();
  data.affiliates.forEach(a => {
    affiliateByCode.set(String(a.affiliate_code), {
      email: a.user_email?.toLowerCase(),
      name: a.display_name
    });
  });
  console.log('Sejoli affiliates:', affiliateByCode.size);
  
  // Get all users by email
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const userByEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u]));
  console.log('Users in DB:', allUsers.length);
  
  // Get ALL existing affiliate profiles and map to email
  const existingProfiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { email: true } } }
  });
  const profileByEmail = new Map();
  existingProfiles.forEach(p => {
    if (p.user?.email) {
      profileByEmail.set(p.user.email.toLowerCase(), p);
    }
  });
  console.log('Existing profiles (with email map):', profileByEmail.size);
  
  // Get existing conversions
  const existingConversions = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  });
  const hasConversion = new Set(existingConversions.map(c => c.transactionId));
  console.log('Existing conversions:', hasConversion.size);
  
  // Get SUCCESS transactions
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
  
  let created = 0;
  let totalCommission = 0;
  let stats = {
    noAffiliateData: 0,
    noProfile: 0,
    convError: 0
  };
  
  for (const tx of txNeedingConversion) {
    const meta = tx.metadata;
    const affiliateCode = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    const productId = Number(meta?.product_id || meta?.original?.product_id || 0);
    
    // Get affiliate email from Sejoli
    const affData = affiliateByCode.get(affiliateCode);
    if (!affData?.email) {
      stats.noAffiliateData++;
      continue;
    }
    
    // Find profile by email
    const profile = profileByEmail.get(affData.email);
    if (!profile) {
      stats.noProfile++;
      continue;
    }
    
    // Calculate commission
    const commission = COMMISSION_MAP[productId] || 0;
    const amount = Number(tx.amount);
    const rate = amount > 0 ? (commission / amount) * 100 : 0;
    
    // Create conversion
    try {
      await prisma.affiliateConversion.create({
        data: {
          transactionId: tx.id,
          affiliateId: profile.id,
          commissionAmount: commission,
          commissionRate: rate,
          paidOut: true,
          paidOutAt: tx.paidAt || tx.createdAt
        }
      });
      created++;
      totalCommission += commission;
    } catch (err) {
      stats.convError++;
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Conversions created:', created);
  console.log('Commission added:', 'Rp', totalCommission.toLocaleString('id-ID'));
  console.log('Stats:', stats);
  
  // Final stats
  const finalConversions = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: { id: true }
  });
  
  console.log('\n=== FINAL TOTALS ===');
  console.log('Total conversions:', finalConversions._count.id);
  console.log('Total commission:', 'Rp', Number(finalConversions._sum.commissionAmount || 0).toLocaleString('id-ID'));
  
  await prisma.$disconnect();
}

main().catch(console.error);
