const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLogoSettings() {
  try {
    console.log('🔍 Checking logo settings...\n')
    
    // 1. Get Settings record
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.log('❌ No settings record found!')
      return
    }
    
    console.log('📋 Logo Related Settings:')
    console.log(`  siteLogo: ${settings.siteLogo || '(not set)'}`)
    console.log(`  logoAffiliate: ${settings.logoAffiliate || '(not set)'}`)
    console.log(`  brandName: ${settings.brandName || '(not set)'}`)
    console.log(`  siteTitle: ${settings.siteTitle || '(not set)'}`)
    console.log(`  emailFooterCompany: ${settings.emailFooterCompany || '(not set)'}`)
    console.log(`  footerText: ${settings.footerText || '(not set)'}`)
    console.log(`  primaryColor: ${settings.primaryColor || '(not set)'}`)
    
    // 2. Check branded templates
    const templates = await prisma.brandedTemplate.findMany({
      where: { type: 'TRANSACTION' },
      select: {
        id: true,
        name: true,
        customBranding: true
      }
    })
    
    console.log('\n📧 Transaction Templates:')
    templates.forEach(t => {
      console.log(`\n  - ${t.name}:`)
      console.log(`    customBranding:`, JSON.stringify(t.customBranding, null, 2))
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkLogoSettings()
