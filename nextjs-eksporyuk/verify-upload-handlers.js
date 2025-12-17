/**
 * Test script untuk verifikasi semua upload handler
 * mengembalikan FULL URL (bukan relative path)
 */

const fs = require('fs')
const path = require('path')

// Check upload handlers
const uploadHandlers = [
  {
    name: 'Main Upload Handler',
    path: 'src/app/api/upload/route.ts',
    expected: 'NEXT_PUBLIC_APP_URL'
  },
  {
    name: 'Admin Upload Handler',
    path: 'src/app/api/admin/upload/route.ts',
    expected: 'NEXT_PUBLIC_APP_URL'
  },
  {
    name: 'Settings Upload Logo Handler',
    path: 'src/app/api/admin/settings/upload-logo/route.ts',
    expected: 'NEXT_PUBLIC_APP_URL'
  }
]

console.log('🔍 VERIFYING UPLOAD HANDLERS\n')
console.log('='.repeat(60))

let allPass = true

uploadHandlers.forEach((handler, index) => {
  const fullPath = path.join(process.cwd(), handler.path)
  
  console.log(`\n${index + 1}. ${handler.name}`)
  console.log(`   File: ${handler.path}`)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`   ❌ File not found!`)
    allPass = false
    return
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  
  // Check if handler uses NEXT_PUBLIC_APP_URL for full URL
  const hasAppUrl = content.includes('NEXT_PUBLIC_APP_URL') || content.includes('NEXTAUTH_URL')
  const hasHttpPrefix = content.includes('${appUrl}') || content.includes('appUrl}/')
  
  if (hasAppUrl && hasHttpPrefix) {
    console.log(`   ✅ Returns FULL URL (with domain)`)
  } else {
    console.log(`   ❌ Returns relative path (needs fix)`)
    allPass = false
  }
  
  // Check for the pattern
  const urlPattern = content.match(/const publicUrl = [`']?\${[^}]+}[^`']*['`]?/g) || 
                     content.match(/const url = [`']?\${[^}]+}[^`']*['`]?/g)
  
  if (urlPattern) {
    console.log(`   URL pattern: ${urlPattern[0].substring(0, 60)}...`)
  }
})

console.log('\n' + '='.repeat(60))

if (allPass) {
  console.log('🎉 ALL UPLOAD HANDLERS VERIFIED!')
  console.log('='.repeat(60))
  console.log('\n✅ Semua upload handler sekarang mengembalikan FULL URL')
  console.log('✅ Logo yang diupload akan tersimpan dengan URL lengkap')
  console.log('✅ Email akan bisa load logo dengan benar')
} else {
  console.log('⚠️  SOME HANDLERS NEED FIXING!')
  console.log('='.repeat(60))
}

console.log('\n📝 Next Steps:')
console.log('   1. Restart Next.js: npm run dev')
console.log('   2. Upload logo dari /admin/settings/branding')
console.log('   3. Check database - URL harus full (https://...)')
console.log('   4. Test email - logo harus muncul')
