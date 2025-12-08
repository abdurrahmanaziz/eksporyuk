const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking video URLs in lessons...\n')
  
  const lessons = await prisma.lesson.findMany({
    where: {
      videoUrl: {
        not: null
      }
    },
    include: {
      module: {
        include: {
          course: true
        }
      }
    }
  })
  
  if (lessons.length === 0) {
    console.log('❌ No lessons with video URLs found!')
    return
  }
  
  console.log(`✅ Found ${lessons.length} lesson(s) with video URLs:\n`)
  
  lessons.forEach((lesson, index) => {
    console.log(`${index + 1}. ${lesson.title}`)
    console.log(`   Course: ${lesson.module.course.title}`)
    console.log(`   Video URL: ${lesson.videoUrl}`)
    console.log(`   Module: ${lesson.module.title}`)
    console.log(`   Lesson ID: ${lesson.id}`)
    console.log(`   Access URL: http://localhost:3000/courses/${lesson.module.courseId}/learn?lesson=${lesson.id}`)
    console.log('')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
