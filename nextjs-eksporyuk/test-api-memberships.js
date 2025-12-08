const https = require('https')
const http = require('http')

async function testAPI() {
  try {
    console.log('Testing API endpoint...\n')
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/memberships/packages',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    http.get(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        const json = JSON.parse(data)
        console.log('API Response:')
        console.log(JSON.stringify(json, null, 2))
        
        console.log('\n📦 Packages found:', json.packages?.length || 0)
        
        if (json.packages) {
          json.packages.forEach((pkg, i) => {
            console.log(`\n${i + 1}. ${pkg.name}`)
            console.log(`   ID: ${pkg.id}`)
            console.log(`   Duration: ${pkg.duration}`)
            console.log(`   Price: ${pkg.price}`)
            console.log(`   Original: ${pkg.originalPrice}`)
            console.log(`   Features type: ${typeof pkg.features}`)
            console.log(`   Features: ${pkg.features}`)
            console.log(`   Best Seller: ${pkg.isBestSeller}`)
            console.log(`   Active: ${pkg.isActive}`)
          })
        }
      })
    }).on('error', (error) => {
      console.error('Error:', error.message)
    })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAPI()
