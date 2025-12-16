const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMembershipUpdate() {
  console.log('🧪 Testing Membership Update...\n');
  
  try {
    // Get a membership
    const membership = await prisma.membership.findFirst({
      include: {
        membershipGroups: true,
        membershipCourses: true,
        membershipFeatures: true
      }
    });
    
    console.log('📦 Membership found:');
    console.log(`   ID: ${membership.id}`);
    console.log(`   Name: ${membership.name}`);
    console.log(`   Groups: ${membership.membershipGroups.length}`);
    console.log(`   Courses: ${membership.membershipCourses.length}`);
    console.log(`   Features: ${membership.membershipFeatures.length}`);
    
    // Get available groups and courses
    const groups = await prisma.group.findMany();
    const courses = await prisma.course.findMany();
    
    console.log('\n📊 Available Data:');
    console.log(`   Groups: ${groups.length}`);
    groups.forEach(g => console.log(`      - ${g.name} (${g.id})`));
    console.log(`   Courses: ${courses.length}`);
    courses.forEach(c => console.log(`      - ${c.title} (${c.id})`));
    
    // Try to update membership with groups and courses
    console.log('\n🔄 Testing update with groups and courses...');
    
    // Add all groups to membership
    if (groups.length > 0) {
      await prisma.membershipGroup.deleteMany({ where: { membershipId: membership.id } });
      await prisma.membershipGroup.createMany({
        data: groups.map(g => ({
          membershipId: membership.id,
          groupId: g.id
        }))
      });
      console.log(`   ✅ Added ${groups.length} groups to ${membership.name}`);
    }
    
    // Add all courses to membership
    if (courses.length > 0) {
      await prisma.membershipCourse.deleteMany({ where: { membershipId: membership.id } });
      await prisma.membershipCourse.createMany({
        data: courses.map(c => ({
          membershipId: membership.id,
          courseId: c.id
        }))
      });
      console.log(`   ✅ Added ${courses.length} courses to ${membership.name}`);
    }
    
    // Verify
    const updated = await prisma.membership.findUnique({
      where: { id: membership.id },
      include: {
        membershipGroups: { include: { group: true } },
        membershipCourses: { include: { course: true } }
      }
    });
    
    console.log('\n✅ Update successful!');
    console.log(`   Groups: ${updated.membershipGroups.length}`);
    updated.membershipGroups.forEach(mg => console.log(`      - ${mg.group.name}`));
    console.log(`   Courses: ${updated.membershipCourses.length}`);
    updated.membershipCourses.forEach(mc => console.log(`      - ${mc.course.title}`));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testMembershipUpdate();
