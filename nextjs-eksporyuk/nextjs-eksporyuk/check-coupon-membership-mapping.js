const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCouponMembershipMapping() {
  console.log('🔍 Checking Coupon-Membership Mapping...\n')
  
  try {
    // Get all memberships
    const memberships = await prisma.membership.findMany({
      select: {
        id: true,
        name: true,
        duration: true,
        slug: true
      },
      orderBy: { price: 'desc' }
    })
    
    console.log(`📦 Found ${memberships.length} memberships:\n`)
    memberships.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name} (${m.duration})`)
      console.log(`   ID: ${m.id}`)
      console.log(`   Slug: ${m.slug}`)
      console.log()
    })
    
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
        productIds: true,
        courseIds: true
      }
    })
    
    console.log(`\n🎫 Found ${coupons.length} affiliate coupons:\n`)
    
    coupons.forEach((c, i) => {
      console.log(`${i + 1}. ${c.code}`)
      console.log(`   Membership IDs: ${c.membershipIds?.length ? c.membershipIds.join(', ') : 'NONE (applies to all)'}`)
      console.log(`   Product IDs: ${c.productIds?.length ? c.productIds.join(', ') : 'NONE'}`)
      console.log(`   Course IDs: ${c.courseIds?.length ? c.courseIds.join(', ') : 'NONE'}`)
      console.log()
      
      // Check which memberships this coupon applies to
      if (c.membershipIds && c.membershipIds.length > 0) {
        console.log('   Applies to:')
        c.membershipIds.forEach(mid => {
          const m = memberships.find(mem => mem.id === mid)
          if (m) {
            console.log(`   ✅ ${m.name} (${m.duration})`)
          } else {
            console.log(`   ❌ Unknown membership ID: ${mid}`)
          }
        })
        console.log()
      } else {
        console.log('   ✅ Applies to ALL memberships\n')
      }
    })
    
    // Check for 6-month specific issue
    const sixMonth = memberships.find(m => m.duration === 'SIX_MONTHS')
    if (sixMonth) {
      console.log(`\n🔍 Checking 6-Month Membership (${sixMonth.name}):`)
      console.log(`   ID: ${sixMonth.id}`)
      
      const applicableCoupons = coupons.filter(c => 
        !c.membershipIds || c.membershipIds.length === 0 || c.membershipIds.includes(sixMonth.id)
      )
      
      console.log(`   Applicable Coupons: ${applicableCoupons.length}`)
      applicableCoupons.forEach(c => {
        console.log(`   ✅ ${c.code}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCouponMembershipMapping()
