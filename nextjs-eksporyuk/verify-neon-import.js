/**
 * VERIFY NEON IMPORT RESULTS
 * ============================
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyImport() {
    try {
        console.log('\n🔍 VERIFYING SEJOLI IMPORT IN NEON')
        console.log('═'.repeat(50))
        
        // Count transactions
        const totalTransactions = await prisma.transaction.count({
            where: {
                externalId: { startsWith: 'SEJOLI-' }
            }
        })
        
        const successTransactions = await prisma.transaction.count({
            where: {
                externalId: { startsWith: 'SEJOLI-' },
                status: 'SUCCESS'
            }
        })
        
        const failedTransactions = await prisma.transaction.count({
            where: {
                externalId: { startsWith: 'SEJOLI-' },
                status: 'FAILED'
            }
        })
        
        const pendingTransactions = await prisma.transaction.count({
            where: {
                externalId: { startsWith: 'SEJOLI-' },
                status: 'PENDING'
            }
        })
        
        // Calculate revenue
        const revenueResult = await prisma.transaction.aggregate({
            where: {
                externalId: { startsWith: 'SEJOLI-' },
                status: 'SUCCESS'
            },
            _sum: {
                amount: true
            }
        })
        
        const totalRevenue = parseFloat(revenueResult._sum.amount || 0)
        
        // Sample transactions
        const samples = await prisma.transaction.findMany({
            where: {
                externalId: { startsWith: 'SEJOLI-' }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        })
        
        // Check unique products
        const transactions = await prisma.transaction.findMany({
            where: {
                externalId: { startsWith: 'SEJOLI-' }
            },
            select: {
                metadata: true
            }
        })
        
        const productIds = new Set()
        transactions.forEach(t => {
            if (t.metadata && typeof t.metadata === 'object' && 'productId' in t.metadata) {
                productIds.add(t.metadata.productId)
            }
        })
        
        // Display results
        console.log('\n📊 TRANSACTION COUNTS')
        console.log('━'.repeat(50))
        console.log(`✅ Total Sejoli transactions: ${totalTransactions.toLocaleString()}`)
        console.log(`  └─ SUCCESS: ${successTransactions.toLocaleString()}`)
        console.log(`  └─ FAILED: ${failedTransactions.toLocaleString()}`)
        console.log(`  └─ PENDING: ${pendingTransactions.toLocaleString()}`)
        
        console.log('\n💰 REVENUE')
        console.log('━'.repeat(50))
        console.log(`Total revenue (SUCCESS): Rp. ${totalRevenue.toLocaleString()}`)
        
        console.log('\n📦 UNIQUE PRODUCTS')
        console.log('━'.repeat(50))
        console.log(`Total unique products: ${productIds.size}`)
        
        console.log('\n🔍 LATEST 10 TRANSACTIONS')
        console.log('━'.repeat(50))
        samples.forEach((tx, i) => {
            const metadata = tx.metadata
            console.log(`${i+1}. ${tx.externalId}`)
            console.log(`   Amount: Rp. ${parseFloat(tx.amount).toLocaleString()}`)
            console.log(`   Status: ${tx.status}`)
            if (metadata && typeof metadata === 'object') {
                console.log(`   Product: ${metadata.productName || 'N/A'}`)
                console.log(`   Sejoli User: ${metadata.sejoliUserId || 'N/A'}`)
            }
            console.log(`   Date: ${tx.createdAt.toLocaleDateString('id-ID')}`)
        })
        
        console.log('\n✅ VERIFICATION COMPLETE')
        console.log('═'.repeat(50))
        
    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

verifyImport()
