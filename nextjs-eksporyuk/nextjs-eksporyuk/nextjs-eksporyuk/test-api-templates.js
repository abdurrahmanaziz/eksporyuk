const http = require('http')

async function testTemplatesAPI() {
  console.log('🧪 Testing /api/affiliate/coupons/templates endpoint\n')
  
  try {
    const response = await fetch('https://eksporyuk.com/api/affiliate/coupons/templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`Status: ${response.status}`)
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Response OK')
      console.log(`Found ${data.templates?.length || 0} templates\n`)
      
      if (data.templates && data.templates.length > 0) {
        data.templates.forEach(t => {
          console.log(`${t.code}:`)
          console.log(`  Discount: ${t.discountValue}${t.discountType === 'PERCENTAGE' ? '%' : ' IDR'}`)
          console.log(`  Max Generate: ${t.maxGeneratePerAffiliate || 'unlimited'}`)
          console.log(`  Generated Count: ${t.generatedCount || 0}`)
          console.log('')
        })
      }
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('❌ Fetch error:', error.message)
  }
}

testTemplatesAPI()
