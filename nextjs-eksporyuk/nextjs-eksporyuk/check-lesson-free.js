const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const lesson = await prisma.courseLesson.findFirst({
      where: { 
        module: {
          course: {
            slug: 'kelas-ekspor'
          }
        }
      }
    });

    if (lesson) {
      console.log('Lesson:', lesson.title);
      console.log('isFree:', lesson.isFree);
      
      if (!lesson.isFree) {
        console.log('\n🔧 Updating lesson to be FREE...');
        await prisma.courseLesson.update({
          where: { id: lesson.id },
          data: { isFree: true }
        });
        console.log('✅ Lesson updated to FREE!');
      } else {
        console.log('\n✅ Lesson already FREE');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
