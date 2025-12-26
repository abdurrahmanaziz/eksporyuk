/**
 * Test Reset Password Flow
 */

const testResetPassword = async () => {
  const API_BASE = 'http://localhost:3000'
  
  console.log('🧪 TESTING RESET PASSWORD FLOW\n')
  
  // Step 1: Request reset password
  console.log('1️⃣  Requesting reset password link...')
  const forgotResponse = await fetch(`${API_BASE}/api/auth/forgot-password-v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: 'admin@eksporyuk.com' 
    })
  })
  
  const forgotData = await forgotResponse.json()
  console.log('   Response:', forgotData)
  
  if (!forgotResponse.ok) {
    console.log('❌ Failed to request reset')
    return
  }
  
  console.log('✅ Reset link should be sent to email\n')
  
  // Note: In real scenario, you would get token from email
  // For testing, check database or email logs
  console.log('📧 Check email for reset link')
  console.log('   Link format: http://localhost:3000/auth/reset-password?token=YOUR_TOKEN\n')
  
  // Step 2: Test reset with dummy token (will fail, but shows the flow)
  console.log('2️⃣  Testing reset password API...')
  const resetResponse = await fetch(`${API_BASE}/api/auth/forgot-password-v2`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: 'dummy-token-for-testing',
      newPassword: 'newpassword123'
    })
  })
  
  const resetData = await resetResponse.json()
  console.log('   Response:', resetData)
  console.log('   (Expected to fail with invalid token)\n')
  
  console.log('✅ Test completed')
  console.log('\n📋 To fully test:')
  console.log('   1. Request reset for admin@eksporyuk.com')
  console.log('   2. Get token from email or database')
  console.log('   3. Use token in reset-password page')
}

testResetPassword().catch(console.error)
