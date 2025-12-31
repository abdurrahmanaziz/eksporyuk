const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const email = 'abdurrahmanazizsultan@gmail.com';
  
  // 1. Get user details
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log('=== USER INFO ===');
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Created:', user.createdAt);
  
  // 2. Get membership
  const membership = await prisma.userMembership.findFirst({
    where: { userId: user.id },
    select: {
      id: true,
      membershipId: true,
      status: true,
      isActive: true,
      startDate: true,
      endDate: true,
      activatedAt: true,
      transactionId: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('\n=== USER MEMBERSHIP ===');
  if (membership) {
    const m = await prisma.membership.findUnique({ 
      where: { id: membership.membershipId },
      select: { name: true, slug: true }
    });
    console.log('Membership:', m?.name, '(' + m?.slug + ')');
    console.log('Status:', membership.status);
    console.log('Active:', membership.isActive);
    console.log('Start:', membership.startDate);
    console.log('End:', membership.endDate);
    console.log('Activated:', membership.activatedAt);
    console.log('Transaction ID:', membership.transactionId);
    
    if (membership.transactionId) {
      const tx = await prisma.transaction.findUnique({
        where: { id: membership.transactionId },
        select: { status: true, paymentMethod: true, paidAt: true, amount: true }
      });
      if (tx) {
        console.log('Transaction Status:', tx.status);
        console.log('Payment Method:', tx.paymentMethod);
        console.log('Paid At:', tx.paidAt);
        console.log('Amount:', tx.amount);
      }
    }
  } else {
    console.log('NO MEMBERSHIP!');
  }
  
  // 3. Get group membership
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId: user.id }
  });
  
  console.log('\n=== GROUP ACCESS ===');
  if (groupMemberships.length === 0) {
    console.log('⚠️ NO GROUP ACCESS!');
  } else {
    for (const gm of groupMemberships) {
      const g = await prisma.group.findUnique({ 
        where: { id: gm.groupId },
        select: { name: true }
      });
      console.log('✅', g?.name, '- Role:', gm.role);
    }
  }
  
  // 4. Get course enrollments
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: user.id }
  });
  
  console.log('\n=== COURSE ACCESS ===');
  if (enrollments.length === 0) {
    console.log('⚠️ NO COURSE ACCESS!');
  } else {
    for (const e of enrollments) {
      const c = await prisma.course.findUnique({ 
        where: { id: e.courseId },
        select: { title: true }
      });
      console.log('✅', c?.title);
    }
  }
  
  // 5. Check what groups/courses should be linked to their membership
  if (membership) {
    console.log('\n=== EXPECTED ACCESS (from MembershipGroup/MembershipCourse) ===');
    
    const expectedGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: membership.membershipId }
    });
    
    const expectedCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: membership.membershipId }
    });
    
    console.log('Groups linked to membership:');
    for (const eg of expectedGroups) {
      const g = await prisma.group.findUnique({ where: { id: eg.groupId }, select: { name: true }});
      console.log('  -', g?.name);
    }
    
    console.log('Courses linked to membership:');
    if (expectedCourses.length === 0) {
      console.log('  (no courses linked)');
    }
    for (const ec of expectedCourses) {
      const c = await prisma.course.findUnique({ where: { id: ec.courseId }, select: { title: true }});
      console.log('  -', c?.title);
    }
  }
  
  // 6. Compare with another user who HAS access
  console.log('\n=== COMPARISON: User with group access ===');
  const userWithAccess = await prisma.groupMember.findFirst({
    select: { userId: true }
  });
  
  if (userWithAccess) {
    const compUser = await prisma.user.findUnique({
      where: { id: userWithAccess.userId },
      select: { id: true, name: true, email: true, role: true }
    });
    
    const compMembership = await prisma.userMembership.findFirst({
      where: { userId: userWithAccess.userId },
      select: { membershipId: true, status: true, transactionId: true }
    });
    
    console.log('User:', compUser?.name, '(' + compUser?.email + ')');
    console.log('Role:', compUser?.role);
    
    if (compMembership) {
      const m = await prisma.membership.findUnique({ 
        where: { id: compMembership.membershipId },
        select: { name: true }
      });
      console.log('Membership:', m?.name);
      console.log('Status:', compMembership.status);
      
      if (compMembership.transactionId) {
        const tx = await prisma.transaction.findUnique({
          where: { id: compMembership.transactionId },
          select: { paymentMethod: true }
        });
        console.log('Payment Method:', tx?.paymentMethod);
      }
    }
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
