const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPI() {
  try {
    console.log('Testing course fetch...')
    
    const course = await prisma.course.findUnique({
      where: { slug: 'kelas-ekspor' },
      include: {
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              include: {
                files: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!course) {
      console.log('❌ Course not found')
      return
    }

    console.log('✅ Course found!')
    console.log('Title:', course.title)
    console.log('Modules:', course.modules.length)
    console.log('Total Lessons:', course.modules.reduce((sum, m) => sum + m.lessons.length, 0))
    
    // Check files
    let totalFiles = 0
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        if (lesson.files && lesson.files.length > 0) {
          totalFiles += lesson.files.length
          console.log(`Lesson "${lesson.title}" has ${lesson.files.length} files`)
        }
      })
    })
    
    console.log('Total Files:', totalFiles)
    console.log('\n✅ API query successful!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPI()
