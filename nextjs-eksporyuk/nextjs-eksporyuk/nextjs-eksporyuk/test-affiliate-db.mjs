/**
 * Simple test for Affiliate Links Database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAffiliateLinksDB() {
  console.log('🔍 Testing Affiliate Links Database...\n')
  
  try {
    // Test database connection
    console.log('1. Testing database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected')
    
    // Check affiliate profiles
    console.log('\n2. Checking affiliate profiles...')
    const profileCount = await prisma.affiliateProfile.count()
    console.log(`   📊 Total affiliate profiles: ${profileCount}`)
    
    if (profileCount > 0) {
      const profiles = await prisma.affiliateProfile.findMany({
        take: 3,
        include: { user: { select: { email: true, name: true } } }
      })
      
      profiles.forEach(p => {
        console.log(`   - ${p.user.name} (${p.user.email}) - Code: ${p.affiliateCode}`)
      })
    }
    
    // Check affiliate links
    console.log('\n3. Checking affiliate links...')
    const linkCount = await prisma.affiliateLink.count()
    console.log(`   📊 Total affiliate links: ${linkCount}`)
    
    if (linkCount > 0) {
      const links = await prisma.affiliateLink.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      
      links.forEach(link => {
        console.log(`   - Code: ${link.code} | Type: ${link.linkType} | Clicks: ${link.clicks}`)
      })
    }
    
    // Check memberships for link generation
    console.log('\n4. Checking available memberships...')
    const membershipCount = await prisma.membership.count({ where: { isActive: true } })
    console.log(`   📊 Active memberships: ${membershipCount}`)
    
    // Check products
    console.log('\n5. Checking available products...')
    const productCount = await prisma.product.count({ where: { isActive: true } })
    console.log(`   📊 Active products: ${productCount}`)
    
    // Check courses
    console.log('\n6. Checking available courses...')
    const courseCount = await prisma.course.count({ where: { isPublished: true } })
    console.log(`   📊 Published courses: ${courseCount}`)
    
    console.log('\n✅ Database test completed successfully!')
    
    // Summary
    console.log('\n📋 SUMMARY:')
    console.log(`   - Affiliate Profiles: ${profileCount}`)
    console.log(`   - Affiliate Links: ${linkCount}`)
    console.log(`   - Active Memberships: ${membershipCount}`)
    console.log(`   - Active Products: ${productCount}`)
    console.log(`   - Published Courses: ${courseCount}`)
    
    if (profileCount > 0 && (membershipCount > 0 || productCount > 0)) {
      console.log('\n🎉 System ready for affiliate link generation!')
    } else {
      console.log('\n⚠️  Missing data: Need affiliate profiles and targets (memberships/products)')
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAffiliateLinksDB()