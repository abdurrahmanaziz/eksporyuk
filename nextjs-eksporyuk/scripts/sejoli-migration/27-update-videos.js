/**
 * Update video URLs for KELAS BIMBINGAN lessons
 * Uses parsed video data from Sejoli
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function loadParsedVideos() {
  const videoPath = path.join(__dirname, 'exports/parsed_videos.json');
  return JSON.parse(fs.readFileSync(videoPath, 'utf-8'));
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\(new\)/gi, '')
    .replace(/\(materi update.*?\)/gi, '')
    .trim();
}

async function updateVideos() {
  console.log('🎬 UPDATING VIDEO URLS');
  console.log('======================\n');

  try {
    // Load parsed videos
    const parsedVideos = loadParsedVideos();
    console.log('📹 Loaded', parsedVideos.length, 'video records\n');
    
    // Create title-to-video map
    const videoByTitle = new Map();
    for (const v of parsedVideos) {
      if (v.videoUrl) {
        const normalizedTitle = normalizeTitle(v.title);
        videoByTitle.set(normalizedTitle, v);
      }
    }
    
    // Get all lessons from KELAS BIMBINGAN
    const course = await prisma.course.findFirst({
      where: { title: { contains: 'KELAS BIMBINGAN' } }
    });
    
    const modules = await prisma.courseModule.findMany({
      where: { courseId: course.id }
    });
    
    const lessons = await prisma.courseLesson.findMany({
      where: { moduleId: { in: modules.map(m => m.id) } }
    });
    
    console.log('📄 Lessons to update:', lessons.length);
    
    let updated = 0;
    let alreadyHasVideo = 0;
    let noMatch = 0;
    
    for (const lesson of lessons) {
      if (lesson.videoUrl) {
        alreadyHasVideo++;
        continue;
      }
      
      const normalizedTitle = normalizeTitle(lesson.title);
      const videoData = videoByTitle.get(normalizedTitle);
      
      if (videoData) {
        await prisma.courseLesson.update({
          where: { id: lesson.id },
          data: {
            videoUrl: videoData.videoUrl,
            duration: videoData.duration || null
          }
        });
        console.log('✅', lesson.title.substring(0, 50), '->', videoData.videoUrl);
        updated++;
      } else {
        // Try fuzzy match
        const fuzzyMatch = findFuzzyVideoMatch(lesson.title, parsedVideos);
        if (fuzzyMatch && fuzzyMatch.videoUrl) {
          await prisma.courseLesson.update({
            where: { id: lesson.id },
            data: {
              videoUrl: fuzzyMatch.videoUrl,
              duration: fuzzyMatch.duration || null
            }
          });
          console.log('✅ (fuzzy)', lesson.title.substring(0, 40), '->', fuzzyMatch.videoUrl);
          updated++;
        } else {
          noMatch++;
        }
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   🎬 Already had video: ${alreadyHasVideo}`);
    console.log(`   ❌ No match: ${noMatch}`);
    
    // Final count
    const withVideo = await prisma.courseLesson.count({
      where: {
        moduleId: { in: modules.map(m => m.id) },
        videoUrl: { not: null }
      }
    });
    console.log(`\n🎬 Total lessons with video: ${withVideo}/${lessons.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function findFuzzyVideoMatch(title, videos) {
  const normalizedSearch = normalizeTitle(title);
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 3);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const video of videos) {
    if (!video.videoUrl) continue;
    
    const normalizedVideo = normalizeTitle(video.title);
    const videoWords = normalizedVideo.split(' ');
    
    let matchingWords = 0;
    for (const word of searchWords) {
      if (videoWords.some(vw => vw.includes(word) || word.includes(vw))) {
        matchingWords++;
      }
    }
    
    const score = matchingWords / searchWords.length;
    if (score > bestScore && score >= 0.7) {
      bestScore = score;
      bestMatch = video;
    }
  }
  
  return bestMatch;
}

updateVideos().catch(console.error);
