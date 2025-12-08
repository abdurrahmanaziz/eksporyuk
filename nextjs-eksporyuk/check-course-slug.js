const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCourse() {
  try {
    console.log('🔍 Checking course with slug: kelas-ekspor')
    
    const course = await prisma.course.findUnique({
      where: { slug: 'kelas-ekspor' },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    })
    
    if (course) {
      console.log('✅ COURSE FOUND:')
      console.log('ID:', course.id)
      console.log('Title:', course.title)
      console.log('Slug:', course.slug)
      console.log('Status:', course.status)
      console.log('Modules:', course.modules.length)
      console.log('Total Lessons:', course.modules.reduce((sum, m) => sum + m.lessons.length, 0))
    } else {
      console.log('❌ COURSE NOT FOUND')
      console.log('\nSearching all courses...')
      
      const allCourses = await prisma.course.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true
        }
      })
      
      console.log(`\nTotal courses: ${allCourses.length}`)
      allCourses.forEach(c => {
        console.log(`- ${c.title} (slug: ${c.slug || 'NULL'}, status: ${c.status})`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCourse()
