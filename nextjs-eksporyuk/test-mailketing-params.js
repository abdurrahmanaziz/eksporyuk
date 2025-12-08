const API_KEY = '4e6b07c547b3de9981dfe432569995ab'

async function testParams() {
  const tests = [
    { name: 'recipient (singular)', params: { recipient: 'abdurrahmanaziz.92@gmail.com' } },
    { name: 'recipient_email', params: { recipient_email: 'abdurrahmanaziz.92@gmail.com' } },
    { name: 'email', params: { email: 'abdurrahmanaziz.92@gmail.com' } },
    { name: 'to_email', params: { to_email: 'abdurrahmanaziz.92@gmail.com' } },
    { name: 'recipient_list', params: { recipient_list: 'abdurrahmanaziz.92@gmail.com' } }
  ]

  for (const test of tests) {
    console.log(`\n🔄 Testing: ${test.name}`)
    
    const formData = new URLSearchParams({
      api_token: API_KEY,
      from_email: 'admin@eksporyuk.com',
      from_name: 'EksporYuk',
      subject: 'Test',
      html: '<h1>Test</h1>',
      ...test.params
    })

    try {
      const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      })

      const data = await response.json()
      console.log(`   Result: ${data.status}`)
      console.log(`   Message: ${data.response || data.message}`)
      
      if (data.status === 'success') {
        console.log(`   ✅ FOUND! Parameter: ${test.name}`)
        return test.name
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
    
    await new Promise(r => setTimeout(r, 500))
  }
}

testParams().catch(console.error)
