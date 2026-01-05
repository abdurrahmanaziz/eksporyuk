#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCommission() {
  console.log('\n🔍 SAFE COMMISSION CHECK (READ-ONLY)\n')

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: 'azizbiasa@gmail.com' },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      console.log('❌ User tidak ditemukan\n')
      return
    }

    console.log('👤 USER:', user.name, `(${user.email})`)
    console.log('📊 ROLE:', user.role)
    console.log()

    // Check wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    })

    if (!wallet) {
      console.log('❌ WALLET TIDAK DITEMUKAN')
      console.log('⚠️  User belum memiliki wallet record\n')
      return
    }

    console.log('💰 WALLET STATUS:')
    console.log('  • Balance Available:', (wallet.balance || 0).toLocaleString('id-ID'), 'IDR')
    console.log('  • Balance Pending:', (wallet.balancePending || 0).toLocaleString('id-ID'), 'IDR')
    if (wallet.totalEarned !== undefined) {
      console.log('  • Total Earned:', (wallet.totalEarned || 0).toLocaleString('id-ID'), 'IDR')
    }
    if (wallet.totalWithdrawn !== undefined) {
      console.log('  • Total Withdrawn:', (wallet.totalWithdrawn || 0).toLocaleString('id-ID'), 'IDR')
    }
    console.log()

    // Check affiliate transactions
    const transactions = await prisma.transaction.findMany({
      where: { affiliateId: user.id, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        amount: true,
        affiliateShare: true,
        createdAt: true,
        membershipId: true
      }
    })

    console.log('📋 AFFILIATE TRANSACTIONS (3 terbaru):')
    if (transactions.length === 0) {
      console.log('  ℹ️  Tidak ada transaksi affiliate')
    } else {
      transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. Transaction ID: ${tx.id}`)
        console.log(`     Amount: ${tx.amount.toLocaleString('id-ID')} IDR`)
        console.log(`     Affiliate Share: ${(tx.affiliateShare || 0).toLocaleString('id-ID')} IDR`)
        console.log(`     Date: ${tx.createdAt.toISOString().split('T')[0]}`)
      })
    }
    console.log()

    // Check wallet transactions
    const walletTxs = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { type: true, amount: true, description: true, createdAt: true }
    })

    console.log('💳 WALLET TRANSACTIONS (5 terbaru):')
    if (walletTxs.length === 0) {
      console.log('  ℹ️  Tidak ada transaksi wallet')
    } else {
      walletTxs.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.type}: ${tx.amount.toLocaleString('id-ID')} IDR`)
        console.log(`     ${tx.description} [${tx.createdAt.toISOString().split('T')[0]}]`)
      })
    }
    console.log()

    console.log('✅ CHECK COMPLETE - NO CHANGES MADE\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkCommission()
