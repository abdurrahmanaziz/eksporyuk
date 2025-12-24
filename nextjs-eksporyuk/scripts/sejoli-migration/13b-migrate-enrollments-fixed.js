/**
 * Migrate Course Enrollments (Fixed)
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

    // Process enrollments
    let validEnrollments = 0;
    let skippedEnrollments = 0;
    const enrollmentsToCreate = [];

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

      enrollmentsToCreate.push({
        userId: newUserId,
        courseId: newCourseId,
        progress: enrollment.post_status === 'completed' ? 100 : 0,
        completed: enrollment.post_status === 'completed',
        completedAt: enrollment.post_status === 'completed' ? new Date(enrollment.post_date) : null,
        createdAt: new Date(enrollment.post_date)
      });

      validEnrollments++;
    }

    console.log(`📈 Processing ${validEnrollments} valid enrollments (skipped ${skippedEnrollments})\n`);

    // Remove existing enrollments
    await prisma.courseEnrollment.deleteMany({});
    console.log('🗑️  Cleared existing enrollments\n');

    // Create unique enrollments only
    const uniqueEnrollments = [];
    const enrollmentSet = new Set();

    for (const enrollment of enrollmentsToCreate) {
      const key = `${enrollment.userId}-${enrollment.courseId}`;
      
      if (!enrollmentSet.has(key)) {
        enrollmentSet.add(key);
        uniqueEnrollments.push(enrollment);
      }
    }

    console.log(`✨ Creating ${uniqueEnrollments.length} unique enrollments\n`);

    // Group by course for better reporting
    const enrollmentsByCourse = {};
    for (const enrollment of uniqueEnrollments) {
      if (!enrollmentsByCourse[enrollment.courseId]) {
        enrollmentsByCourse[enrollment.courseId] = [];
      }
      enrollmentsByCourse[enrollment.courseId].push(enrollment);
    }

    // Create enrollments in batches
    let totalCreated = 0;
    for (const [courseId, courseEnrollments] of Object.entries(enrollmentsByCourse)) {
      // Get course info
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true }
      });

      console.log(`📚 ${course?.title || courseId}: ${courseEnrollments.length} enrollments`);

      const batchSize = 50;
      for (let i = 0; i < courseEnrollments.length; i += batchSize) {
        const batch = courseEnrollments.slice(i, i + batchSize);

        try {
          await prisma.courseEnrollment.createMany({
            data: batch
          });

          totalCreated += batch.length;

          if ((i / batchSize + 1) % 5 === 0) {
            console.log(`     ✓ Created ${Math.min(i + batchSize, courseEnrollments.length)} enrollments`);
          }
        } catch (error) {
          console.log(`   ⚠️  Batch error: ${error.message}`);
        }
      }
    }

    // Get final stats
    const finalEnrollments = await prisma.courseEnrollment.count();
    const completedCount = await prisma.courseEnrollment.count({
      where: { completed: true }
    });
    const activeCount = await prisma.courseEnrollment.count({
      where: { completed: false }
    });

    console.log('\n🎉 ENROLLMENT MIGRATION COMPLETE!');
    console.log('==================================');
    console.log(`✅ Total enrollments: ${finalEnrollments}`);
    console.log(`✅ Created: ${totalCreated}`);
    
    console.log('\n📊 Status breakdown:');
    console.log(`   Completed: ${completedCount}`);
    console.log(`   Active: ${activeCount}`);

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