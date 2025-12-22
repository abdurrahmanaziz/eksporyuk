const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    console.log('=== Checking Course: kelas-eksporyuk ===\n');
    
    // 1. Check if course exists with slug
    const courseBySlug = await p.course.findFirst({
      where: { slug: 'kelas-eksporyuk' }
    });
    
    if (courseBySlug) {
      console.log('✅ Course found by slug:');
      console.log('   ID:', courseBySlug.id);
      console.log('   Title:', courseBySlug.title);
      console.log('   Slug:', courseBySlug.slug);
      console.log('   Status:', courseBySlug.status);
      console.log('   MentorId:', courseBySlug.mentorId);
      console.log('   isPublished:', courseBySlug.isPublished);
      console.log('   roleAccess:', courseBySlug.roleAccess);
      
      // Check modules for this course
      const modules = await p.courseModule.findMany({
        where: { courseId: courseBySlug.id },
        orderBy: { order: 'asc' }
      });
      console.log('\n📚 Modules for this course:', modules.length);
      
      let totalLessons = 0;
      for (const mod of modules) {
        const lessons = await p.courseLesson.findMany({
          where: { moduleId: mod.id }
        });
        console.log('   Module:', mod.title, '- Lessons:', lessons.length);
        totalLessons += lessons.length;
      }
      console.log('\n📖 Total Lessons:', totalLessons);
    } else {
      console.log('❌ Course NOT FOUND with slug: kelas-eksporyuk');
    }
    
    // 2. Search for any course with "eksporyuk" in title or slug
    console.log('\n=== Searching courses with "eksporyuk" ===\n');
    const relatedCourses = await p.course.findMany({
      where: {
        OR: [
          { slug: { contains: 'eksporyuk' } },
          { title: { contains: 'eksporyuk' } },
          { title: { contains: 'Eksporyuk' } }
        ]
      },
      select: { id: true, slug: true, title: true, status: true, isPublished: true }
    });
    
    console.log('Found', relatedCourses.length, 'related courses:');
    relatedCourses.forEach(c => {
      console.log('  - Slug:', c.slug || '(no slug)');
      console.log('    Title:', c.title);
      console.log('    Status:', c.status);
      console.log('    Published:', c.isPublished);
      console.log('');
    });
    
    // 3. List ALL courses
    console.log('\n=== ALL Courses in Database ===\n');
    const allCourses = await p.course.findMany({
      select: { id: true, slug: true, title: true, status: true, isPublished: true },
      orderBy: { title: 'asc' }
    });
    
    console.log('Total courses:', allCourses.length);
    allCourses.forEach(c => {
      console.log('  -', c.slug || '(no slug)', ':', c.title, '|', c.status, '| Published:', c.isPublished);
    });
    
  } catch (e) {
    console.error('❌ ERROR:', e.message);
    console.error(e.stack);
  }
  await p.$disconnect();
}

test();
