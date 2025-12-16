const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupMembershipAccess() {
  console.log('🔧 SETUP MEMBERSHIP ACCESS\n');
  console.log('═'.repeat(60));

  try {
    // Get all memberships
    const memberships = await prisma.membership.findMany();
    
    // Get all groups
    const groups = await prisma.group.findMany();
    
    // Get all courses
    const courses = await prisma.course.findMany();
    
    console.log(`\n📦 Memberships: ${memberships.length}`);
    console.log(`👥 Groups: ${groups.length}`);
    console.log(`📚 Courses: ${courses.length}`);
    
    // Assign ALL groups and courses to ALL memberships
    for (const membership of memberships) {
      console.log(`\n🔄 Processing: ${membership.name}`);
      
      // Clear existing and add all groups
      await prisma.membershipGroup.deleteMany({ where: { membershipId: membership.id } });
      if (groups.length > 0) {
        await prisma.membershipGroup.createMany({
          data: groups.map(g => ({
            membershipId: membership.id,
            groupId: g.id
          })),
          skipDuplicates: true
        });
        console.log(`   ✅ Assigned ${groups.length} groups`);
      }
      
      // Clear existing and add all courses
      await prisma.membershipCourse.deleteMany({ where: { membershipId: membership.id } });
      if (courses.length > 0) {
        await prisma.membershipCourse.createMany({
          data: courses.map(c => ({
            membershipId: membership.id,
            courseId: c.id
          })),
          skipDuplicates: true
        });
        console.log(`   ✅ Assigned ${courses.length} courses`);
      }
    }
    
    // Verify
    console.log('\n═'.repeat(60));
    console.log('📊 VERIFICATION:');
    
    const updatedMemberships = await prisma.membership.findMany({
      include: {
        membershipGroups: { include: { group: true } },
        membershipCourses: { include: { course: true } }
      }
    });
    
    for (const m of updatedMemberships) {
      console.log(`\n${m.name}:`);
      console.log(`   Groups: ${m.membershipGroups.length}`);
      m.membershipGroups.forEach(mg => console.log(`      • ${mg.group.name}`));
      console.log(`   Courses: ${m.membershipCourses.length}`);
      m.membershipCourses.forEach(mc => console.log(`      • ${mc.course.title}`));
    }
    
    console.log('\n✅ Setup complete!');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMembershipAccess();
