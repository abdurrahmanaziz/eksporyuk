const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCouponMembershipMapping() {
  console.log('🔧 Fixing Coupon-Membership Mapping...\n')
  
  try {
    // Get all memberships
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        duration: true
      },
      orderBy: { price: 'desc' }
    })
    
    console.log(`📦 Found ${memberships.length} active memberships`)
    
    // Get the affiliate coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: 'EKSPORYUK',
        isAffiliateEnabled: true
      }
    })
    
    if (!coupon) {
      console.log('❌ EKSPORYUK coupon not found')
      return
    }
    
    console.log(`\n🎫 Found coupon: ${coupon.code}`)
    console.log(`   Current membershipIds: ${coupon.membershipIds?.join(', ') || 'NONE'}`)
    
    // Get all active membership IDs
    const allMembershipIds = memberships.map(m => m.id)
    
    console.log(`\n📝 Updating coupon to include all active memberships:`)
    memberships.forEach(m => {
      console.log(`   - ${m.name} (${m.duration}): ${m.id}`)
    })
    
    // Update the coupon
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        membershipIds: allMembershipIds
      }
    })
    
    console.log(`\n✅ Coupon updated successfully!`)
    
    // Verify
    const updated = await prisma.coupon.findUnique({
      where: { id: coupon.id }
    })
    
    console.log(`\n✅ Verification:`)
    console.log(`   Coupon: ${updated.code}`)
    console.log(`   Membership IDs: ${updated.membershipIds?.length} included`)
    updated.membershipIds?.forEach(mid => {
      const m = memberships.find(mem => mem.id === mid)
      if (m) {
        console.log(`   ✅ ${m.name} (${m.duration})`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCouponMembershipMapping()
