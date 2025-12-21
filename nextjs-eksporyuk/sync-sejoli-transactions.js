/**
 * Sync Sejoli Transactions with Database
 * Compare Sejoli API data with existing DB data
 * - Update existing records if status changed
 * - Add new records
 * - Remove duplicates
 * - DO NOT delete existing data
 */

const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const fs = require('fs')

const prisma = new PrismaClient()

const SEJOLI_API_URL = process.env.SEJOLI_API_URL || 'https://member.eksporyuk.com/wp-json/sejoli-api/v1'
const SEJOLI_API_USERNAME = process.env.SEJOLI_API_USERNAME || 'admin_ekspor'
const SEJOLI_API_PASSWORD = process.env.SEJOLI_API_PASSWORD || 'Eksporyuk2024#'

// Status mapping Sejoli -> Platform
const STATUS_MAP = {
  'completed': 'SUCCESS',
  'on-hold': 'PENDING',
  'cancelled': 'FAILED',
  'payment-confirm': 'PENDING',
  'refunded': 'REFUNDED'
}

async function main() {
  console.log('🔄 Starting Sejoli Transaction Sync...\n')

  // 1. Fetch data from Sejoli API
  console.log('📡 Fetching data from Sejoli API...')
  const auth = Buffer.from(`${SEJOLI_API_USERNAME}:${SEJOLI_API_PASSWORD}`).toString('base64')
  
  const response = await axios.get(`${SEJOLI_API_URL}/sales`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  })

  const sejoliOrders = response.data.orders || []
  console.log(`✅ Fetched ${sejoliOrders.length} orders from Sejoli\n`)

  // 2. Get existing transactions from DB
  console.log('📊 Fetching existing transactions from database...')
  const existingTransactions = await prisma.transaction.findMany({
    select: {
      id: true,
      externalId: true,
      status: true,
      amount: true,
      createdAt: true,
      userId: true,
      metadata: true
    }
  })
  console.log(`✅ Found ${existingTransactions.length} existing transactions\n`)

  // 3. Create lookup map by externalId (Sejoli order ID)
  const existingBySejoliId = new Map()
  const existingByUserId = new Map()
  
  existingTransactions.forEach(tx => {
    const sejoliId = tx.metadata?.sejoli_order_id || tx.externalId
    if (sejoliId) {
      existingBySejoliId.set(String(sejoliId), tx)
    }
    // Also map by userId + amount + date for fallback matching
    const key = `${tx.userId}-${tx.amount}-${new Date(tx.createdAt).toISOString().split('T')[0]}`
    if (!existingByUserId.has(key)) {
      existingByUserId.set(key, [])
    }
    existingByUserId.get(key).push(tx)
  })

  console.log(`🔍 Analyzing data...\n`)

  // 4. Categorize orders
  const stats = {
    existing: 0,
    needsUpdate: 0,
    new: 0,
    duplicates: 0,
    errors: []
  }

  const toUpdate = []
  const toCreate = []
  const duplicateIds = []

  for (const order of sejoliOrders) {
    try {
      const sejoliId = String(order.ID)
      const existingTx = existingBySejoliId.get(sejoliId)

      if (existingTx) {
        // Check if status changed
        const sejoliStatus = STATUS_MAP[order.status] || 'PENDING'
        if (existingTx.status !== sejoliStatus) {
          toUpdate.push({
            id: existingTx.id,
            sejoliId: sejoliId,
            oldStatus: existingTx.status,
            newStatus: sejoliStatus,
            order
          })
          stats.needsUpdate++
        } else {
          stats.existing++
        }
      } else {
        // Check for potential duplicate by userId + amount + date
        const orderDate = new Date(order.created_at).toISOString().split('T')[0]
        const key = `${order.user_id}-${order.grand_total}-${orderDate}`
        const potentialDupes = existingByUserId.get(key) || []

        if (potentialDupes.length > 0) {
          // Found potential duplicate
          console.log(`⚠️  Potential duplicate: Sejoli ID ${sejoliId} matches existing transaction(s)`)
          duplicateIds.push(sejoliId)
          stats.duplicates++
        } else {
          // New transaction
          toCreate.push(order)
          stats.new++
        }
      }
    } catch (error) {
      stats.errors.push({ orderId: order.ID, error: error.message })
    }
  }

  // 5. Display summary
  console.log('📊 SYNC SUMMARY:')
  console.log(`   ✅ Already in DB (no change): ${stats.existing}`)
  console.log(`   🔄 Need status update: ${stats.needsUpdate}`)
  console.log(`   ➕ New transactions: ${stats.new}`)
  console.log(`   ⚠️  Potential duplicates: ${stats.duplicates}`)
  console.log(`   ❌ Errors: ${stats.errors.length}\n`)

  // 6. Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: stats,
    toUpdate: toUpdate.map(u => ({
      transactionId: u.id,
      sejoliId: u.sejoliId,
      oldStatus: u.oldStatus,
      newStatus: u.newStatus
    })),
    toCreate: toCreate.map(o => ({
      sejoliId: o.ID,
      userId: o.user_id,
      amount: o.grand_total,
      status: o.status,
      date: o.created_at
    })).slice(0, 100), // Limit to first 100 for readability
    duplicates: duplicateIds,
    errors: stats.errors
  }

  const reportFile = `sync-report-${Date.now()}.json`
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
  console.log(`📄 Detailed report saved to: ${reportFile}\n`)

  // 7. Ask for confirmation before making changes
  console.log('⏸️  DRY RUN MODE - No changes made to database')
  console.log('Review the report file and run with --execute flag to apply changes\n')

  // Save data for next step
  const dataFile = `sync-data-${Date.now()}.json`
  fs.writeFileSync(dataFile, JSON.stringify({ toUpdate, toCreate }, null, 2))
  console.log(`💾 Sync data saved to: ${dataFile}`)
  console.log('✅ Analysis complete!')
}

main()
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
