import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixMissingMembershipActivations() {
  try {
    console.log('🔍 Finding SUCCESS transactions with missing UserMembership...');
    
    // Find SUCCESS transactions of type MEMBERSHIP that don't have UserMembership
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS',
        paidAt: { not: null }
      },
      select: {
        id: true,
        userId: true,
        membershipId: true,
        metadata: true,
        customerName: true,
        amount: true
      }
    });

    console.log(`📊 Found ${transactions.length} SUCCESS membership transactions`);

    for (const tx of transactions) {
      const metadata = tx.metadata || {};
      const membershipId = tx.membershipId || metadata.membershipId;
      
      if (!membershipId) {
        console.log(`⚠️  Transaction ${tx.id} has no membershipId in field or metadata`);
        continue;
      }

      // Check if UserMembership already exists
      const existingMembership = await prisma.userMembership.findFirst({
        where: {
          userId: tx.userId,
          transactionId: tx.id
        }
      });

      if (existingMembership) {
        console.log(`✅ Transaction ${tx.id} already has UserMembership`);
        
        // Check if user has groups/courses
        const [userGroups, userCourses] = await Promise.all([
          prisma.groupMember.findMany({ where: { userId: tx.userId } }),
          prisma.courseEnrollment.findMany({ where: { userId: tx.userId } })
        ]);

        if (userGroups.length === 0 || userCourses.length === 0) {
          console.log(`⚠️  User ${tx.customerName} missing groups/courses, fixing...`);
          await activateGroupsAndCourses(tx.userId, membershipId, tx.id);
        }
        continue;
      }

      console.log(`🔧 FIXING: Transaction ${tx.id} (${tx.customerName}) - Creating UserMembership + Groups/Courses`);
      
      // 1. Update transaction to set membershipId field if missing
      if (!tx.membershipId && membershipId) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { membershipId: membershipId }
        });
        console.log(`   ✅ Updated transaction.membershipId to ${membershipId}`);
      }

      // 2. Get membership details
      const membership = await prisma.membership.findUnique({
        where: { id: membershipId }
      });

      if (!membership) {
        console.log(`   ❌ Membership ${membershipId} not found`);
        continue;
      }

      // 3. Calculate expiry date
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

      // 4. Create UserMembership
      await prisma.userMembership.create({
        data: {
          userId: tx.userId,
          membershipId: membershipId,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: now,
          startDate: now,
          endDate: endDate,
          price: Number(tx.amount),
          transactionId: tx.id
        }
      });
      console.log(`   ✅ Created UserMembership`);

      // 5. Auto-join groups and enroll courses
      await activateGroupsAndCourses(tx.userId, membershipId, tx.id);
    }

    console.log('🎉 All missing memberships have been fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function activateGroupsAndCourses(userId, membershipId, transactionId) {
  try {
    // Get membership groups
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId },
      select: { groupId: true }
    });

    // Auto-join groups
    let groupsJoined = 0;
    for (const mg of membershipGroups) {
      try {
        await prisma.groupMember.create({
          data: {
            groupId: mg.groupId,
            userId: userId,
            role: 'MEMBER'
          }
        });
        groupsJoined++;
      } catch (error) {
        // Ignore if already member
      }
    }

    // Get membership courses  
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId },
      select: { courseId: true }
    });

    // Auto-enroll courses
    let coursesEnrolled = 0;
    for (const mc of membershipCourses) {
      try {
        await prisma.courseEnrollment.create({
          data: {
            id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            userId: userId,
            courseId: mc.courseId,
            updatedAt: new Date()
          }
        });
        coursesEnrolled++;
      } catch (error) {
        // Ignore if already enrolled
      }
    }

    // Get membership products
    const membershipProducts = await prisma.membershipProduct.findMany({
      where: { membershipId },
      select: { productId: true }
    });

    // Auto-grant products
    let productsGranted = 0;
    for (const mp of membershipProducts) {
      try {
        await prisma.userProduct.create({
          data: {
            userId: userId,
            productId: mp.productId,
            transactionId: transactionId,
            purchaseDate: new Date(),
            price: 0 // Free as part of membership
          }
        });
        productsGranted++;
      } catch (error) {
        // Ignore if already owned
      }
    }

    console.log(`   ✅ Auto-assigned: ${groupsJoined} groups, ${coursesEnrolled} courses, ${productsGranted} products`);

  } catch (error) {
    console.error(`   ❌ Failed to activate groups/courses:`, error.message);
  }
}

// Run the fix
fixMissingMembershipActivations();