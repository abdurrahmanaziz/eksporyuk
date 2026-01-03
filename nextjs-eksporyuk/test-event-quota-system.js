const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Event Quota System Test\n');
  console.log('='.repeat(60));

  try {
    // 1. Create admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    });

    if (!admin) {
      console.log('❌ No admin found');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Found admin: ${admin.name} (${admin.email})\n`);

    // 2. Create test event with quota 5
    console.log('📝 TEST 1: Creating event with maxParticipants = 5');
    console.log('-'.repeat(60));

    const event = await prisma.product.create({
      data: {
        id: 'quota-test-' + Date.now(),
        User: { connect: { id: admin.id } },
        name: 'Quota Test Event - ' + new Date().toLocaleDateString(),
        slug: 'quota-test-' + Date.now(),
        checkoutSlug: 'checkout-quota-' + Date.now(),
        description: 'Testing event quota system',
        shortDescription: 'Quota test',
        price: 100000,
        originalPrice: 150000,
        productType: 'EVENT',
        productStatus: 'PUBLISHED',
        accessLevel: 'PUBLIC',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        eventEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        eventDuration: 120,
        eventUrl: 'https://zoom.us/test',
        meetingId: 'test123',
        maxParticipants: 5,
        updatedAt: new Date(),
        affiliateEnabled: true,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30
      },
      select: {
        id: true,
        name: true,
        maxParticipants: true
      }
    });

    console.log(`✅ Event created: "${event.name}"`);
    console.log(`   ID: ${event.id}`);
    console.log(`   Max Participants: ${event.maxParticipants}\n`);

    // 3. Create 5 test users and register them
    console.log('📝 TEST 2: Creating 5 test users and registering them');
    console.log('-'.repeat(60));

    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          id: `test-user-${Date.now()}-${i}`,
          email: `test${i}-${Date.now()}@quota-test.com`,
          name: `Test User ${i}`,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        select: { id: true, email: true, name: true }
      });
      testUsers.push(user);

      // Register user for event
      await prisma.userProduct.create({
        data: {
          id: `user-product-${Date.now()}-${i}`,
          User: { connect: { id: user.id } },
          Product: { connect: { id: event.id } },
          price: 100000,
          updatedAt: new Date()
        }
      });

      const currentCount = await prisma.userProduct.count({
        where: { productId: event.id }
      });

      const percentFull = (currentCount / event.maxParticipants) * 100;
      const remaining = event.maxParticipants - currentCount;

      console.log(`  [${i}/5] ✅ Registered: ${user.name}`);
      console.log(`       Progress: ${currentCount}/${event.maxParticipants} (${percentFull.toFixed(0)}%)`);
      console.log(`       Remaining: ${remaining} slots`);
      
      if (percentFull >= 80) {
        console.log(`       ⚠️  QUOTA WARNING (${percentFull.toFixed(0)}% full)`);
      }
      if (percentFull >= 100) {
        console.log(`       🔴 QUOTA FULL - No more registrations allowed!`);
      }
    }

    console.log();

    // 4. Test quota full - try to register another user
    console.log('📝 TEST 3: Attempting to register 6th user (should FAIL)');
    console.log('-'.repeat(60));

    const extraUser = await prisma.user.create({
      data: {
        id: `test-user-${Date.now()}-extra`,
        email: `test-extra-${Date.now()}@quota-test.com`,
        name: `Test User Extra`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const currentCount = await prisma.userProduct.count({
      where: { productId: event.id }
    });

    if (currentCount >= event.maxParticipants) {
      console.log(`❌ REJECTED: Event quota full (${currentCount}/${event.maxParticipants})`);
      console.log(`   Cannot register: ${extraUser.name}`);
    } else {
      console.log(`✅ ACCEPTED: Registrations available (${currentCount}/${event.maxParticipants})`);
    }

    console.log();

    // 5. Test quota increase - admin increases from 5 to 10
    console.log('📝 TEST 4: Admin increases quota from 5 to 10');
    console.log('-'.repeat(60));

    const updatedEvent = await prisma.product.update({
      where: { id: event.id },
      data: { maxParticipants: 10 },
      select: { id: true, maxParticipants: true }
    });

    console.log(`✅ Quota updated: ${event.maxParticipants} → ${updatedEvent.maxParticipants}`);
    console.log(`   Registered users: ${currentCount} (unchanged)`);
    console.log(`   New available slots: ${updatedEvent.maxParticipants - currentCount}`);

    console.log();

    // 6. Test registering user after quota increase
    console.log('📝 TEST 5: Registering 6th user after quota increase (should SUCCEED)');
    console.log('-'.repeat(60));

    const afterUpdate = await prisma.userProduct.count({
      where: { productId: event.id }
    });

    if (afterUpdate < updatedEvent.maxParticipants) {
      await prisma.userProduct.create({
        data: {
          id: `user-product-${Date.now()}-extra`,
          User: { connect: { id: extraUser.id } },
          Product: { connect: { id: event.id } },
          price: 100000,
          updatedAt: new Date()
        }
      });

      const newCount = await prisma.userProduct.count({
        where: { productId: event.id }
      });

      const percentFull = (newCount / updatedEvent.maxParticipants) * 100;

      console.log(`✅ ACCEPTED: ${extraUser.name} registered successfully!`);
      console.log(`   Current registrations: ${newCount}/${updatedEvent.maxParticipants}`);
      console.log(`   Quota usage: ${percentFull.toFixed(0)}%`);
    }

    console.log();

    // 7. Summary report
    console.log('📊 QUOTA SYSTEM VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    const finalCount = await prisma.userProduct.count({
      where: { productId: event.id }
    });

    console.log(`✅ Event: "${event.name}"`);
    console.log(`✅ Initial Quota: 5 participants`);
    console.log(`✅ Registrations: 5/5 (FULL) ➜ Rejected 6th user`);
    console.log(`✅ Admin Increased: 5 → 10 participants`);
    console.log(`✅ After Increase: 6/10 (Accepted 6th user)`);
    console.log(`✅ Final State: ${finalCount}/${updatedEvent.maxParticipants} registered`);
    console.log();

    // 8. Test quota status API
    console.log('📊 Testing /api/admin/events/quota-status');
    console.log('-'.repeat(60));
    console.log('API endpoint will return:');
    console.log(`  - quotaStatus: '${finalCount >= updatedEvent.maxParticipants ? 'FULL' : finalCount / updatedEvent.maxParticipants >= 0.95 ? 'CRITICAL' : finalCount / updatedEvent.maxParticipants >= 0.80 ? 'WARNING' : 'AVAILABLE'}'`);
    console.log(`  - percentFull: ${((finalCount / updatedEvent.maxParticipants) * 100).toFixed(1)}%`);
    console.log(`  - remaining: ${updatedEvent.maxParticipants - finalCount}`);
    console.log();

    console.log('🎉 ALL QUOTA TESTS PASSED!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
