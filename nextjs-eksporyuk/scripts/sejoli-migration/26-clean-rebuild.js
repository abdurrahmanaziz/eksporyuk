/**
 * Clean rebuild of KELAS BIMBINGAN EKSPOR YUK
 * Only keep published lessons (no copies) and assign to correct modules
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse Sejoli data - exact lessons from course 1678
function parseSejoliLessons() {
  const rawPath = path.join(__dirname, 'exports/kelas_bimbingan_lessons.txt');
  const content = fs.readFileSync(rawPath, 'utf-8');
  
  const lessons = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match: | lesson_id | lesson_title | topic_id | topic_title | course_id | course_title |
    const match = line.match(/\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*\d+\s*\|/);
    if (match) {
      const [, lessonId, lessonTitle, topicId, topicTitle] = match;
      lessons.push({
        sejoliId: parseInt(lessonId),
        title: lessonTitle.trim(),
        topicId: parseInt(topicId),
        topicTitle: topicTitle.trim()
      });
    }
  }
  
  return lessons;
}

async function cleanRebuild() {
  console.log('🧹 CLEAN REBUILD KELAS BIMBINGAN EKSPOR YUK');
  console.log('============================================\n');

  try {
    // Parse Sejoli data
    const sejoliLessons = parseSejoliLessons();
    console.log('📖 Sejoli lessons parsed:', sejoliLessons.length);
    
    // Group by topic
    const lessonsByTopic = {};
    for (const l of sejoliLessons) {
      if (!lessonsByTopic[l.topicId]) {
        lessonsByTopic[l.topicId] = { title: l.topicTitle, lessons: [] };
      }
      lessonsByTopic[l.topicId].lessons.push(l);
    }
    
    console.log('\n📂 Topics structure:');
    for (const [topicId, data] of Object.entries(lessonsByTopic)) {
      console.log(`   ${topicId}: ${data.title} (${data.lessons.length} lessons)`);
    }

    // Get course
    const course = await prisma.course.findFirst({
      where: { title: { contains: 'KELAS BIMBINGAN' } }
    });
    console.log('\n📚 Course:', course.title);

    // Get current modules
    const currentModules = await prisma.courseModule.findMany({
      where: { courseId: course.id },
      orderBy: { order: 'asc' }
    });
    
    // Get all current lessons
    const currentLessons = await prisma.courseLesson.findMany({
      where: { moduleId: { in: currentModules.map(m => m.id) } }
    });
    console.log('📄 Current lessons in DB:', currentLessons.length);

    // Create title-to-lesson map for matching
    const lessonByTitle = new Map();
    for (const l of currentLessons) {
      const normalizedTitle = normalizeTitle(l.title);
      if (!lessonByTitle.has(normalizedTitle)) {
        lessonByTitle.set(normalizedTitle, l);
      }
    }

    // Map modules to topic IDs
    const moduleMap = {};
    for (const mod of currentModules) {
      if (mod.title.includes('Modul 1')) moduleMap[1681] = mod.id;
      else if (mod.title.includes('Modul 2')) moduleMap[1682] = mod.id;
      else if (mod.title.includes('Modul 3')) moduleMap[1683] = mod.id;
      else if (mod.title.includes('Modul 4')) moduleMap[1684] = mod.id;
      else if (mod.title.includes('Modul 5')) moduleMap[1685] = mod.id;
      else if (mod.title.includes('Modul 6')) moduleMap[1686] = mod.id;
      else if (mod.title.includes('Modul 7')) moduleMap[1687] = mod.id;
      else if (mod.title.includes('Zoominar Bulanan')) moduleMap[1799] = mod.id;
      else if (mod.title.includes('Zoom Mingguan')) moduleMap[21519] = mod.id;
    }

    // Track which lessons we want to keep
    const lessonsToKeep = new Set();
    const lessonAssignments = new Map(); // lessonId -> moduleId
    
    let matched = 0;
    let notFound = 0;
    
    for (const sejoliLesson of sejoliLessons) {
      const normalizedTitle = normalizeTitle(sejoliLesson.title);
      const dbLesson = lessonByTitle.get(normalizedTitle);
      
      if (dbLesson) {
        lessonsToKeep.add(dbLesson.id);
        lessonAssignments.set(dbLesson.id, moduleMap[sejoliLesson.topicId]);
        matched++;
      } else {
        // Try fuzzy match
        const fuzzyMatch = findFuzzyMatch(sejoliLesson.title, currentLessons);
        if (fuzzyMatch && !lessonsToKeep.has(fuzzyMatch.id)) {
          lessonsToKeep.add(fuzzyMatch.id);
          lessonAssignments.set(fuzzyMatch.id, moduleMap[sejoliLesson.topicId]);
          matched++;
        } else {
          console.log('   ❌ Not found:', sejoliLesson.title.substring(0, 60));
          notFound++;
        }
      }
    }
    
    console.log(`\n✅ Matched: ${matched}`);
    console.log(`❌ Not found: ${notFound}`);
    console.log(`🗑️  To delete: ${currentLessons.length - lessonsToKeep.size}`);

    // Step 1: Update lesson assignments to correct modules
    console.log('\n🔄 Updating lesson modules...');
    for (const [lessonId, moduleId] of lessonAssignments) {
      await prisma.courseLesson.update({
        where: { id: lessonId },
        data: { moduleId }
      });
    }

    // Step 2: Delete lessons not in Sejoli (duplicates/copies)
    console.log('🗑️  Deleting duplicate lessons...');
    const toDelete = currentLessons.filter(l => !lessonsToKeep.has(l.id));
    
    for (const lesson of toDelete) {
      // First delete any lesson files
      await prisma.lessonFile.deleteMany({ where: { lessonId: lesson.id } });
      // Then delete lesson
      await prisma.courseLesson.delete({ where: { id: lesson.id } });
    }
    console.log(`   Deleted ${toDelete.length} lessons`);

    // Print final stats
    console.log('\n\n🎉 REBUILD COMPLETE!');
    console.log('=====================');
    
    for (const mod of currentModules) {
      const count = await prisma.courseLesson.count({ where: { moduleId: mod.id } });
      const withVideo = await prisma.courseLesson.count({ 
        where: { moduleId: mod.id, videoUrl: { not: null } } 
      });
      console.log(`\n📂 ${mod.title}`);
      console.log(`   Lessons: ${count}`);
      console.log(`   With video: ${withVideo}`);
    }

    // Total
    const totalLessons = await prisma.courseLesson.count({
      where: { moduleId: { in: currentModules.map(m => m.id) } }
    });
    console.log(`\n📊 TOTAL: ${totalLessons} lessons`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
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

function findFuzzyMatch(title, lessons) {
  const normalizedSearch = normalizeTitle(title);
  const searchWords = normalizedSearch.split(' ').filter(w => w.length > 3);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const lesson of lessons) {
    const normalizedLesson = normalizeTitle(lesson.title);
    const lessonWords = normalizedLesson.split(' ');
    
    let matchingWords = 0;
    for (const word of searchWords) {
      if (lessonWords.some(lw => lw.includes(word) || word.includes(lw))) {
        matchingWords++;
      }
    }
    
    const score = matchingWords / searchWords.length;
    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestMatch = lesson;
    }
  }
  
  return bestMatch;
}

cleanRebuild().catch(console.error);
