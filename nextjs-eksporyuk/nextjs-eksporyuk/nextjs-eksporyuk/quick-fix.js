/**
 * QUICK FIX - Direct SQL update untuk fix critical bugs
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 QUICK FIX - CRITICAL BUGS\n')
  
  try {
    // 1. Publish all products
    await prisma.$executeRaw`UPDATE Product SET productStatus = 'PUBLISHED' WHERE productStatus = 'DRAFT'`
    console.log('✅ Products published')
    
    // 2. Update affiliate commission rates  
    await prisma.$executeRaw`UPDATE AffiliateProfile SET commissionRate = 25`
    console.log('✅ Affiliate commission rates updated to 25%')
    
    // 3. Publish courses
    await prisma.$executeRaw`UPDATE Course SET status = 'PUBLISHED' WHERE status != 'PUBLISHED'`
    console.log('✅ Courses published')
    
    // 4. Create course modules & lessons (sample for first course)
    const courses = await prisma.course.findMany({ take: 1 })
    if (courses.length > 0) {
      const course = courses[0]
      
      // Create 1 module with 2 lessons
      const module1 = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: 'Getting Started',
          description: 'Introduction to the course',
          order: 1
        }
      })
      
      await prisma.courseLesson.createMany({
        data: [
          {
            moduleId: module1.id,
            title: 'Welcome & Overview',
            content: 'Course introduction and what you will learn',
            videoUrl: 'https://youtube.com/watch?v=example1',
            duration: 15,
            order: 1,
            isFree: true
          },
          {
            moduleId: module1.id,
            title: 'Core Concepts',
            content: 'Main concepts explained in detail',
            videoUrl: 'https://youtube.com/watch?v=example2',
            duration: 30,
            order: 2,
            isFree: false
          }
        ]
      })
      
      console.log('✅ Course modules & lessons created')
    }
    
    // 5. Create affiliate links
    const affiliates = await prisma.user.findMany({ where: { role: 'AFFILIATE' } })
    const products = await prisma.product.findMany()
    
    let linksCreated = 0
    for (const affiliate of affiliates) {
      for (const product of products) {
        try {
          await prisma.affiliateLink.create({
            data: {
              userId: affiliate.id,
              slug: `${affiliate.affiliateCode}-${product.slug}`,
              targetUrl: `/products/${product.slug}`,
              type: 'SALESPAGE_INTERNAL',
              productId: product.id,
              clicks: 0,
              conversions: 0,
              isActive: true
            }
          })
          linksCreated++
        } catch (e) {
          // Skip duplicate
        }
      }
    }
    console.log(`✅ Created ${linksCreated} affiliate links`)
    
    // Verify
    console.log('\n🔍 VERIFICATION:')
    const publishedProducts = await prisma.product.count({ where: { productStatus: 'PUBLISHED' } })
    const modules = await prisma.courseModule.count()
    const lessons = await prisma.courseLesson.count()
    const links = await prisma.affiliateLink.count()
    
    console.log(`  Products published: ${publishedProducts}`)
    console.log(`  Course modules: ${modules}`)
    console.log(`  Lessons: ${lessons}`)
    console.log(`  Affiliate links: ${links}`)
    
    console.log('\n✅ ALL FIXES APPLIED!')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
