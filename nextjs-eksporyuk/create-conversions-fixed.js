import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all transactions with affiliateId
const transactions = await prisma.transaction.findMany({
  where: { 
    affiliateId: { not: null },
    status: 'SUCCESS'
  },
  select: {
    id: true,
    affiliateId: true, // This is User.id
    amount: true,
    createdAt: true
  }
});

console.log(`\n📊 Found ${transactions.length} transactions with affiliate\n`);

// Build User.id → AffiliateProfile.id mapping
const userIdToProfileId = new Map();

for (const tx of transactions) {
  if (!userIdToProfileId.has(tx.affiliateId)) {
    const profile = await prisma.affiliateProfile.findUnique({
      where: { userId: tx.affiliateId },
      select: { id: true }
    });
    
    if (profile) {
      userIdToProfileId.set(tx.affiliateId, profile.id);
    }
  }
}

console.log(`✅ Mapped ${userIdToProfileId.size} User IDs to AffiliateProfile IDs\n`);

const batchSize = 500;
let created = 0;
let skipped = 0;

for (let i = 0; i < transactions.length; i += batchSize) {
  const batch = transactions.slice(i, i + batchSize);
  
  try {
    const conversions = batch
      .filter(tx => userIdToProfileId.has(tx.affiliateId))
      .map(tx => {
        const rate = 0.3; // Default 30%
        return {
          transactionId: tx.id,
          affiliateId: userIdToProfileId.get(tx.affiliateId), // Use AffiliateProfile.id!
          commissionAmount: tx.amount * rate,
          commissionRate: rate,
          paidOut: false
        };
      });
    
    await prisma.affiliateConversion.createMany({
      data: conversions,
      skipDuplicates: true
    });
    
    created += conversions.length;
    console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Created ${conversions.length} conversions (total: ${created})`);
  } catch (error) {
    console.error(`❌ Batch error:`, error.message);
    skipped += batch.length;
  }
}

console.log(`\n✅ Created ${created} AffiliateConversion records`);
console.log(`⏭ Skipped: ${skipped}`);

const final = await prisma.affiliateConversion.count();
console.log(`\n📊 Total AffiliateConversion in DB: ${final}`);

await prisma.$disconnect();
