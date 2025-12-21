#!/usr/bin/env node

/**
 * HTTP API Test - Test actual API endpoint
 * Tests the /api/admin/sync/sejoli endpoint with real HTTP calls
 */

const http = require('http')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get auth token by creating a test session
async function getAuthToken() {
  // For this test, we'll just verify that a POST would be rejected without auth
  // In real scenario, would need to login first
  return null
}

async function testSyncAPI() {
  try {
    console.log('🔍 Testing Sync API via HTTP...\n')

    // Step 1: Get test data
    console.log('📋 Preparing test data...')
    const membership = await prisma.membership.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, price: true, affiliateCommissionRate: true, duration: true }
    })

    const affiliate = await prisma.affiliateProfile.findFirst({
      where: { isActive: true },
      include: { user: { select: { id: true } } }
    })

    if (!membership || !affiliate) {
      console.error('❌ Missing test data')
      return
    }

    const testEmail = `test-api-${Date.now()}@example.com`
    const testPrice = 100000
    const affiliateCommission = (testPrice * membership.affiliateCommissionRate) / 100

    const csvData = [
      {
        email: testEmail,
        name: 'API Test User',
        price: testPrice.toString(),
        status: 'completed',
        INV: `INV${Math.floor(Math.random() * 100000)}`
      }
    ]

    console.log(`✅ Membership: ${membership.name}`)
    console.log(`✅ Affiliate: ${affiliate.user.id}`)
    console.log(`✅ Test email: ${testEmail}`)
    console.log(`✅ Commission: Rp${affiliateCommission}\n`)

    // Step 2: Make POST request to API
    console.log('📤 Making POST request to /api/admin/sync/sejoli...')

    const requestData = {
      csvData,
      membershipId: membership.id,
      affiliateId: affiliate.user.id,
      affiliateCommission
    }

    const postData = JSON.stringify(requestData)

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/sync/sejoli',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', async () => {
        console.log(`\n📥 Response Status: ${res.statusCode}`)
        
        try {
          const jsonData = JSON.parse(data)
          
          if (res.statusCode === 401) {
            console.log('⚠️  Unauthorized (expected without auth token)')
            console.log('   This is expected - needs admin login\n')
          } else if (res.statusCode === 200) {
            console.log('✅ Success!\n')
            console.log('📊 Response:')
            console.log(JSON.stringify(jsonData, null, 2))
          } else {
            console.log('❌ Error response:')
            console.log(JSON.stringify(jsonData, null, 2))
          }
        } catch (e) {
          console.log('📝 Raw response:')
          console.log(data.substring(0, 200))
        }

        await prisma.$disconnect()
      })
    })

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message)
      console.log('\n💡 Make sure Next.js server is running on port 3000')
      process.exit(1)
    })

    req.write(postData)
    req.end()

  } catch (error) {
    console.error('❌ Error:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testSyncAPI()
