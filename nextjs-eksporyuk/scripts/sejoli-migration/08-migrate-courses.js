/**
 * Migrate Tutor LMS Courses & Lessons
 * Import courses and lessons from Tutor LMS to new system
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

async function migrateCourses() {
  console.log('📚 MIGRATING TUTOR LMS COURSES');
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

    // Load course meta
    const metaContent = await fs.readFile(path.join(EXPORT_DIR, 'tutor_course_meta.tsv'), 'utf-8');
    const courseMeta = parseTSV(metaContent, ['post_id', 'meta_key', 'meta_value']);

    // Build meta lookup
    const metaByPost = {};
    courseMeta.forEach(meta => {
      if (!metaByPost[meta.post_id]) metaByPost[meta.post_id] = {};
      metaByPost[meta.post_id][meta.meta_key] = meta.meta_value;
    });

    console.log(`📊 Data loaded:`);
    console.log(`   Courses: ${courses.length}`);
    console.log(`   Lessons: ${lessons.length}\n`);

    // Create user mapping (Sejoli user ID -> Eksporyuk user ID)
    const sejoliUsers = JSON.parse(
      await fs.readFile(path.join(EXPORT_DIR, 'sejoli_users.json'), 'utf-8')
    );
    
    const userMapping = {};
    for (const sejoliUser of sejoliUsers) {
      if (!sejoliUser.user_email) continue;
      
      const eksporyukUser = await prisma.user.findUnique({
        where: { email: sejoliUser.user_email },
        select: { id: true }
      });
      if (eksporyukUser) {
        userMapping[sejoliUser.ID] = eksporyukUser.id;
      }
    }

    console.log(`📊 User mapping: ${Object.keys(userMapping).length} users\n`);

    // Get admin as default author
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    const courseMapping = {}; // Tutor course ID -> Course Material ID
    let importedCourses = 0;
    let importedLessons = 0;

    // Import courses
    console.log('📖 Importing Courses...\n');
    
    for (const course of courses) {
      try {
        const authorId = userMapping[course.post_author] || admin.id;
        const meta = metaByPost[course.ID] || {};
        
        // Parse duration safely
        let duration = null;
        if (meta._course_duration) {
          const parsed = parseInt(meta._course_duration);
          if (!isNaN(parsed)) duration = parsed;
        }

        // Create course
        const courseRecord = await prisma.course.create({
          data: {
            mentorId: authorId,
            title: course.post_title,
            slug: course.post_name || course.post_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: course.post_content || course.post_title,
            thumbnail: null,
            price: meta._tutor_course_price ? parseFloat(meta._tutor_course_price) : 0,
            originalPrice: null,
            duration: duration,
            level: meta._tutor_course_level || 'beginner',
            status: course.post_status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            isPublished: course.post_status === 'publish',
            publishedAt: course.post_status === 'publish' ? new Date(course.post_date) : null,
            monetizationType: (meta._tutor_course_price && parseFloat(meta._tutor_course_price) > 0) ? 'PAID' : 'FREE',
            createdAt: new Date(course.post_date),
          }
        });

        courseMapping[course.ID] = courseRecord.id;
        importedCourses++;

        console.log(`✅ ${course.post_title}`);
        console.log(`   ID: ${courseRecord.id} (was ${course.ID})`);
        console.log(`   Price: Rp ${parseFloat(meta._tutor_course_price || 0).toLocaleString('id-ID')}\n`);

      } catch (error) {
        console.error(`❌ Failed course ${course.ID}: ${error.message}\n`);
      }
    }

    // Import lessons
    console.log('\n📝 Importing Lessons...\n');
    
    // Group lessons by course
    const lessonsByCourse = {};
    lessons.forEach(lesson => {
      if (!lessonsByCourse[lesson.post_parent]) {
        lessonsByCourse[lesson.post_parent] = [];
      }
      lessonsByCourse[lesson.post_parent].push(lesson);
    });

    for (const [courseId, courseLessons] of Object.entries(lessonsByCourse)) {
      const parentCourseId = courseMapping[courseId];
      
      if (!parentCourseId) {
        console.log(`⚠️  Skipping ${courseLessons.length} lessons - parent course ${courseId} not found\n`);
        continue;
      }

      console.log(`📚 Course ${courseId} - ${courseLessons.length} lessons:`);

      // Create module for this course
      const module = await prisma.courseModule.create({
        data: {
          courseId: parentCourseId,
          title: 'Main Module',
          description: 'Lessons imported from Tutor LMS',
          order: 1,
        }
      });

      for (let i = 0; i < courseLessons.length; i++) {
        const lesson = courseLessons[i];
        
        try {
          await prisma.courseLesson.create({
            data: {
              moduleId: module.id,
              title: lesson.post_title,
              content: lesson.post_content || lesson.post_title,
              videoUrl: null,
              duration: 0,
              order: i + 1,
              isFree: false,
              createdAt: new Date(lesson.post_date),
            }
          });

          importedLessons++;
          
          if (importedLessons % 50 === 0) {
            process.stdout.write(`  ✅ ${importedLessons} lessons imported...\r`);
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
    console.log(`✅ Courses imported: ${importedCourses}`);
    console.log(`✅ Lessons imported: ${importedLessons}`);
    console.log(`📊 Total materials: ${importedCourses + importedLessons}\n`);

    // Save mapping
    await fs.writeFile(
      path.join(EXPORT_DIR, '_course_mapping.json'),
      JSON.stringify(courseMapping, null, 2)
    );

    console.log('📁 Course mapping saved to _course_mapping.json\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateCourses().catch(console.error);
