const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSultanAzizEnrollment() {
  console.log('🔧 Fixing Sultan Aziz auto-enrollment issues...\n');
  
  // Find Sultan Aziz (yang checkout hari ini)
  const user = await prisma.user.findFirst({
    where: {
      email: 'abdurrahmanazizsultan@gmail.com'
    }
  });
  
  if (!user) {
    console.log('❌ User Sultan Aziz tidak ditemukan');
    return;
  }
  
  console.log('✅ User ditemukan:', user.name, user.email);
  
  // Find transaction hari ini
  const transaction = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      invoiceNumber: 'INV19334',
      status: 'SUCCESS'
    }
  });
  
  if (!transaction) {
    console.log('❌ Transaction tidak ditemukan');
    return;
  }
  
  console.log('✅ Transaction ditemukan:', transaction.invoiceNumber, transaction.amount.toString());
  
  // Find atau create UserMembership untuk transaction ini
  let userMembership = await prisma.userMembership.findFirst({
    where: {
      userId: user.id,
      transactionId: transaction.id
    },
    include: {
      membership: {
        include: {
          membershipGroups: true,
          membershipCourses: true
        }
      }
    }
  });
  
  if (!userMembership) {
    console.log('❌ UserMembership tidak ditemukan untuk transaction ini');
    
    // Cari membership berdasarkan price
    const membership = await prisma.membership.findFirst({
      where: {
        price: transaction.amount,
        isActive: true
      },
      include: {
        membershipGroups: true,
        membershipCourses: true
      }
    });
    
    if (!membership) {
      console.log('❌ Membership dengan price', transaction.amount.toString(), 'tidak ditemukan');
      return;
    }
    
    console.log('✅ Membership ditemukan:', membership.name);
    
    // Check if user already has this membership (without transaction)
    const existingMembership = await prisma.userMembership.findFirst({
      where: {
        userId: user.id,
        membershipId: membership.id
      },
      include: {
        membership: {
          include: {
            membershipGroups: true,
            membershipCourses: true
          }
        }
      }
    });
    
    if (existingMembership) {
      console.log('✅ User already has this membership, updating transaction link...');
      
      // Update existing membership dengan transaction ID
      userMembership = await prisma.userMembership.update({
        where: { id: existingMembership.id },
        data: {
          transactionId: transaction.id,
          status: 'ACTIVE',
          isActive: true,
          activatedAt: new Date()
        },
        include: {
          membership: {
            include: {
              membershipGroups: true,
              membershipCourses: true
            }
          }
        }
      });
      
      console.log('✅ UserMembership updated with transaction');
    } else {
      // Create new UserMembership
      const endDate = new Date();
      if (membership.duration === 'MONTHLY') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (membership.duration === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (membership.duration === 'LIFETIME') {
        endDate.setFullYear(endDate.getFullYear() + 100);
      }
      
      userMembership = await prisma.userMembership.create({
        data: {
          userId: user.id,
          membershipId: membership.id,
          transactionId: transaction.id,
          startDate: new Date(),
          endDate: endDate,
          isActive: true,
          status: 'ACTIVE',
          activatedAt: new Date(),
          price: membership.price
        },
        include: {
          membership: {
            include: {
              membershipGroups: true,
              membershipCourses: true
            }
          }
        }
      });
      
      console.log('✅ UserMembership created');
    }
  }
  
  console.log('\n📦 Processing membership:', userMembership.membership.name);
  console.log('Groups to auto-join:', userMembership.membership.membershipGroups.length);
  console.log('Courses to auto-enroll:', userMembership.membership.membershipCourses.length);
  
  // Auto-join groups
  for (const mg of userMembership.membership.membershipGroups) {
    const existingGroupMember = await prisma.groupMember.findFirst({
      where: {
        userId: user.id,
        groupId: mg.groupId
      }
    });
    
    if (!existingGroupMember) {
      const group = await prisma.group.findUnique({ where: { id: mg.groupId } });
      
      await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: mg.groupId,
          role: 'MEMBER'
        }
      });
      
      console.log('✅ Auto-joined group:', group?.name);
    } else {
      const group = await prisma.group.findUnique({ where: { id: mg.groupId } });
      console.log('ℹ️ Already member of group:', group?.name);
    }
  }
  
  // Auto-enroll courses
  for (const mc of userMembership.membership.membershipCourses) {
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId: user.id,
        courseId: mc.courseId
      }
    });
    
    if (!existingEnrollment) {
      const course = await prisma.course.findUnique({ where: { id: mc.courseId } });
      
      await prisma.courseEnrollment.create({
        data: {
          userId: user.id,
          courseId: mc.courseId,
          progress: 0,
          completed: false,
          transactionId: transaction.id,
          createdAt: new Date()
        }
      });
      
      console.log('✅ Auto-enrolled course:', course?.title);
    } else {
      const course = await prisma.course.findUnique({ where: { id: mc.courseId } });
      console.log('ℹ️ Already enrolled in course:', course?.title);
    }
  }
  
  // Update transaction status jika masih PENDING
  if (transaction.status !== 'SUCCESS') {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'SUCCESS',
        paymentStatus: 'PAID'
      }
    });
    console.log('✅ Transaction status updated to SUCCESS');
  }
  
  // Update user role ke MEMBER_PREMIUM
  if (user.role === 'MEMBER_FREE') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'MEMBER_PREMIUM' }
    });
    console.log('✅ User role updated to MEMBER_PREMIUM');
  }
  
  console.log('\n🎉 Sultan Aziz auto-enrollment fixed!');
  
  await prisma.$disconnect();
}

fixSultanAzizEnrollment().catch(console.error);