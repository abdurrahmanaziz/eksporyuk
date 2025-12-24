/**
 * Migrate Course Enrollments
 * Link users to courses based on enrollment data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();
const EXPORT_DIR = path.join(__dirname, 'exports');

// Parse TSV
function parseTSV(content, columns) {
  const lines = content.trim().split('\n');
  return lines.map(line => {
    const values = line.split('\t');
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = values[i] === 'NULL' || !values[i] ? null : values[i];
    });
    return obj;
  });
}

async function migrateEnrollments() {
  console.log('👥 MIGRATING COURSE ENROLLMENTS');
  console.log('=================================\n');

  try {
    // Load enrollment data
    const enrollmentsContent = await fs.readFile(path.join(EXPORT_DIR, 'tutor_enrollments.tsv'), 'utf-8');
    const enrollments = parseTSV(enrollmentsContent, [
      'ID', 'post_id', 'post_date', 'post_parent', 'post_status'  // post_parent = course_id
    ]);

    console.log(`📊 Data loaded: ${enrollments.length} enrollments\n`);

    // Load user mapping (old ID -> new ID)
    const userMappingContent = await fs.readFile(path.join(EXPORT_DIR, '_user_mapping.json'), 'utf-8');
    const userMapping = JSON.parse(userMappingContent);

    // Load course mapping (old ID -> new ID)
    const courseMappingContent = await fs.readFile(path.join(EXPORT_DIR, '_course_mapping.json'), 'utf-8');
    const courseMappingArray = JSON.parse(courseMappingContent);
    const courseMapping = {};
    courseMappingArray.forEach(item => {
      courseMapping[item.oldId] = item.newId;
    });

    console.log(`📋 Mappings loaded:`);
    console.log(`   Users: ${Object.keys(userMapping).length}`);
    console.log(`   Courses: ${Object.keys(courseMapping).length}\n`);

    // Group enrollments by course
    const enrollmentsByCourse = {};
    let validEnrollments = 0;
    let skippedEnrollments = 0;

    for (const enrollment of enrollments) {
      const oldUserId = enrollment.post_id;
      const oldCourseId = enrollment.post_parent;

      // Skip if no valid course
      if (!oldCourseId || oldCourseId === '0' || !courseMapping[oldCourseId]) {
        skippedEnrollments++;
        continue;
      }

      // Skip if no valid user
      if (!oldUserId || !userMapping[oldUserId]) {
        skippedEnrollments++;
        continue;
      }

      const newUserId = userMapping[oldUserId];
      const newCourseId = courseMapping[oldCourseId];

      if (!enrollmentsByCourse[newCourseId]) {
        enrollmentsByCourse[newCourseId] = [];
      }

      enrollmentsByCourse[newCourseId].push({
        userId: newUserId,
        enrollmentDate: new Date(enrollment.post_date),
        status: enrollment.post_status === 'completed' ? 'COMPLETED' : 'ACTIVE',
        progress: enrollment.post_status === 'completed' ? 100 : 0
      });

      validEnrollments++;
    }

    console.log(`📈 Processing ${validEnrollments} valid enrollments (skipped ${skippedEnrollments})\n`);

    // Create enrollments per course
    let totalCreated = 0;
    for (const [courseId, courseEnrollments] of Object.entries(enrollmentsByCourse)) {
      // Get course info
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
      });

      console.log(`📚 ${course?.title || courseId}: ${courseEnrollments.length} enrollments`);

      // Create enrollments in batches
      const batchSize = 100;
      for (let i = 0; i < courseEnrollments.length; i += batchSize) {
        const batch = courseEnrollments.slice(i, i + batchSize);

        // Create unique enrollments (avoid duplicates)
        for (const enrollment of batch) {
          try {
            await prisma.courseEnrollment.upsert({
              where: {
                userId_courseId: {
                  userId: enrollment.userId,
                  courseId: courseId
                }
              },
              create: {
                userId: enrollment.userId,
                courseId: courseId,
                enrolledAt: enrollment.enrollmentDate,
                status: enrollment.status,
                progress: enrollment.progress
              },
              update: {
                status: enrollment.status,
                progress: enrollment.progress
              }
            });

            totalCreated++;
          } catch (error) {
            if (!error.message.includes('Unique constraint')) {
              console.log(`   ⚠️  Error for user ${enrollment.userId}: ${error.message}`);
            }
          }
        }

        if ((i / batchSize + 1) % 10 === 0) {
          console.log(`     ✓ Processed ${Math.min(i + batchSize, courseEnrollments.length)} enrollments`);
        }
      }
    }

    // Get final stats
    const finalEnrollments = await prisma.courseEnrollment.count();
    const enrollmentStats = await prisma.courseEnrollment.groupBy({
      by: ['status'],
      _count: { _all: true }
    });

    console.log('\n🎉 ENROLLMENT MIGRATION COMPLETE!');
    console.log('==================================');
    console.log(`✅ Total enrollments: ${finalEnrollments}`);
    console.log(`✅ Created/Updated: ${totalCreated}`);
    
    console.log('\n📊 Status breakdown:');
    enrollmentStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count._all}`);
    });

    // Course enrollment summary
    console.log('\n📚 Courses with enrollments:');
    for (const [courseId] of Object.entries(enrollmentsByCourse)) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
      });
      
      const enrollmentCount = await prisma.courseEnrollment.count({
        where: { courseId }
      });

      console.log(`   ${course?.title}: ${enrollmentCount} students`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateEnrollments();