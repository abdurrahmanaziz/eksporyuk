/**
 * Manual test View As User untuk debug masalah logout
 */

console.log('🔍 Testing View As User session flow...')

// Test 1: Login sebagai admin
console.log('Step 1: Pastikan login sebagai admin di browser')
console.log('Step 2: Buka console di halaman profil user (misal /sultanaziz)')
console.log('Step 3: Jalankan script ini di console:')

console.log(`
// Debug session sebelum impersonation
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('BEFORE IMPERSONATION Session:', session)
    
    if (!session?.user) {
      console.error('❌ No session found - user not logged in')
      return
    }
    
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(session.user.role)) {
      console.error('❌ Not admin/founder/co-founder:', session.user.role)
      return
    }
    
    console.log('✅ Admin session valid, starting impersonation test...')
    
    // Find a target user ID (replace with real user ID)
    const targetUserId = 'TARGET_USER_ID_HERE' // CHANGE THIS
    
    // Test impersonation API
    return fetch('/api/admin/view-as-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: targetUserId,
        reason: 'Debug test'
      })
    })
  })
  .then(r => {
    if (!r) return
    console.log('API Response status:', r.status)
    return r.json()
  })
  .then(result => {
    if (!result) return
    console.log('API Response:', result)
    
    if (result.success) {
      console.log('✅ API berhasil, testing session update...')
      
      // Test NextAuth session update
      if (window.next_auth_session_update) {
        window.next_auth_session_update({
          impersonation: result.data
        })
      } else {
        console.log('⚠️ NextAuth session update function not found')
        console.log('Trying manual session refresh...')
        location.reload()
      }
    } else {
      console.error('❌ API failed:', result.error)
    }
  })
  .catch(err => {
    console.error('❌ Test failed:', err)
  })
`)

console.log('Step 4: Replace TARGET_USER_ID_HERE dengan user ID yang valid')
console.log('Step 5: Paste dan jalankan di console browser')