const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCoupons() {
  console.log('🔍 Checking couponCode in affiliate links...\n')

  const links = await prisma.affiliateLink.findMany({
    where: {
      isActive: true,
      isArchived: false,
    },
    select: {
      id: true,
      code: true,
      shortCode: true,
      couponCode: true,
      membership: {
        select: {
          name: true,
          slug: true,
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`📦 Found ${links.length} active links\n`)

  links.forEach((link, idx) => {
    console.log(`${idx + 1}. ${link.membership?.name || 'No membership'}`)
    console.log(`   Code: ${link.code}`)
    console.log(`   Short: ${link.shortCode || 'No short code'}`)
    console.log(`   Coupon: ${link.couponCode || '❌ NO COUPON'}`)
    console.log(`   Slug: ${link.membership?.slug || 'No slug'}`)
    console.log('')
  })

  await prisma.$disconnect()
}

checkCoupons().catch(console.error)
