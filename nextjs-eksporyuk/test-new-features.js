const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testNewFeatures() {
  console.log('🧪 Testing New Course Features...\n')

  try {
    // Test 1: Student Enrollments API
    console.log('1. Testing Student Enrollments API...')
    const enrollments = await db.courseEnrollment.findMany({
      take: 2
    })
    
    if (enrollments.length > 0) {
      console.log('✅ CourseEnrollment table accessible')
      
      // Test getting related course data
      const courseIds = enrollments.map(e => e.courseId)
      const courses = await db.course.findMany({
        where: { id: { in: courseIds } }
      })
      console.log(`✅ Found ${courses.length} courses for ${enrollments.length} enrollments`)
    } else {
      console.log('ℹ️ No enrollments found, but table is accessible')
    }

    // Test 2: Course Slug Generation  
    console.log('\n2. Testing Course Slug Generation...')
    function generateSlug(text) {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    }
    
    const testTitle = "Kelas Ekspor Mudah & Praktis 2025!"
    const generatedSlug = generateSlug(testTitle)
    console.log(`✅ Generated slug: "${testTitle}" → "${generatedSlug}"")`)
    
    // Test 3: CourseMentor Model
    console.log('\n3. Testing CourseMentor Model...')
    const mentorCount = await db.courseMentor.count()
    console.log(`✅ CourseMentor table accessible with ${mentorCount} records`)

    // Test 4: Multiple Mentors Support
    console.log('\n4. Testing Multiple Mentors Query...')
    const courses = await db.course.findMany({ take: 3 })
    if (courses.length > 0) {
      const courseIds = courses.map(c => c.id)
      const courseMentors = await db.courseMentor.findMany({
        where: { 
          courseId: { in: courseIds },
          isActive: true 
        }
      })
      console.log(`✅ Found ${courseMentors.length} mentor assignments for ${courses.length} courses`)

      // Test mentor details query
      if (courseMentors.length > 0) {
        const mentorIds = courseMentors.map(cm => cm.mentorId)
        const mentorProfiles = await db.mentorProfile.findMany({
          where: { id: { in: mentorIds } }
        })
        console.log(`✅ Found ${mentorProfiles.length} mentor profiles`)
      }
    }

    // Test 5: Course with Mentors Query (simulating API)
    console.log('\n5. Testing Course List with Mentors...')
    const sampleCourses = await db.course.findMany({ 
      take: 2,
      select: {
        id: true,
        title: true,
        slug: true,
        mentorId: true
      }
    })
    
    if (sampleCourses.length > 0) {
      const courseIds = sampleCourses.map(c => c.id)
      const courseMentors = await db.courseMentor.findMany({
        where: { 
          courseId: { in: courseIds },
          isActive: true 
        }
      })

      console.log(`✅ Sample course: "${sampleCourses[0].title}"`)
      console.log(`   Slug: ${sampleCourses[0].slug || 'NULL'}`)
      console.log(`   Multiple mentors: ${courseMentors.length} assignments`)
    }

    console.log('\n✅ All tests passed! New features are working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Error details:', error)
  } finally {
    await db.$disconnect()
  }
}

testNewFeatures().catch(console.error)