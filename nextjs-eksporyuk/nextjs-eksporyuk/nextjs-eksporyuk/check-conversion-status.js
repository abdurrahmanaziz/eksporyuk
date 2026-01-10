import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const conversionCount = await prisma.affiliateConversion.count();
const transactionWithAffiliate = await prisma.transaction.count({
  where: { affiliateId: { not: null } }
});

console.log(`\n📊 CONVERSION STATUS\n`);
console.log(`Transactions with affiliate: ${transactionWithAffiliate}`);
console.log(`AffiliateConversion records: ${conversionCount}`);
console.log(`\n❌ MISSING: ${transactionWithAffiliate - conversionCount} conversions\n`);

if (conversionCount > 0) {
  const sample = await prisma.affiliateConversion.findMany({
    take: 5,
    include: {
      affiliate: { select: { name: true } },
      transaction: { select: { totalAmount: true } }
    }
  });
  console.log('Sample conversions:', sample);
}

await prisma.$disconnect();
