/**
 * Clear Browser Cookies - Untuk Development
 * 
 * Jalankan di browser console untuk clear semua cookies NextAuth
 * dan menghindari error JWT_SESSION_ERROR
 */

console.log('🧹 Clearing NextAuth Cookies...\n')

// Get all cookies
const cookies = document.cookie.split(';')

// List of NextAuth cookie names
const authCookies = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  'next-auth.csrf-token',
  '__Secure-next-auth.csrf-token'
]

let clearedCount = 0

// Clear each cookie
cookies.forEach(cookie => {
  const cookieName = cookie.split('=')[0].trim()
  
  // Clear all cookies (not just auth)
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`
  
  clearedCount++
  console.log(`✓ Cleared: ${cookieName}`)
})

console.log(`\n✅ Cleared ${clearedCount} cookies`)
console.log('🔄 Please refresh the page and login again\n')
console.log('📝 If error persists, close all tabs and open a new browser window')
