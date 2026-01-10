/**
 * FINAL SAFE IMPORT TO NEON DATABASE
 * ===================================
 * 
 * Import Sejoli transactions to NEON with:
 * - Duplicate prevention (check existing data)
 * - Skip already imported transactions
 * - Accurate commission calculation
 * - Safe batch processing
 */

const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

// Configuration
const BATCH_SIZE = 100
const DRY_RUN = false // Set to true to test without inserting

async function fetchSejoliData() {
    console.log('\n📡 FETCHING SEJOLI DATA')
    console.log('━'.repeat(50))
    
    // Fetch products with commission data
    console.log('📦 Fetching products...')
    const productsResponse = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
        headers: {
            'User-Agent': 'Eksporyuk Migration Bot',
            'Accept': 'application/json'
        }
    })
    
    const products = productsResponse.data
    console.log(`✅ Fetched ${products.length} products`)
    
    // Build commission lookup
    const commissionLookup = new Map()
    let productsWithCommission = 0
    
    for (const product of products) {
        if (product.affiliate && product.affiliate[1] && product.affiliate[1].fee) {
            const fee = product.affiliate[1].fee
            const feeStr = String(fee)
            
            let commissionValue = 0
            
            if (feeStr.includes('%')) {
                // Percentage commission
                commissionValue = parseFloat(feeStr.replace('%', '')) / 100
                commissionLookup.set(product.id, { 
                    type: 'percentage', 
                    value: commissionValue,
                    price: parseFloat(product.price) || 0,
                    name: product.title
                })
            } else {
                // Flat commission
                commissionValue = parseFloat(feeStr.replace(/[^\d]/g, '')) || 0
                commissionLookup.set(product.id, { 
                    type: 'flat', 
                    value: commissionValue,
                    price: parseFloat(product.price) || 0,
                    name: product.title
                })
            }
            productsWithCommission++
        }
    }
    
    console.log(`💰 Commission data: ${productsWithCommission} products`)
    
    // Fetch all sales data
    console.log('\n📊 Fetching all sales orders...')
    let allOrders = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
        const response = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
            params: {
                'per_page': 100,
                'page': page
            },
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        })
        
        const orders = response.data.orders || []
        allOrders = allOrders.concat(orders)
        
        console.log(`   Page ${page}: ${orders.length} orders (Total: ${allOrders.length})`)
        
        hasMore = orders.length === 100
        page++
        
        // Safety limit
        if (page > 200) {
            console.log('⚠️ Safety limit reached (200 pages)')
            break
        }
    }
    
    console.log(`✅ Total orders fetched: ${allOrders.length}`)
    
    return { orders: allOrders, commissionLookup }
}

async function checkExistingData() {
    console.log('\n🔍 CHECKING EXISTING DATA IN NEON')
    console.log('━'.repeat(50))
    
    // Get all existing transaction external IDs
    const existingTransactions = await prisma.transaction.findMany({
        where: {
            externalId: { startsWith: 'SEJOLI-' }
        },
        select: {
            externalId: true,
            amount: true,
            createdAt: true,
            status: true
        }
    })
    
    console.log(`📊 Existing Sejoli transactions: ${existingTransactions.length}`)
    
    // Build lookup sets for fast duplicate checking
    const existingIds = new Set(existingTransactions.map(t => t.externalId))
    const existingKeys = new Set(
        existingTransactions.map(t => 
            `${t.amount}_${t.createdAt.toISOString().substring(0, 19)}_${t.status}`
        )
    )
    
    return { existingIds, existingKeys, count: existingTransactions.length }
}

async function importToNeon(orders, commissionLookup, existingData) {
    console.log('\n📥 IMPORTING TO NEON DATABASE')
    console.log('━'.repeat(50))
    
    if (DRY_RUN) {
        console.log('⚠️ DRY RUN MODE - No data will be inserted')
    }
    
    const stats = {
        total: orders.length,
        duplicates: 0,
        toImport: 0,
        imported: 0,
        withCommission: 0,
        withoutCommission: 0,
        revenue: 0,
        commissionTotal: 0,
        errors: 0
    }
    
    // Process in batches
    const batches = []
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        batches.push(orders.slice(i, i + BATCH_SIZE))
    }
    
    console.log(`📦 Processing ${batches.length} batches (${BATCH_SIZE} orders each)`)
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}`)
        
        const transactionsToCreate = []
        const commissionsToCreate = []
        
        for (const order of batch) {
            try {
                const externalId = `SEJOLI-${order.ID}`
                
                // Check duplicate by external ID
                if (existingData.existingIds.has(externalId)) {
                    stats.duplicates++
                    continue
                }
                
                // Parse order data
                const amount = parseFloat(order.grand_total) || 0
                const createdAt = new Date(order.created_at)
                const updatedAt = order.updated_at && order.updated_at !== '0000-00-00 00:00:00' ? 
                    new Date(order.updated_at) : createdAt
                const status = order.status === 'completed' ? 'SUCCESS' : 
                              order.status === 'on-hold' ? 'PENDING' : 
                              order.status === 'cancelled' ? 'FAILED' : 'PENDING'
                
                // Skip orders with zero amount
                if (amount === 0) {
                    stats.duplicates++
                    continue
                }
                
                // Check duplicate by composite key
                const compositeKey = `${amount}_${createdAt.toISOString().substring(0, 19)}_${status}`
                if (existingData.existingKeys.has(compositeKey)) {
                    stats.duplicates++
                    continue
                }
                
                // Prepare transaction data
                const transactionData = {
                    externalId: externalId,
                    userId: 'SEJOLI-MIGRATION', // Dummy user ID for migration - avoid foreign key errors
                    type: 'MEMBERSHIP', // Must match Prisma enum: MEMBERSHIP, PRODUCT, COURSE, EVENT
                    amount: amount,
                    status: status,
                    paymentMethod: order.payment_info?.gateway || 'UNKNOWN',
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                    metadata: {
                        source: 'SEJOLI',
                        orderId: order.ID,
                        productId: order.product_id,
                        productName: order.product_name,
                        sejoliUserId: order.user_id, // Store original Sejoli user ID in metadata
                        affiliateId: order.affiliate_id || null,
                        sejoliStatus: order.status
                    }
                }
                
                transactionsToCreate.push(transactionData)
                
                // Track for duplicate prevention in next batches
                existingData.existingIds.add(externalId)
                existingData.existingKeys.add(compositeKey)
                
                stats.toImport++
                if (status === 'SUCCESS') {
                    stats.revenue += amount
                }
                
                // Calculate commission if product has commission data
                if (order.affiliate_id && commissionLookup.has(order.product_id)) {
                    const commissionData = commissionLookup.get(order.product_id)
                    let commissionAmount = 0
                    
                    if (commissionData.type === 'flat') {
                        commissionAmount = commissionData.value
                    } else {
                        commissionAmount = amount * commissionData.value
                    }
                    
                    if (commissionAmount > 0) {
                        commissionsToCreate.push({
                            transactionId: externalId, // Will need to map after transaction creation
                            affiliateId: `SEJOLI-AFFILIATE-${order.affiliate_id}`,
                            amount: commissionAmount,
                            status: status === 'SUCCESS' ? 'APPROVED' : 'PENDING',
                            type: commissionData.type.toUpperCase(),
                            createdAt: createdAt,
                            productName: order.product_name,
                            productId: order.product_id
                        })
                        
                        stats.withCommission++
                        if (status === 'SUCCESS') {
                            stats.commissionTotal += commissionAmount
                        }
                    }
                } else {
                    stats.withoutCommission++
                }
                
            } catch (error) {
                console.log(`⚠️ Error processing order ${order.ID}: ${error.message}`)
                stats.errors++
            }
        }
        
        // Insert transactions
        if (transactionsToCreate.length > 0 && !DRY_RUN) {
            try {
                const result = await prisma.transaction.createMany({
                    data: transactionsToCreate,
                    skipDuplicates: true
                })
                
                stats.imported += result.count || transactionsToCreate.length
                console.log(`   ✅ Imported ${result.count || transactionsToCreate.length} transactions`)
                
            } catch (error) {
                console.log(`   ❌ Error importing transactions: ${error.message}`)
                stats.errors += transactionsToCreate.length
            }
        } else if (transactionsToCreate.length > 0) {
            console.log(`   ℹ️ Would import ${transactionsToCreate.length} transactions (DRY RUN)`)
            stats.imported += transactionsToCreate.length
        }
        
        // Note: Commission creation would need separate handling after transactions are created
        // For now, we're focusing on transaction import
        if (commissionsToCreate.length > 0) {
            console.log(`   💰 Commission data: ${commissionsToCreate.length} records`)
        }
    }
    
    return stats
}

async function main() {
    try {
        console.log('🚀 FINAL SAFE IMPORT TO NEON DATABASE')
        console.log('═'.repeat(50))
        console.log(`📅 Date: ${new Date().toLocaleString('id-ID')}`)
        console.log(`🔧 Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`)
        console.log('═'.repeat(50))
        
        // Step 1: Fetch Sejoli data
        const { orders, commissionLookup } = await fetchSejoliData()
        
        // Step 2: Check existing data in NEON
        const existingData = await checkExistingData()
        
        // Step 3: Import to NEON
        const stats = await importToNeon(orders, commissionLookup, existingData)
        
        // Final report
        console.log('\n' + '═'.repeat(50))
        console.log('📊 IMPORT SUMMARY')
        console.log('═'.repeat(50))
        console.log(`📦 Total Sejoli orders: ${stats.total.toLocaleString()}`)
        console.log(`📂 Already in NEON: ${existingData.count.toLocaleString()}`)
        console.log(`🔄 Duplicates skipped: ${stats.duplicates.toLocaleString()}`)
        console.log(`✨ New to import: ${stats.toImport.toLocaleString()}`)
        console.log(`✅ Successfully imported: ${stats.imported.toLocaleString()}`)
        console.log(`❌ Errors: ${stats.errors.toLocaleString()}`)
        console.log()
        console.log(`💰 Total revenue: Rp. ${stats.revenue.toLocaleString()}`)
        console.log(`🏆 Total commissions: Rp. ${stats.commissionTotal.toLocaleString()}`)
        console.log(`📈 Commission rate: ${(stats.commissionTotal / stats.revenue * 100).toFixed(1)}%`)
        console.log()
        console.log(`✅ Orders with commission: ${stats.withCommission.toLocaleString()}`)
        console.log(`⚪ Orders without commission: ${stats.withoutCommission.toLocaleString()}`)
        console.log('═'.repeat(50))
        
        if (DRY_RUN) {
            console.log('\n⚠️ This was a DRY RUN - no data was actually inserted')
            console.log('Set DRY_RUN = false to execute the import')
        } else {
            console.log('\n✅ IMPORT COMPLETE!')
        }
        
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message)
        console.error(error.stack)
    } finally {
        await prisma.$disconnect()
    }
}

main()
