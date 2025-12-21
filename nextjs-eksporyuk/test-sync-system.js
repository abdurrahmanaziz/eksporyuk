const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSyncSystem() {
  console.log('🧪 Testing Sejoli Sync System')
  console.log('=' .repeat(50))

  try {
    // 1. Check current max invoice number
    console.log('\n1. Checking current invoice numbers...')
    
    const lastInvoice = await prisma.transaction.findFirst({
      where: {
        invoiceNumber: { startsWith: 'INV' }
      },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true, createdAt: true }
    })

    console.log('Last invoice:', lastInvoice?.invoiceNumber || 'None found')
    
    const nextNumber = lastInvoice 
      ? Math.max(parseInt(lastInvoice.invoiceNumber.replace('INV', '')) + 1, 12001)
      : 12001

    console.log('Next invoice number will be: INV' + nextNumber)

    // 2. Check for potential conflicts
    console.log('\n2. Checking for existing conflicts...')
    
    const invoiceCount = await prisma.transaction.groupBy({
      by: ['invoiceNumber'],
      _count: { invoiceNumber: true },
      having: {
        invoiceNumber: { _count: { gt: 1 } }
      }
    })

    if (invoiceCount.length > 0) {
      console.log('⚠️  Found duplicate invoice numbers:')
      invoiceCount.forEach(item => {
        console.log(`   ${item.invoiceNumber}: ${item._count.invoiceNumber} times`)
      })
    } else {
      console.log('✅ No duplicate invoice numbers found')
    }

    // 3. Check affiliate commission system
    console.log('\n3. Checking affiliate system...')
    
    const topAffiliates = await prisma.affiliateConversion.groupBy({
      by: ['affiliateId'],
      _sum: { commissionAmount: true },
      _count: { id: true },
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 5
    })

    if (topAffiliates.length > 0) {
      console.log('Top 5 affiliates by commission:')
      for (const affiliate of topAffiliates) {
        const affiliateProfile = await prisma.affiliateProfile.findUnique({
          where: { id: affiliate.affiliateId },
          include: { user: { select: { name: true, email: true } } }
        })
        const user = affiliateProfile?.user
        
        const commission = affiliate._sum.commissionAmount || 0
        console.log(`   ${user?.name || user?.email}: Rp ${commission.toLocaleString()} (${affiliate._count.id} sales)`)
      }
    }

    // 4. Test sample data structure
    console.log('\n4. Testing sample sync data structure...')
    
    const sampleData = [
      {
        id: 'TEST-001',
        email: 'test-sync@example.com',
        customerName: 'Test Sync User',
        productName: 'Membership Premium Eksporyuk', 
        price: '399000',
        status: 'completed',
        date: '2025-12-20T10:00:00Z',
        affiliateCode: 'RAHMAT123',
        commissionAmount: '79800'
      }
    ]

    console.log('Sample sync data:', JSON.stringify(sampleData, null, 2))

    // 5. Check membership mapping
    console.log('\n5. Checking membership mapping...')
    
    const memberships = await prisma.membership.findMany({
      select: { id: true, name: true, duration: true }
    })

    const membershipMapping = {
      'Membership Premium Eksporyuk': 'PREMIUM',
      'Membership Gold Eksporyuk': 'GOLD', 
      'Membership Basic Eksporyuk': 'BASIC',
      'Member Premium': 'PREMIUM',
      'Member Gold': 'GOLD'
    }

    console.log('Available memberships:')
    memberships.forEach(m => {
      console.log(`   ${m.name} (${m.duration})`)
    })

    console.log('\nProduct-to-membership mapping:')
    Object.entries(membershipMapping).forEach(([product, type]) => {
      const found = memberships.find(m => 
        m.name.toLowerCase().includes(type.toLowerCase())
      )
      console.log(`   "${product}" → ${type} ${found ? '✅' : '❌'}`)
    })

    // 6. Check wallet system
    console.log('\n6. Checking wallet system...')
    
    const walletStats = await prisma.wallet.aggregate({
      _sum: { balance: true, balancePending: true },
      _count: { id: true }
    })

    console.log(`Wallets: ${walletStats._count.id} users`)
    console.log(`Total balance: Rp ${(walletStats._sum.balance || 0).toLocaleString()}`)
    console.log(`Total pending: Rp ${(walletStats._sum.balancePending || 0).toLocaleString()}`)

    // 7. Summary stats
    console.log('\n7. Current database summary...')
    
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.affiliateConversion.count(),
      prisma.userMembership.count({ where: { status: 'ACTIVE' } })
    ])

    console.log(`Users: ${stats[0]}`)
    console.log(`Transactions: ${stats[1]}`)
    console.log(`Affiliate conversions: ${stats[2]}`)
    console.log(`Active memberships: ${stats[3]}`)

    console.log('\n✅ Sync system test completed!')
    console.log('\n🔗 Access sync UI at: http://localhost:3000/admin/sync/sejoli')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSyncSystem()