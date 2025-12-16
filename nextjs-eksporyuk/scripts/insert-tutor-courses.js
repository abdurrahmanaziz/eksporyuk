#!/usr/bin/env node
/**
 * Insert Tutor LMS courses into Eksporyuk database
 * Maps: Course → Course, Topics → CourseModule, Lessons → CourseLesson
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Helper to create slug from title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

// Strip HTML tags from content
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log('🚀 Starting Tutor LMS course import...\n')

  // Read imported data
  const importPath = path.join(__dirname, '..', 'tutor-import.json')
  if (!fs.existsSync(importPath)) {
    console.error('❌ tutor-import.json not found. Run import-tutor-lms-mysql.js first.')
    process.exit(1)
  }

  const courses = JSON.parse(fs.readFileSync(importPath, 'utf8'))
  console.log(`📚 Found ${courses.length} courses to import\n`)

  // Get or create mentor (ADMIN or first MENTOR in DB)
  let mentor = await prisma.mentorProfile.findFirst({
    where: {
      user: { role: 'MENTOR' }
    }
  })

  if (!mentor) {
    // Use ADMIN as mentor if no mentor exists
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.error('❌ No ADMIN or MENTOR found in database')
      process.exit(1)
    }

    console.log('📝 Creating mentor profile for ADMIN...')
    mentor = await prisma.mentorProfile.create({
      data: {
        userId: admin.id,
        expertise: 'Export Business',
        bio: 'Platform Admin',
        isVerified: true
      }
    })
  }

  console.log(`✅ Using mentor: ${mentor.id}\n`)

  // Import each course
  for (const courseData of courses) {
    const { course, topics } = courseData
    
    console.log(`\n📖 Importing: ${course.title}`)
    console.log(`   Topics: ${topics.length}`)
    console.log(`   Lessons: ${topics.reduce((sum, t) => sum + t.lessons.length, 0)}`)

    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        OR: [
          { slug: course.slug },
          { title: course.title }
        ]
      }
    })

    if (existingCourse) {
      console.log(`   ⚠️  Course already exists: ${existingCourse.title}`)
      console.log(`   Skipping...`)
      continue
    }

    // Create course
    const newCourse = await prisma.course.create({
      data: {
        mentorId: mentor.id,
        title: course.title,
        slug: course.slug || slugify(course.title),
        description: course.description || `Imported from Tutor LMS - ${course.title}`,
        price: 0, // Set to 0 for now, can be updated later
        monetizationType: 'FREE', // Can be changed to PAID later
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
        duration: 0,
        level: 'Beginner',
        roleAccess: 'MEMBER', // Available to all members
        membershipIncluded: true
      }
    })

    console.log(`   ✅ Created course: ${newCourse.id}`)

    // Import modules (topics)
    for (let topicIdx = 0; topicIdx < topics.length; topicIdx++) {
      const topic = topics[topicIdx]
      
      const module = await prisma.courseModule.create({
        data: {
          courseId: newCourse.id,
          title: topic.title,
          description: stripHtml(topic.content || '').substring(0, 500),
          order: topicIdx + 1
        }
      })

      console.log(`      📁 Module ${topicIdx + 1}: ${topic.title}`)

      // Import lessons
      for (let lessonIdx = 0; lessonIdx < topic.lessons.length; lessonIdx++) {
        const lesson = topic.lessons[lessonIdx]
        
        await prisma.courseLesson.create({
          data: {
            moduleId: module.id,
            title: lesson.title,
            content: lesson.content || '',
            videoUrl: lesson.videoUrl,
            order: lessonIdx + 1,
            isFree: lessonIdx === 0 && topicIdx === 0, // First lesson is free preview
            duration: 0 // Can be calculated from video later
          }
        })

        const videoStatus = lesson.videoUrl ? '🎥' : '📝'
        console.log(`         ${videoStatus} Lesson ${lessonIdx + 1}: ${lesson.title}`)
      }
    }

    console.log(`   ✅ Course imported successfully!`)
  }

  console.log('\n🎉 All courses imported successfully!')
  console.log('\n📊 Summary:')
  
  const totalCourses = await prisma.course.count()
  const totalModules = await prisma.courseModule.count()
  const totalLessons = await prisma.courseLesson.count()
  const lessonsWithVideo = await prisma.courseLesson.count({
    where: { videoUrl: { not: null } }
  })

  console.log(`   Total Courses: ${totalCourses}`)
  console.log(`   Total Modules: ${totalModules}`)
  console.log(`   Total Lessons: ${totalLessons}`)
  console.log(`   Lessons with Video: ${lessonsWithVideo}`)
  console.log(`   Video Coverage: ${((lessonsWithVideo / totalLessons) * 100).toFixed(1)}%`)
}

main()
  .catch((e) => {
    console.error('\n❌ Import failed:', e.message)
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
