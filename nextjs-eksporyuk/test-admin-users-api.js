const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAdminUsersAPI() {
  try {
    console.log('🔍 Testing Admin Users API logic...\n')
    
    // Simulate what the API does
    const page = 1
    const limit = 20
    const skip = (page - 1) * limit

    // Get users with pagination
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true,
        wallet: {
          select: {
            balance: true,
          },
        },
        userMemberships: {
          where: {
            AND: [
              { startDate: { lte: new Date() } },
              { endDate: { gte: new Date() } },
            ],
          },
          include: {
            membershipPackage: {
              select: {
                name: true,
                duration: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    })

    console.log(`✅ Found ${users.length} users\n`)

    // Show first 3 users
    users.slice(0, 3).forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email})`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Wallet: Rp ${user.wallet?.balance?.toLocaleString('id-ID') || 0}`)
      console.log(`   Transactions: ${user._count.transactions}`)
      if (user.userMemberships[0]) {
        const membership = user.userMemberships[0]
        const daysRemaining = Math.ceil(
          (new Date(membership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        console.log(`   Membership: ${membership.membershipPackage.name} (${daysRemaining} days left)`)
      }
      console.log('')
    })

    // Get stats
    const total = await prisma.user.count()
    const byRole = {
      admin: await prisma.user.count({ where: { role: 'ADMIN' } }),
      mentor: await prisma.user.count({ where: { role: 'MENTOR' } }),
      affiliate: await prisma.user.count({ where: { role: 'AFFILIATE' } }),
      memberPremium: await prisma.user.count({ where: { role: 'MEMBER_PREMIUM' } }),
      memberFree: await prisma.user.count({ where: { role: 'MEMBER_FREE' } }),
    }
    const activeMemberships = await prisma.userMembership.count({
      where: {
        AND: [
          { startDate: { lte: new Date() } },
          { endDate: { gte: new Date() } },
        ],
      },
    })

    console.log('📊 Stats:')
    console.log(`   Total Users: ${total}`)
    console.log(`   Admin: ${byRole.admin}`)
    console.log(`   Mentor: ${byRole.mentor}`)
    console.log(`   Affiliate: ${byRole.affiliate}`)
    console.log(`   Premium: ${byRole.memberPremium}`)
    console.log(`   Free: ${byRole.memberFree}`)
    console.log(`   Active Memberships: ${activeMemberships}\n`)

    console.log('✅ API logic works correctly!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminUsersAPI()
