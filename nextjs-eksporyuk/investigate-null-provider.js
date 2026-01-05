#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function investigateNullProvider() {
  try {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`  🔍 INVESTIGATING NULL PAYMENT PROVIDER TRANSACTIONS`)
    console.log(`${'='.repeat(70)}\n`)

    const nullProviderTxs = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        paymentProvider: null
      },
      select: {
        id: true,
        userId: true,
        status: true,
        amount: true,
        description: true,
        notes: true,
        metadata: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Found ${nullProviderTxs.length} transactions with NULL paymentProvider\n`)

    // Group by status
    const byStatus = {}
    nullProviderTxs.forEach(tx => {
      if (!byStatus[tx.status]) byStatus[tx.status] = []
      byStatus[tx.status].push(tx)
    })

    console.log(`Distribution by status:`)
    Object.entries(byStatus).forEach(([status, txs]) => {
      console.log(`  - ${status}: ${txs.length}`)
    })

    console.log(`\n\nDetailed information:\n`)

    for (const tx of nullProviderTxs.slice(0, 10)) {
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { name: true, email: true, role: true }
      })

      console.log(`ID: ${tx.id}`)
      console.log(`  User: ${user?.name} (${user?.email})`)
      console.log(`  Role: ${user?.role}`)
      console.log(`  Status: ${tx.status}`)
      console.log(`  Amount: Rp${tx.amount}`)
      console.log(`  Description: ${tx.description}`)
      console.log(`  Notes: ${tx.notes || 'none'}`)
      console.log(`  Metadata: ${tx.metadata || 'none'}`)
      console.log(`  Created: ${new Date(tx.createdAt).toLocaleString('id-ID')}`)
      console.log('')
    }

    console.log(`\n${'='.repeat(70)}`)
    console.log(`ANALYSIS:`)
    console.log(`${'='.repeat(70)}`)
    console.log(`\nPossible reasons for NULL paymentProvider:`)
    console.log(`1. Transactions created manually via admin panel`)
    console.log(`2. Test/development transactions`)
    console.log(`3. Incomplete transaction records`)
    console.log(`4. Legacy data from previous system version`)
    console.log(`\nAll ${nullProviderTxs.filter(t => t.status === 'SUCCESS').length} NULL provider txs have status SUCCESS`)
    console.log(`Need to investigate if these should have provider info added\n`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

investigateNullProvider()
