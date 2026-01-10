const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateLifetimeBenefits() {
  try {
    const lifetime = await prisma.membership.findUnique({
      where: { slug: 'paket-lifetime' },
      select: { id: true, name: true, features: true }
    })
    
    if (!lifetime) {
      console.log('❌ Paket lifetime tidak ditemukan')
      return
    }
    
    console.log('\n📦 Current Paket Lifetime:')
    console.log('Features:', JSON.stringify(lifetime.features, null, 2))
    
    // Benefits untuk paket lifetime
    const lifetimeBenefits = [
      "✅ Akses SELAMANYA ke semua kursus",
      "✅ Semua fitur paket 6 bulan",
      "✅ Konsultasi 1-on-1 UNLIMITED",
      "✅ Database buyer UNLIMITED",
      "✅ Priority support 24/7",
      "✅ Free update konten selamanya",
      "✅ Sertifikat verified",
      "✅ Akses komunitas VIP lifetime"
    ]
    
    // Update features with benefits
    const currentFeatures = Array.isArray(lifetime.features) ? lifetime.features : []
    
    if (currentFeatures.length > 0 && typeof currentFeatures[0] === 'object') {
      // Update benefits in price object
      currentFeatures[0].benefits = lifetimeBenefits
      
      const updated = await prisma.membership.update({
        where: { slug: 'paket-lifetime' },
        data: {
          features: currentFeatures
        }
      })
      
      console.log('\n✅ Benefits updated successfully!')
      console.log('\nNew features:', JSON.stringify(updated.features, null, 2))
    } else {
      console.log('\n❌ Features structure is not as expected')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateLifetimeBenefits()
