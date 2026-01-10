#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateMembership() {
  try {
    const userId = 'cae2eab3-e653-40e9-893d-2e98994ba004';
    const membershipId = 'mem_6bulan_ekspor';
    const transactionId = 'txn_1768036141053_lk8d7r75lh';

    console.log('\n=== MANUAL MEMBERSHIP ACTIVATION ===\n');
    console.log('User:', userId);
    console.log('Membership:', membershipId);
    console.log('Transaction:', transactionId);

    // Get membership
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    });

    if (!membership) {
      console.log('❌ Membership not found');
      return;
    }

    console.log('\n✅ Membership found:', membership.name);

    // Calculate end date
    const now = new Date();
    let endDate = new Date(now);

    switch (membership.duration) {
      case 'ONE_MONTH':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'THREE_MONTHS':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'SIX_MONTHS':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'TWELVE_MONTHS':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'LIFETIME':
        endDate.setFullYear(endDate.getFullYear() + 100);
        break;
    }

    console.log('Duration:', membership.duration);
    console.log('End Date:', endDate);

    // Deactivate old memberships
    await prisma.userMembership.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false,
        status: 'EXPIRED'
      }
    });

    console.log('\n✅ Deactivated old memberships');

    // Create new membership
    const userMembership = await prisma.userMembership.create({
      data: {
        id: `um_${transactionId}`,
        userId,
        membershipId,
        status: 'ACTIVE',
        isActive: true,
        activatedAt: now,
        startDate: now,
        endDate,
        price: 15980,
        transactionId,
        updatedAt: now
      }
    });

    console.log('✅ Created UserMembership:', userMembership.id);

    // Upgrade user role to MEMBER_PREMIUM
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: 'MEMBER_PREMIUM' }
    });

    console.log('✅ Upgraded user role to:', user.role);

    // Get groups/courses/products
    const [membershipGroups, membershipCourses, membershipProducts] = await Promise.all([
      prisma.membershipGroup.findMany({ where: { membershipId } }),
      prisma.membershipCourse.findMany({ where: { membershipId } }),
      prisma.membershipProduct.findMany({ where: { membershipId } })
    ]);

    console.log(`\nFound: ${membershipGroups.length} groups, ${membershipCourses.length} courses, ${membershipProducts.length} products`);

    // Auto-enroll
    for (const group of membershipGroups) {
      const existing = await prisma.groupMember.findFirst({
        where: { groupId: group.groupId, userId }
      });
      if (!existing) {
        await prisma.groupMember.create({
          data: {
            id: `gm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            groupId: group.groupId,
            userId,
            role: 'MEMBER'
          }
        });
      }
    }

    for (const course of membershipCourses) {
      const existing = await prisma.courseEnrollment.findFirst({
        where: { courseId: course.courseId, userId }
      });
      if (!existing) {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId,
            courseId: course.courseId,
            updatedAt: new Date()
          }
        });
      }
    }

    for (const product of membershipProducts) {
      const existing = await prisma.userProduct.findFirst({
        where: { productId: product.productId, userId }
      });
      if (!existing) {
        await prisma.userProduct.create({
          data: {
            id: `up_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId,
            productId: product.productId,
            transactionId,
            purchaseDate: now,
            price: 0
          }
        });
      }
    }

    console.log('\n✅ MANUAL ACTIVATION COMPLETE!');
    console.log('\nNow checking...\n');

    // Verify
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    const userMemberships = await prisma.userMembership.findMany({
      where: { userId }
    });

    console.log('User Role:', updatedUser.role);
    console.log('Memberships:', userMemberships.length);
    for (const um of userMemberships) {
      console.log(`  - ${um.membershipId}: ${um.status} (active: ${um.isActive})`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

activateMembership();
