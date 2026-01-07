const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detailedModuleAudit() {
  try {
    console.log('🔍 AUDIT DETAIL MODUL DAN MATERI\n');
    console.log('='.repeat(80));
    
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, slug: true }
    });
    
    let totalStats = { courses: 0, modules: 0, lessons: 0, lessonsWithContent: 0, lessonsWithVideo: 0 };
    
    for (const course of courses) {
      console.log(`\n📚 KURSUS: ${course.title} (${course.slug})`);
      console.log('='.repeat(80));
      
      const modules = await prisma.courseModule.findMany({
        where: { courseId: course.id },
        orderBy: { order: 'asc' },
        select: { id: true, title: true, order: true, description: true }
      });
      
      console.log(`\n📊 Total Modules: ${modules.length}\n`);
      
      if (modules.length === 0) {
        console.log('⚠️  TIDAK ADA MODULE!\n');
        continue;
      }
      
      totalStats.courses++;
      totalStats.modules += modules.length;
      
      for (const mod of modules) {
        console.log(`\n▶ MODULE ${mod.order}: "${mod.title}"`);
        console.log(`  ID: ${mod.id}`);
        if (mod.description) {
          console.log(`  Deskripsi: ${mod.description}`);
        }
        
        // Get lessons for this module
        const lessons = await prisma.courseLesson.findMany({
          where: { moduleId: mod.id },
          orderBy: { order: 'asc' },
          select: { 
            id: true, 
            title: true, 
            order: true,
            content: true,
            videoUrl: true,
            isFree: true,
            duration: true
          }
        });
        
        console.log(`  📖 Total Lessons: ${lessons.length}`);
        
        if (lessons.length === 0) {
          console.log(`  ⚠️  MODULE INI KOSONG - TIDAK ADA LESSON!`);
          continue;
        }
        
        totalStats.lessons += lessons.length;
        
        // Analyze content
        let contentCount = 0;
        let videoCount = 0;
        
        for (const lesson of lessons) {
          const hasContent = lesson.content && lesson.content.trim().length > 0;
          const hasVideo = lesson.videoUrl && lesson.videoUrl.trim().length > 0;
          
          if (hasContent) contentCount++;
          if (hasVideo) videoCount++;
          
          const contentStatus = hasContent ? '✅' : '❌';
          const videoStatus = hasVideo ? '✅' : '❌';
          const freeStatus = lesson.isFree ? '🆓' : '🔒';
          
          console.log(`    ${lesson.order}. ${contentStatus} ${videoStatus} ${freeStatus} "${lesson.title}"`);
          
          if (!hasContent) {
            console.log(`        ⚠️  TIDAK ADA CONTENT`);
          }
          if (!hasVideo && lesson.videoUrl) {
            console.log(`        ⚠️  VIDEO URL INVALID: ${lesson.videoUrl.substring(0, 50)}...`);
          }
        }
        
        console.log(`  📈 Content: ${contentCount}/${lessons.length} (${Math.round(contentCount/lessons.length*100)}%)`);
        console.log(`  🎬 Video: ${videoCount}/${lessons.length} (${Math.round(videoCount/lessons.length*100)}%)`);
        
        totalStats.lessonsWithContent += contentCount;
        totalStats.lessonsWithVideo += videoCount;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 RINGKASAN TOTAL:');
    console.log(`  Courses: ${totalStats.courses}`);
    console.log(`  Modules: ${totalStats.modules}`);
    console.log(`  Lessons: ${totalStats.lessons}`);
    console.log(`  Lessons with Content: ${totalStats.lessonsWithContent}/${totalStats.lessons} (${Math.round(totalStats.lessonsWithContent/totalStats.lessons*100)}%)`);
    console.log(`  Lessons with Video: ${totalStats.lessonsWithVideo}/${totalStats.lessons} (${Math.round(totalStats.lessonsWithVideo/totalStats.lessons*100)}%)`);
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

detailedModuleAudit();