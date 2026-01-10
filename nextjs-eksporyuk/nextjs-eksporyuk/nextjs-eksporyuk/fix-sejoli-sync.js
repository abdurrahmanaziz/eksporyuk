#!/usr/bin/env node

/**
 * Fix Sejoli Sync Mistakes
 * 
 * This script helps you:
 * 1. Find transactions from a specific sync (by invoice number prefix)
 * 2. Delete ALL related records (Transaction, Commission, AffiliateConversion, UserMembership, Wallet)
 * 3. Restore affiliate wallet balance if commission was already paid
 * 
 * Usage: node fix-sejoli-sync.js <invoice-prefix>
 * Example: node fix-sejoli-sync.js "INV12" (deletes all INV12xxx and COM-INV12xxx records)
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  try {
    const invoicePrefix = process.argv[2]
    
    if (!invoicePrefix) {
      console.log('❌ Usage: node fix-sejoli-sync.js <invoice-prefix>')
      console.log('Example: node fix-sejoli-sync.js "INV12" (removes all INV12xxx and COM-INV12xxx)')
      process.exit(1)
    }

    console.log(`\n🔍 Looking for transactions with prefix: ${invoicePrefix}...`)
    
    // Find all transactions with this prefix
    const membershipsToDelete = await prisma.transaction.findMany({
      where: {
        invoiceNumber: { startsWith: invoicePrefix },
        type: 'MEMBERSHIP'
      },
      select: {
        id: true,
        invoiceNumber: true,
        userId: true,
        amount: true,
        affiliateId: true,
        customerEmail: true,
        metadata: true
      }
    })

    if (membershipsToDelete.length === 0) {
      console.log(`\n❌ No transactions found with prefix: ${invoicePrefix}`)
      process.exit(0)
    }

    console.log(`\n📋 Found ${membershipsToDelete.length} membership transactions`)
    
    // Find corresponding commission transactions
    const commissionsToDelete = await prisma.transaction.findMany({
      where: {
        invoiceNumber: { startsWith: `COM-${invoicePrefix}` },
        type: 'COMMISSION'
      },
      select: {
        id: true,
        invoiceNumber: true,
        userId: true,
        amount: true
      }
    })

    console.log(`📋 Found ${commissionsToDelete.length} commission transactions`)
    
    // Show details
    console.log('\n' + '='.repeat(60))
    console.log('TRANSACTIONS TO DELETE:')
    console.log('='.repeat(60))
    
    console.log('\n💳 Membership Transactions:')
    membershipsToDelete.forEach(t => {
      console.log(`  • ${t.invoiceNumber} - ${t.customerEmail} (Amount: Rp${t.amount})`)
    })
    
    console.log('\n💰 Commission Transactions:')
    commissionsToDelete.forEach(t => {
      console.log(`  • ${t.invoiceNumber} - Amount: Rp${t.amount}`)
    })
    
    // Get affiliate info to calculate wallet adjustment
    const affiliateIds = new Set(membershipsToDelete.map(t => t.affiliateId).filter(Boolean))
    console.log(`\n👥 Affected affiliates: ${Array.from(affiliateIds).length}`)
    
    // Calculate total commission to refund
    const totalCommissionToRefund = commissionsToDelete.reduce((sum, t) => sum + (t.amount || 0), 0)
    console.log(`💸 Total commission to refund: Rp${totalCommissionToRefund.toLocaleString('id-ID')}`)
    
    console.log('\n' + '='.repeat(60))
    const confirm = await question('\n⚠️  Are you SURE you want to DELETE all these records? (type "YES" to confirm): ')
    
    if (confirm !== 'YES') {
      console.log('\n❌ Operation cancelled')
      process.exit(0)
    }

    console.log('\n🔄 Deleting records...\n')
    
    let deletedCount = 0
    
    // Get transaction IDs to use for deleting related records
    const txnIds = membershipsToDelete.map(t => t.id)
    
    // 1. Delete AffiliateConversion records
    const affiliateConversionsDeleted = await prisma.affiliateConversion.deleteMany({
      where: {
        transactionId: { in: txnIds }
      }
    })
    console.log(`✅ Deleted ${affiliateConversionsDeleted.count} affiliate conversion records`)
    deletedCount += affiliateConversionsDeleted.count

    // 2. Delete UserMembership records
    const userMembershipsDeleted = await prisma.userMembership.deleteMany({
      where: {
        transactionId: { in: txnIds }
      }
    })
    console.log(`✅ Deleted ${userMembershipsDeleted.count} user membership records`)
    deletedCount += userMembershipsDeleted.count

    // 3. Delete commission transactions first (they reference the membership transaction)
    const commissionsDeleted = await prisma.transaction.deleteMany({
      where: {
        invoiceNumber: { startsWith: `COM-${invoicePrefix}` },
        type: 'COMMISSION'
      }
    })
    console.log(`✅ Deleted ${commissionsDeleted.count} commission transactions`)
    deletedCount += commissionsDeleted.count

    // 4. Delete membership transactions
    const txnsDeleted = await prisma.transaction.deleteMany({
      where: {
        invoiceNumber: { startsWith: invoicePrefix },
        type: 'MEMBERSHIP'
      }
    })
    console.log(`✅ Deleted ${txnsDeleted.count} membership transactions`)
    deletedCount += txnsDeleted.count

    // 5. Refund commission from affiliate wallets
    for (const affiliateId of affiliateIds) {
      const commissionTransactions = commissionsToDelete.filter(t => {
        // Find the affiliate from the membership transaction
        const memTxn = membershipsToDelete.find(m => m.affiliateId === affiliateId)
        return memTxn !== undefined
      })
      
      const totalToRefund = commissionTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      
      if (totalToRefund > 0) {
        await prisma.wallet.updateMany({
          where: { userId: affiliateId },
          data: {
            balance: {
              decrement: totalToRefund
            },
            totalEarnings: {
              decrement: totalToRefund
            }
          }
        })
        console.log(`✅ Refunded Rp${totalToRefund.toLocaleString('id-ID')} to affiliate wallet`)
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`✅ CLEANUP COMPLETE!`)
    console.log(`${'='.repeat(60)}`)
    console.log(`Total records deleted: ${deletedCount}`)
    console.log(`Invoices removed: ${invoicePrefix}xxx and COM-${invoicePrefix}xxx`)
    console.log(`Commission refunded: Rp${totalCommissionToRefund.toLocaleString('id-ID')}`)
    console.log('\n💡 Now you can re-sync with the correct affiliate/membership!\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

main()
