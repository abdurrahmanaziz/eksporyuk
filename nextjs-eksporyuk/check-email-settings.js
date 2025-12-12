const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSettings() {
  console.log('\n🔍 Checking Email Settings...\n')
  
  const settings = await prisma.settings.findFirst()
  
  if (!settings) {
    console.log('❌ No settings found - creating default settings...')
    
    // Create default settings
    const defaultSettings = await prisma.settings.create({
      data: {
        siteName: 'EksporYuk',
        siteLogo: 'https://app.eksporyuk.com/logo-eksporyuk.png',
        emailFooterCompany: 'PT Ekspor Yuk Indonesia',
        emailFooterAddress: 'Jakarta, Indonesia',
        emailFooterPhone: '+62 812-3456-7890',
        emailFooterEmail: 'admin@eksporyuk.com',
        emailFooterWebsiteUrl: 'https://app.eksporyuk.com',
        emailFooterInstagramUrl: 'https://instagram.com/eksporyuk',
        emailFooterFacebookUrl: 'https://facebook.com/eksporyuk',
        emailFooterCopyrightText: '© 2025 EksporYuk. All rights reserved.',
        emailFooterText: 'Belajar ekspor dengan mentor berpengalaman'
      }
    })
    
    console.log('✅ Default settings created')
    console.log(defaultSettings)
    return
  }
  
  console.log('📧 Email Settings:')
  console.log('  Logo:', settings.siteLogo || '❌ Not set')
  console.log('  Company:', settings.emailFooterCompany || '❌ Not set')
  console.log('  Address:', settings.emailFooterAddress || '❌ Not set')
  console.log('  Phone:', settings.emailFooterPhone || '❌ Not set')
  console.log('  Email:', settings.emailFooterEmail || '❌ Not set')
  console.log('  Website:', settings.emailFooterWebsiteUrl || '❌ Not set')
  console.log('  Instagram:', settings.emailFooterInstagramUrl || '❌ Not set')
  console.log('  Facebook:', settings.emailFooterFacebookUrl || '❌ Not set')
  console.log('  LinkedIn:', settings.emailFooterLinkedinUrl || '❌ Not set')
  console.log('  Footer Text:', settings.emailFooterText || '❌ Not set')
  console.log('  Copyright:', settings.emailFooterCopyrightText || '❌ Not set')
  
  await prisma.$disconnect()
}

checkSettings().catch(console.error)
