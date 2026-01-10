import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Membuat user affiliate...\n')

  // Hash password
  const password = 'affiliate123'
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate unique affiliate code
  const affiliateCode = 'AFF' + Math.random().toString(36).substring(2, 8).toUpperCase()
  const shortLinkUsername = 'demoaffiliate'

  // Create affiliate user
  const affiliateUser = await prisma.user.upsert({
    where: { email: 'affiliate@eksporyuk.com' },
    update: {
      name: 'Demo Affiliate',
      password: hashedPassword,
      role: 'AFFILIATE',
      phone: '081234567890',
      whatsapp: '081234567890',
      emailVerified: true,
      isActive: true,
    },
    create: {
      email: 'affiliate@eksporyuk.com',
      username: 'demoaffiliate',
      name: 'Demo Affiliate',
      password: hashedPassword,
      role: 'AFFILIATE',
      phone: '081234567890',
      whatsapp: '081234567890',
      emailVerified: true,
      isActive: true,
    },
  })

  console.log('✅ User affiliate berhasil dibuat!\n')
  console.log('📧 Email    : affiliate@eksporyuk.com')
  console.log('🔑 Password : affiliate123')
  console.log('👤 Name     :', affiliateUser.name)
  console.log('🎭 Role     :', affiliateUser.role)
  console.log('🆔 ID       :', affiliateUser.id)

  // Create affiliate profile if not exists
  const existingProfile = await prisma.affiliateProfile.findUnique({
    where: { userId: affiliateUser.id }
  })

  if (!existingProfile) {
    const affiliateProfile = await prisma.affiliateProfile.create({
      data: {
        userId: affiliateUser.id,
        affiliateCode: affiliateCode,
        shortLink: `https://link.eksporyuk.com/${shortLinkUsername}`,
        shortLinkUsername: shortLinkUsername,
        commissionRate: 10,
        tier: 1,
        totalEarnings: 0,
        totalClicks: 0,
        totalConversions: 0,
        isActive: true,
        approvedAt: new Date(),
      }
    })
    console.log('\n✅ Profil affiliate berhasil dibuat!')
    console.log('🔗 Affiliate Code:', affiliateProfile.affiliateCode)
    console.log('🌐 Short Link:', affiliateProfile.shortLink)
    console.log('💰 Commission Rate:', Number(affiliateProfile.commissionRate), '%')
  } else {
    console.log('\n✅ Profil affiliate sudah ada!')
    console.log('🔗 Affiliate Code:', existingProfile.affiliateCode)
    console.log('🌐 Short Link:', existingProfile.shortLink)
  }

  console.log('\n🎉 Selesai! User affiliate siap digunakan.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
