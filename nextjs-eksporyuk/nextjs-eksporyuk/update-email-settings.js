const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateSettings() {
  console.log('\n🔄 Updating Email Settings...\n')
  
  const settings = await prisma.settings.findFirst()
  
  if (!settings) {
    console.log('❌ No settings found')
    return
  }
  
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: {
      emailFooterCompany: 'PT Ekspor Yuk Indonesia',
      emailFooterPhone: '+62 812-3456-7890',
      emailFooterEmail: 'admin@eksporyuk.com',
      emailFooterInstagramUrl: 'https://instagram.com/eksporyuk',
      emailFooterFacebookUrl: 'https://facebook.com/eksporyuk',
      emailFooterLinkedinUrl: 'https://linkedin.com/company/eksporyuk',
      emailFooterText: 'Platform pembelajaran ekspor terpercaya untuk UMKM Indonesia'
    }
  })
  
  console.log('✅ Settings updated successfully!')
  console.log('\nUpdated fields:')
  console.log('  Company:', updated.emailFooterCompany)
  console.log('  Phone:', updated.emailFooterPhone)
  console.log('  Email:', updated.emailFooterEmail)
  console.log('  Instagram:', updated.emailFooterInstagramUrl)
  console.log('  Facebook:', updated.emailFooterFacebookUrl)
  console.log('  LinkedIn:', updated.emailFooterLinkedinUrl)
  console.log('  Footer Text:', updated.emailFooterText)
  
  await prisma.$disconnect()
}

updateSettings().catch(console.error)
