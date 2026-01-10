const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateMemberships() {
  console.log('📝 UPDATING MEMBERSHIP DATA\n')
  
  // Update 1 Bulan
  const m1 = await prisma.membership.update({
    where: { id: 'cmi5cu62p0000umk8tfswv6gv' },
    data: {
      discount: 34,
      originalPrice: 150000,
    }
  })
  console.log(`✅ Updated ${m1.name}: discount=${m1.discount}%, originalPrice=Rp ${m1.originalPrice?.toLocaleString('id-ID')}`)
  
  // Update 6 Bulan
  const m2 = await prisma.membership.update({
    where: { id: 'cmi5cu6310001umk8ihmh03zn' },
    data: {
      discount: 46,
      originalPrice: 900000,
      isPopular: true,
    }
  })
  console.log(`✅ Updated ${m2.name}: discount=${m2.discount}%, originalPrice=Rp ${m2.originalPrice?.toLocaleString('id-ID')}, isPopular=${m2.isPopular}`)
  
  // Update 12 Bulan
  const m3 = await prisma.membership.update({
    where: { id: 'cmi5cu6360002umk8m6re0rub' },
    data: {
      discount: 65,
      originalPrice: 1800000,
      isMostPopular: true,
    }
  })
  console.log(`✅ Updated ${m3.name}: discount=${m3.discount}%, originalPrice=Rp ${m3.originalPrice?.toLocaleString('id-ID')}, isMostPopular=${m3.isMostPopular}`)
  
  console.log('\n✅ All memberships updated!')
  
  await prisma.$disconnect()
}

updateMemberships().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
