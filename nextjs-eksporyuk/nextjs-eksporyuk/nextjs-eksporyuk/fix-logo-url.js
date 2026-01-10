const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixLogoPath() {
  try {
    console.log('🔍 Checking and fixing logo path...\n')
    
    // 1. Get current settings
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.log('❌ No settings found!')
      return
    }
    
    console.log('📋 Current Logo Path:')
    console.log(`  siteLogo: ${settings.siteLogo}`)
    
    // 2. Check if logo is relative path (needs full URL)
    const currentLogo = settings.siteLogo || ''
    let fixedLogoUrl = currentLogo
    
    if (currentLogo && currentLogo.startsWith('/uploads/')) {
      // Convert relative path to full URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      fixedLogoUrl = `${appUrl}${currentLogo}`
      
      console.log('\n🔧 Converting relative path to full URL:')
      console.log(`  From: ${currentLogo}`)
      console.log(`  To: ${fixedLogoUrl}`)
      
      // Update database
      await prisma.settings.update({
        where: { id: settings.id },
        data: { siteLogo: fixedLogoUrl }
      })
      
      console.log('\n✅ Logo path updated in database!')
    } else if (currentLogo && (currentLogo.startsWith('http://') || currentLogo.startsWith('https://'))) {
      console.log('\n✅ Logo already has full URL - no update needed')
      fixedLogoUrl = currentLogo
    } else {
      console.log('\n⚠️  Logo path format not recognized:', currentLogo)
      console.log('   Expected: /uploads/... or http(s)://...')
    }
    
    // 3. Verify final logo URL
    console.log('\n📸 Final Logo URL:')
    console.log(`  ${fixedLogoUrl}`)
    
    // 4. Test getBrandConfig
    console.log('\n🧪 Testing getBrandConfig result:')
    const updatedSettings = await prisma.settings.findFirst()
    console.log(`  siteLogo from DB: ${updatedSettings?.siteLogo}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixLogoPath()
