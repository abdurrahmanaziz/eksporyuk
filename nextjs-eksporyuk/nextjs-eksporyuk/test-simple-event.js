import { PrismaClient } from '@prisma/client';
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

    // Try exact same way as API does it
    const event = await prisma.product.create({
      data: {
        creatorId: admin.id,
        name: 'Simple Test Event',
        slug: `simple-${Date.now()}`,
        checkoutSlug: `checkout-${Date.now()}`,
        productType: 'EVENT',
        price: 100000,
        eventDate: new Date(),
        affiliateEnabled: true,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30
      }
    });

    console.log('✅ Event created:', event.id);
    console.log('   Commission:', event.affiliateCommissionRate);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
