/**
 * FIX AFFILIATE CONVERSIONS - FINAL VERSION
 * 
 * Key insight: affiliate_id in orders = affiliate_code in affiliates array
 * NOT user_id!
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Commission mapping per Sejoli product
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
  
  // 1. Load Sejoli data
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const raw = fs.readFileSync(sejoliPath, 'utf-8');
  const data = JSON.parse(raw);
  
  // 2. Build affiliate map: affiliate_code -> affiliate data
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
  
  // 3. Get all transactions with affiliate_id in metadata but NO conversion
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'SUCCESS',
      metadata: { not: null }
    },
    include: {
      conversions: true
    }
  });
  
  console.log('Total SUCCESS transactions:', transactions.length);
  
  // Filter transactions that have affiliate_id but no conversion
  const txNeedingConversion = transactions.filter(tx => {
    if (tx.conversions.length > 0) return false;
    const meta = tx.metadata;
    const affId = meta?.affiliate_id || meta?.original?.affiliate_id;
    return affId && affId !== '0' && affId !== 0;
  });
  
  console.log('Transactions needing conversion:', txNeedingConversion.length);
  
  if (txNeedingConversion.length === 0) {
    console.log('No transactions need affiliate conversion!');
    await prisma.$disconnect();
    return;
  }
  
  // 4. Get all users by email for matching
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    where: { email: { not: null } }
  });
  const userByEmail = new Map(allUsers.map(u => [u.email?.toLowerCase(), u]));
  console.log('Users in DB:', allUsers.length);
  
  // 5. Get existing affiliate profiles
  const existingProfiles = await prisma.affiliateProfile.findMany({
    include: { user: true }
  });
  const profileByUserId = new Map(existingProfiles.map(p => [p.userId, p]));
  const profileBySejoliId = new Map();
  existingProfiles.forEach(p => {
    if (p.sejoliAffiliateId) {
      profileBySejoliId.set(String(p.sejoliAffiliateId), p);
    }
  });
  console.log('Existing affiliate profiles:', existingProfiles.length);
  
  // 6. Process each transaction
  let created = 0;
  let skipped = 0;
  let noAffiliate = 0;
  let noUser = 0;
  let profilesCreated = 0;
  let totalCommission = 0;
  
  for (const tx of txNeedingConversion) {
    const meta = tx.metadata;
    const affiliateCode = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    const productId = Number(meta?.product_id || meta?.original?.product_id || 0);
    
    // Get affiliate info using affiliate_code
    const affiliateInfo = affiliateByCode.get(affiliateCode);
    
    if (!affiliateInfo) {
      noAffiliate++;
      continue;
    }
    
    // Find user by email
    const user = userByEmail.get(affiliateInfo.email?.toLowerCase());
    if (!user) {
      noUser++;
      continue;
    }
    
    // Get or create affiliate profile
    let profile = profileByUserId.get(user.id);
    
    if (!profile) {
      // Check by sejoliAffiliateId
      profile = profileBySejoliId.get(String(affiliateInfo.userId));
      
      if (!profile) {
        // Create new profile
        try {
          profile = await prisma.affiliateProfile.create({
            data: {
              userId: user.id,
              affiliateCode: `SEJ${affiliateInfo.code}`,
              sejoliAffiliateId: String(affiliateInfo.userId),
              status: 'ACTIVE'
            }
          });
          profilesCreated++;
          profileByUserId.set(user.id, profile);
          profileBySejoliId.set(String(affiliateInfo.userId), profile);
        } catch (err) {
          // Profile might exist, fetch it
          profile = await prisma.affiliateProfile.findUnique({
            where: { userId: user.id }
          });
          if (!profile) {
            skipped++;
            continue;
          }
        }
      }
    }
    
    // Calculate commission
    const commission = COMMISSION_MAP[productId] || 0;
    
    // Create conversion
    try {
      await prisma.affiliateConversion.create({
        data: {
          transactionId: tx.id,
          affiliateId: profile.id,
          amount: tx.amount,
          commission: commission,
          status: 'PAID',
          paidAt: tx.paidAt || tx.createdAt
        }
      });
      created++;
      totalCommission += commission;
    } catch (err) {
      skipped++;
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Profiles created:', profilesCreated);
  console.log('Conversions created:', created);
  console.log('Total commission:', 'Rp', totalCommission.toLocaleString('id-ID'));
  console.log('Skipped (duplicate/error):', skipped);
  console.log('No affiliate info found:', noAffiliate);
  console.log('No user match:', noUser);
  
  // Final stats
  const finalConversions = await prisma.affiliateConversion.aggregate({
    _sum: { commission: true },
    _count: { id: true }
  });
  
  console.log('\n=== FINAL STATS ===');
  console.log('Total conversions:', finalConversions._count.id);
  console.log('Total commission:', 'Rp', finalConversions._sum.commission?.toLocaleString('id-ID'));
  
  await prisma.$disconnect();
}

main().catch(console.error);
