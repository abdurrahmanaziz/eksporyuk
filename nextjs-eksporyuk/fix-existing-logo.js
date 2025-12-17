const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixExistingLogoUrl() {
  try {
    console.log('🔧 FIXING EXISTING LOGO URL IN DATABASE\n')
    console.log('='.repeat(60))
    
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.log('❌ No settings found!')
      return
    }
    
    console.log('\n📋 Current Logo URL:')
    console.log(`   ${settings.siteLogo}`)
    
    const currentLogo = settings.siteLogo || ''
    let newLogoUrl = currentLogo
    
    // Check if it's a relative path that needs fixing
    if (currentLogo.startsWith('/uploads/') || currentLogo.startsWith('/')) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.eksporyuk.com'
      newLogoUrl = `${appUrl}${currentLogo}`
      
      console.log('\n🔄 Converting relative path to full URL:')
      console.log(`   From: ${currentLogo}`)
      console.log(`   To: ${newLogoUrl}`)
      
      // Update database
      await prisma.settings.update({
        where: { id: settings.id },
        data: { siteLogo: newLogoUrl }
      })
      
      console.log('\n✅ Database updated!')
      
    } else if (currentLogo.startsWith('data:')) {
      console.log('\n⚠️  Logo is Data URI (embedded)')
      console.log('   This will work but not recommended for production')
      console.log('   Please upload a real logo image')
      
    } else if (currentLogo.startsWith('https://') || currentLogo.startsWith('http://')) {
      console.log('\n✅ Logo already has full URL')
      
      // Check if it's a valid image URL
      if (currentLogo.includes('placeholder') || currentLogo.includes('via.placeholder')) {
        console.log('   ⚠️  Using placeholder - please upload real logo')
      }
    } else {
      console.log('\n⚠️  Unknown logo format:', currentLogo)
    }
    
    // Verify final state
    const updated = await prisma.settings.findFirst()
    console.log('\n📸 Final Logo URL in Database:')
    console.log(`   ${updated?.siteLogo}`)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ DONE!')
    console.log('='.repeat(60))
    
    console.log('\n📝 NEXT STEPS:')
    console.log('   1. Restart Next.js server if running')
    console.log('   2. Go to /admin/settings/branding')
    console.log('   3. Upload logo baru → URL lengkap akan otomatis tersimpan')
    console.log('   4. Test kirim email → logo harus muncul')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixExistingLogoUrl()
