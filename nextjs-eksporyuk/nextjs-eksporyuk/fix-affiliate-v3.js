/**
 * FIX AFFILIATE CONVERSIONS - v3 with verbose error logging
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
  console.log('\n=== FIX AFFILIATE CONVERSIONS v3 ===\n');
  
  // Load Sejoli affiliates
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const data = JSON.parse(fs.readFileSync(sejoliPath, 'utf-8'));
  
  const affiliateByCode = new Map();
  data.affiliates.forEach(a => {
    affiliateByCode.set(String(a.affiliate_code), {
      userId: a.user_id,
      email: a.user_email,
      name: a.display_name,
      code: a.affiliate_code
    });
  });
  console.log('Affiliates indexed by code:', affiliateByCode.size);
  
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
  
  // Get all users by email
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true },
    where: { email: { not: undefined } }
  });
  const userByEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u]));
  console.log('Users in DB:', allUsers.length);
  
  // Get existing profiles
  const existingProfiles = await prisma.affiliateProfile.findMany();
  const profileByUserId = new Map(existingProfiles.map(p => [p.userId, p]));
  console.log('Existing profiles:', existingProfiles.length);
  
  let created = 0;
  let profilesCreated = 0;
  let totalCommission = 0;
  let errors = {
    noAffiliateInfo: 0,
    noUser: 0,
    profileCreateFailed: 0,
    conversionCreateFailed: 0
  };
  
  // Process first 10 for test
  for (const tx of txNeedingConversion) {
    const meta = tx.metadata;
    const affiliateCode = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    const productId = Number(meta?.product_id || meta?.original?.product_id || 0);
    
    const affiliateInfo = affiliateByCode.get(affiliateCode);
    if (!affiliateInfo) {
      errors.noAffiliateInfo++;
      continue;
    }
    
    const user = userByEmail.get(affiliateInfo.email?.toLowerCase());
    if (!user) {
      errors.noUser++;
      continue;
    }
    
    // Get or create profile
    let profile = profileByUserId.get(user.id);
    
    if (!profile) {
      try {
        // Generate unique code
        const codeBase = `AFF${affiliateInfo.code}`;
        const existingCode = await prisma.affiliateProfile.findUnique({
          where: { affiliateCode: codeBase }
        });
        
        const finalCode = existingCode ? `${codeBase}_${Date.now().toString(36)}` : codeBase;
        
        profile = await prisma.affiliateProfile.create({
          data: {
            userId: user.id,
            affiliateCode: finalCode,
            sejoliAffiliateId: String(affiliateInfo.userId),
            status: 'ACTIVE'
          }
        });
        profilesCreated++;
        profileByUserId.set(user.id, profile);
        console.log('Created profile:', finalCode, 'for', affiliateInfo.email);
      } catch (err) {
        // Try to fetch existing
        profile = await prisma.affiliateProfile.findUnique({
          where: { userId: user.id }
        });
        if (!profile) {
          console.log('Failed to create profile for', affiliateInfo.email, ':', err.message);
          errors.profileCreateFailed++;
          continue;
        }
      }
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
      errors.conversionCreateFailed++;
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Profiles created:', profilesCreated);
  console.log('Conversions created:', created);
  console.log('Commission added:', 'Rp', totalCommission.toLocaleString('id-ID'));
  console.log('Errors:', errors);
  
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
