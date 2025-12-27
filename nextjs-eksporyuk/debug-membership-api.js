const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMembershipQuery() {
  try {
    console.log('Testing user query...')
    
    // Test user query first with the failing ID
    const userId = 'cmjn3bkdj00045tpny75hiwn4'
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })
    
    console.log('User found:', user)
    
    if (!user) {
      console.log('User not found with that ID')
      return
    }
    
    console.log('Testing user memberships query...')
    
    // Test user memberships
    const userMemberships = await prisma.userMembership.findMany({
      where: { userId: user.id },
      take: 5
    })
    
    console.log('User memberships found:', userMemberships.length)
    console.log('Sample membership:', userMemberships[0] || 'No memberships')
    
    if (userMemberships.length > 0) {
      // Test membership details
      const membershipIds = userMemberships.map(um => um.membershipId)
      console.log('Membership IDs:', membershipIds)
      
      const memberships = await prisma.membership.findMany({
        where: { id: { in: membershipIds } },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          isActive: true
        }
      })
      
      console.log('Membership details found:', memberships.length)
      console.log('Sample membership detail:', memberships[0] || 'No membership details')
      
      // Test if there are missing memberships
      const foundIds = memberships.map(m => m.id)
      const missingIds = membershipIds.filter(id => !foundIds.includes(id))
      if (missingIds.length > 0) {
        console.log('❌ Missing membership details for IDs:', missingIds)
      }
    }
    
    console.log('Test completed successfully!')
    
  } catch (error) {
    console.error('Test error:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
  } finally {
    await prisma.$disconnect()
  }
}

testMembershipQuery()