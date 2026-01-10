const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSchema() {
  try {
    console.log('�� Checking AffiliateLink table schema...\n')
    
    // Try to get a sample link to see actual columns
    const sampleLink = await prisma.affiliateLink.findFirst({
      select: {
        id: true,
        userId: true,
        affiliateId: true,
        code: true,
        shortCode: true,
        linkType: true,
        membershipId: true,
        productId: true,
        courseId: true,
        supplierId: true,
        couponCode: true,
        fullUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    console.log('✅ Sample link structure:', sampleLink ? 'Found' : 'No links in DB yet')
    if (sampleLink) {
      console.log(JSON.stringify(sampleLink, null, 2))
    }
    
    // Check if we can create a test query
    const count = await prisma.affiliateLink.count()
    console.log(`\n📊 Total links in database: ${count}`)
    
    // Try to test the create operation structure
    console.log('\n🧪 Testing create data structure...')
    const testData = {
      id: 'test_' + Date.now(),
      userId: 'test_user',
      affiliateId: 'test_affiliate',
      code: 'TEST123',
      shortCode: 'ABC123',
      linkType: 'CHECKOUT',
      membershipId: 'test_membership',
      fullUrl: 'https://test.com',
      isActive: true,
    }
    console.log('Test data structure:', Object.keys(testData).join(', '))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('\nFull error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchema()
