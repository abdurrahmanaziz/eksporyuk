/**
 * FIX AFFILIATE CONVERSIONS - BATCH VERSION
 * Creates conversions in batch for speed
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
  console.log('\n=== FIX AFFILIATE BATCH ===\n');
  
  // Load Sejoli
  const sejoliPath = path.join(__dirname, 'scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json');
  const data = JSON.parse(fs.readFileSync(sejoliPath, 'utf-8'));
  
  const affiliateByCode = new Map();
  data.affiliates.forEach(a => {
    affiliateByCode.set(String(a.affiliate_code), a.user_email?.toLowerCase());
  });
  
  // Get users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const userIdByEmail = new Map();
  allUsers.forEach(u => {
    if (u.email) userIdByEmail.set(u.email.toLowerCase(), u.id);
  });
  
  // Get profiles (now 199 with new ones created)
  const profiles = await prisma.affiliateProfile.findMany({
    select: { id: true, userId: true }
  });
  
  // Build email -> profileId
  const profileIdByEmail = new Map();
  profiles.forEach(p => {
    const user = allUsers.find(u => u.id === p.userId);
    if (user?.email) {
      profileIdByEmail.set(user.email.toLowerCase(), p.id);
    }
  });
  console.log('Profile email map:', profileIdByEmail.size);
  
  // Get existing conversions
  const existingConversions = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  });
  const hasConversion = new Set(existingConversions.map(c => c.transactionId));
  console.log('Existing conversions:', hasConversion.size);
  
  // Get transactions needing conversion
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
  
  // Prepare batch data
  const conversionsToCreate = [];
  let skipped = { noAff: 0, noProfile: 0 };
  
  for (const tx of txNeedingConversion) {
    const meta = tx.metadata;
    const affiliateCode = String(meta?.affiliate_id || meta?.original?.affiliate_id);
    const productId = Number(meta?.product_id || meta?.original?.product_id || 0);
    
    const email = affiliateByCode.get(affiliateCode);
    if (!email) {
      skipped.noAff++;
      continue;
    }
    
    const profileId = profileIdByEmail.get(email);
    if (!profileId) {
      skipped.noProfile++;
      continue;
    }
    
    const commission = COMMISSION_MAP[productId] || 0;
    const amount = Number(tx.amount);
    const rate = amount > 0 ? (commission / amount) * 100 : 0;
    
    conversionsToCreate.push({
      transactionId: tx.id,
      affiliateId: profileId,
      commissionAmount: commission,
      commissionRate: rate,
      paidOut: true,
      paidOutAt: tx.paidAt || tx.createdAt
    });
  }
  
  console.log('Conversions to create:', conversionsToCreate.length);
  console.log('Skipped:', skipped);
  
  // Batch create
  if (conversionsToCreate.length > 0) {
    const result = await prisma.affiliateConversion.createMany({
      data: conversionsToCreate,
      skipDuplicates: true
    });
    console.log('Created:', result.count);
  }
  
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
