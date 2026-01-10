/**
 * Rebuild course modules using SEJOLI lesson-topic mapping data
 * Uses exact lesson_id from Sejoli to match lessons
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Parse the raw export file to build mapping
function parseLessonTopicMapping() {
  const rawPath = path.join(__dirname, 'exports/lesson_topics_raw.txt');
  const content = fs.readFileSync(rawPath, 'utf-8');
  
  // Parse MySQL output format: | lesson_id | lesson_title | topic_id | topic_title | order |
  const lines = content.split('\n');
  const mapping = [];
  const topics = new Map(); // topic_id -> { title, order }
  
  for (const line of lines) {
    // Match lines that look like: |  1717 | Welcome to Dunia Kontaineran | 1681 | Modul 1 ... | 1 |
    const match = line.match(/\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|/);
    if (match) {
      const [, lessonId, lessonTitle, topicId, topicTitle, topicOrder] = match;
      
      // Only include original KELAS BIMBINGAN EKSPOR YUK lessons (topic IDs 1681-1687, 1799, 21519)
      const validTopicIds = [1681, 1682, 1683, 1684, 1685, 1686, 1687, 1799, 21519];
      const tid = parseInt(topicId);
      
      if (validTopicIds.includes(tid)) {
        mapping.push({
          lessonId: parseInt(lessonId),
          lessonTitle: lessonTitle.trim(),
          topicId: tid,
          topicTitle: topicTitle.trim(),
          topicOrder: parseInt(topicOrder)
        });
        
        if (!topics.has(tid)) {
          topics.set(tid, {
            title: topicTitle.trim(),
            order: parseInt(topicOrder)
          });
        }
      }
    }
  }
  
  return { mapping, topics };
}

async function rebuildModules() {
  console.log('🔄 REBUILDING COURSE MODULES FROM SEJOLI DATA');
  console.log('==============================================\n');

  try {
    // Parse Sejoli data
    console.log('📖 Parsing Sejoli lesson-topic mapping...');
    const { mapping, topics } = parseLessonTopicMapping();
    console.log(`   Found ${mapping.length} lessons`);
    console.log(`   Found ${topics.size} topics/modules`);
    
    // Display topics found
    console.log('\n📂 Topics from Sejoli:');
    for (const [topicId, data] of topics) {
      console.log(`   ${topicId}: ${data.title} (order: ${data.order})`);
    }

    // Get KELAS BIMBINGAN EKSPOR YUK course
    const course = await prisma.course.findFirst({
      where: { title: { contains: 'KELAS BIMBINGAN' } }
    });

    if (!course) {
      console.log('❌ Course not found!');
      return;
    }

    console.log('\n📚 Course:', course.title);
    console.log('   ID:', course.id);

    // Get current modules
    const currentModules = await prisma.courseModule.findMany({
      where: { courseId: course.id }
    });
    console.log('\n📂 Current modules:', currentModules.length);
    
    // Get all lessons for this course's modules
    const allLessons = await prisma.courseLesson.findMany({
      where: { moduleId: { in: currentModules.map(m => m.id) } }
    });
    console.log('📄 Total lessons:', allLessons.length);
    
    // Create title-based matching (since we don't have Sejoli IDs in our DB)
    const lessonByTitle = new Map();
    for (const lesson of allLessons) {
      // Normalize title for matching
      const normalizedTitle = normalizeTitle(lesson.title);
      lessonByTitle.set(normalizedTitle, lesson);
    }
    
    console.log('\n📊 Lessons in DB:', allLessons.length);

    // Step 1: Delete all existing modules and recreate
    console.log('\n🗑️  Deleting existing modules...');
    
    // First, need to disconnect lessons from modules before deleting
    // Update all lessons to point to null moduleId (but Prisma requires moduleId, so we'll handle differently)
    
    // Get first module ID to temporarily hold lessons
    const tempModuleId = currentModules[0].id;
    
    // Move all lessons to first module temporarily
    await prisma.courseLesson.updateMany({
      where: {
        moduleId: { in: currentModules.map(m => m.id) }
      },
      data: { moduleId: tempModuleId }
    });
    
    // Delete all modules except the first one
    for (let i = 1; i < currentModules.length; i++) {
      await prisma.courseModule.delete({
        where: { id: currentModules[i].id }
      });
    }
    console.log('   Deleted', currentModules.length - 1, 'modules');

    // Step 2: Create new modules based on Sejoli topics
    console.log('\n📁 Creating new modules from Sejoli topics...');
    const newModules = new Map(); // topicId -> module record
    
    // Sort topics by order
    const sortedTopics = Array.from(topics.entries()).sort((a, b) => a[1].order - b[1].order);
    
    let isFirst = true;
    for (const [topicId, topicData] of sortedTopics) {
      let moduleRecord;
      
      if (isFirst) {
        // Update the first existing module
        moduleRecord = await prisma.courseModule.update({
          where: { id: tempModuleId },
          data: {
            title: topicData.title,
            order: topicData.order
          }
        });
        isFirst = false;
      } else {
        // Create new module
        moduleRecord = await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: topicData.title,
            order: topicData.order
          }
        });
      }
      
      newModules.set(topicId, moduleRecord);
      console.log(`  ✅ ${topicData.title}`);
    }

    // Step 3: Assign lessons to correct modules based on Sejoli mapping
    console.log('\n🔗 Assigning lessons to modules...');
    
    let matched = 0;
    let unmatched = 0;
    const unmatchedLessons = [];
    
    // Build reverse mapping: normalized title -> topicId (from Sejoli)
    const titleToTopic = new Map();
    for (const item of mapping) {
      const normalizedTitle = normalizeTitle(item.lessonTitle);
      titleToTopic.set(normalizedTitle, item.topicId);
    }
    
    // Assign each lesson
    for (const lesson of allLessons) {
      const normalizedTitle = normalizeTitle(lesson.title);
      const topicId = titleToTopic.get(normalizedTitle);
      
      let targetModule;
      
      if (topicId && newModules.has(topicId)) {
        targetModule = newModules.get(topicId);
        matched++;
      } else {
        // Try fuzzy match
        let bestMatch = findBestTopicMatch(lesson.title, mapping);
        if (bestMatch) {
          targetModule = newModules.get(bestMatch.topicId);
          matched++;
        } else {
          // Default to Modul 1
          targetModule = newModules.get(1681);
          unmatched++;
          unmatchedLessons.push(lesson.title);
        }
      }
      
      await prisma.courseLesson.update({
        where: { id: lesson.id },
        data: { moduleId: targetModule.id }
      });
    }
    
    console.log(`   ✅ Matched: ${matched}`);
    console.log(`   ⚠️  Unmatched (default to Modul 1): ${unmatched}`);
    
    if (unmatchedLessons.length > 0 && unmatchedLessons.length <= 20) {
      console.log('\n   Unmatched lessons:');
      for (const title of unmatchedLessons) {
        console.log(`     - ${title.substring(0, 60)}...`);
      }
    }

    // Step 4: Print final stats
    console.log('\n\n🎉 REBUILD COMPLETE!');
    console.log('=====================');
    
    for (const [topicId, module] of newModules) {
      const lessonCount = await prisma.courseLesson.count({
        where: { moduleId: module.id }
      });
      const withVideo = await prisma.courseLesson.count({
        where: { moduleId: module.id, videoUrl: { not: null } }
      });
      console.log(`\n📂 ${module.title}`);
      console.log(`   Lessons: ${lessonCount}`);
      console.log(`   With video: ${withVideo}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Normalize title for matching
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Find best matching topic for a lesson title
function findBestTopicMatch(lessonTitle, mapping) {
  const normalizedLesson = normalizeTitle(lessonTitle);
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const item of mapping) {
    const normalizedMapping = normalizeTitle(item.lessonTitle);
    
    // Check for significant overlap
    const lessonWords = normalizedLesson.split(' ');
    const mappingWords = normalizedMapping.split(' ');
    
    let matchingWords = 0;
    for (const word of lessonWords) {
      if (word.length > 3 && mappingWords.includes(word)) {
        matchingWords++;
      }
    }
    
    // Calculate score based on matching words ratio
    const score = matchingWords / Math.max(lessonWords.length, mappingWords.length);
    
    if (score > bestScore && score > 0.5) {
      bestScore = score;
      bestMatch = item;
    }
  }
  
  return bestMatch;
}

rebuildModules().catch(console.error);
