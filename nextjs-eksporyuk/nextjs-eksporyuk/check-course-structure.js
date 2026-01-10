const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCourseStructure() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        price: true,
        originalPrice: true,
        level: true,
        isPublished: true,
        thumbnail: true,
      },
      take: 5
    })

    console.log('\n=== COURSE STRUCTURE CHECK ===\n')
    
    if (courses.length === 0) {
      console.log('❌ Tidak ada course di database')
      return
    }

    console.log(`✅ Found ${courses.length} courses\n`)
    
    courses.forEach((course, i) => {
      console.log(`${i+1}. ${course.title}`)
      console.log(`   ID: ${course.id}`)
      console.log(`   Slug: ${course.slug || '❌ TIDAK ADA SLUG'}`)
      console.log(`   Price: Rp ${course.price?.toLocaleString('id-ID') || '0'}`)
      if (course.originalPrice) {
        console.log(`   Original Price: Rp ${course.originalPrice.toLocaleString('id-ID')}`)
      }
      console.log(`   Level: ${course.level || '(tidak ada)'}`)
      console.log(`   Published: ${course.isPublished ? '✅ Ya' : '❌ Draft'}`)
      console.log(`   Thumbnail: ${course.thumbnail || '(tidak ada)'}`)
      console.log()
    })

    // Check if slug field exists
    const firstCourse = courses[0]
    const hasSlugField = 'slug' in firstCourse
    
    if (hasSlugField) {
      console.log('✅ Course model sudah punya field SLUG')
      console.log('✅ Siap untuk implementasi /checkout/course/[slug]')
    } else {
      console.log('❌ Course model belum punya field SLUG')
      console.log('❌ Perlu menambah field slug ke database schema')
    }

  } catch (error) {
    if (error.message.includes('slug')) {
      console.log('❌ Field SLUG belum ada di Course model')
      console.log('💡 Perlu update schema database untuk menambah field slug')
    } else {
      console.error('Error:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkCourseStructure();