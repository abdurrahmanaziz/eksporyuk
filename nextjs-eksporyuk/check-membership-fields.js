const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkFields() {
  console.log('🔍 CHECKING MEMBERSHIP DATA AND FIELDS\n')
  
  const memberships = await prisma.membership.findMany()
  
  console.log(`Found ${memberships.length} memberships\n`)
  
  if (memberships.length === 0) {
    console.log('❌ NO MEMBERSHIPS FOUND IN DATABASE!')
    console.log('\nCreating default memberships...\n')
    
    // Create default memberships
    const defaults = [
      {
        name: '1 Bulan',
        duration: 'ONE_MONTH',
        price: 99000,
        discount: 34,
        features: ['Akses semua kursus', 'Grup VIP', 'Sertifikat', 'Event gratis'],
        isActive: true
      },
      {
        name: '6 Bulan',
        duration: 'SIX_MONTHS',
        price: 449000,
        discount: 46,
        features: ['Akses semua kursus', 'Grup VIP', 'Sertifikat', 'Event gratis', 'Konsultasi 1-on-1'],
        isPopular: true,
        isActive: true
      },
      {
        name: '12 Bulan',
        duration: 'TWELVE_MONTHS',
        price: 799000,
        discount: 65,
        features: ['Akses semua kursus', 'Grup VIP', 'Sertifikat', 'Event gratis', 'Konsultasi unlimited', 'Bonus ebook'],
        isMostPopular: true,
        isActive: true
      }
    ]
    
    for (const data of defaults) {
      const created = await prisma.membership.create({ data })
      console.log(`✅ Created: ${created.name} - Rp ${created.price.toLocaleString('id-ID')}`)
    }
    
    console.log('\n✅ Default memberships created!')
  } else {
    memberships.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}`)
      console.log(`   ID: ${m.id}`)
      console.log(`   Duration: ${m.duration}`)
      console.log(`   Price: Rp ${m.price.toLocaleString('id-ID')}`)
      console.log(`   Discount: ${m.discount || 0}%`)
      console.log(`   Features: ${JSON.stringify(m.features)}`)
      console.log(`   Is Popular: ${m.isPopular || false}`)
      console.log(`   Is Most Popular: ${m.isMostPopular || false}`)
      console.log(`   Is Active: ${m.isActive}`)
      console.log('')
    })
  }
  
  await prisma.$disconnect()
}

checkFields().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})
