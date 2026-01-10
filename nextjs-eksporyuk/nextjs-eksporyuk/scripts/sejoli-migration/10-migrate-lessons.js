/**
 * Migrate Tutor LMS Lessons Only
 * Import lessons from Tutor LMS to CourseLesson
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

async function migrateLessons() {
  console.log('📝 MIGRATING TUTOR LMS LESSONS');
  console.log('===============================\n');

  try {
    // Load courses
    const coursesContent = await fs.readFile(path.join(EXPORT_DIR, 'tutor_courses.tsv'), 'utf-8');
    const courses = parseTSV(coursesContent, [
      'ID', 'post_author', 'post_date', 'post_content', 'post_title', 'post_status', 'post_name', 'post_type'
    ]);

    // Load lessons
    const lessonsContent = await fs.readFile(path.join(EXPORT_DIR, 'tutor_lessons.tsv'), 'utf-8');
    const lessons = parseTSV(lessonsContent, [
      'ID', 'post_author', 'post_date', 'post_content', 'post_title', 'post_status', 'post_name', 'post_parent', 'post_type'
    ]);

    console.log(`📊 Data loaded:`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Lessons: ${lessons.length}\n`);

    // Get admin as default
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    const courseMapping = {}; // Tutor course ID -> {courseId, moduleId}
    let importedCourses = 0;
    let importedModules = 0;
    let importedLessons = 0;

    // Step 1: Create Courses & Modules
    console.log('📖 Creating Courses & Modules...\n');
    
    for (const course of courses) {
      try {
        // Create Course
        const newCourse = await prisma.course.create({
          data: {
            mentorId: admin.id,
            title: course.post_title,
            slug: course.post_name || course.post_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: course.post_content || 'Course migrated from Sejoli',
            price: 0,
            originalPrice: 0,
            status: course.post_status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            isPublished: course.post_status === 'publish',
            publishedAt: course.post_status === 'publish' ? new Date(course.post_date) : null,
            monetizationType: 'FREE',
            affiliateCommissionRate: 30,
            createdAt: new Date(course.post_date),
          }
        });

        // Create default module
        const defaultModule = await prisma.courseModule.create({
          data: {
            courseId: newCourse.id,
            title: 'Materi Utama',
            description: 'Module utama course',
            order: 1,
          }
        });

        courseMapping[course.ID] = {
          courseId: newCourse.id,
          moduleId: defaultModule.id
        };

        importedCourses++;
        importedModules++;

        console.log(`✅ ${course.post_title}`);
        console.log(`   Course: ${newCourse.id}`);
        console.log(`   Module: ${defaultModule.id}\n`);

      } catch (error) {
        console.error(`❌ Course ${course.ID}: ${error.message}\n`);
      }
    }

    // Step 2: Import Lessons
    console.log('\n📝 Importing Lessons...\n');
    
    // Group lessons by course (post_parent)
    const lessonsByCourse = {};
    lessons.forEach(lesson => {
      const parentId = lesson.post_parent || '0';
      if (!lessonsByCourse[parentId]) {
        lessonsByCourse[parentId] = [];
      }
      lessonsByCourse[parentId].push(lesson);
    });

    for (const [courseId, courseLessons] of Object.entries(lessonsByCourse)) {
      const mapping = courseMapping[courseId];
      
      if (!mapping) {
        console.log(`⚠️  Skipping ${courseLessons.length} lessons - parent course ${courseId} not found\n`);
        continue;
      }

      console.log(`📚 Course ${courseId} (${mapping.courseId}) - ${courseLessons.length} lessons:`);

      for (let i = 0; i < courseLessons.length; i++) {
        const lesson = courseLessons[i];
        
        try {
          await prisma.courseLesson.create({
            data: {
              moduleId: mapping.moduleId,
              title: lesson.post_title,
              content: lesson.post_content || '',
              videoUrl: null,
              duration: 0,
              order: i + 1,
              isFree: false,
              createdAt: new Date(lesson.post_date),
            }
          });

          importedLessons++;
          
          if (importedLessons % 50 === 0) {
            process.stdout.write(`  ✅ ${importedLessons} lessons...\r`);
          }

        } catch (error) {
          console.error(`  ❌ Lesson ${lesson.ID}: ${error.message}`);
        }
      }
      
      console.log(`  ✅ ${courseLessons.length} lessons imported\n`);
    }

    // Summary
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('======================');
    console.log(`✅ Courses: ${importedCourses}`);
    console.log(`✅ Modules: ${importedModules}`);
    console.log(`✅ Lessons: ${importedLessons}`);
    console.log(`📊 Total: ${importedCourses + importedModules + importedLessons} records\n`);

    // Save mapping
    await fs.writeFile(
      path.join(EXPORT_DIR, '_course_mapping.json'),
      JSON.stringify(courseMapping, null, 2)
    );

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateLessons().catch(console.error);
