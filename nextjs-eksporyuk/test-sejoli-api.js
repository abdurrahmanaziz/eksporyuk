/**
 * Test Sejoli REST API - Get Latest Transactions
 * Test koneksi ke API Sejoli untuk ambil transaksi terbaru
 */

const axios = require('axios')

// Config dari .env
const SEJOLI_API_URL = process.env.SEJOLI_API_URL || 'https://member.eksporyuk.com/wp-json/sejoli-api/v1'
const SEJOLI_API_USERNAME = process.env.SEJOLI_API_USERNAME || 'admin_ekspor'
const SEJOLI_API_PASSWORD = process.env.SEJOLI_API_PASSWORD || 'Eksporyuk2024#'

async function testSejoliAPI() {
  console.log('🔌 Testing Sejoli REST API...\n')
  console.log(`API URL: ${SEJOLI_API_URL}`)
  console.log(`Username: ${SEJOLI_API_USERNAME}`)
  console.log(`Password: ${SEJOLI_API_PASSWORD.substring(0, 4)}***\n`)

  try {
    // 1. Test root endpoint untuk lihat available routes
    console.log('📡 Checking available API routes...')
    
    const auth = Buffer.from(`${SEJOLI_API_USERNAME}:${SEJOLI_API_PASSWORD}`).toString('base64')
    
    // Test root endpoint
    try {
      const rootResponse = await axios.get(SEJOLI_API_URL, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      })
      
      console.log('\n✅ API Root Response:')
      console.log(JSON.stringify(rootResponse.data, null, 2))
    } catch (rootError) {
      console.log('\n⚠️  Root endpoint not accessible, trying specific routes...')
    }

    // Try different possible endpoints
    const possibleEndpoints = [
      '/orders',
      '/order',
      '/transactions',
      '/transaction',
      '/sales',
      '/order-product',
      '/products'
    ]

    console.log('\n🔍 Testing possible endpoints:')
    for (const endpoint of possibleEndpoints) {
      try {
        const testResponse = await axios.get(`${SEJOLI_API_URL}${endpoint}`, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          params: { per_page: 1 },
          timeout: 10000
        })
        console.log(`   ✅ ${endpoint} - Available (${testResponse.status})`)
      } catch (err) {
        console.log(`   ❌ ${endpoint} - ${err.response?.status || 'Error'}: ${err.response?.data?.message || err.message}`)
      }
    }

    console.log('\n✅ Endpoint check completed!')
    return null

  } catch (error) {
    console.error('\n❌ Error fetching from Sejoli API:')
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error(`Message: ${error.response.statusText}`)
      console.error(`Data:`, error.response.data)
    } else if (error.request) {
      console.error('No response received from server')
      console.error('Request:', error.request)
    } else {
      console.error('Error:', error.message)
    }
    throw error
  }
}

// Run test
testSejoliAPI()
  .then(data => {
    console.log('\n🎉 Test selesai!')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n💥 Test gagal!')
    process.exit(1)
  })
