const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const templates = [
  {
    name: 'Welcome Email',
    slug: 'welcome-email',
    description: 'Email selamat datang untuk user baru yang mendaftar',
    type: 'EMAIL',
    subject: 'Selamat Datang di EksporYuk!',
    content: '<div>Welcome content...</div>',
    isActive: true,
    category: 'ONBOARDING'
  },
  {
    name: 'Payment Success',
    slug: 'payment-success',
    description: 'Konfirmasi pembayaran berhasil',
    type: 'EMAIL',
    subject: '✅ Pembayaran Berhasil - EksporYuk',
    content: '<div>Payment success content...</div>',
    isActive: true,
    category: 'TRANSACTION'
  }
]

async function main() {
  console.log('\n🚀 Creating templates...\n')
  
  for (const tmpl of templates) {
    const existing = await prisma.brandedTemplate.findUnique({ where: { slug: tmpl.slug } })
    if (existing) {
      console.log(`⏭️  Skip: ${tmpl.name}`)
      continue
    }
    await prisma.brandedTemplate.create({ data: tmpl })
    console.log(`✅ Created: ${tmpl.name}`)
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
