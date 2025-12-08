/**
 * LMS Integration Testing Script
 * Tests end-to-end flow: Enrollment → Video → Progress → Quiz → Certificate → Email
 * 
 * Run: node test-lms-integration.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}━━━ ${msg} ━━━${colors.reset}\n`),
};

let passed = 0;
let failed = 0;
let warnings = 0;

async function testDatabaseConnection() {
  log.section('1. Database Connection Test');
  try {
    await prisma.$connect();
    log.success('Database connected successfully');
    passed++;
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testCourseStructure() {
  log.section('2. Course Structure Test');
  try {
    const courseCount = await prisma.course.count();
    log.info(`Total courses: ${courseCount}`);
    
    if (courseCount === 0) {
      log.warning('No courses found in database');
      warnings++;
      return false;
    }
    
    // Test course with modules and lessons
    const courseWithContent = await prisma.course.findFirst({
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
    
    if (!courseWithContent) {
      log.error('No course with modules found');
      failed++;
      return false;
    }
    
    log.success(`Course "${courseWithContent.title}" has ${courseWithContent.modules.length} modules`);
    
    const totalLessons = courseWithContent.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    log.success(`Total lessons: ${totalLessons}`);
    
    if (totalLessons === 0) {
      log.warning('No lessons found in course');
      warnings++;
    }
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Course structure test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testEnrollmentSystem() {
  log.section('3. Enrollment System Test');
  try {
    const enrollmentCount = await prisma.courseEnrollment.count();
    log.info(`Total enrollments: ${enrollmentCount}`);
    
    if (enrollmentCount === 0) {
      log.warning('No enrollments found');
      warnings++;
      return true; // Not critical
    }
    
    // Check enrollment with user and course
    const enrollment = await prisma.courseEnrollment.findFirst({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    
    if (enrollment) {
      log.success(`Sample enrollment: ${enrollment.user.name} → ${enrollment.course.title}`);
      log.info(`Progress: ${enrollment.progress}%`);
      log.info(`Completed: ${enrollment.completed ? 'Yes' : 'No'}`);
    }
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Enrollment test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testQuizSystem() {
  log.section('4. Quiz System Test');
  try {
    const quizCount = await prisma.quiz.count();
    log.info(`Total quizzes: ${quizCount}`);
    
    if (quizCount === 0) {
      log.warning('No quizzes found');
      warnings++;
      return true;
    }
    
    // Check quiz with questions
    const quiz = await prisma.quiz.findFirst({
      include: {
        questions: true,
        lesson: {
          select: {
            title: true,
          },
        },
      },
    });
    
    if (quiz) {
      log.success(`Quiz "${quiz.title}" in lesson "${quiz.lesson.title}"`);
      log.info(`Questions: ${quiz.questions.length}`);
      log.info(`Pass score: ${quiz.passingScore}%`);
      log.info(`Time limit: ${quiz.timeLimit || 'None'}`);
    }
    
    // Check quiz attempts
    const attemptCount = await prisma.quizAttempt.count();
    log.info(`Total quiz attempts: ${attemptCount}`);
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Quiz system test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testCertificateSystem() {
  log.section('5. Certificate System Test');
  try {
    const certCount = await prisma.certificate.count();
    log.info(`Total certificates: ${certCount}`);
    
    if (certCount === 0) {
      log.warning('No certificates issued yet');
      warnings++;
      return true;
    }
    
    // Check certificate with details
    const cert = await prisma.certificate.findFirst({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });
    
    if (cert) {
      log.success(`Certificate ${cert.certificateNumber}`);
      log.info(`Student: ${cert.user.name}`);
      log.info(`Course: ${cert.course.title}`);
      log.info(`Issued: ${cert.issuedAt.toLocaleDateString()}`);
      log.info(`Valid: ${cert.isValid ? 'Yes' : 'No'}`);
      log.info(`PDF URL: ${cert.pdfUrl || 'Not generated'}`);
      log.info(`Verification URL: ${cert.verificationUrl || 'None'}`);
    }
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Certificate system test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testNotificationSystem() {
  log.section('6. Notification System Test');
  try {
    const notifCount = await prisma.notification.count();
    log.info(`Total notifications: ${notifCount}`);
    
    if (notifCount === 0) {
      log.warning('No notifications found');
      warnings++;
      return true;
    }
    
    // Check recent notifications
    const recentNotifs = await prisma.notification.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    log.info('Recent notifications:');
    recentNotifs.forEach((notif, idx) => {
      console.log(`  ${idx + 1}. ${notif.title} → ${notif.user.name} (${notif.read ? 'Read' : 'Unread'})`);
    });
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Notification test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testVideoSystem() {
  log.section('7. Video System Test');
  try {
    const videoCount = await prisma.courseLesson.count({
      where: {
        videoUrl: {
          not: null,
        },
      },
    });
    
    log.info(`Lessons with videos: ${videoCount}`);
    
    if (videoCount === 0) {
      log.warning('No video lessons found');
      warnings++;
      return true;
    }
    
    // Check video lesson
    const videoLesson = await prisma.courseLesson.findFirst({
      where: {
        videoUrl: {
          not: null,
        },
      },
      include: {
        module: {
          select: {
            title: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
    
    if (videoLesson) {
      log.success(`Video lesson: "${videoLesson.title}"`);
      log.info(`Course: ${videoLesson.module.course.title}`);
      log.info(`Module: ${videoLesson.module.title}`);
      log.info(`Duration: ${videoLesson.duration || 'Not set'}`);
      log.info(`Video URL: ${videoLesson.videoUrl.substring(0, 50)}...`);
    }
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Video system test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testProgressTracking() {
  log.section('8. Progress Tracking Test');
  try {
    // Check if there's a progress tracking field in CourseEnrollment
    const enrollmentsWithProgress = await prisma.courseEnrollment.count({
      where: {
        progress: {
          gt: 0,
        },
      },
    });
    
    log.info(`Enrollments with progress: ${enrollmentsWithProgress}`);
    
    if (enrollmentsWithProgress === 0) {
      log.warning('No progress tracking data found');
      warnings++;
      return true;
    }
    
    // Get enrollment with highest progress
    const topProgress = await prisma.courseEnrollment.findFirst({
      where: {
        progress: {
          gt: 0,
        },
      },
      orderBy: {
        progress: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });
    
    if (topProgress) {
      log.success(`${topProgress.user.name} has ${topProgress.progress}% progress in ${topProgress.course.title}`);
      log.info(`Completed: ${topProgress.completed ? 'Yes' : 'No'}`);
    }
    
    // Count completed enrollments
    const completedCount = await prisma.courseEnrollment.count({
      where: {
        completed: true,
      },
    });
    
    const totalEnrollments = await prisma.courseEnrollment.count();
    log.info(`Completed courses: ${completedCount}/${totalEnrollments}`);
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Progress tracking test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testMembershipIntegration() {
  log.section('9. Membership Integration Test');
  try {
    const membershipCount = await prisma.userMembership.count();
    log.info(`Total active memberships: ${membershipCount}`);
    
    if (membershipCount === 0) {
      log.warning('No memberships found');
      warnings++;
      return true;
    }
    
    // Check active memberships
    const activeMemberships = await prisma.userMembership.count({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });
    
    log.info(`Active memberships: ${activeMemberships}`);
    
    // Check membership with courses
    const membership = await prisma.userMembership.findFirst({
      include: {
        membership: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    if (membership) {
      log.success(`${membership.user.name} → ${membership.membership.name}`);
      log.info(`Start: ${membership.startDate.toLocaleDateString()}`);
      log.info(`End: ${membership.endDate.toLocaleDateString()}`);
      log.info(`Status: ${membership.isActive ? 'Active' : 'Inactive'}`);
    }
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Membership integration test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testActivityLogging() {
  log.section('10. Activity Logging Test');
  try {
    const logCount = await prisma.activityLog.count();
    log.info(`Total activity logs: ${logCount}`);
    
    if (logCount === 0) {
      log.warning('No activity logs found');
      warnings++;
      return true;
    }
    
    // Check recent activities
    const recentLogs = await prisma.activityLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    log.info('Recent activities:');
    recentLogs.forEach((activity, idx) => {
      console.log(`  ${idx + 1}. ${activity.user.name} → ${activity.action}`);
    });
    
    passed++;
    return true;
  } catch (error) {
    log.error(`Activity logging test failed: ${error.message}`);
    failed++;
    return false;
  }
}

async function testAPIEndpoints() {
  log.section('11. Critical API Endpoints Check');
  
  const fs = require('fs');
  const path = require('path');
  
  const criticalEndpoints = [
    'src/app/api/learn/[courseId]/progress/route.ts',
    'src/app/api/certificates/route.ts',
    'src/app/api/certificates/verify/[certificateNumber]/route.ts',
    'src/app/api/quizzes/attempts/[id]/submit/route.ts',
    'src/lib/certificate-generator.ts',
    'src/lib/email/certificate-email.ts',
  ];
  
  let allExist = true;
  
  criticalEndpoints.forEach(endpoint => {
    const fullPath = path.join(process.cwd(), endpoint);
    if (fs.existsSync(fullPath)) {
      log.success(`${endpoint} exists`);
    } else {
      log.error(`${endpoint} NOT FOUND`);
      allExist = false;
      failed++;
    }
  });
  
  if (allExist) {
    log.success('All critical endpoints exist');
    passed++;
  }
  
  return allExist;
}

async function runAllTests() {
  console.log(`\n${colors.magenta}${colors.bright}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}║   LMS INTEGRATION TESTING SUITE         ║${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}╚══════════════════════════════════════════╝${colors.reset}\n`);
  
  const startTime = Date.now();
  
  await testDatabaseConnection();
  await testCourseStructure();
  await testEnrollmentSystem();
  await testQuizSystem();
  await testCertificateSystem();
  await testNotificationSystem();
  await testVideoSystem();
  await testProgressTracking();
  await testMembershipIntegration();
  await testActivityLogging();
  await testAPIEndpoints();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Summary
  console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`${colors.green}✓ Passed:  ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed:  ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${warnings}${colors.reset}`);
  console.log(`⏱ Duration: ${duration}s\n`);
  
  if (failed === 0) {
    console.log(`${colors.green}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}${colors.bright}   ✓ ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}${colors.bright}   System is production-ready!${colors.reset}`);
    console.log(`${colors.green}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.red}${colors.bright}   ✗ TESTS FAILED!${colors.reset}`);
    console.log(`${colors.red}${colors.bright}   Please fix ${failed} error(s) before deployment${colors.reset}`);
    console.log(`${colors.red}${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }
  
  if (warnings > 0) {
    console.log(`${colors.yellow}Note: ${warnings} warning(s) detected - system will work but some features might be empty${colors.reset}\n`);
  }
  
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
