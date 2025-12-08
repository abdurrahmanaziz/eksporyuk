/**
 * Test Mailketing API Endpoints
 * Find the correct endpoint and authentication method
 */

const API_KEY = '4e6b07c547b3de9981dfe432569995ab'

const testConfigs = [
  {
    name: 'v1/send with Bearer',
    url: 'https://api.mailketing.co.id/v1/send',
    auth: { 'Authorization': `Bearer ${API_KEY}` },
    body: {
      from: { email: 'noreply@eksporyuk.com', name: 'EksporYuk Test' },
      to: 'abdurrahmanaziz.92@gmail.com',
      subject: 'Test Email EksporYuk',
      html: '<h1>Test Email</h1><p>Test dari sistem EksporYuk</p>'
    }
  },
  {
    name: 'api/v1/send with x-api-key',
    url: 'https://api.mailketing.co.id/api/v1/send',
    auth: { 'x-api-key': API_KEY },
    body: {
      from: { email: 'noreply@eksporyuk.com', name: 'EksporYuk Test' },
      to: 'abdurrahmanaziz.92@gmail.com',
      subject: 'Test Email EksporYuk',
      html: '<h1>Test Email</h1><p>Test dari sistem EksporYuk</p>'
    }
  },
  {
    name: 'api/v1/send with Bearer',
    url: 'https://api.mailketing.co.id/api/v1/send',
    auth: { 'Authorization': `Bearer ${API_KEY}` },
    body: {
      from: { email: 'noreply@eksporyuk.com', name: 'EksporYuk Test' },
      to: 'abdurrahmanaziz.92@gmail.com',
      subject: 'Test Email EksporYuk',
      html: '<h1>Test Email</h1><p>Test dari sistem EksporYuk</p>'
    }
  },
  {
    name: 'email/send with Bearer',
    url: 'https://api.mailketing.co.id/v1/email/send',
    auth: { 'Authorization': `Bearer ${API_KEY}` },
    body: {
      from_email: 'noreply@eksporyuk.com',
      from_name: 'EksporYuk Test',
      to: 'abdurrahmanaziz.92@gmail.com',
      subject: 'Test Email EksporYuk',
      html: '<h1>Test Email</h1><p>Test dari sistem EksporYuk</p>'
    }
  },
  {
    name: 'send with api_key in body',
    url: 'https://api.mailketing.co.id/api/v1/send',
    auth: {},
    body: {
      api_key: API_KEY,
      from: { email: 'noreply@eksporyuk.com', name: 'EksporYuk Test' },
      to: 'abdurrahmanaziz.92@gmail.com',
      subject: 'Test Email EksporYuk',
      html: '<h1>Test Email</h1><p>Test dari sistem EksporYuk</p>'
    }
  }
]

async function testEndpoint(config) {
  console.log(`\n🔄 Testing: ${config.name}`)
  console.log(`   URL: ${config.url}`)
  console.log(`   Auth: ${Object.keys(config.auth).join(', ') || 'in body'}`)
  
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.auth
      },
      body: JSON.stringify(config.body)
    })

    const contentType = response.headers.get('content-type')
    const text = await response.text()
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Content-Type: ${contentType}`)
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text)
        console.log(`   Response:`, JSON.stringify(data, null, 2))
        
        if (response.ok) {
          console.log(`   ✅ SUCCESS! This endpoint works!`)
          return { success: true, config, data }
        } else {
          console.log(`   ❌ Error: ${data.message || data.response || 'Unknown error'}`)
        }
      } catch (e) {
        console.log(`   ⚠️ JSON parse error`)
      }
    } else {
      console.log(`   ⚠️ Non-JSON response: ${text.substring(0, 100)}...`)
    }
    
    return { success: false, config }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`)
    return { success: false, config, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 MAILKETING API ENDPOINT TESTING')
  console.log('=' .repeat(60))
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`)
  console.log(`Test Email: abdurrahmanaziz.92@gmail.com`)
  console.log('=' .repeat(60))

  const results = []
  
  for (const config of testConfigs) {
    const result = await testEndpoint(config)
    results.push(result)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1s between tests
  }

  console.log('\n\n📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(60))
  
  const successful = results.filter(r => r.success)
  
  if (successful.length > 0) {
    console.log(`\n✅ ${successful.length} successful endpoint(s) found:`)
    successful.forEach(r => {
      console.log(`\n   📍 ${r.config.name}`)
      console.log(`      URL: ${r.config.url}`)
      console.log(`      Auth: ${JSON.stringify(r.config.auth)}`)
      console.log(`      Response: ${JSON.stringify(r.data)}`)
    })
  } else {
    console.log('\n❌ No working endpoints found')
    console.log('\n🔍 Possible issues:')
    console.log('   1. Invalid API key - check with Mailketing provider')
    console.log('   2. API not activated - verify account status')
    console.log('   3. Wrong base URL - confirm with Mailketing documentation')
    console.log('   4. IP whitelist - add server IP to Mailketing dashboard')
  }
  
  console.log('\n' + '=' .repeat(60))
}

runTests().catch(console.error)
