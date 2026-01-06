const https = require('https')

// Test Xendit Payout API dengan credentials production
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || 'PASTE_YOUR_KEY_HERE'

const requestData = {
  referenceId: `test_${Date.now()}`,
  channelCode: 'ID_BCA',
  channelProperties: {
    accountHolderName: 'Abdurrahman Aziz',
    accountNumber: '5530467850'
  },
  amount: 45000,
  currency: 'IDR',
  description: 'Test payout'
}

const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')

const options = {
  hostname: 'api.xendit.co',
  path: '/v2/payouts',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }
}

console.log('Testing Xendit Payout API...')
console.log('Auth:', auth.substring(0, 20) + '...')
console.log('Request:', JSON.stringify(requestData, null, 2))

const req = https.request(options, (res) => {
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    console.log('\nResponse Status:', res.statusCode)
    console.log('Response:', data)
    
    try {
      const json = JSON.parse(data)
      console.log('\nParsed:', JSON.stringify(json, null, 2))
    } catch (e) {
      console.log('Not JSON')
    }
  })
})

req.on('error', (error) => {
  console.error('Request Error:', error)
})

req.write(JSON.stringify(requestData))
req.end()
