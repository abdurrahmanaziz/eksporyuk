// Test withdrawal API locally
const https = require('https')

const testData = {
  amount: 50000,
  pin: '123456', // Ganti dengan PIN sebenarnya
  bankName: 'BCA',
  accountName: 'Abdurrahman Aziz',
  accountNumber: '5530467850'
}

const options = {
  hostname: 'eksporyuk.com',
  path: '/api/affiliate/payouts/xendit',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'PASTE_YOUR_SESSION_COOKIE_HERE' // Ambil dari browser
  }
}

console.log('Testing withdrawal API...')
console.log('Request:', testData)

const req = https.request(options, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('\nResponse Status:', res.statusCode)
    console.log('Response Headers:', res.headers)
    console.log('\nResponse Body:')
    
    try {
      const json = JSON.parse(data)
      console.log(JSON.stringify(json, null, 2))
    } catch (e) {
      console.log(data)
    }
  })
})

req.on('error', (error) => {
  console.error('Request Error:', error)
})

req.write(JSON.stringify(testData))
req.end()
