/**
 * Test Course Content API
 * Simulates frontend API call to check what content is being returned
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCourseContentAPI() {
  try {
    console.log('🔍 Testing Course Content API Response...\n');
    
    // Get all courses
    const allCourses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📚 Found ${allCourses.length} total courses`);
    console.log('---\n');
    
    for (const course of allCourses) {
      console.log(`\n🎓 Course: ${course.title}`);
      console.log(`   Slug: ${course.slug}`);
      console.log(`   Status: ${course.status}`);
      console.log(`   Published: ${course.isPublished}`);
      
      // Get module count
      const moduleCount = await prisma.courseModule.count({
        where: { courseId: course.id }
      });
      
      console.log(`   Modules: ${moduleCount}`);
      
      if (moduleCount === 0) {
        console.log(`   ⚠️ NO MODULES`);
        continue;
      }
      
      // Simulate the API logic from /api/learn/[slug]/route.ts
      
      // 1. Fetch modules
      const modules = await prisma.courseModule.findMany({
        where: { courseId: course.id },
        orderBy: { order: 'asc' }
      });
      
      // 2. Fetch lessons with content for each module
      const modulesWithLessons = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await prisma.courseLesson.findMany({
            where: { moduleId: mod.id },
            orderBy: { order: 'asc' }
          });
          
          // Fetch files for each lesson
          const lessonsWithFiles = await Promise.all(
            lessons.map(async (lesson) => {
              const files = await prisma.lessonFile.findMany({
                where: { lessonId: lesson.id },
                orderBy: { order: 'asc' }
              });
              return { ...lesson, files };
            })
          );
          
          return { ...mod, lessons: lessonsWithFiles };
        })
      );
      
      // 3. Analyze content
      let totalLessons = 0;
      let lessonsWithContent = 0;
      let lessonsWithVideo = 0;
      
      for (const module of modulesWithLessons) {
        for (const lesson of module.lessons) {
          totalLessons++;
          
          const hasContent = lesson.content && lesson.content.trim().length > 0;
          const hasVideo = lesson.videoUrl && lesson.videoUrl.trim().length > 0;
          
          if (hasContent) lessonsWithContent++;
          if (hasVideo) lessonsWithVideo++;
        }
      }
      
      console.log(`   Lessons: ${totalLessons}`);
      console.log(`   With content: ${lessonsWithContent} (${totalLessons > 0 ? Math.round(lessonsWithContent/totalLessons*100) : 0}%)`);
      console.log(`   With video: ${lessonsWithVideo} (${totalLessons > 0 ? Math.round(lessonsWithVideo/totalLessons*100) : 0}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error testing course content API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCourseContentAPI();