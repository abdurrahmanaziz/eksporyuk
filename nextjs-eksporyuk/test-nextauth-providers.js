// Test NextAuth providers directly
const { authOptions } = require('./dist/lib/auth-options')

console.log('🔍 Testing NextAuth Configuration\n')

// Check if authOptions is loaded
console.log('Auth Options loaded:', !!authOptions)

if (authOptions) {
  console.log('\n📋 Providers configured:')
  if (authOptions.providers) {
    authOptions.providers.forEach((provider, index) => {
      console.log(`  ${index + 1}. ${provider.name || provider.id || 'Unknown'}`)
      console.log(`     Type:`, provider.type)
      if (provider.options) {
        console.log(`     Has clientId:`, !!provider.options.clientId)
        console.log(`     Has clientSecret:`, !!provider.options.clientSecret)
        if (provider.options.clientId) {
          console.log(`     ClientId prefix:`, provider.options.clientId.substring(0, 20))
        }
      }
      console.log('')
    })
    console.log(`\n✅ Total providers: ${authOptions.providers.length}`)
  } else {
    console.log('❌ No providers array found!')
  }
  
  console.log('\n🔐 Auth Configuration:')
  console.log('  Secret set:', !!authOptions.secret)
  console.log('  Session strategy:', authOptions.session?.strategy)
  console.log('  Debug mode:', authOptions.debug)
  
  console.log('\n📍 Pages:')
  console.log('  Sign In:', authOptions.pages?.signIn)
  console.log('  Error:', authOptions.pages?.error)
}

console.log('\n🌍 Environment Variables:')
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) || 'undefined')
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'undefined')
console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'undefined')
console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'undefined')
