#!/usr/bin/env node

/**
 * Verify Commission Data Across System
 * Check: Transactions, Wallets, Affiliate Conversions, Membership Assignments
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Verifying Commission Data Across System...\n')

    // Get all recent transactions from Sejoli sync
    console.log('📊 Recent Sejoli Sync Transactions:')
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        paymentMethod: 'SEJOLI_SYNC',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: { select: { email: true, name: true } },
        affiliateConversion: {
          select: { commissionAmount: true, commissionRate: true, paidOut: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    if (recentTransactions.length === 0) {
      console.log('   ⚠️  No recent Sejoli sync transactions found')
    } else {
      console.log(`   Found ${recentTransactions.length} transactions:\n`)
      
      let totalCommission = 0
      for (const txn of recentTransactions) {
        console.log(`   📝 ${txn.invoiceNumber}`)
        console.log(`      Customer: ${txn.customerEmail}`)
        console.log(`      Amount: Rp${txn.amount}`)
        console.log(`      Product: ${txn.description}`)
        console.log(`      Status: ${txn.status}`)
        
        if (txn.affiliateConversion) {
          console.log(`      ✅ Commission: Rp${txn.affiliateConversion.commissionAmount} (${txn.affiliateConversion.commissionRate}%)`)
          console.log(`      Paid Out: ${txn.affiliateConversion.paidOut}`)
          totalCommission += Number(txn.affiliateConversion.commissionAmount)
        } else {
          console.log(`      ⚠️  No affiliate conversion record`)
        }
        console.log()
      }
      console.log(`   Total Commission (from shown): Rp${totalCommission}\n`)
    }

    // Check commission transactions
    console.log('💰 Commission Transactions (Type: COMMISSION):')
    const commissionTxns = await prisma.transaction.findMany({
      where: {
        type: 'COMMISSION',
        paymentMethod: 'SYNC_COMMISSION',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    if (commissionTxns.length === 0) {
      console.log('   ⚠️  No recent commission transactions found\n')
    } else {
      console.log(`   Found ${commissionTxns.length} commission transactions:\n`)
      
      for (const txn of commissionTxns) {
        console.log(`   💸 ${txn.invoiceNumber}`)
        console.log(`      To: ${txn.user.name} (${txn.user.email})`)
        console.log(`      Amount: Rp${txn.amount}`)
        console.log(`      Description: ${txn.description}`)
        console.log(`      Status: ${txn.status}`)
        console.log()
      }
    }

    // Check affiliate wallets with balance
    console.log('💳 Affiliate Wallets (with balance):')
    const affiliatesWithBalance = await prisma.wallet.findMany({
      where: {
        balance: {
          gt: 0
        }
      },
      orderBy: { balance: 'desc' },
      take: 20
    })

    // Get user details for each wallet
    const walletsWithUser = await Promise.all(
      affiliatesWithBalance.map(async (wallet) => {
        const user = await prisma.user.findUnique({
          where: { id: wallet.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            affiliateProfile: {
              select: { isActive: true }
            }
          }
        })
        return { wallet, user }
      })
    )

    const affiliatesWithBalance_new = walletsWithUser

    if (affiliatesWithBalance_new.length === 0) {
      console.log('   No wallets with balance found\n')
    } else {
      console.log(`   Found ${affiliatesWithBalance_new.length} wallets:\n`)
      
      let totalBalance = 0
      let totalEarnings = 0
      
      for (const { wallet, user } of affiliatesWithBalance_new) {
        const isAffiliate = user.affiliateProfile
        const status = isAffiliate ? '✅ ACTIVE' : '❓ NOT AFFILIATE'
        
        console.log(`   👤 ${user.name}`)
        console.log(`      Email: ${user.email}`)
        console.log(`      Role: ${user.role}`)
        console.log(`      Status: ${status}`)
        console.log(`      Balance: Rp${wallet.balance}`)
        console.log(`      Pending: Rp${wallet.balancePending}`)
        console.log(`      Total Earnings: Rp${wallet.totalEarnings}`)
        console.log(`      Total Payout: Rp${wallet.totalPayout}`)
        console.log()
        
        totalBalance += Number(wallet.balance)
        totalEarnings += Number(wallet.totalEarnings)
      }
      
      console.log(`   💰 Total Balance: Rp${totalBalance}`)
      console.log(`   📈 Total Earnings: Rp${totalEarnings}\n`)
    }

    // Check user memberships assigned
    console.log('🎁 User Memberships (Recent):')
    const recentMemberships = await prisma.userMembership.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        membership: { select: { name: true, duration: true } },
        transaction: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get user details for each membership
    const membershipsWithUser = await Promise.all(
      recentMemberships.map(async (membership) => {
        const user = await prisma.user.findUnique({
          where: { id: membership.userId },
          select: { email: true, name: true }
        })
        return { membership, user }
      })
    )

    if (recentMemberships.length === 0) {
      console.log('   No recent membership assignments found\n')
    } else {
      console.log(`   Found ${recentMemberships.length} memberships:\n`)
      
      for (const { membership, user } of membershipsWithUser) {
        console.log(`   ✅ ${membership.membership.name}`)
        console.log(`      User: ${user.email}`)
        console.log(`      Status: ${membership.status}`)
        console.log(`      Active: ${membership.isActive}`)
        console.log(`      Start: ${membership.startDate.toISOString().split('T')[0]}`)
        console.log(`      End: ${membership.endDate.toISOString().split('T')[0]}`)
        console.log(`      Invoice: ${membership.transaction?.invoiceNumber || 'N/A'}`)
        console.log()
      }
    }

    // Summary statistics
    console.log('=' .repeat(60))
    console.log('📊 SUMMARY STATISTICS:')
    console.log('=' .repeat(60))

    const totalTransactions = await prisma.transaction.count({
      where: { paymentMethod: 'SEJOLI_SYNC' }
    })

    const totalCommissionAmount = await prisma.transaction.aggregate({
      where: { type: 'COMMISSION', paymentMethod: 'SYNC_COMMISSION' },
      _sum: { amount: true }
    })

    const activeAffiliates = await prisma.wallet.count({
      where: { balance: { gt: 0 } }
    })

    const totalMembershipsAssigned = await prisma.userMembership.count({
      where: { status: 'ACTIVE' }
    })

    console.log(`
✅ Total Sejoli Sync Transactions: ${totalTransactions}
💰 Total Commission Distributed: Rp${totalCommissionAmount._sum.amount || 0}
👥 Affiliates with Balance: ${activeAffiliates}
🎁 Active Memberships: ${totalMembershipsAssigned}
    `)

    console.log('=' .repeat(60))
    console.log('✨ Data verification complete!\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
