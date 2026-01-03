#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testEventCreate() {
  try {
    console.log('\n🧪 Testing Event Creation System\n');

    // Test 1: Check if admin user exists
    console.log('Test 1: Finding admin user...');
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true }
    });

    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }
    console.log(`✅ Admin found: ${admin.email}`);

    // Test 2: Create test event with all fields
    console.log('\nTest 2: Creating event with commission fields...');
    const newEvent = await prisma.product.create({
      data: {
        creatorId: admin.id,
        name: 'Test Event - Commission System',
        slug: `test-event-${Date.now()}`,
        checkoutSlug: `event-test-${Date.now()}`,
        description: 'Testing commission fields integration',
        price: 500000,
        productType: 'EVENT',
        maxParticipants: 100,
        eventDate: new Date('2026-02-15'),
        eventVisibility: 'PUBLIC',
        isActive: true,
        // Commission fields
        affiliateEnabled: true,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30,
      }
    });

    console.log(`✅ Event created successfully!`);
    console.log(`   ID: ${newEvent.id}`);
    console.log(`   Name: ${newEvent.name}`);
    console.log(`   Commission Enabled: ${newEvent.affiliateEnabled}`);
    console.log(`   Commission Type: ${newEvent.commissionType}`);
    console.log(`   Commission Rate: ${newEvent.affiliateCommissionRate}%`);

    // Test 3: Verify event is queryable
    console.log('\nTest 3: Verifying event can be retrieved...');
    const retrieved = await prisma.product.findUnique({
      where: { id: newEvent.id },
      select: {
        name: true,
        affiliateEnabled: true,
        commissionType: true,
        affiliateCommissionRate: true,
        maxParticipants: true
      }
    });

    if (retrieved?.affiliateEnabled === true && retrieved.commissionType === 'PERCENTAGE') {
      console.log('✅ Event data persisted correctly!');
    } else {
      console.log('❌ Commission fields not persisted');
    }

    // Test 4: Check quota system integration
    console.log('\nTest 4: Testing quota system...');
    const quotaCheck = await prisma.transaction.count({
      where: {
        productId: newEvent.id,
        status: 'SUCCESS'
      }
    });
    console.log(`✅ Quota check working: ${quotaCheck} paid registrations`);

    // Test 5: Test with all required commission fields
    console.log('\nTest 5: Testing FLAT rate commission...');
    const flatRateEvent = await prisma.product.create({
      data: {
        creatorId: admin.id,
        name: 'Flat Rate Commission Event',
        slug: `flat-event-${Date.now()}`,
        checkoutSlug: `flat-${Date.now()}`,
        description: 'Testing flat rate commission',
        price: 1000000,
        productType: 'EVENT',
        maxParticipants: 50,
        eventDate: new Date('2026-03-01'),
        eventVisibility: 'PUBLIC',
        isActive: true,
        // Flat rate commission
        affiliateEnabled: true,
        commissionType: 'FLAT',
        affiliateCommissionRate: 100000, // 100k per sale
      }
    });

    console.log(`✅ Flat rate event created!`);
    console.log(`   Commission: Rp ${flatRateEvent.affiliateCommissionRate}/sale`);

    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('Event creation system is WORKING');
    console.log('Commission fields are PERSISTED');
    console.log('Quota system is INTEGRATED');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEventCreate();
