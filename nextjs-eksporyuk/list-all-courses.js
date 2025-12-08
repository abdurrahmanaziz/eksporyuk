const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listCourses() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            modules: true,
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📚 Found ${courses.length} courses:\n`)
    
    courses.forEach((course, idx) => {
      console.log(`${idx + 1}. ${course.title}`)
      console.log(`   ID: ${course.id}`)
      console.log(`   Slug: ${course.slug}`)
      console.log(`   Published: ${course.isPublished}`)
      console.log(`   Price: Rp ${course.price.toLocaleString('id-ID')}`)
      console.log(`   Modules: ${course._count.modules}`)
      console.log(`   Enrollments: ${course._count.enrollments}`)
      console.log(`   URL: /courses/${course.id}/learn`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listCourses()
