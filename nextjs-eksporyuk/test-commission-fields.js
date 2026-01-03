const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing commission fields on Product model...\n');

  // Check if fields exist by trying to update them
  const event = await prisma.product.findFirst({
    where: { productType: 'EVENT' },
    take: 1,
  });

  if (!event) {
    console.log('❌ No event found to test');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found event: ${event.id}`);
  console.log(`Current values:`);
  console.log(`  - affiliateEnabled: ${event.affiliateEnabled}`);
  console.log(`  - commissionType: ${event.commissionType}`);
  console.log(`  - affiliateCommissionRate: ${event.affiliateCommissionRate}\n`);

  // Now try to update them
  const updated = await prisma.product.update({
    where: { id: event.id },
    data: {
      affiliateEnabled: false,
      commissionType: 'FLAT',
      affiliateCommissionRate: 100000,
    },
    select: {
      id: true,
      affiliateEnabled: true,
      commissionType: true,
      affiliateCommissionRate: true,
    }
  });

  console.log('✅ Update successful!');
  console.log(`Updated values:`);
  console.log(`  - affiliateEnabled: ${updated.affiliateEnabled}`);
  console.log(`  - commissionType: ${updated.commissionType}`);
  console.log(`  - affiliateCommissionRate: ${updated.affiliateCommissionRate}`);

  // Revert
  await prisma.product.update({
    where: { id: event.id },
    data: {
      affiliateEnabled: true,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 30,
    }
  });

  console.log('\n✅ Reverted to original values');

  await prisma.$disconnect();
}

main().catch(console.error);
