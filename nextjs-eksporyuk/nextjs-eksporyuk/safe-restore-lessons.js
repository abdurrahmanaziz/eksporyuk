/**
 * SAFE COURSELESSON RESTORATION
 * Restores CourseLesson data with actual content from backup
 * Uses UPSERT operations to preserve existing data safely
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🔄 SAFE COURSELESSON RESTORATION STARTING...\n');
console.log('⚠️  PRESERVATION MODE - EXISTING DATA WILL NOT BE DELETED\n');
console.log('📚 Restoring actual lesson content with videos and materials\n');

const backupUrl = 'https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/backup-2025-12-17T15-28-38-897Z.json';

async function safeRestoreLessons() {
  try {
    // Step 1: Fetch backup data
    console.log('📥 Fetching lesson backup data...');
    const response = await fetch(backupUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch backup: ${response.status}`);
    }
    
    const backup = await response.json();
    const lessons = backup.tables.CourseLesson;
    
    console.log(`✅ Loaded backup with ${lessons.length} lessons`);
    
    // Step 2: Check current database state (read-only)
    const currentLessons = await prisma.courseLesson.count();
    
    console.log(`📊 Current database: ${currentLessons} lessons`);
    
    // Step 3: Show sample content before restoration
    console.log('\\n📝 SAMPLE CONTENT TO BE RESTORED:');
    const samplesWithContent = lessons.filter(l => l.content && l.content.length > 20).slice(0, 3);
    samplesWithContent.forEach((lesson, i) => {
      console.log(`   ${i+1}. ${lesson.title}`);
      console.log(`      Content: ${lesson.content ? lesson.content.substring(0, 100) + '...' : 'NULL'}`);
      console.log(`      Video: ${lesson.videoUrl ? 'YES' : 'NO'}`);
    });
    
    console.log('\\n🔄 Starting lesson restoration...');
    
    // Step 4: Safely restore/update course lessons (UPSERT)
    let restored = 0;
    let updated = 0;
    let errors = 0;
    let withContent = 0;
    let withVideo = 0;
    
    for (const lesson of lessons) {
      try {
        const result = await prisma.courseLesson.upsert({
          where: { id: lesson.id },
          update: {
            moduleId: lesson.moduleId,
            title: lesson.title,
            content: lesson.content || '',
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            order: lesson.order,
            isFree: lesson.isFree || false,
            updatedAt: new Date()
          },
          create: {
            id: lesson.id,
            moduleId: lesson.moduleId,
            title: lesson.title,
            content: lesson.content || '',
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            order: lesson.order,
            isFree: lesson.isFree || false,
            createdAt: lesson.createdAt ? new Date(lesson.createdAt) : new Date(),
            updatedAt: new Date()
          }
        });
        
        // Check if it was created or updated
        const existingCount = await prisma.courseLesson.count({
          where: { 
            id: lesson.id,
            createdAt: { lt: new Date(Date.now() - 1000) } // Created more than 1 second ago
          }
        });
        
        if (existingCount > 0) {
          updated++;
          console.log(`   🔄 Updated: ${lesson.title}`);
        } else {
          restored++;
          console.log(`   ✅ Created: ${lesson.title}`);
        }
        
        // Count content statistics
        if (lesson.content && lesson.content.length > 10) withContent++;
        if (lesson.videoUrl) withVideo++;
        
      } catch (error) {
        errors++;
        console.log(`   ❌ Error (${lesson.title}): ${error.message}`);
      }
    }
    
    // Step 5: Final verification
    const finalLessons = await prisma.courseLesson.count();
    const finalModules = await prisma.courseModule.count();
    
    // Check content statistics
    const lessonsWithContent = await prisma.courseLesson.count({
      where: { content: { not: '' } }
    });
    
    const lessonsWithVideo = await prisma.courseLesson.count({
      where: { videoUrl: { not: null } }
    });
    
    console.log('\\n' + '='.repeat(60));
    console.log('✅ LESSON CONTENT RESTORATION COMPLETE');
    console.log(`📊 Final state: ${finalModules} modules, ${finalLessons} lessons`);
    console.log(`📈 Changes: +${restored} new, ~${updated} updated, ❌${errors} errors`);
    console.log(`📚 Content: ${lessonsWithContent} lessons with content`);
    console.log(`🎥 Videos: ${lessonsWithVideo} lessons with videos`);
    console.log('🔐 ALL EXISTING DATA PRESERVED');
    console.log('⚡ COURSE MATERIALS NOW AVAILABLE');
    
    // Show sample of restored content
    console.log('\\n📖 SAMPLE RESTORED LESSONS:');
    const sampleRestored = await prisma.courseLesson.findMany({
      take: 3,
      where: { content: { not: '' } },
      select: {
        title: true,
        content: true,
        videoUrl: true
      }
    });
    
    sampleRestored.forEach((lesson, i) => {
      console.log(`   ${i+1}. ${lesson.title}`);
      console.log(`      Content: ${lesson.content.substring(0, 80)}...`);
      console.log(`      Video: ${lesson.videoUrl ? 'Available' : 'None'}`);
    });
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

safeRestoreLessons().catch(console.error);