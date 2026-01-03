#!/usr/bin/env node

/**
 * Fix Missing Commission Breakdown
 * Usage: node fix-missing-commission-breakdown.js
 * 
 * Fills in missing commission breakdown for transactions
 * that were marked SUCCESS but don't have commission details
 * 
 * Safe operation: Only sets to 0 if missing, doesn't recalculate
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixMissingBreakdown() {
  try {
    console.log('🔧 Fixing missing commission breakdowns...\n')

    // Find transactions without commission breakdown
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        OR: [
          { affiliateShare: null },
          { companyFee: null },
          { founderShare: null },
          { coFounderShare: null },
        ]
      },
      select: {
        id: true,
        amount: true,
        type: true,
        affiliateShare: true,
        companyFee: true,
        founderShare: true,
        coFounderShare: true,
      },
    })

    console.log(`Found ${transactions.length} transactions with missing breakdown\n`)

    if (transactions.length === 0) {
      console.log('✅ No transactions need fixing!')
      return
    }

    // Show what will be fixed
    console.log('Transactions to be fixed:')
    transactions.forEach((t, i) => {
      const missing = []
      if (t.affiliateShare === null) missing.push('affiliateShare')
      if (t.companyFee === null) missing.push('companyFee')
      if (t.founderShare === null) missing.push('founderShare')
      if (t.coFounderShare === null) missing.push('coFounderShare')

      console.log(`${i + 1}. ${t.id} - Amount: Rp ${(t.amount || 0).toLocaleString('id-ID')}`)
      console.log(`   Missing: ${missing.join(', ')}`)
    })

    // Fix by setting missing values to 0
    console.log(`\n⏳ Updating ${transactions.length} transactions...\n`)

    let fixedCount = 0
    let errorCount = 0

    for (const transaction of transactions) {
      try {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            affiliateShare: transaction.affiliateShare ?? 0,
            companyFee: transaction.companyFee ?? 0,
            founderShare: transaction.founderShare ?? 0,
            coFounderShare: transaction.coFounderShare ?? 0,
          },
        })
        fixedCount++
      } catch (error) {
        console.error(`Error fixing ${transaction.id}:`, error)
        errorCount++
      }
    }

    console.log(`✅ Fix complete!`)
    console.log(`  Successfully fixed: ${fixedCount}`)
    if (errorCount > 0) {
      console.log(`  Errors: ${errorCount}`)
    }

    // Verify
    console.log(`\n🔍 Verifying fix...`)
    const remaining = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        OR: [
          { affiliateShare: null },
          { companyFee: null },
          { founderShare: null },
          { coFounderShare: null },
        ]
      },
      select: { id: true },
    })

    if (remaining.length === 0) {
      console.log('✅ All transactions now have commission breakdown!')
    } else {
      console.log(`⚠️  ${remaining.length} transactions still need fixing`)
    }

    console.log('\n💡 NOTE: These transactions were set to 0 for all commission shares.')
    console.log('   This may need manual review if they should have specific splits.')
    console.log('\n' + '='.repeat(60) + '\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingBreakdown().then(() => {
  console.log('✅ Done!')
  process.exit(0)
})
