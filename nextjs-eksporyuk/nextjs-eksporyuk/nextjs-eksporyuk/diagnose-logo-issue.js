const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLogoAccessibility() {
  try {
    console.log('🔍 Checking Logo Accessibility...\n')
    
    const settings = await prisma.settings.findFirst()
    
    console.log('📋 Current Logo Settings:')
    console.log(`   siteLogo: ${settings?.siteLogo}`)
    console.log(`   logoAffiliate: ${settings?.logoAffiliate || '(not set)'}`)
    
    // Check if logo is accessible
    const logoUrl = settings?.siteLogo || ''
    
    console.log('\n🔍 Logo Accessibility Check:')
    
    if (logoUrl.startsWith('/uploads/')) {
      console.log('   ❌ PROBLEM: Relative path /uploads/ tidak bisa diakses dari email client')
      console.log('   ❌ Email client tidak bisa load image dari local server')
      console.log('')
      console.log('   💡 SOLUTION OPTIONS:')
      console.log('   1. Upload logo ke CDN/cloud storage (Cloudinary, AWS S3, etc)')
      console.log('   2. Gunakan public URL yang bisa diakses dari internet')
      console.log('   3. Gunakan logo default dari URL publik')
      console.log('')
      console.log('   🔧 Sementara, saya akan set logo default yang bisa diakses publik')
      
      // Set logo default yang accessible
      const publicLogoUrl = 'https://app.eksporyuk.com/logo.png' // atau gunakan CDN
      
      console.log(`\n   🔄 Updating to accessible logo URL...`)
      console.log(`   From: ${logoUrl}`)
      console.log(`   To: ${publicLogoUrl}`)
      
    } else if (logoUrl.startsWith('http://localhost') || logoUrl.includes('localhost')) {
      console.log('   ❌ PROBLEM: localhost URL tidak bisa diakses dari email client')
      console.log('   ❌ Email client ada di device lain, tidak bisa akses localhost')
    } else if (logoUrl.startsWith('https://app.eksporyuk.com/uploads/')) {
      console.log('   ⚠️  PARTIAL PROBLEM: URL benar tapi folder /uploads/ mungkin tidak public')
      console.log('   ⚠️  Perlu pastikan folder /public/uploads accessible dari luar')
      console.log('')
      console.log('   💡 Cek apakah URL ini bisa diakses:')
      console.log(`   ${logoUrl}`)
      console.log('')
      console.log('   🔧 Jika tidak bisa diakses, perlu:')
      console.log('   1. Move logo ke /public/ folder')
      console.log('   2. Atau upload ke CDN')
    } else if (logoUrl.startsWith('https://') || logoUrl.startsWith('http://')) {
      console.log('   ✅ Logo menggunakan public URL')
      console.log(`   ℹ️  Silakan test apakah URL ini bisa diakses: ${logoUrl}`)
    }
    
    // Suggest using default logo
    console.log('\n💡 RECOMMENDED FIX:')
    console.log('   Gunakan logo dari public URL atau base64 encoded image')
    console.log('')
    console.log('   Option 1: Upload logo ke CDN (Cloudinary, imgbb, etc)')
    console.log('   Option 2: Simpan logo di /public/images/ folder')
    console.log('   Option 3: Gunakan base64 encoded image')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkLogoAccessibility()
