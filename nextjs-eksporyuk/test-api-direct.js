// Test API route directly to see the actual error
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPILogic() {
  try {
    console.log('Testing API logic directly...\n');
    
    const slug = 'kelas-eksporyuk';
    
    // Simulate what API does
    const course = await prisma.course.findFirst({
      where: { slug }
    });
    
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    
    console.log('✅ Course found:', course.title);
    console.log('   ID:', course.id);
    console.log('   MentorId:', course.mentorId);
    
    // Try to find mentor
    let mentor = null;
    if (course.mentorId) {
      try {
        mentor = await prisma.mentorProfile.findUnique({
          where: { id: course.mentorId }
        });
        console.log('✅ Mentor found:', mentor ? 'YES' : 'NO');
      } catch (e) {
        console.log('⚠️ Error finding mentor:', e.message);
      }
    }
    
    // Try to find modules
    try {
      const modules = await prisma.courseModule.findMany({
        where: { courseId: course.id },
        orderBy: { order: 'asc' }
      });
      console.log('✅ Modules found:', modules.length);
    } catch (e) {
      console.log('❌ Error finding modules:', e.message);
    }
    
    console.log('\n✅ All database queries work!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAPILogic();
