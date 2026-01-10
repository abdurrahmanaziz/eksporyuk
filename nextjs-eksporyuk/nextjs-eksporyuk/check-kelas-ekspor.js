const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCourse() {
  try {
    const course = await prisma.course.findFirst({
      where: {
        slug: 'kelas-ekspor'
      },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })

    if (course) {
      console.log('✅ Course found!')
      console.log('Title:', course.title)
      console.log('Slug:', course.slug)
      console.log('Published:', course.isPublished)
      console.log('Modules:', course.modules.length)
      console.log('Total Lessons:', course.modules.reduce((acc, m) => acc + m.lessons.length, 0))
    } else {
      console.log('❌ Course with slug "kelas-ekspor" not found')
      console.log('\nAvailable courses:')
      const allCourses = await prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          isPublished: true
        }
      })
      console.table(allCourses)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCourse()
