const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMemberships() {
  try {
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        duration: true,
      }
    })
    
    console.log('\n=== ACTIVE MEMBERSHIPS ===\n')
    
    if (memberships.length === 0) {
      console.log('❌ Tidak ada membership aktif di database')
      console.log('\nSilakan buat membership baru di: http://localhost:3000/admin/membership-plans')
    } else {
      console.log(`✅ Ditemukan ${memberships.length} membership aktif:\n`)
      
      memberships.forEach((m, index) => {
        console.log(`${index + 1}. ${m.name}`)
        console.log(`   Slug: ${m.slug || '(belum ada slug)'}`)
        console.log(`   Duration: ${m.duration}`)
        if (m.slug) {
          console.log(`   URL: http://localhost:3000/checkout/${m.slug}`)
        }
        console.log('')
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMemberships()
