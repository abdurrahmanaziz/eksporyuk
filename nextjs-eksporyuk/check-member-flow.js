const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CEK ALUR MEMBER ===\n');
  
  // 1. Cek sample user dengan UserMembership ACTIVE
  console.log('=== 1. SAMPLE PREMIUM MEMBER (dari Sejoli) ===');
  const sampleUM = await prisma.userMembership.findFirst({
    where: { status: 'ACTIVE' },
    select: { 
      userId: true, 
      membershipId: true,
      startDate: true,
      endDate: true
    }
  });
  
  if (sampleUM) {
    const user = await prisma.user.findUnique({ 
      where: { id: sampleUM.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    const membership = await prisma.membership.findUnique({
      where: { id: sampleUM.membershipId },
      select: { id: true, name: true }
    });
    
    console.log(`User: ${user.email} | ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Membership: ${membership?.name}`);
    console.log(`Period: ${sampleUM.startDate.toISOString().split('T')[0]} - ${sampleUM.endDate.toISOString().split('T')[0]}`);
    
    // Cek CourseEnrollment
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true, status: true }
    });
    console.log(`Course Enrollments: ${enrollments.length}`);
    
    // Cek GroupMember
    const groupMembers = await prisma.groupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true, status: true }
    });
    console.log(`Group Memberships: ${groupMembers.length}`);
  }
  
  // 2. Cek Membership -> Course & Group mappings
  console.log('\n=== 2. MEMBERSHIP -> COURSE & GROUP MAPPINGS ===');
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    select: { id: true, name: true, featureAccess: true }
  });
  
  for (const m of memberships) {
    console.log(`\n[${m.name}]`);
    
    // Cek MembershipCourse
    const mcourses = await prisma.membershipCourse.findMany({
      where: { membershipId: m.id },
      select: { courseId: true }
    });
    console.log(`  Courses linked: ${mcourses.length}`);
    
    // Cek MembershipGroup
    const mgroups = await prisma.membershipGroup.findMany({
      where: { membershipId: m.id },
      select: { groupId: true }
    });
    console.log(`  Groups linked: ${mgroups.length}`);
    
    // featureAccess JSON
    if (m.featureAccess) {
      console.log(`  featureAccess: ${JSON.stringify(m.featureAccess).substring(0, 100)}...`);
    }
  }
  
  // 3. Total Course & Group
  console.log('\n=== 3. TOTAL COURSES & GROUPS ===');
  const totalCourses = await prisma.course.count();
  const totalGroups = await prisma.group.count();
  const totalEnrollments = await prisma.courseEnrollment.count();
  const totalGroupMembers = await prisma.groupMember.count();
  
  console.log(`Total Courses: ${totalCourses}`);
  console.log(`Total Groups: ${totalGroups}`);
  console.log(`Total Course Enrollments: ${totalEnrollments}`);
  console.log(`Total Group Members: ${totalGroupMembers}`);
  
  // 4. Cek webhook/API untuk auto-enrollment
  console.log('\n=== 4. CHECK: Users with Membership but NO Course/Group ===');
  
  // Sample 5 premium users
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, email: true },
    take: 5
  });
  
  for (const u of premiumUsers) {
    const umCount = await prisma.userMembership.count({ where: { userId: u.id, status: 'ACTIVE' } });
    const enrollCount = await prisma.courseEnrollment.count({ where: { userId: u.id } });
    const groupCount = await prisma.groupMember.count({ where: { userId: u.id } });
    
    if (umCount > 0 && (enrollCount === 0 || groupCount === 0)) {
      console.log(`⚠️ ${u.email}: Membership=${umCount}, Courses=${enrollCount}, Groups=${groupCount}`);
    }
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
