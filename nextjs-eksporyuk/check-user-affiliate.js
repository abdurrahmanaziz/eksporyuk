const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      include: { affiliateProfile: true }
    })
    
    if (!user) {
      console.log('❌ User tidak ditemukan')
      return
    }
    
    console.log('✅ User ditemukan:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Affiliate:', user.affiliateProfile ? 'YES' : 'NO')
    console.log('   ID:', user.id)
    
    // Get available templates
    const templates = await prisma.coupon.findMany({
      where: { 
        basedOnCouponId: null, 
        isAffiliateEnabled: true, 
        isActive: true 
      }
    })
    
    console.log('\n✅ Available templates:')
    templates.forEach(t => {
      console.log(`   - ${t.code}: ${t.discountValue}${t.discountType === 'PERCENTAGE' ? '%' : ' IDR'} (ID: ${t.id})`)
    })
    
    // Check templates with KARDUS keyword
    const kardusTemplates = await prisma.coupon.findMany({
      where: { 
        basedOnCouponId: null,
        isAffiliateEnabled: true,
        isActive: true,
        code: {
          contains: 'KARDUS',
          mode: 'insensitive'
        }
      }
    })
    
    if (kardusTemplates.length > 0) {
      console.log('\n✅ KARDUS Templates found:')
      kardusTemplates.forEach(t => {
        console.log(`   - ${t.code}: ${t.discountValue}${t.discountType === 'PERCENTAGE' ? '%' : ' IDR'}`)
      })
    } else {
      console.log('\n❌ No KARDUS template found. Available templates:')
      templates.slice(0, 5).forEach(t => {
        console.log(`   - ${t.code}`)
      })
    }
    
  } finally {
    await prisma.$disconnect()
  }
}

test()
