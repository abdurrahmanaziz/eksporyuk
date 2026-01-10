const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showShortLinks() {
  console.log('🔗 SHORT AFFILIATE LINKS\n')
  console.log('='.repeat(80))
  
  const links = await prisma.affiliateLink.findMany({
    where: {
      isActive: true,
      shortCode: { not: null }
    },
    include: {
      user: { select: { name: true, email: true } },
      membership: { select: { name: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
  
  console.log(`\n📦 ${links.length} ACTIVE SHORT LINKS:\n`)
  
  links.forEach((link, i) => {
    console.log(`${i + 1}. ${link.user?.name || 'Unknown'}`)
    console.log(`   Target: ${link.membership?.name || 'No target'}`)
    console.log(`   Coupon: ${link.couponCode}`)
    console.log(`   `)
    console.log(`   🔗 SEBELUM (panjang):`)
    console.log(`      http://localhost:3000/aff/${link.userId}/${link.code}/`)
    console.log(`   `)
    console.log(`   ✨ SEKARANG (pendek):`)
    console.log(`      http://localhost:3000/go/${link.shortCode}`)
    console.log(`   `)
    console.log(`   🎯 Checkout langsung:`)
    console.log(`      http://localhost:3000/go/${link.shortCode}/checkout`)
    console.log(`   `)
    console.log(`   📝 Coupon otomatis: ${link.couponCode}`)
    console.log('')
  })
  
  console.log('='.repeat(80))
  console.log('\n📊 PERBANDINGAN LENGTH:')
  const oldLink = `http://localhost:3000/aff/cmi59vwe90000umzk2ax9foxx/TEST5ENIFJ/checkout`
  const newLink = `http://localhost:3000/go/3BEC0Z/checkout`
  console.log(`❌ Old: ${oldLink.length} karakter`)
  console.log(`   ${oldLink}`)
  console.log(``)
  console.log(`✅ New: ${newLink.length} karakter`)
  console.log(`   ${newLink}`)
  console.log(``)
  console.log(`🎉 Hemat ${oldLink.length - newLink.length} karakter (${Math.round((1 - newLink.length/oldLink.length) * 100)}% lebih pendek!)`)
  console.log(``)
  console.log(`✨ BONUS: Coupon code otomatis apply!`)
  
  await prisma.$disconnect()
}

showShortLinks().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
