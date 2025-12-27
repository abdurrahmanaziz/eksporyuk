// Test the membership API with direct HTTP calls
const fetch = require('node-fetch')

async function testMembershipAPI() {
  try {
    console.log('Testing membership API...')
    
    // First get a login session
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@eksporyuk.com',
        password: 'admin123'
      })
    })
    
    console.log('Login status:', loginResponse.status)
    
    if (loginResponse.ok) {
      const cookies = loginResponse.headers.get('set-cookie')
      console.log('Got cookies:', !!cookies)
      
      // Test the membership endpoint
      const membershipResponse = await fetch('http://localhost:3000/api/admin/users/cmjn3bkdj00045tpny75hiwn4/memberships', {
        headers: {
          'Cookie': cookies || '',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Membership API status:', membershipResponse.status)
      const membershipData = await membershipResponse.text()
      console.log('Response:', membershipData.substring(0, 200) + '...')
    }
    
  } catch (error) {
    console.error('Test error:', error.message)
  }
}

testMembershipAPI()