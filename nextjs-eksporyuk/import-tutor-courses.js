/**
 * Import Tutor LMS Courses to NextJS Database
 * Reads from tutor-courses-export.json and imports to Prisma database
 * 
 * Schema uses: Course, CourseModule, CourseLesson
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse PHP serialized string to extract YouTube URL
function parseVideoUrl(serializedData) {
  if (!serializedData) return null;
  
  // Try to extract YouTube URL from serialized PHP array
  // Format: s:14:"source_youtube";s:28:"https://youtu.be/xxxxx"
  const youtubeMatch = serializedData.match(/source_youtube";s:\d+:"([^"]+)"/);
  if (youtubeMatch && youtubeMatch[1]) {
    return youtubeMatch[1];
  }
  
  // Try Vimeo
  const vimeoMatch = serializedData.match(/source_vimeo";s:\d+:"([^"]+)"/);
  if (vimeoMatch && vimeoMatch[1] && vimeoMatch[1].length > 0) {
    return vimeoMatch[1];
  }
  
  // Try external URL
  const externalMatch = serializedData.match(/source_external_url";s:\d+:"([^"]+)"/);
  if (externalMatch && externalMatch[1] && externalMatch[1].length > 0) {
    return externalMatch[1];
  }
  
  return null;
}

// Parse duration from serialized PHP string - returns in seconds
function parseDuration(serializedData) {
  if (!serializedData) return null;
  
  // Extract hours, minutes, seconds from video runtime
  const hoursMatch = serializedData.match(/hours";s:\d+:"(\d+)"/);
  const minutesMatch = serializedData.match(/minutes";s:\d+:"(\d+)"/);
  const secondsMatch = serializedData.match(/seconds";s:\d+:"(\d+)"/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
  
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  return totalSeconds > 0 ? totalSeconds : null;
}

// Clean HTML content
function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

// Generate unique slug
function generateSlug(title, existingSlugs) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
  
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  existingSlugs.add(slug);
  return slug;
}

async function importCourses() {
  console.log('📚 Starting Tutor LMS Course Import...\n');
  
  // Read exported data
  const exportPath = path.join(__dirname, 'tutor-courses-export.json');
  if (!fs.existsSync(exportPath)) {
    console.error('❌ tutor-courses-export.json not found!');
    console.log('   Run fetch-tutor-courses.js first');
    process.exit(1);
  }
  
  const coursesData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  console.log(`📖 Found ${coursesData.length} courses to import\n`);
  
  // Find mentor user (author)
  let mentor = await prisma.user.findFirst({
    where: { role: 'MENTOR' }
  });
  
  if (!mentor) {
    mentor = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
  }
  
  if (!mentor) {
    console.error('❌ No MENTOR or ADMIN user found to assign as course author');
    process.exit(1);
  }
  
  console.log(`👤 Using author: ${mentor.name} (${mentor.email})\n`);
  
  const existingSlugs = new Set();
  const stats = {
    courses: 0,
    modules: 0,
    lessons: 0,
    skipped: 0
  };
  
  for (const courseData of coursesData) {
    console.log(`\n📖 Processing: ${courseData.title}`);
    
    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        OR: [
          { slug: courseData.slug },
          { title: courseData.title }
        ]
      }
    });
    
    if (existingCourse) {
      console.log(`   ⚠️ Course already exists, deleting modules/lessons for clean import...`);
      
      // Delete existing modules and lessons
      const existingModules = await prisma.courseModule.findMany({
        where: { courseId: existingCourse.id }
      });
      
      for (const mod of existingModules) {
        await prisma.courseLesson.deleteMany({ where: { moduleId: mod.id } });
      }
      await prisma.courseModule.deleteMany({ where: { courseId: existingCourse.id } });
    }
    
    const courseSlug = generateSlug(courseData.title, existingSlugs);
    
    // Create or update course
    const course = existingCourse 
      ? await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            title: courseData.title,
            description: courseData.description || `Kelas ${courseData.title}`,
            thumbnail: courseData.thumbnail || null,
            status: courseData.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
          }
        })
      : await prisma.course.create({
          data: {
            title: courseData.title,
            slug: courseSlug,
            description: courseData.description || `Kelas ${courseData.title}`,
            thumbnail: courseData.thumbnail || null,
            price: courseData.price || 0,
            status: courseData.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            level: courseData.level === 'all_levels' ? 'Beginner' : 
                   courseData.level === 'intermediate' ? 'Intermediate' : 
                   courseData.level === 'advanced' ? 'Advanced' : 'Beginner',
            mentorId: mentor.id,
          }
        });
    
    stats.courses++;
    console.log(`   ✅ Course created/updated: ${course.title} (ID: ${course.id})`);
    
    // Import topics as CourseModules
    for (const topic of courseData.topics || []) {
      const module = await prisma.courseModule.create({
        data: {
          title: topic.title,
          description: '',
          order: topic.order_index || 0,
          courseId: course.id,
        }
      });
      
      stats.modules++;
      console.log(`      📁 Module: ${topic.title} (${topic.lessons?.length || 0} lessons)`);
      
      // Import lessons as CourseLessons
      for (const lessonData of topic.lessons || []) {
        const videoUrl = parseVideoUrl(lessonData.videoUrl);
        const duration = parseDuration(lessonData.videoUrl);
        
        await prisma.courseLesson.create({
          data: {
            title: lessonData.title,
            content: cleanHtml(lessonData.content) || '',
            videoUrl: videoUrl,
            duration: duration,
            order: lessonData.order_index || 0,
            moduleId: module.id,
            isFree: false,
          }
        });
        
        stats.lessons++;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY:');
  console.log('='.repeat(50));
  console.log(`   ✅ Courses imported: ${stats.courses}`);
  console.log(`   ✅ Modules imported: ${stats.modules}`);
  console.log(`   ✅ Lessons imported: ${stats.lessons}`);
  console.log('='.repeat(50));
  
  // Show imported courses
  console.log('\n📋 IMPORTED COURSES:');
  const importedCourses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  for (const course of importedCourses) {
    const moduleCount = await prisma.courseModule.count({ where: { courseId: course.id } });
    const modules = await prisma.courseModule.findMany({ where: { courseId: course.id } });
    let lessonCount = 0;
    for (const m of modules) {
      lessonCount += await prisma.courseLesson.count({ where: { moduleId: m.id } });
    }
    console.log(`   📖 ${course.title}`);
    console.log(`      Slug: ${course.slug}`);
    console.log(`      Modules: ${moduleCount}, Lessons: ${lessonCount}`);
  }
}

// Run import
importCourses()
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
