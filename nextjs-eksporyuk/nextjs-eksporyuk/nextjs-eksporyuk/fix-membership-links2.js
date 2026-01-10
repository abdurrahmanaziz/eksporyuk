const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const prisma = new PrismaClient();

async function main() {
  console.log('=== FIX MEMBERSHIP LINKS ===\n');
  
  // 1. Get all courses and groups
  const courses = await prisma.course.findMany({ select: { id: true, title: true } });
  const groups = await prisma.group.findMany({ select: { id: true, name: true } });
  
  console.log('Available Courses:');
  courses.forEach(c => console.log(`  - ${c.id}: ${c.title}`));
  console.log('\nAvailable Groups:');
  groups.forEach(g => console.log(`  - ${g.id}: ${g.name}`));
  
  // 2. Get all active memberships
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });
  
  console.log('\n=== LINKING ALL MEMBERSHIPS TO COURSES & GROUPS ===');
  
  for (const m of memberships) {
    console.log(`\n[${m.name}]`);
    
    // Link to all courses
    for (const course of courses) {
      const exists = await prisma.membershipCourse.findUnique({
        where: { membershipId_courseId: { membershipId: m.id, courseId: course.id } }
      });
      
      if (!exists) {
        await prisma.membershipCourse.create({
          data: { 
            id: `mc_${nanoid(16)}`,
            membershipId: m.id, 
            courseId: course.id 
          }
        });
        console.log(`  ✅ Linked to course: ${course.title}`);
      } else {
        console.log(`  ✓ Already linked to: ${course.title}`);
      }
    }
    
    // Link to all groups
    for (const group of groups) {
      const exists = await prisma.membershipGroup.findUnique({
        where: { membershipId_groupId: { membershipId: m.id, groupId: group.id } }
      });
      
      if (!exists) {
        await prisma.membershipGroup.create({
          data: { 
            id: `mg_${nanoid(16)}`,
            membershipId: m.id, 
            groupId: group.id 
          }
        });
        console.log(`  ✅ Linked to group: ${group.name}`);
      } else {
        console.log(`  ✓ Already linked to: ${group.name}`);
      }
    }
  }
  
  // 3. Verify
  console.log('\n=== VERIFICATION ===');
  for (const m of memberships) {
    const courseCount = await prisma.membershipCourse.count({ where: { membershipId: m.id } });
    const groupCount = await prisma.membershipGroup.count({ where: { membershipId: m.id } });
    console.log(`${m.name}: ${courseCount} courses, ${groupCount} groups`);
  }
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
