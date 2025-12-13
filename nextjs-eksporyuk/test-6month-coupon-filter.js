const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCouponFilter() {
  console.log('🧪 Testing Coupon Filter for 6-Month Membership...\n')
  
  try {
    // Get 6-month membership
    const sixMonth = await prisma.membership.findFirst({
      where: { duration: 'SIX_MONTHS', isActive: true }
    })
    
    if (!sixMonth) {
      console.log('❌ 6-Month membership not found')
      return
    }
    
    console.log(`📦 6-Month Membership:`)
    console.log(`   Name: ${sixMonth.name}`)
    console.log(`   ID: ${sixMonth.id}`)
    console.log(`   Slug: ${sixMonth.slug}`)
    console.log()
    
    // Get all affiliate coupons
    const coupons = await prisma.coupon.findMany({
      where: {
        isAffiliateEnabled: true,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        membershipIds: true,
        discountType: true,
        discountValue: true
      }
    })
    
    console.log(`🎫 Total Affiliate Coupons: ${coupons.length}\n`)
    
    // Filter coupons that apply to 6-month membership
    const applicableCoupons = coupons.filter(coupon => {
      const ids = coupon.membershipIds || []
      // Apply same logic as frontend: empty array OR contains the specific ID
      return ids.length === 0 || ids.includes(sixMonth.id)
    })
    
    console.log(`✅ Coupons Applicable to 6-Month Membership: ${applicableCoupons.length}\n`)
    
    if (applicableCoupons.length === 0) {
      console.log('❌ NO COUPONS FOUND! This is the issue.')
      console.log('\nDEBUG INFO:')
      coupons.forEach(c => {
        console.log(`\nCoupon: ${c.code}`)
        console.log(`  membershipIds: ${c.membershipIds ? c.membershipIds.join(', ') : 'null/empty'}`)
        console.log(`  Includes 6-month ID? ${c.membershipIds ? c.membershipIds.includes(sixMonth.id) : false}`)
      })
    } else {
      applicableCoupons.forEach(c => {
        console.log(`✅ ${c.code}`)
        console.log(`   Type: ${c.discountType}`)
        console.log(`   Value: ${c.discountValue}`)
        console.log(`   Membership IDs: ${c.membershipIds ? c.membershipIds.length : 0}`)
        console.log()
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCouponFilter()
