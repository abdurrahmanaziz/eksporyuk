/**
 * Test Course Creation Flow
 * 
 * Script untuk memverifikasi bahwa pembuatan kursus berfungsi dengan benar
 * Run: node test-course-creation.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCourseCreation() {
  console.log('🧪 Testing Course Creation Flow\n');
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Check if admin user exists
    console.log('1️⃣ Checking for admin user...');
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!admin) {
      console.log('❌ No admin user found. Creating one...');
      const newAdmin = await prisma.user.create({
        data: {
          id: `admin_test_${Date.now()}`,
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'ADMIN',
          password: 'hashed_password',
          isActive: true,
          updatedAt: new Date()
        }
      });
      console.log('✅ Admin user created:', newAdmin.email);
      testsPassed++;
    } else {
      console.log('✅ Admin user found:', admin.email);
      testsPassed++;
    }
    
    const adminUser = admin || await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    // Test 2: Check/create MentorProfile for admin
    console.log('\n2️⃣ Checking mentor profile for admin...');
    let mentorProfile = await prisma.mentorProfile.findFirst({
      where: { userId: adminUser.id }
    });
    
    if (!mentorProfile) {
      console.log('⚠️  No mentor profile found. Creating one...');
      mentorProfile = await prisma.mentorProfile.create({
        data: {
          id: `mentor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: adminUser.id,
          bio: 'Test Mentor',
          expertise: 'All topics',
          isActive: true,
          updatedAt: new Date()
        }
      });
      console.log('✅ Mentor profile created');
      testsPassed++;
    } else {
      console.log('✅ Mentor profile found');
      testsPassed++;
    }
    
    // Test 3: Check CourseSettings
    console.log('\n3️⃣ Checking course settings...');
    let settings = await prisma.courseSettings.findFirst();
    
    if (!settings) {
      console.log('⚠️  No course settings found. Creating default...');
      settings = await prisma.courseSettings.create({
        data: {
          id: `settings_${Date.now()}`,
          defaultMentorCommission: 50,
          defaultAffiliateCommission: 30,
          updatedAt: new Date()
        }
      });
      console.log('✅ Course settings created');
      testsPassed++;
    } else {
      console.log('✅ Course settings found:', {
        mentorCommission: settings.defaultMentorCommission,
        affiliateCommission: settings.defaultAffiliateCommission
      });
      testsPassed++;
    }
    
    // Test 4: Create test course - FREE
    console.log('\n4️⃣ Creating FREE test course...');
    const freeCourseId = `crs_test_free_${Date.now()}`;
    const freeCourse = await prisma.course.create({
      data: {
        id: freeCourseId,
        mentorId: mentorProfile.id,
        title: 'Test Free Course',
        slug: `test-free-course-${Date.now()}`,
        description: 'This is a test free course',
        price: 0,
        monetizationType: 'FREE',
        status: 'APPROVED',
        isPublished: false,
        mentorCommissionPercent: settings.defaultMentorCommission,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30,
        affiliateEnabled: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create CourseMentor relation
    await prisma.courseMentor.create({
      data: {
        id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId: freeCourse.id,
        mentorId: mentorProfile.id,
        role: 'PRIMARY',
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ FREE course created:', {
      id: freeCourse.id,
      title: freeCourse.title,
      slug: freeCourse.slug,
      monetizationType: freeCourse.monetizationType
    });
    testsPassed++;
    
    // Test 5: Create test course - PAID
    console.log('\n5️⃣ Creating PAID test course...');
    const paidCourseId = `crs_test_paid_${Date.now()}`;
    const paidCourse = await prisma.course.create({
      data: {
        id: paidCourseId,
        mentorId: mentorProfile.id,
        title: 'Test Paid Course',
        slug: `test-paid-course-${Date.now()}`,
        description: 'This is a test paid course',
        price: 500000,
        originalPrice: 750000,
        monetizationType: 'PAID',
        status: 'APPROVED',
        isPublished: false,
        mentorCommissionPercent: settings.defaultMentorCommission,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30,
        affiliateEnabled: true,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create CourseMentor relation
    await prisma.courseMentor.create({
      data: {
        id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        courseId: paidCourse.id,
        mentorId: mentorProfile.id,
        role: 'PRIMARY',
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ PAID course created:', {
      id: paidCourse.id,
      title: paidCourse.title,
      slug: paidCourse.slug,
      price: paidCourse.price.toString(),
      monetizationType: paidCourse.monetizationType
    });
    testsPassed++;
    
    // Test 6: Verify course-mentor relationship
    console.log('\n6️⃣ Verifying course-mentor relationships...');
    const courseMentors = await prisma.courseMentor.findMany({
      where: {
        courseId: { in: [freeCourse.id, paidCourse.id] }
      }
    });
    
    if (courseMentors.length === 2) {
      console.log('✅ Course-mentor relationships verified:', courseMentors.length, 'relations');
      testsPassed++;
    } else {
      console.log('❌ Expected 2 relations, found:', courseMentors.length);
      testsFailed++;
    }
    
    // Test 7: Check membership exists for SUBSCRIPTION type test
    console.log('\n7️⃣ Checking membership for SUBSCRIPTION type course...');
    const membership = await prisma.membership.findFirst({
      where: { status: 'PUBLISHED' }
    });
    
    if (membership) {
      console.log('✅ Active membership found:', membership.name);
      
      // Create SUBSCRIPTION type course
      const subscriptionCourseId = `crs_test_subscription_${Date.now()}`;
      const subscriptionCourse = await prisma.course.create({
        data: {
          id: subscriptionCourseId,
          mentorId: mentorProfile.id,
          title: 'Test Subscription Course',
          slug: `test-subscription-course-${Date.now()}`,
          description: 'This is a test subscription-only course',
          price: 0,
          monetizationType: 'SUBSCRIPTION',
          status: 'APPROVED',
          isPublished: false,
          mentorCommissionPercent: settings.defaultMentorCommission,
          commissionType: 'PERCENTAGE',
          affiliateCommissionRate: 30,
          affiliateEnabled: false,
          approvedBy: adminUser.id,
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Create CourseMentor relation
      await prisma.courseMentor.create({
        data: {
          id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          courseId: subscriptionCourse.id,
          mentorId: mentorProfile.id,
          role: 'PRIMARY',
          isActive: true,
          updatedAt: new Date()
        }
      });
      
      // Create CourseMembership relation
      await prisma.courseMembership.create({
        data: {
          id: `cmsub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          courseId: subscriptionCourse.id,
          membershipId: membership.id,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ SUBSCRIPTION course created with relation');
      testsPassed++;
    } else {
      console.log('⚠️  No active membership found, skipping SUBSCRIPTION course test');
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Course creation system is working correctly.');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
    }
    
    // Cleanup (optional - comment out if you want to keep test data)
    console.log('\n🧹 Cleaning up test data...');
    const testCourses = await prisma.course.findMany({
      where: {
        title: { contains: 'Test' }
      }
    });
    
    for (const course of testCourses) {
      // Delete course mentors
      await prisma.courseMentor.deleteMany({
        where: { courseId: course.id }
      });
      
      // Delete course memberships
      await prisma.courseMembership.deleteMany({
        where: { courseId: course.id }
      });
      
      // Delete course
      await prisma.course.delete({
        where: { id: course.id }
      });
    }
    console.log(`✅ Cleaned up ${testCourses.length} test courses`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
    testsFailed++;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testCourseCreation()
  .catch(console.error)
  .finally(() => process.exit());
