const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    console.log('Testing course query (manual fetch like new API)...');
    
    // 1. Get course without relations
    const course = await p.course.findUnique({
      where: { slug: 'kelas-website-ekspor' }
    });
    
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    
    console.log('✅ Course:', course.title);
    
    // 2. Get mentor
    const mentor = course.mentorId ? await p.mentorProfile.findUnique({
      where: { id: course.mentorId }
    }) : null;
    
    const mentorUser = mentor ? await p.user.findUnique({
      where: { id: mentor.userId },
      select: { id: true, name: true, email: true, avatar: true }
    }) : null;
    
    console.log('✅ Mentor:', mentorUser?.name || 'N/A');
    
    // 3. Get modules
    const modules = await p.courseModule.findMany({
      where: { courseId: course.id },
      orderBy: { order: 'asc' }
    });
    
    console.log('✅ Modules:', modules.length);
    
    // 4. Get lessons for each module
    let totalLessons = 0;
    for (const mod of modules) {
      const lessons = await p.courseLesson.findMany({
        where: { moduleId: mod.id }
      });
      totalLessons += lessons.length;
    }
    
    console.log('✅ Total Lessons:', totalLessons);
    console.log('\n✅ SUCCESS! Query works correctly');
    
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }
  await p.$disconnect();
}

test();
