const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMembershipSystem() {
  try {
    console.log('🔍 AUDIT SISTEM MEMBERSHIP\n')
    
    // 1. Database Check
    console.log('📊 DATABASE STATUS:')
    const memberships = await prisma.membership.count()
    const userMemberships = await prisma.userMembership.count()
    const membershipGroups = await prisma.membershipGroup.count()
    const membershipCourses = await prisma.membershipCourse.count()
    const membershipProducts = await prisma.membershipProduct.count()
    
    console.log(`   ✅ Membership Plans: ${memberships}`)
    console.log(`   ✅ User Memberships: ${userMemberships}`)
    console.log(`   ✅ Membership-Group Relations: ${membershipGroups}`)
    console.log(`   ✅ Membership-Course Relations: ${membershipCourses}`)
    console.log(`   ✅ Membership-Product Relations: ${membershipProducts}\n`)
    
    // 2. Membership Plans Detail
    if (memberships > 0) {
      console.log('📦 MEMBERSHIP PLANS:')
      const plans = await prisma.membership.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          duration: true,
          price: true,
          isActive: true,
          _count: {
            select: {
              userMemberships: true,
              membershipGroups: true,
              membershipCourses: true,
              membershipProducts: true
            }
          }
        }
      })
      
      plans.forEach(plan => {
        console.log(`   📌 ${plan.name} (${plan.slug})`)
        console.log(`      Duration: ${plan.duration}`)
        console.log(`      Price: Rp ${plan.price}`)
        console.log(`      Status: ${plan.isActive ? 'Active' : 'Inactive'}`)
        console.log(`      Users: ${plan._count.userMemberships}`)
        console.log(`      Groups: ${plan._count.membershipGroups}`)
        console.log(`      Courses: ${plan._count.membershipCourses}`)
        console.log(`      Products: ${plan._count.membershipProducts}`)
      })
      console.log('')
    }
    
    // 3. Active User Memberships
    if (userMemberships > 0) {
      console.log('👥 ACTIVE USER MEMBERSHIPS:')
      const activeUsers = await prisma.userMembership.findMany({
        where: { status: 'ACTIVE' },
        include: {
          user: { select: { name: true, email: true } },
          membership: { select: { name: true, duration: true } }
        },
        take: 10
      })
      
      activeUsers.forEach(um => {
        console.log(`   👤 ${um.user.name} (${um.user.email})`)
        console.log(`      Plan: ${um.membership.name}`)
        console.log(`      Duration: ${um.membership.duration}`)
        console.log(`      Expires: ${um.endDate.toLocaleDateString()}`)
      })
      console.log('')
    }
    
    console.log('✅ Audit selesai!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkMembershipSystem()
