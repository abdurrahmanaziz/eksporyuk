const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminEnrollmentsView() {
  console.log('🔍 ADMIN ENROLLMENTS VIEW CHECK');
  console.log('===============================\n');
  
  try {
    // Simulate the admin enrollments API query
    const enrollments = await prisma.courseEnrollment.findMany({
      take: 50, // Same as admin page limit
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        courseId: true,
        progress: true,
        completed: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Latest 50 Enrollments (as shown in admin panel):`);
    console.log(`Total shown: ${enrollments.length}`);
    
    // Check for duplicates in the view
    const seen = new Set();
    const duplicates = [];
    
    enrollments.forEach(enrollment => {
      const key = `${enrollment.userId}-${enrollment.courseId}`;
      if (seen.has(key)) {
        duplicates.push({
          user: enrollment.userId,
          course: enrollment.courseId,
          id: enrollment.id
        });
      } else {
        seen.add(key);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`\n❌ Found ${duplicates.length} duplicate user-course combinations in current view:`);
      duplicates.forEach((dup, idx) => {
        console.log(`   ${idx + 1}. User: ${dup.user}, Course: ${dup.course}, ID: ${dup.id}`);
      });
    } else {
      console.log('\n✅ No duplicates in current admin enrollments view');
    }
    
    // Get user and course info for first few enrollments
    console.log('\n📋 Sample Enrollments (with details):');
    console.log('------------------------------------');
    
    for (let i = 0; i < Math.min(5, enrollments.length); i++) {
      const enrollment = enrollments[i];
      
      const user = await prisma.user.findUnique({
        where: { id: enrollment.userId },
        select: { name: true, email: true, role: true }
      });
      
      const course = await prisma.course.findUnique({
        where: { id: enrollment.courseId },
        select: { title: true }
      });
      
      console.log(`${i + 1}. ${user?.name || 'Unknown'} (${user?.email}) - ${user?.role}`);
      console.log(`   Course: ${course?.title || 'Unknown'}`);
      console.log(`   Progress: ${enrollment.progress}%`);
      console.log(`   Enrolled: ${enrollment.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    }
    
    // Overall stats
    console.log('📈 OVERALL ENROLLMENT STATS:');
    console.log('----------------------------');
    
    const totalEnrollments = await prisma.courseEnrollment.count();
    const uniqueUserCourseCombo = await prisma.courseEnrollment.groupBy({
      by: ['userId', 'courseId']
    });
    
    console.log(`Total Enrollments: ${totalEnrollments.toLocaleString()}`);
    console.log(`Unique User-Course Combinations: ${uniqueUserCourseCombo.length.toLocaleString()}`);
    
    if (totalEnrollments === uniqueUserCourseCombo.length) {
      console.log('✅ Perfect! No duplicates anywhere in the system');
    } else {
      console.log(`❌ Found ${totalEnrollments - uniqueUserCourseCombo.length} duplicate enrollments system-wide`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminEnrollmentsView();