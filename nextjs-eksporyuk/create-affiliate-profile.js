const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createAffiliateProfile() {
  try {
    // Get user by email - ganti dengan email yang sedang login
    const email = 'affiliate@eksporyuk.com' // GANTI dengan email Anda
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { affiliateProfile: true }
    })

    if (!user) {
      console.error('❌ User tidak ditemukan dengan email:', email)
      console.log('\n💡 Cari email user Anda dengan:')
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, username: true }
      })
      console.table(users)
      return
    }

    if (user.affiliateProfile) {
      console.log('✅ User sudah punya AffiliateProfile!')
      console.log('Affiliate Code:', user.affiliateProfile.affiliateCode)
      console.log('Short Link Username:', user.affiliateProfile.shortLinkUsername)
      return
    }

    console.log('📝 Membuat AffiliateProfile untuk:', user.email)

    // Generate unique affiliate code
    const affiliateCode = `AFF${user.username || user.id.substring(0, 8)}`.toUpperCase()
    
    // Generate short link username
    const shortLinkUsername = user.username || user.email.split('@')[0]

    // Create affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.create({
      data: {
        userId: user.id,
        affiliateCode,
        shortLink: `${shortLinkUsername}`,
        shortLinkUsername,
        tier: 1,
        commissionRate: 10,
        isActive: true,
        applicationStatus: 'APPROVED',
        approvedAt: new Date()
      }
    })

    console.log('✅ AffiliateProfile berhasil dibuat!')
    console.log('Affiliate Code:', affiliateProfile.affiliateCode)
    console.log('Short Link Username:', affiliateProfile.shortLinkUsername)
    console.log('\n🎉 Sekarang user bisa menggunakan Bio Page!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    
    if (error.code === 'P2002') {
      console.error('\n⚠️ Username atau affiliate code sudah digunakan!')
      console.error('Field yang conflict:', error.meta?.target)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAffiliateProfile()
