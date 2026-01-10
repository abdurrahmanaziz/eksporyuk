#!/usr/bin/env node
/**
 * Check specific user and commission data
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserCommission() {
  console.log('🔍 CHECKING USER COMMISSION DATA')
  console.log('=================================\n')

  try {
    // 1. Check specific user
    const email = 'rahmatalfianto1997@gmail.com'
    console.log(`📊 CHECKING USER: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
        wallet: true,
        _count: {
          select: {
            affiliateLinks: true
          }
        }
      }
    })

    // Get affiliate transactions separately
    const affiliateTransactions = await prisma.transaction.findMany({
      where: {
        affiliateId: user?.id,
        status: 'SUCCESS'
      },
      select: {
        id: true,
        amount: true,
        status: true,
        affiliateShare: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    const totalAffiliateTransactions = await prisma.transaction.count({
      where: {
        affiliateId: user?.id,
        status: 'SUCCESS'
      }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log(`✅ User found:`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Primary Role: ${user.role}`)
    console.log(`   Additional Roles: ${user.userRoles.map(r => r.role).join(', ') || 'None'}`)
    console.log(`   Affiliate Menu Enabled: ${user.affiliateMenuEnabled}`)
    console.log(`   Total Affiliate Transactions: ${totalAffiliateTransactions}`)
    console.log(`   Total Affiliate Links: ${user._count.affiliateLinks}`)

    if (user.wallet) {
      console.log(`   Wallet Balance: Rp ${user.wallet.balance.toLocaleString()}`)
      console.log(`   Pending Balance: Rp ${user.wallet.balancePending.toLocaleString()}`)
    } else {
      console.log('   Wallet: Not created')
    }

    console.log(`\n📋 RECENT AFFILIATE TRANSACTIONS:`)
    if (affiliateTransactions.length > 0) {
      affiliateTransactions.forEach(transaction => {
        const commission = transaction.affiliateShare || 0
        console.log(`   - Total: Rp ${transaction.amount.toLocaleString()}, Commission: Rp ${commission.toLocaleString()} (${transaction.status}) - ${new Date(transaction.createdAt).toLocaleDateString()}`)
      })
    } else {
      console.log('   No affiliate transactions found')
    }

    // 2. Check database schema for affiliate detection
    console.log(`\n🔧 COMMISSION DETECTION LOGIC:`)
    
    // Check if user has any affiliate transactions
    const hasAffiliateTransactions = totalAffiliateTransactions > 0
    console.log(`   Has Affiliate Transactions: ${hasAffiliateTransactions}`)

    // Check if user has affiliate links
    const hasAffiliateLinks = user._count.affiliateLinks > 0
    console.log(`   Has Affiliate Links: ${hasAffiliateLinks}`)
    
    // Check if user has wallet with balance
    const hasWalletBalance = user.wallet && (user.wallet.balance > 0 || user.wallet.balancePending > 0)
    console.log(`   Has Wallet Balance: ${hasWalletBalance}`)

    // Check if user should have auto-affiliate access
    const shouldHaveAffiliateAccess = hasAffiliateTransactions || hasAffiliateLinks || hasWalletBalance
    console.log(`   Should Have Auto Affiliate Access: ${shouldHaveAffiliateAccess}`)
    console.log(`   Currently Has Affiliate Access: ${user.affiliateMenuEnabled}`)
    
    if (shouldHaveAffiliateAccess && !user.affiliateMenuEnabled) {
      console.log(`   ⚠️  ISSUE: User should have affiliate access but doesn't!`)
    }

    // 3. Check general commission distribution
    console.log(`\n📈 AFFILIATE OVERVIEW:`)
    
    const totalUsersWithAffiliateTransactions = await prisma.user.count({
      where: {
        id: {
          in: await prisma.transaction.findMany({
            where: { 
              affiliateId: { not: null },
              status: 'SUCCESS'
            },
            select: { affiliateId: true },
            distinct: ['affiliateId']
          }).then(results => results.map(r => r.affiliateId).filter(Boolean))
        }
      }
    })
    
    const totalUsersWithAffiliateLinks = await prisma.user.count({
      where: {
        affiliateLinks: {
          some: {}
        }
      }
    })
    
    const totalUsersWithWallet = await prisma.user.count({
      where: {
        wallet: {
          OR: [
            { balance: { gt: 0 } },
            { balancePending: { gt: 0 } }
          ]
        }
      }
    })

    const totalUsersWithAffiliateMenuEnabled = await prisma.user.count({
      where: {
        affiliateMenuEnabled: true
      }
    })

    console.log(`   Users with Affiliate Transactions: ${totalUsersWithAffiliateTransactions}`)
    console.log(`   Users with Affiliate Links: ${totalUsersWithAffiliateLinks}`)
    console.log(`   Users with Wallet Balance: ${totalUsersWithWallet}`)
    console.log(`   Users with Affiliate Menu Enabled: ${totalUsersWithAffiliateMenuEnabled}`)

    // 4. Get users who should have auto-affiliate but don't  
    const affiliateUserIds = await prisma.transaction.findMany({
      where: { 
        affiliateId: { not: null },
        status: 'SUCCESS'
      },
      select: { affiliateId: true },
      distinct: ['affiliateId']
    }).then(results => results.map(r => r.affiliateId).filter(Boolean))

    const usersNeedingAutoAffiliate = await prisma.user.findMany({
      where: {
        AND: [
          { affiliateMenuEnabled: false },
          {
            OR: [
              { id: { in: affiliateUserIds } },
              { affiliateLinks: { some: {} } },
              { 
                wallet: {
                  OR: [
                    { balance: { gt: 0 } },
                    { balancePending: { gt: 0 } }
                  ]
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            affiliateLinks: true
          }
        }
      },
      take: 10
    })

    console.log(`\n👥 USERS NEEDING AUTO-AFFILIATE ACCESS (${usersNeedingAutoAffiliate.length} total):`)
    for (const u of usersNeedingAutoAffiliate) {
      const userTransactions = await prisma.transaction.count({
        where: { 
          affiliateId: u.id,
          status: 'SUCCESS'
        }
      })
      console.log(`   ${u.name} (${u.email}) - ${u.role} - ${userTransactions} transactions, ${u._count.affiliateLinks} links`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  await prisma.$disconnect()
}

checkUserCommission().catch(console.error)