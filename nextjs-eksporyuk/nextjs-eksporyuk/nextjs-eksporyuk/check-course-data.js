const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: 'kelas-ekspor' },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                files: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      console.log('❌ Course not found!');
      return;
    }

    console.log('✅ Course found:', course.title);
    console.log('📦 Modules count:', course.modules?.length || 0);
    
    if (course.modules) {
      course.modules.forEach((module, idx) => {
        console.log(`\n  Module ${idx + 1}: ${module.title}`);
        console.log(`  Lessons count: ${module.lessons?.length || 0}`);
        
        if (module.lessons) {
          module.lessons.forEach((lesson, lidx) => {
            console.log(`    Lesson ${lidx + 1}: ${lesson.title}`);
            console.log(`      Files: ${lesson.files?.length || 0}`);
          });
        }
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
