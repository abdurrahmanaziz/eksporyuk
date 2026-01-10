// Test Google OAuth Configuration
console.log('🔍 Testing Google OAuth Configuration\n')

// Check environment
console.log('Environment Variables:')
console.log('✓ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set (Length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : '❌ Not set')
console.log('✓ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set')
console.log('✓ NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Not set')
console.log('✓ NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set')

console.log('\n📋 Expected Google Redirect URIs:')
const nextauthUrl = process.env.NEXTAUTH_URL || 'https://eksporyuk.com'
console.log(`  ${nextauthUrl}/api/auth/callback/google`)

console.log('\n🔗 Google Sign In URL:')
console.log(`  ${nextauthUrl}/api/auth/signin/google`)

console.log('\n⚙️ Google Client ID Details:')
if (process.env.GOOGLE_CLIENT_ID) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  console.log(`  Full ID: ${clientId}`)
  console.log(`  Prefix: ${clientId.substring(0, 20)}...`)
  
  // Check if it ends with .apps.googleusercontent.com
  if (clientId.includes('.apps.googleusercontent.com')) {
    console.log('  Format: ✅ Valid Google Client ID format')
  } else {
    console.log('  Format: ⚠️ May not be valid Google Client ID format')
    console.log('  Expected format: XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com')
  }
}

console.log('\n💡 Next Steps:')
console.log('1. Verify in Google Cloud Console:')
console.log('   https://console.cloud.google.com/apis/credentials')
console.log('2. Check Authorized redirect URIs includes:')
console.log(`   ${nextauthUrl}/api/auth/callback/google`)
console.log('3. Check Authorized JavaScript origins includes:')
console.log(`   ${nextauthUrl}`)
