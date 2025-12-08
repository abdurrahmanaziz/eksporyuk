const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCoupons() {
  console.log('\n=== CEK KUPON ADMIN (isAffiliateEnabled: true) ===')
  const adminCoupons = await prisma.coupon.findMany({
    where: {
      createdBy: null,
      isAffiliateEnabled: true,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      isAffiliateEnabled: true,
      isActive: true,
    }
  })
  
  console.log(`Ditemukan ${adminCoupons.length} kupon admin:`)
  adminCoupons.forEach(c => {
    console.log(`- ${c.code} (${c.discountType}: ${c.discountValue}) - ${c.description || 'No description'}`)
  })
  
  console.log('\n=== CEK SEMUA KUPON ADMIN ===')
  const allAdminCoupons = await prisma.coupon.findMany({
    where: {
      createdBy: null,
    },
    select: {
      id: true,
      code: true,
      isAffiliateEnabled: true,
      isActive: true,
    }
  })
  
  console.log(`Total kupon admin: ${allAdminCoupons.length}`)
  allAdminCoupons.forEach(c => {
    console.log(`- ${c.code} (isAffiliateEnabled: ${c.isAffiliateEnabled}, isActive: ${c.isActive})`)
  })
  
  await prisma.$disconnect()
}

checkCoupons().catch(console.error)
