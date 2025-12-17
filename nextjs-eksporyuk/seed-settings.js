const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedSettings() {
  console.log('🌱 Seeding Settings for Branded Templates...\n')
  
  const existing = await prisma.settings.findFirst()
  
  const settingsData = {
    siteTitle: 'EksporYuk',
    siteLogo: 'https://eksporyuk.com/logo.png',
    brandName: 'EksporYuk',
    emailFooterCompany: 'PT Ekspor Yuk Indonesia',
    emailFooterAddress: 'Jl. Raya Ekspor No. 123, Jakarta Selatan 12345, Indonesia',
    emailFooterPhone: '+62 812-3456-7890',
    emailFooterEmail: 'support@eksporyuk.com',
    emailFooterWebsiteUrl: 'https://eksporyuk.com',
    emailFooterInstagramUrl: 'https://instagram.com/eksporyuk',
    emailFooterFacebookUrl: 'https://facebook.com/eksporyuk',
    emailFooterLinkedinUrl: 'https://linkedin.com/company/eksporyuk',
    emailFooterText: 'Platform pembelajaran ekspor terpercaya untuk UMKM Indonesia',
    emailFooterCopyrightText: '© 2025 EksporYuk. All rights reserved.',
  }
  
  if (existing) {
    await prisma.settings.update({
      where: { id: existing.id },
      data: settingsData
    })
    console.log('✅ Settings updated successfully!')
  } else {
    await prisma.settings.create({
      data: settingsData
    })
    console.log('✅ Settings created successfully!')
  }
  
  console.log('\n📋 Settings Data:')
  console.log(`   Company: ${settingsData.emailFooterCompany}`)
  console.log(`   Address: ${settingsData.emailFooterAddress}`)
  console.log(`   Phone: ${settingsData.emailFooterPhone}`)
  console.log(`   Email: ${settingsData.emailFooterEmail}`)
  console.log(`   Logo: ${settingsData.siteLogo}`)
  console.log('\n✨ Templates sekarang akan menggunakan settings ini untuk logo & footer!\n')
  
  await prisma.$disconnect()
}

seedSettings().catch(console.error)
