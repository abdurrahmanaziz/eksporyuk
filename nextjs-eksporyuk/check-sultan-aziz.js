const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSultanAziz() {
  console.log('🔍 Mencari user Sultan Aziz...\n');
  
  // Find user
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Sultan', mode: 'insensitive' } },
        { name: { contains: 'Aziz', mode: 'insensitive' } },
        { email: { contains: 'sultan', mode: 'insensitive' } },
        { email: { contains: 'aziz', mode: 'insensitive' } }
      ]
    },
    include: {
      userMemberships: {
        include: {
          membership: {
            include: {
              membershipGroups: true,
              membershipCourses: true
            }
          },
          transaction: true
        }
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });
  
  if (!user) {
    console.log('❌ User tidak ditemukan');
    await prisma.$disconnect();
    return;
  }
  
  console.log('✅ User ditemukan:');
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('\n📦 User Memberships:', user.userMemberships.length);
  
  for (const um of user.userMemberships) {
    console.log('\n--- Membership:', um.membership.name);
    console.log('Status:', um.status);
    console.log('Active:', um.isActive);
    console.log('Start:', um.startDate);
    console.log('End:', um.endDate);
    console.log('Transaction ID:', um.transactionId);
    console.log('Groups in membership:', um.membership.membershipGroups.length);
    console.log('Courses in membership:', um.membership.membershipCourses.length);
    
    if (um.transaction) {
      console.log('\nTransaction Details:');
      console.log('  Invoice:', um.transaction.invoiceNumber);
      console.log('  Status:', um.transaction.status);
      console.log('  Payment Status:', um.transaction.paymentStatus);
    }
  }
  
  console.log('\n\n💰 Recent Transactions:');
  for (const tx of user.transactions) {
    console.log('\n---', tx.invoiceNumber);
    console.log('Status:', tx.status);
    console.log('Payment:', tx.paymentStatus);
    console.log('Type:', tx.type);
    console.log('Amount:', tx.amount.toString());
    console.log('Created:', tx.createdAt);
  }
  
  // Check group memberships
  const groupMembers = await prisma.groupMember.findMany({
    where: { userId: user.id }
  });
  
  console.log('\n\n👥 User Groups:', groupMembers.length);
  for (const gm of groupMembers) {
    const group = await prisma.group.findUnique({ where: { id: gm.groupId } });
    console.log('- Group:', group?.name || 'Unknown', '| Role:', gm.role);
  }
  
  // Check course enrollments  
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: user.id }
  });
  
  console.log('\n\n📚 Course Enrollments:', enrollments.length);
  for (const e of enrollments) {
    const course = await prisma.course.findUnique({ where: { id: e.courseId } });
    console.log('- Course:', course?.title || 'Unknown', '| Active:', e.isActive);
  }
  
  // Cek membership yang harus dibuat otomatis
  console.log('\n\n🔍 Membership Analysis:');
  for (const um of user.userMemberships) {
    console.log(`\n=== ${um.membership.name} ===`);
    console.log('Should auto-join groups:', um.membership.membershipGroups.length);
    console.log('Should auto-enroll courses:', um.membership.membershipCourses.length);
    
    // Check if groups were auto-joined
    for (const mg of um.membership.membershipGroups) {
      const isJoined = groupMembers.some(gm => gm.groupId === mg.groupId);
      const group = await prisma.group.findUnique({ where: { id: mg.groupId } });
      console.log(`  Group "${group?.name}": ${isJoined ? '✅ Joined' : '❌ NOT Joined'}`);
    }
    
    // Check if courses were auto-enrolled
    for (const mc of um.membership.membershipCourses) {
      const isEnrolled = enrollments.some(e => e.courseId === mc.courseId);
      const course = await prisma.course.findUnique({ where: { id: mc.courseId } });
      console.log(`  Course "${course?.title}": ${isEnrolled ? '✅ Enrolled' : '❌ NOT Enrolled'}`);
    }
  }
  
  await prisma.$disconnect();
}

checkSultanAziz().catch(console.error);
