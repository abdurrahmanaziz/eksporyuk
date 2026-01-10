const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAffiliateCoupons() {
  console.log('\n=== CEK SEMUA USER ===')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  })
  
  console.log(`Total users: ${users.length}`)
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) - Role: ${u.role} - ID: ${u.id}`)
  })
  
  console.log('\n=== CEK KUPON AFFILIATE ===')
  const affiliateCoupons = await prisma.coupon.findMany({
    where: {
      createdBy: { not: null }, // Bukan admin (ada createdBy)
    },
    select: {
      id: true,
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      isActive: true,
      createdBy: true,
      creator: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  })
  
  console.log(`Ditemukan ${affiliateCoupons.length} kupon affiliate:`)
  if (affiliateCoupons.length === 0) {
    console.log('  Belum ada kupon affiliate - perlu buat dulu di halaman /affiliate/coupons')
  } else {
    affiliateCoupons.forEach(c => {
      console.log(`- ${c.code} (${c.discountType}: ${c.discountValue}) - By: ${c.creator?.name || 'Unknown'}`)
    })
  }
  
  await prisma.$disconnect()
}

checkAffiliateCoupons().catch(console.error)
