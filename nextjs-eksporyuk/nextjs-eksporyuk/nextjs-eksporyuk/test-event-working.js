import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function test() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.log('No admin found');
      return;
    }

    const event = await prisma.product.create({
      data: {
        creatorId: admin.id,
        name: 'Test Event - Working',
        slug: `test-${Date.now()}`,
        checkoutSlug: `checkout-${Date.now()}`,
        description: 'Testing event creation',
        productType: 'EVENT',
        price: 100000,
        eventDate: new Date(),
        affiliateEnabled: true,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30
      }
    });

    console.log('✅ Event created successfully!');
    console.log(`   ID: ${event.id}`);
    console.log(`   Name: ${event.name}`);
    console.log(`   Commission Rate: ${event.affiliateCommissionRate}%`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
