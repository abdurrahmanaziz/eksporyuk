#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPendingCommission() {
  console.log('\n🔍 CHECK PENDING COMMISSION & REVENUE\n')

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      select: { id: true, name: true }
    })

    if (!user) return

    console.log('👤 User:', user.name)
    console.log()

    // Check pending revenue via wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { id: true }
    })

    let pendingRevenue = []
    if (wallet) {
      pendingRevenue = await prisma.pendingRevenue.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    }

    console.log('💰 PENDING REVENUE RECORDS:')
    if (pendingRevenue.length === 0) {
      console.log('  ℹ️  Tidak ada pending revenue')
    } else {
      pendingRevenue.forEach((pr, i) => {
        console.log(`  ${i + 1}. Amount: ${pr.amount.toLocaleString('id-ID')} IDR`)
        console.log(`     Type: ${pr.type}`)
        console.log(`     Status: ${pr.status}`)
        console.log(`     Date: ${pr.createdAt.toISOString().split('T')[0]}`)
      })
    }
    console.log()

    // Check recent non-SUCCESS transactions
    const nonSuccessTransactions = await prisma.transaction.findMany({
      where: { affiliateId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        amount: true,
        createdAt: true
      }
    })

    console.log('📋 ALL RECENT AFFILIATE TRANSACTIONS:')
    nonSuccessTransactions.forEach((tx, i) => {
      console.log(`  ${i + 1}. [${tx.status}] ${tx.amount.toLocaleString('id-ID')} IDR`)
      console.log(`     ${tx.createdAt.toISOString().split('T')[0]}`)
    })
    console.log()

    console.log('✅ CHECK COMPLETE\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkPendingCommission()
