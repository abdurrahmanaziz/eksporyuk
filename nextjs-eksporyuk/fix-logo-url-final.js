const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixLogoUrl() {
  try {
    console.log('🔧 Fixing Logo URL for Email Accessibility...\n')
    
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.log('❌ No settings found!')
      return
    }
    
    console.log('📋 Current Settings:')
    console.log(`   siteLogo: ${settings.siteLogo}`)
    
    const currentLogo = settings.siteLogo || ''
    
    // Fix the logo URL
    let fixedLogoUrl = currentLogo
    
    if (currentLogo.startsWith('/uploads/')) {
      // Convert to full public URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.eksporyuk.com'
      fixedLogoUrl = `${appUrl}${currentLogo}`
      
      console.log('\n🔄 Converting to full public URL:')
      console.log(`   From: ${currentLogo}`)
      console.log(`   To: ${fixedLogoUrl}`)
      
      // Update in database
      await prisma.settings.update({
        where: { id: settings.id },
        data: { siteLogo: fixedLogoUrl }
      })
      
      console.log('\n✅ Logo URL updated in database!')
      
    } else if (currentLogo.startsWith('https://app.eksporyuk.com/uploads/')) {
      console.log('\n✅ Logo already has full URL')
      fixedLogoUrl = currentLogo
    } else {
      console.log('\n⚠️  Unknown logo format:', currentLogo)
    }
    
    console.log('\n📸 Final Logo URL:')
    console.log(`   ${fixedLogoUrl}`)
    
    console.log('\n🧪 Testing URL accessibility...')
    console.log(`   URL: ${fixedLogoUrl}`)
    console.log(`   This URL should be accessible from browser`)
    console.log(`   Test it: Open this URL in browser to verify`)
    
    // Verify update
    const updated = await prisma.settings.findFirst()
    console.log('\n✅ Verified in database:')
    console.log(`   siteLogo: ${updated?.siteLogo}`)
    
    console.log('\n💡 Next Steps:')
    console.log('   1. Test logo URL in browser')
    console.log('   2. Send test email from /admin/branded-templates')
    console.log('   3. Check if logo appears in email')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixLogoUrl()
