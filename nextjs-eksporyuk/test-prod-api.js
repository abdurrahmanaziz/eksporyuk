// Test production API
const https = require('https')

// Read session from environment or hardcode for testing
const sessionToken = process.env.SESSION_TOKEN || 'YOUR_SESSION_TOKEN_HERE'

const options = {
  hostname: 'eksporyuk.com',
  path: '/api/affiliate/transactions?page=1&limit=5&status=all',
  method: 'GET',
  headers: {
    'Cookie': `next-auth.session-token=${sessionToken}; __Secure-next-auth.session-token=${sessionToken}`,
    'Content-Type': 'application/json',
  }
}

console.log('Testing API:', options.hostname + options.path)

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode)
  console.log('Headers:', JSON.stringify(res.headers, null, 2))
  
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('\nResponse body:')
    try {
      const json = JSON.parse(data)
      console.log(JSON.stringify(json, null, 2))
    } catch (e) {
      console.log(data.substring(0, 2000))
    }
  })
})

req.on('error', (e) => {
  console.error('Error:', e.message)
})

req.end()
