const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullTest() {
  try {
    // Full API simulation
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { affiliateOnly: true },
          { isAffiliateTraining: true },
          { isAffiliateMaterial: true },
          { roleAccess: 'AFFILIATE' }
        ],
        status: { in: ['PUBLISHED', 'APPROVED'] }
      },
      orderBy: [
        { isAffiliateTraining: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    console.log('📊 Courses found:', courses.length);

    const courseIds = courses.map(c => c.id);
    const modules = await prisma.courseModule.findMany({
      where: { courseId: { in: courseIds } }
    });

    console.log('📁 Modules found:', modules.length);

    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId: { in: modules.map(m => m.id) } }
    });

    console.log('📖 Lessons found:', lessons.length);

    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: 'test',
        courseId: { in: courses.map(c => c.id) },
      },
    });

    console.log('📝 Enrollments found:', enrollments.length);

    const progressRecords = await prisma.userCourseProgress.findMany({
      where: {
        userId: 'test',
        courseId: { in: courses.map(c => c.id) },
      },
    });

    console.log('📈 Progress records found:', progressRecords.length);

    const certificates = await prisma.certificate.findMany({
      where: {
        userId: 'test',
        courseId: { in: courses.map(c => c.id) },
      },
    });

    console.log('🏆 Certificates found:', certificates.length);

    const formattedCourses = courses.map(course => {
      const courseModules = modules.filter(m => m.courseId === course.id);
      const courseLessons = lessons.filter(l => 
        courseModules.some(m => m.id === l.moduleId)
      );

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        modulesCount: courseModules.length,
        lessonsCount: courseLessons.length,
        isMainTraining: course.isAffiliateTraining,
        isLearningMaterial: course.isAffiliateMaterial,
      };
    });

    const trainingCourses = formattedCourses.filter(c => c.isMainTraining);
    const learningMaterials = formattedCourses.filter(c => c.isLearningMaterial);
    const otherCourses = formattedCourses.filter(c => !c.isMainTraining && !c.isLearningMaterial);

    console.log('\n✅ RESPONSE:');
    console.log('Training courses:', trainingCourses.length);
    console.log('Learning materials:', learningMaterials.length);
    console.log('Other courses:', otherCourses.length);
    console.log('\nTraining courses detail:');
    console.log(JSON.stringify(trainingCourses, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fullTest();
