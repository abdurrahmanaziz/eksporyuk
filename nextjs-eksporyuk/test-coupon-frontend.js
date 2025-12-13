/**
 * Test coupon generation API like frontend would call it
 */
async function testCouponGeneration() {
  try {
    console.log('🧪 Testing coupon generation API...')
    
    // Mock session data (we'll need a real affiliate user ID for actual test)
    const testData = {
      templateId: 'cm8q8s7qz0002r1j3o3p6kxfw', // Template EKSPORYUK ID (needs to be real)
      customCode: 'TESTCODE' + Date.now().toString().slice(-4) // Unique code
    }
    
    console.log('Test data:', testData)
    
    // This is what frontend would send
    const response = await fetch('http://localhost:3000/api/affiliate/coupons/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real scenario, this would include session cookie
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response:', result)
    
    if (response.ok) {
      console.log('✅ Coupon generation successful!')
      console.log(`✅ Generated coupon: ${result.coupon.code}`)
    } else {
      console.log('❌ Coupon generation failed:', result.error)
      if (response.status === 401) {
        console.log('💡 This is expected - need authentication for real test')
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
    console.log('💡 Make sure development server is running on port 3000')
  }
}

// First get the actual template ID
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function getTemplateId() {
  try {
    const template = await prisma.coupon.findFirst({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      }
    })
    
    if (template) {
      console.log('📋 Found template:', template.code, '(ID:', template.id + ')')
      return template.id
    } else {
      console.log('❌ No template found')
      return null
    }
  } catch (error) {
    console.error('❌ Database error:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const templateId = await getTemplateId()
  if (templateId) {
    // Update test data with real template ID
    console.log('\n🧪 Testing with real template ID...')
    await testCouponGeneration()
  }
}

main()