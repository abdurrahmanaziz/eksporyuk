const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  try {
    // Get courses
    const courses = await p.course.findMany({
      select: { id: true, title: true, slug: true, mentorId: true }
    });
    console.log('=== COURSES (Total:', courses.length, ') ===\n');
    
    for (const course of courses) {
      console.log('📚 Course:', course.title);
      console.log('   ID:', course.id);
      console.log('   Slug:', course.slug);
      console.log('   MentorId:', course.mentorId);
      
      // Get modules
      const modules = await p.courseModule.findMany({ 
        where: { courseId: course.id },
        select: { id: true, title: true, order: true }
      });
      console.log('   Modules:', modules.length);
      
      // Get lessons per module
      let totalLessons = 0;
      let lessonsWithVideo = 0;
      for (const mod of modules) {
        const lessons = await p.courseLesson.findMany({
          where: { moduleId: mod.id },
          select: { id: true, title: true, videoUrl: true }
        });
        totalLessons += lessons.length;
        lessonsWithVideo += lessons.filter(l => l.videoUrl).length;
      }
      console.log('   Total Lessons:', totalLessons);
      console.log('   Lessons with Video:', lessonsWithVideo);
      console.log('');
    }

    // Check mentor profile
    console.log('=== MENTOR PROFILE CHECK ===');
    const mentorProfile = await p.mentorProfile.findFirst({
      where: { id: 'cmj547e5d0004it1e6434w860' }
    });
    console.log('MentorProfile exists:', !!mentorProfile);
    
    if (mentorProfile) {
      console.log('MentorProfile userId:', mentorProfile.userId);
      const user = await p.user.findFirst({
        where: { id: mentorProfile.userId },
        select: { id: true, name: true, email: true, role: true }
      });
      console.log('User for this mentor:', user);
    }

    // List users with MENTOR role
    console.log('\n=== USERS WITH MENTOR ROLE ===');
    const mentorUsers = await p.user.findMany({
      where: { role: 'MENTOR' },
      select: { id: true, name: true, email: true },
      take: 10
    });
    console.log('Found', mentorUsers.length, 'users with MENTOR role');
    mentorUsers.forEach(u => console.log('  -', u.name, '|', u.email, '|', u.id));

    // Count all mentor profiles
    const allMentorProfiles = await p.mentorProfile.count();
    console.log('\n=== TOTAL MENTOR PROFILES:', allMentorProfiles, '===');

    // Show sample users to create mentor from
    console.log('\n=== SAMPLE USERS (first 5 non-admin) ===');
    const sampleUsers = await p.user.findMany({
      where: { role: { notIn: ['ADMIN'] } },
      select: { id: true, name: true, email: true, role: true },
      take: 5
    });
    sampleUsers.forEach(u => console.log('  -', u.name, '|', u.email, '| role:', u.role));

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    await p.$disconnect();
  }
}

check();
