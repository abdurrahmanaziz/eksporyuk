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
      select: { id: true, email: true, name: true, role: true }
    });
    const membership = await prisma.membership.findUnique({
      where: { id: sampleUM.membershipId },
      select: { id: true, name: true }
    });
    
    console.log(`User: ${user.email} | ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Membership: ${membership?.name}`);
    
    // Cek CourseEnrollment
    const enrollments = await prisma.courseEnrollment.count({
      where: { userId: user.id }
    });
    console.log(`Course Enrollments: ${enrollments}`);
    
    // Cek GroupMember
    const groupMembers = await prisma.groupMember.count({
      where: { userId: user.id }
    });
    console.log(`Group Memberships: ${groupMembers}`);
  }
  
  // 2. Cek Membership -> Course & Group mappings
  console.log('\n=== 2. MEMBERSHIP -> COURSE & GROUP MAPPINGS ===');
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });
  
  for (const m of memberships) {
    console.log(`\n[${m.name}]`);
    
    // Cek MembershipCourse
    const mcourses = await prisma.membershipCourse.count({
      where: { membershipId: m.id }
    });
    console.log(`  Courses linked: ${mcourses}`);
    
    // Cek MembershipGroup
    const mgroups = await prisma.membershipGroup.count({
      where: { membershipId: m.id }
    });
    console.log(`  Groups linked: ${mgroups}`);
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
  
  // 4. Cek users dengan membership tapi tidak punya course/group
  console.log('\n=== 4. CHECK: Users with Membership but NO Course/Group ===');
  
  // Sample 20 premium users
  const premiumUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_PREMIUM' },
    select: { id: true, email: true },
    take: 20
  });
  
  let problemCount = 0;
  for (const u of premiumUsers) {
    const umCount = await prisma.userMembership.count({ where: { userId: u.id, status: 'ACTIVE' } });
    const enrollCount = await prisma.courseEnrollment.count({ where: { userId: u.id } });
    const groupCount = await prisma.groupMember.count({ where: { userId: u.id } });
    
    if (umCount > 0 && (enrollCount === 0 || groupCount === 0)) {
      if (problemCount < 5) {
        console.log(`⚠️ ${u.email}: Membership=${umCount}, Courses=${enrollCount}, Groups=${groupCount}`);
      }
      problemCount++;
    }
  }
  console.log(`\nTotal with issues in sample: ${problemCount}/20`);
  
  // 5. List courses
  console.log('\n=== 5. AVAILABLE COURSES ===');
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, isPublished: true }
  });
  courses.forEach(c => console.log(`[${c.isPublished ? 'PUBLISHED' : 'DRAFT'}] ${c.title}`));
  
  // 6. List groups  
  console.log('\n=== 6. AVAILABLE GROUPS ===');
  const groups = await prisma.group.findMany({
    select: { id: true, name: true, isActive: true }
  });
  groups.forEach(g => console.log(`[${g.isActive ? 'ACTIVE' : 'INACTIVE'}] ${g.name}`));
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
