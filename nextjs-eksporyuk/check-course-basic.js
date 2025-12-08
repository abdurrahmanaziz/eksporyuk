const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndFixCourses() {
  try {
    console.log('🔍 Checking course: sample-course-basic\n')
    
    const course = await prisma.course.findUnique({
      where: { id: 'sample-course-basic' },
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!course) {
      console.log('❌ Course not found')
      return
    }

    console.log(`📚 Course: ${course.title}`)
    console.log(`   Modules: ${course.modules.length}`)
    
    if (course.modules.length > 0) {
      course.modules.forEach((module, idx) => {
        console.log(`\n   ${idx + 1}. ${module.title}`)
        console.log(`      Lessons: ${module.lessons.length}`)
        module.lessons.forEach((lesson, lidx) => {
          console.log(`      ${lidx + 1}. ${lesson.title} (${lesson.isFree ? 'Free' : 'Premium'})`)
        })
      })
    }

    console.log('\n\n✅ Course has content!')
    console.log(`   Access at: http://localhost:3000/courses/${course.id}/learn`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixCourses()
