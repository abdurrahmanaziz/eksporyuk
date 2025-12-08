const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCourseData() {
  try {
    console.log('🔍 Checking course data for sample-course-basic...\n')
    
    // Get course with modules and lessons
    const course = await prisma.course.findFirst({
      where: {
        slug: 'sample-course-basic'
      },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!course) {
      console.log('❌ Course not found!')
      return
    }

    console.log(`📚 Course: ${course.title}`)
    console.log(`   ID: ${course.id}`)
    console.log(`   Slug: ${course.slug}`)
    console.log(`   Published: ${course.isPublished}`)
    console.log(`   Modules: ${course.modules?.length || 0}`)
    
    if (course.modules && course.modules.length > 0) {
      console.log('\n📖 Modules:')
      course.modules.forEach((module, idx) => {
        console.log(`\n   ${idx + 1}. ${module.title} (${module.lessons?.length || 0} lessons)`)
        if (module.lessons && module.lessons.length > 0) {
          module.lessons.forEach((lesson, lidx) => {
            console.log(`      ${lidx + 1}. ${lesson.title}`)
            console.log(`         - ID: ${lesson.id}`)
            console.log(`         - Free: ${lesson.isFree}`)
            console.log(`         - Video: ${lesson.videoUrl ? 'Yes' : 'No'}`)
          })
        } else {
          console.log('      ⚠️  No lessons in this module')
        }
      })
    } else {
      console.log('\n❌ NO MODULES FOUND!')
      console.log('This is why the course shows "Konten kursus tidak tersedia"')
      console.log('\nSolution: Add modules and lessons to this course via:')
      console.log('  - Admin panel: /admin/courses/editor?edit=' + course.id)
      console.log('  - Or use the seed script to add sample data')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCourseData()
