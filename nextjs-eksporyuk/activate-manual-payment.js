#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateMembership(userId) {
  try {
    console.log(`\n🔄 Activating membership for user: ${userId}\n`);

    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return;
    }
    console.log(`✅ User found: ${user.email} (Role: ${user.role})`);

    // Get latest SUCCESS transaction
    const transaction = await prisma.transaction.findFirst({
      where: { userId, status: 'SUCCESS', type: 'MEMBERSHIP' },
      orderBy: { createdAt: 'desc' }
    });

    if (!transaction) {
      console.error(`❌ No successful membership transaction found`);
      return;
    }

    const metadata = transaction.metadata;
    const membershipId = metadata.membershipId;

    console.log(`✅ Transaction found:`);
    console.log(`   - Amount: Rp ${transaction.amount}`);
    console.log(`   - Payment: ${transaction.paymentMethod}`);
    console.log(`   - Membership ID: ${membershipId}`);

    // Get membership details
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    });

    if (!membership) {
      console.error(`❌ Membership not found: ${membershipId}`);
      return;
    }
    console.log(`✅ Membership: ${membership.name} (${membership.duration})`);

    // Check if already has this membership
    const existingMembership = await prisma.userMembership.findFirst({
      where: { userId, membershipId }
    });

    if (existingMembership) {
      console.log(`⚠️  User already has this membership:`);
      console.log(`   - Status: ${existingMembership.status}`);
      console.log(`   - Active: ${existingMembership.isActive}`);
      console.log(`   - End Date: ${existingMembership.endDate?.toISOString().substring(0, 10)}`);

      if (!existingMembership.isActive) {
        console.log(`\n🔄 Reactivating membership...`);
        await prisma.userMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: 'ACTIVE',
            isActive: true,
            activatedAt: new Date()
          }
        });
        console.log(`✅ Membership reactivated`);
      } else {
        console.log(`ℹ️  Membership already active`);
      }
    } else {
      // Create new UserMembership
      console.log(`\n🔄 Creating new membership...`);

      // Fetch related data
      const [membershipGroups, membershipCourses, membershipProducts] = await Promise.all([
        prisma.membershipGroup.findMany({ where: { membershipId } }),
        prisma.membershipCourse.findMany({ where: { membershipId } }),
        prisma.membershipProduct.findMany({ where: { membershipId } })
      ]);

      const groupIds = membershipGroups.map(mg => mg.groupId);
      const courseIds = membershipCourses.map(mc => mc.courseId);
      const productIds = membershipProducts.map(mp => mp.productId);

      const [groups, courses, products] = await Promise.all([
        groupIds.length > 0 ? prisma.group.findMany({
          where: { id: { in: groupIds } }
        }) : [],
        courseIds.length > 0 ? prisma.course.findMany({
          where: { id: { in: courseIds } }
        }) : [],
        productIds.length > 0 ? prisma.product.findMany({
          where: { id: { in: productIds } }
        }) : []
      ]);

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

      // Create UserMembership
      const umId = `um_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await prisma.userMembership.create({
        data: {
          id: umId,
          userId,
          membershipId,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: now,
          startDate: now,
          endDate,
          price: transaction.amount,
          transactionId: transaction.id,
          updatedAt: now,
          createdAt: now
        }
      });

      console.log(`✅ UserMembership created`);
      console.log(`   - Status: ACTIVE`);
      console.log(`   - Start: ${now.toISOString().substring(0, 10)}`);
      console.log(`   - End: ${endDate.toISOString().substring(0, 10)}`);

      // Auto-join groups
      for (const group of groups) {
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId,
            role: 'MEMBER'
          }
        }).catch(() => {}); // Ignore if already member
      }

      if (groups.length > 0) {
        console.log(`✅ Auto-joined ${groups.length} groups`);
      }

      // Auto-enroll courses
      for (const course of courses) {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId,
            courseId: course.id,
            updatedAt: new Date()
          }
        }).catch(() => {}); // Ignore if already enrolled
      }

      if (courses.length > 0) {
        console.log(`✅ Auto-enrolled ${courses.length} courses`);
      }

      // Auto-grant products
      for (const product of products) {
        await prisma.userProduct.create({
          data: {
            userId,
            productId: product.id,
            transactionId: transaction.id,
            purchaseDate: now,
            price: 0
          }
        }).catch(() => {}); // Ignore if already owned
      }

      if (products.length > 0) {
        console.log(`✅ Auto-granted ${products.length} products`);
      }
    }

    // Upgrade user role if needed
    if (user.role === 'MEMBER_FREE' || user.role === 'CUSTOMER') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'MEMBER_PREMIUM' }
      });
      console.log(`\n✅ User role upgraded to MEMBER_PREMIUM`);
    }

    console.log(`\n✅ ✅ ✅ Membership activation complete!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get user ID from command line or use test user
const userId = process.argv[2] || 'cmjmtou2e001fitz0pjwgpl60';
activateMembership(userId);
