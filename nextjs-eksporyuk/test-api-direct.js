// Test API /api/learn/kelas-ekspor
async function testAPI() {
  try {
    console.log('Testing API: /api/learn/kelas-ekspor')
    
    const res = await fetch('http://localhost:3000/api/learn/kelas-ekspor', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN_HERE'
      }
    })
    
    console.log('Status:', res.status)
    console.log('Status Text:', res.statusText)
    
    const data = await res.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testAPI()
