/**
 * FIX CRITICAL BUGS - Update seeded data
 * Fixes: Products unpublished, courses without modules, affiliate links, commission rates
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixProducts() {
  console.log('\n🛍️  FIXING PRODUCTS...')
  
  // Publish all products
  const updated = await prisma.product.updateMany({
    where: { productStatus: 'DRAFT' },
    data: { productStatus: 'PUBLISHED' }
  })
  console.log(`✅ Published ${updated.count} products`)
  
  return updated.count
}

async function fixAffiliates() {
  console.log('\n💰 FIXING AFFILIATES...')
  
  // Update affiliate commission rates
  const affiliates = await prisma.user.findMany({
    where: { role: 'AFFILIATE' }
  })
  
  let updated = 0
  for (const affiliate of affiliates) {
    await prisma.user.update({
      where: { id: affiliate.id },
      data: { commissionRate: 25 } // 25% commission
    })
    updated++
  }
  console.log(`✅ Updated ${updated} affiliates with 25% commission rate`)
  
  // Create affiliate links for each product
  const products = await prisma.product.findMany()
  const memberships = await prisma.membershipPlan.findMany()
  
  let linksCreated = 0
  for (const affiliate of affiliates) {
    // Affiliate link for each product
    for (const product of products) {
      await prisma.affiliateLink.create({
        data: {
          userId: affiliate.id,
          slug: `${affiliate.affiliateCode}-${product.slug}`,
          targetUrl: `/products/${product.slug}`,
          type: 'SALESPAGE_INTERNAL',
          productId: product.id,
          clicks: Math.floor(Math.random() * 50),
          conversions: Math.floor(Math.random() * 10),
          isActive: true
        }
      })
      linksCreated++
    }
    
    // Affiliate link for membership
    const proPlan = memberships.find(m => m.slug === 'pro')
    if (proPlan) {
      await prisma.affiliateLink.create({
        data: {
          userId: affiliate.id,
          slug: `${affiliate.affiliateCode}-membership-pro`,
          targetUrl: `/membership/pro`,
          type: 'CHECKOUT',
          membershipPlanId: proPlan.id,
          clicks: Math.floor(Math.random() * 100),
          conversions: Math.floor(Math.random() * 20),
          isActive: true
        }
      })
      linksCreated++
    }
  }
  
  console.log(`✅ Created ${linksCreated} affiliate links`)
  
  // Create some commission records
  const transactions = await prisma.transaction.findMany({
    where: { 
      status: 'SUCCESS',
      type: { in: ['PRODUCT', 'MEMBERSHIP'] }
    },
    take: 5
  })
  
  let commissionsCreated = 0
  for (const tx of transactions) {
    const randomAffiliate = affiliates[Math.floor(Math.random() * affiliates.length)]
    const commissionAmount = tx.amount * 0.25 // 25%
    
    await prisma.affiliateCommission.create({
      data: {
        affiliateId: randomAffiliate.id,
        transactionId: tx.id,
        amount: commissionAmount,
        rate: 25,
        status: 'APPROVED',
        isPaid: Math.random() > 0.5
      }
    })
    commissionsCreated++
  }
  
  console.log(`✅ Created ${commissionsCreated} commission records`)
  
  return { updated, linksCreated, commissionsCreated }
}

async function fixCourses() {
  console.log('\n📚 FIXING COURSES...')
  
  const courses = await prisma.course.findMany()
  let modulesCreated = 0
  let lessonsCreated = 0
  
  for (const course of courses) {
    // Create 3 modules per course
    for (let i = 1; i <= 3; i++) {
      const module = await prisma.courseModule.create({
        data: {
          courseId: course.id,
          title: `Module ${i}: ${['Fundamentals', 'Advanced Techniques', 'Practical Application'][i-1]}`,
          description: `Learn the essential concepts in module ${i}`,
          order: i,
          isPublished: true
        }
      })
      modulesCreated++
      
      // Create 4 lessons per module
      for (let j = 1; j <= 4; j++) {
        const isFree = i === 1 && j === 1 // First lesson free
        await prisma.lesson.create({
          data: {
            courseId: course.id,
            moduleId: module.id,
            title: `Lesson ${j}: ${['Introduction', 'Deep Dive', 'Case Study', 'Practice'][j-1]}`,
            description: `Detailed lesson content for module ${i}, lesson ${j}`,
            videoUrl: `https://youtube.com/watch?v=example${i}${j}`,
            duration: 15 * j, // 15, 30, 45, 60 minutes
            order: j,
            isFree: isFree,
            isPublished: true
          }
        })
        lessonsCreated++
      }
    }
  }
  
  console.log(`✅ Created ${modulesCreated} modules`)
  console.log(`✅ Created ${lessonsCreated} lessons`)
  
  return { modulesCreated, lessonsCreated }
}

async function fixEvents() {
  console.log('\n📅 FIXING EVENTS...')
  
  const updated = await prisma.event.updateMany({
    data: { productStatus: 'PUBLISHED' }
  })
  console.log(`✅ Published ${updated.count} events`)
  
  return updated.count
}

async function verifyFixes() {
  console.log('\n\n🔍 VERIFYING FIXES...')
  
  const publishedProducts = await prisma.product.count({ where: { productStatus: 'PUBLISHED' } })
  console.log(`✅ Published products: ${publishedProducts}`)
  
  const affiliateLinks = await prisma.affiliateLink.count()
  console.log(`✅ Affiliate links: ${affiliateLinks}`)
  
  const commissions = await prisma.affiliateCommission.count()
  console.log(`✅ Commission records: ${commissions}`)
  
  const affiliatesWithRate = await prisma.user.count({
    where: { 
      role: 'AFFILIATE',
      commissionRate: { gt: 0 }
    }
  })
  console.log(`✅ Affiliates with commission: ${affiliatesWithRate}`)
  
  const modules = await prisma.courseModule.count()
  console.log(`✅ Course modules: ${modules}`)
  
  const lessons = await prisma.lesson.count()
  console.log(`✅ Lessons: ${lessons}`)
  
  const freeLessons = await prisma.lesson.count({ where: { isFree: true } })
  console.log(`✅ Free preview lessons: ${freeLessons}`)
}

async function main() {
  console.log('🔧 FIXING CRITICAL BUGS...\n')
  console.log('=' .repeat(60))
  
  try {
    await fixProducts()
    await fixAffiliates()
    await fixCourses()
    await fixEvents()
    
    console.log('\n' + '='.repeat(60))
    await verifyFixes()
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL CRITICAL BUGS FIXED!')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
