/**
 * Smart Lesson Migration
 * Map lessons to courses using keyword matching and enrollment data
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

// Keyword-based course detection
function detectCourse(lessonTitle, lessonContent) {
  const text = `${lessonTitle} ${lessonContent}`.toLowerCase();
  
  // Course 1678: KELAS BIMBINGAN EKSPOR YUK
  if (text.includes('ekspor yuk') && !text.includes('automation') && !text.includes('website')) {
    return 1678;
  }
  
  // Course 2984: EKSPOR YUK AUTOMATION (EYA)
  if (text.includes('automation') || text.includes('eya') || text.includes('ekspor yuk automation')) {
    return 2984;
  }
  
  // Course 8692: KELAS WEBSITE EKSPOR
  if (text.includes('website') || text.includes('web ekspor')) {
    return 8692;
  }
  
  // Default to main course
  return 1678;
}

async function smartMigrateLessons() {
  console.log('📝 SMART LESSON MIGRATION');
  console.log('==========================\n');

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

    // Load enrollments to map user -> course -> lessons
    const enrollmentsContent = await fs.readFile(path.join(EXPORT_DIR, 'tutor_enrollments.tsv'), 'utf-8');
    const enrollments = parseTSV(enrollmentsContent, [
      'ID', 'post_id', 'post_date', 'post_parent', 'post_status'
    ]);

    console.log(`📊 Data loaded:`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Lessons: ${lessons.length}`);
    console.log(`   Enrollments: ${enrollments.length}\n`);

    // Get admin
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      throw new Error('❌ No admin user found. Please create one first.');
    }

    // Load course mapping
    let courseMapping = {};
    try {
      const mappingContent = await fs.readFile(path.join(EXPORT_DIR, '_course_mapping.json'), 'utf-8');
      const mapping = JSON.parse(mappingContent);
      mapping.forEach(item => {
        courseMapping[item.oldId] = item;
      });
    } catch (error) {
      console.log('⚠️  No course mapping found, will create courses...\n');
    }

    console.log('📖 Creating/Verifying Courses & Modules...\n');

    // Create or get courses
    for (const tutorCourse of courses) {
      const oldId = parseInt(tutorCourse.ID);
      let newCourse, defaultModule;

      if (courseMapping[oldId]) {
        console.log(`✓ Using existing: ${tutorCourse.post_title}`);
        continue;
      }

      // Create course
      const slug = tutorCourse.post_name || tutorCourse.post_title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      newCourse = await prisma.course.create({
        data: {
          mentorId: admin.id,
          title: tutorCourse.post_title,
          slug: slug,
          description: tutorCourse.post_content || tutorCourse.post_title,
          price: 0,
          status: tutorCourse.post_status === 'publish' ? 'PUBLISHED' : 'DRAFT',
          isPublished: tutorCourse.post_status === 'publish',
          monetizationType: 'FREE',
          publishedAt: tutorCourse.post_status === 'publish' ? new Date(tutorCourse.post_date) : null,
        }
      });

      // Create default module
      defaultModule = await prisma.courseModule.create({
        data: {
          courseId: newCourse.id,
          title: 'Materi Utama',
          description: `Module untuk ${tutorCourse.post_title}`,
          order: 1,
        }
      });

      courseMapping[oldId] = {
        oldId: oldId,
        newId: newCourse.id,
        moduleId: defaultModule.id,
        title: tutorCourse.post_title
      };

      console.log(`✅ ${tutorCourse.post_title}`);
      console.log(`   Course: ${newCourse.id}`);
      console.log(`   Module: ${defaultModule.id}\n`);
    }

    // Save updated mapping
    await fs.writeFile(
      path.join(EXPORT_DIR, '_course_mapping.json'),
      JSON.stringify(Object.values(courseMapping), null, 2)
    );

    console.log('\n📝 Importing Lessons with Smart Detection...\n');

    let imported = 0;
    let skipped = 0;
    let errors = [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      
      try {
        // Detect course using keywords
        const detectedCourseId = detectCourse(lesson.post_title, lesson.post_content || '');
        
        if (!courseMapping[detectedCourseId]) {
          skipped++;
          if (skipped % 50 === 0) {
            console.log(`⚠️  Skipped ${skipped} lessons (no matching course)`);
          }
          continue;
        }

        const mapping = courseMapping[detectedCourseId];

        // Create lesson
        await prisma.courseLesson.create({
          data: {
            moduleId: mapping.moduleId,
            title: lesson.post_title,
            content: lesson.post_content || `<p>${lesson.post_title}</p>`,
            order: i + 1,
            isFree: false,
          }
        });

        imported++;

        if (imported % 50 === 0) {
          console.log(`✓ Imported ${imported} lessons...`);
        }

      } catch (error) {
        errors.push({
          lessonId: lesson.ID,
          title: lesson.post_title,
          error: error.message
        });
      }
    }

    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('======================');
    console.log(`✅ Courses: ${Object.keys(courseMapping).length}`);
    console.log(`✅ Modules: ${Object.keys(courseMapping).length}`);
    console.log(`✅ Lessons Imported: ${imported}`);
    console.log(`⚠️  Lessons Skipped: ${skipped}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors (${errors.length}):`);
      errors.slice(0, 10).forEach(err => {
        console.log(`   - Lesson ${err.lessonId} (${err.title}): ${err.error}`);
      });
    }

    console.log(`\n📊 Total: ${imported + skipped} lessons processed`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

smartMigrateLessons();
