/**
 * Parse video metadata from SSH output and update lessons
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function parseAndUpdateVideos() {
  console.log('🎬 PARSING VIDEO DATA AND UPDATING LESSONS');
  console.log('==========================================\n');

  try {
    // Read raw output
    const rawOutput = await fs.readFile(
      path.join(__dirname, 'exports/video_output_raw.txt'),
      'utf-8'
    );

    // Parse video data from MySQL output
    const videoData = [];
    const lines = rawOutput.split('\n');
    
    for (const line of lines) {
      // Skip empty lines and non-data lines
      if (!line.trim() || line.includes('spawn') || line.includes('password') || 
          line.includes('Welcome') || line.includes('System') || 
          line.includes('Ubuntu') || line.includes('eksporyuk') ||
          line.includes('mysql') || line.includes('exit') || line.includes('logout') ||
          line.includes('Connection') || line.includes('Last login') ||
          line.includes('+----') || line.includes('aziz@')) {
        continue;
      }

      // Parse lesson ID and video info from serialized PHP array
      const idMatch = line.match(/^\s*\|\s*(\d+)\s*\|/);
      if (!idMatch) continue;

      const lessonId = parseInt(idMatch[1]);
      
      // Extract YouTube URL from serialized PHP array
      let youtubeUrl = null;
      let duration = null;
      
      // Look for source_youtube in serialized data
      const youtubeMatch = line.match(/s:14:"source_youtube";s:\d+:"([^"]+)"/);
      if (youtubeMatch && youtubeMatch[1]) {
        youtubeUrl = youtubeMatch[1];
      }
      
      // Also check for source_external_url
      if (!youtubeUrl) {
        const externalMatch = line.match(/s:19:"source_external_url";s:\d+:"([^"]+)"/);
        if (externalMatch && externalMatch[1]) {
          youtubeUrl = externalMatch[1];
        }
      }
      
      // Parse runtime from serialized data
      const runtimeMatch = line.match(/s:7:"runtime";a:\d+:\{s:5:"hours";s:\d+:"(\d+)";s:7:"minutes";s:\d+:"(\d+)";s:7:"seconds";s:\d+:"(\d+)"/);
      if (runtimeMatch) {
        const hours = parseInt(runtimeMatch[1]) || 0;
        const minutes = parseInt(runtimeMatch[2]) || 0;
        const seconds = parseInt(runtimeMatch[3]) || 0;
        duration = (hours * 60) + minutes + Math.ceil(seconds / 60);
        if (duration === 0) duration = null;
      }
      
      // Extract title from line
      const titleMatch = line.match(/\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/);
      const title = titleMatch ? titleMatch[2].trim() : null;

      if (youtubeUrl || duration) {
        videoData.push({
          sejoliLessonId: lessonId,
          title,
          videoUrl: youtubeUrl,
          duration
        });
      }
    }

    console.log(`📊 Parsed ${videoData.length} lessons with video data\n`);
    
    // Save parsed data for reference
    await fs.writeFile(
      path.join(__dirname, 'exports/parsed_videos.json'),
      JSON.stringify(videoData, null, 2)
    );
    console.log('💾 Saved parsed videos to exports/parsed_videos.json\n');

    // Load lesson mapping (sejoli ID -> eksporyuk lesson)
    const lessonMapping = {};
    
    // Read tutor_lessons.tsv to get mapping
    const lessonsData = await fs.readFile(
      path.join(__dirname, 'exports/tutor_lessons.tsv'),
      'utf-8'
    );
    
    const lessonLines = lessonsData.split('\n').filter(l => l.trim());
    const sejoliLessonTitles = {};
    
    for (const line of lessonLines) {
      const parts = line.split('\t');
      if (parts.length >= 5) {
        const sejoliId = parseInt(parts[0]);
        const title = parts[4]?.trim();
        if (sejoliId && title) {
          sejoliLessonTitles[sejoliId] = title;
        }
      }
    }
    
    // Get all current lessons from database
    const dbLessons = await prisma.courseLesson.findMany({
      select: {
        id: true,
        title: true,
        videoUrl: true,
        duration: true
      }
    });
    
    console.log(`📊 Found ${dbLessons.length} lessons in database\n`);

    // Match by title
    const titleToDbLesson = {};
    for (const lesson of dbLessons) {
      titleToDbLesson[lesson.title.toLowerCase().trim()] = lesson;
    }

    // Update lessons with video data
    let updated = 0;
    let skipped = 0;
    let noMatch = 0;

    for (const video of videoData) {
      // Find matching lesson by title from sejoli
      const sejoliTitle = sejoliLessonTitles[video.sejoliLessonId] || video.title;
      
      if (!sejoliTitle) {
        noMatch++;
        continue;
      }
      
      const dbLesson = titleToDbLesson[sejoliTitle.toLowerCase().trim()];
      
      if (!dbLesson) {
        noMatch++;
        continue;
      }

      // Only update if there's new data
      const hasNewVideo = video.videoUrl && !dbLesson.videoUrl;
      const hasNewDuration = video.duration && !dbLesson.duration;
      
      if (!hasNewVideo && !hasNewDuration) {
        skipped++;
        continue;
      }

      const updateData = {};
      if (hasNewVideo) {
        updateData.videoUrl = video.videoUrl;
      }
      if (hasNewDuration) {
        updateData.duration = video.duration;
      }

      await prisma.courseLesson.update({
        where: { id: dbLesson.id },
        data: updateData
      });
      
      updated++;
      console.log(`  ✅ Updated: ${sejoliTitle.substring(0, 50)}... (${video.videoUrl || 'no url'}, ${video.duration || 0} min)`);
    }

    // Now do a second pass - update ALL lessons that have video data regardless of existing
    console.log('\n🔄 Second pass: Force updating all video URLs...\n');
    
    let forceUpdated = 0;
    for (const video of videoData) {
      const sejoliTitle = sejoliLessonTitles[video.sejoliLessonId] || video.title;
      if (!sejoliTitle) continue;
      
      const dbLesson = titleToDbLesson[sejoliTitle.toLowerCase().trim()];
      if (!dbLesson) continue;
      
      if (video.videoUrl) {
        await prisma.courseLesson.update({
          where: { id: dbLesson.id },
          data: { 
            videoUrl: video.videoUrl,
            duration: video.duration || dbLesson.duration
          }
        });
        forceUpdated++;
      }
    }

    // Get final stats
    const finalStats = await prisma.courseLesson.groupBy({
      by: ['moduleId'],
      _count: { id: true }
    });

    const withVideos = await prisma.courseLesson.count({
      where: { videoUrl: { not: null } }
    });

    const withDuration = await prisma.courseLesson.count({
      where: { duration: { not: null } }
    });

    // Get video URLs by course
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                videoUrl: true
              }
            }
          }
        }
      }
    });

    console.log('\n\n🎉 VIDEO UPDATE COMPLETE!');
    console.log('=========================');
    console.log(`📊 Parsed from Sejoli: ${videoData.length}`);
    console.log(`✅ Updated (new): ${updated}`);
    console.log(`🔄 Force updated: ${forceUpdated}`);
    console.log(`⏭️  Skipped (no change): ${skipped}`);
    console.log(`❌ No match found: ${noMatch}`);
    console.log(`\n📊 Database Stats:`);
    console.log(`   Total lessons: ${dbLessons.length}`);
    console.log(`   With videos: ${withVideos}`);
    console.log(`   With duration: ${withDuration}`);
    
    console.log('\n📚 Video distribution by course:');
    for (const course of courses) {
      let totalLessons = 0;
      let lessonsWithVideo = 0;
      for (const module of course.modules) {
        totalLessons += module.lessons.length;
        lessonsWithVideo += module.lessons.filter(l => l.videoUrl).length;
      }
      console.log(`   - ${course.title}: ${lessonsWithVideo}/${totalLessons} lessons have videos`);
    }

    // Sample some video URLs
    console.log('\n🎬 Sample Video URLs:');
    const sampleLessons = await prisma.courseLesson.findMany({
      where: { videoUrl: { not: null } },
      take: 10,
      select: {
        title: true,
        videoUrl: true,
        duration: true
      }
    });
    
    for (const lesson of sampleLessons) {
      console.log(`   - ${lesson.title.substring(0, 40)}...`);
      console.log(`     URL: ${lesson.videoUrl}`);
      console.log(`     Duration: ${lesson.duration || 'N/A'} min\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

parseAndUpdateVideos().catch(console.error);
