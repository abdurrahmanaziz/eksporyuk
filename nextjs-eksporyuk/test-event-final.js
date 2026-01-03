const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

async function testEventCreation() {
  try {
    console.log('Testing event creation...\n');
    
    // Get first admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!admin) {
      console.error('❌ No admin user found');
      process.exit(1);
    }
    
    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    
    // Create test event
    const testEvent = await prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Test Event - JS Test',
        slug: `test-event-js-${Date.now()}`,
        description: 'Created via test script',
        productType: 'EVENT',
        price: 500000,
        maxParticipants: 100,
        creatorId: admin.id,
        affiliateEnabled: true,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        creator: { select: { name: true } }
      }
    });
    
    console.log('\n✅ Event created successfully!');
    console.log(`   Name: ${testEvent.name}`);
    console.log(`   Slug: ${testEvent.slug}`);
    console.log(`   Max Participants: ${testEvent.maxParticipants}`);
    console.log(`   Affiliate Enabled: ${testEvent.affiliateEnabled}`);
    console.log(`   Commission Type: ${testEvent.commissionType}`);
    console.log(`   Commission Rate: ${testEvent.affiliateCommissionRate}%`);
    console.log(`   Creator: ${testEvent.creator.name}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEventCreation();
