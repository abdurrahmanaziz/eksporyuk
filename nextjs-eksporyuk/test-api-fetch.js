async function testAPI() {
  try {
    console.log('\n🔍 Testing API: /api/membership-plans/paket-lifetime\n')
    
    const response = await fetch('http://localhost:3000/api/membership-plans/paket-lifetime')
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const error = await response.text()
      console.log('\n❌ Error Response:')
      console.log(error)
      return
    }
    
    const data = await response.json()
    
    console.log('\n✅ Success! API Response:')
    console.log(JSON.stringify(data, null, 2))
    
    console.log('\n📊 Plan Details:')
    console.log(`Name: ${data.plan.name}`)
    console.log(`Slug: ${data.plan.slug}`)
    console.log(`Active: ${data.plan.isActive}`)
    console.log(`Prices: ${data.plan.prices?.length || 0} options`)
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

testAPI()
