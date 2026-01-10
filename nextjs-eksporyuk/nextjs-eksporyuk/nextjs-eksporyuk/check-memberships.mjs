import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkMembershipPlans() {
  console.log('🔍 Checking Active Membership Plans...\n')
  
  try {
    const memberships = await prisma.membership.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        isActive: true,
        description: true
      },
      orderBy: {
        price: 'desc'
      }
    })
    
    console.log(`✅ Found ${memberships.length} active membership plans:\n`)
    
    memberships.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}`)
      console.log(`   ID: ${m.id}`)
      console.log(`   Slug: ${m.slug}`)
      console.log(`   Price: Rp ${m.price.toLocaleString('id-ID')}`)
      console.log(`   Active: ${m.isActive ? '✅' : '❌'}`)
      console.log(`   Checkout URL: https://eksporyuk.com/checkout/${m.slug}`)
      console.log('')
    })
    
    if (memberships.length === 0) {
      console.log('⚠️  No active membership plans found!')
      console.log('   Create memberships first before testing checkout.')
    } else {
      console.log('🎯 Ready for testing!')
      console.log(`   Pick any URL above and test the checkout flow.`)
      console.log(`   Expected: Redirect to https://checkout.xendit.co/web/...`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMembershipPlans()
