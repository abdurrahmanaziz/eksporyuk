/**
 * Clean up duplicate courses
 * Keep only courses with lessons
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🧹 CLEANUP DUPLICATE COURSES\n');
  
  try {
    // Get all courses
    const allCourses = await prisma.course.findMany({
      select: { 
        id: true, 
        title: true, 
        createdAt: true
      }
    });
    
    console.log(`Found ${allCourses.length} courses total\n`);
    
    // Group by title
    const groups = {};
    for (const course of allCourses) {
      if (!groups[course.title]) groups[course.title] = [];
      groups[course.title].push(course);
    }
    
    // Process each group
    for (const [title, courses] of Object.entries(groups)) {
      if (courses.length > 1) {
        console.log(`📂 "${title}": ${courses.length} duplicates`);
        
        // Get lesson count for each course
        const coursesWithStats = [];
        for (const course of courses) {
          const modules = await prisma.courseModule.findMany({
            where: { courseId: course.id },
            select: { id: true }
          });
          
          let lessonCount = 0;
          for (const module of modules) {
            const count = await prisma.courseLesson.count({
              where: { moduleId: module.id }
            });
            lessonCount += count;
          }
          
          coursesWithStats.push({
            ...course,
            lessonCount,
            moduleIds: modules.map(m => m.id)
          });
        }
        
        // Sort by lesson count (keep highest)
        coursesWithStats.sort((a, b) => b.lessonCount - a.lessonCount);
        
        const toKeep = coursesWithStats[0];
        const toDelete = coursesWithStats.slice(1);
        
        console.log(`   ✅ Keep: ${toKeep.id} (${toKeep.lessonCount} lessons)`);
        
        // Delete duplicates
        for (const course of toDelete) {
          console.log(`   ❌ Delete: ${course.id} (${course.lessonCount} lessons)`);
          
          // Delete lessons first
          for (const moduleId of course.moduleIds) {
            await prisma.courseLesson.deleteMany({ where: { moduleId } });
          }
          
          // Delete modules
          await prisma.courseModule.deleteMany({ where: { courseId: course.id } });
          
          // Delete course
          await prisma.course.delete({ where: { id: course.id } });
        }
        
        console.log('');
      }
    }
    
    // Final stats
    const finalCourses = await prisma.course.count();
    const finalLessons = await prisma.courseLesson.count();
    
    console.log('✅ Cleanup complete!');
    console.log(`📊 Final: ${finalCourses} courses, ${finalLessons} lessons`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();