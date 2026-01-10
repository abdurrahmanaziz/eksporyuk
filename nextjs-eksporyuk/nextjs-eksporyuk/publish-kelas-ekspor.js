const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function publishCourse() {
  try {
    const updated = await prisma.course.update({
      where: {
        slug: 'kelas-ekspor'
      },
      data: {
        isPublished: true
      }
    })

    console.log('✅ Course published successfully!')
    console.log('Title:', updated.title)
    console.log('Slug:', updated.slug)
    console.log('Published:', updated.isPublished)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

publishCourse()
