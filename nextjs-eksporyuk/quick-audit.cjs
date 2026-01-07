const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickAudit() {
  try {
    // Just count basics
    const courseCount = await prisma.course.count({ where: { isPublished: true } });
    const moduleCount = await prisma.courseModule.count();
    const lessonCount = await prisma.courseLesson.count();
    
    const lessonsWithContent = await prisma.courseLesson.count({
      where: { content: { not: '' } }
    });
    
    const lessonsWithVideo = await prisma.courseLesson.count({
      where: { videoUrl: { not: null } }
    });
    
    console.log('='.repeat(60));
    console.log('📊 DATABASE STATE:');
    console.log('='.repeat(60));
    console.log(`Courses (Published): ${courseCount}`);
    console.log(`Total Modules: ${moduleCount}`);
    console.log(`Total Lessons: ${lessonCount}`);
    console.log(`Lessons with Content: ${lessonsWithContent}`);
    console.log(`Lessons with Video: ${lessonsWithVideo}`);
    console.log('='.repeat(60));
    
    // Get one course detail
    const course = await prisma.course.findFirst({
      where: { slug: 'kelas-eksporyuk' }
    });
    
    if (course) {
      console.log(`\n📚 COURSE: ${course.title}`);
      
      const modules = await prisma.courseModule.findMany({
        where: { courseId: course.id },
        select: { id: true, title: true, order: true }
      });
      
      console.log(`Modules: ${modules.length}`);
      
      for (const mod of modules.slice(0, 3)) {
        const lessons = await prisma.courseLesson.count({
          where: { moduleId: mod.id }
        });
        
        const lessonsWithContent = await prisma.courseLesson.count({
          where: { moduleId: mod.id, content: { not: '' } }
        });
        
        console.log(`  ${mod.order}. ${mod.title}: ${lessons} lessons (${lessonsWithContent} with content)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickAudit();