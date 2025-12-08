/**
 * Test script untuk Invoice Number Generator
 * Run: node test-invoice-generator.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateInvoiceNumber() {
  try {
    // Get last transaction ordered by createdAt
    const lastTransaction = await prisma.transaction.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true
      }
    })

    let invoiceNumber = 1

    if (lastTransaction && lastTransaction.id.startsWith('INV')) {
      // Extract number from INV001, INV002, etc.
      const lastNumber = parseInt(lastTransaction.id.replace('INV', ''))
      if (!isNaN(lastNumber)) {
        invoiceNumber = lastNumber + 1
      }
    }

    // Format: INV001, INV002, ..., INV999, INV1000, etc.
    const paddedNumber = invoiceNumber.toString().padStart(3, '0')
    return `INV${paddedNumber}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    return `INV${Date.now().toString().slice(-6)}`
  }
}

async function testInvoiceGeneration() {
  console.log('🧪 Testing Invoice Number Generation...\n')

  try {
    // Test 1: Get current last invoice
    console.log('📋 Test 1: Checking last invoice in database')
    const lastTx = await prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true }
    })
    
    if (lastTx) {
      console.log(`   Last Invoice: ${lastTx.id}`)
      console.log(`   Created: ${lastTx.createdAt.toLocaleString('id-ID')}\n`)
    } else {
      console.log('   No transactions found (database empty)\n')
    }

    // Test 2: Generate next invoice numbers
    console.log('📋 Test 2: Generating next invoice numbers')
    const invoice1 = await generateInvoiceNumber()
    console.log(`   Next Invoice: ${invoice1}`)
    
    // Simulate second call
    const invoice2 = `INV${(parseInt(invoice1.replace('INV', '')) + 1).toString().padStart(3, '0')}`
    console.log(`   After that: ${invoice2}`)
    
    const invoice3 = `INV${(parseInt(invoice2.replace('INV', '')) + 1).toString().padStart(3, '0')}`
    console.log(`   Then: ${invoice3}\n`)

    // Test 3: Count transactions by status
    console.log('📊 Test 3: Transaction statistics')
    const totalCount = await prisma.transaction.count()
    const pendingCount = await prisma.transaction.count({ where: { status: 'PENDING' } })
    const successCount = await prisma.transaction.count({ where: { status: 'SUCCESS' } })
    
    console.log(`   Total Transactions: ${totalCount}`)
    console.log(`   Pending: ${pendingCount}`)
    console.log(`   Success: ${successCount}\n`)

    // Test 4: Show recent transactions
    console.log('📋 Test 4: Recent transactions (last 5)')
    const recentTx = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        paymentMethod: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (recentTx.length > 0) {
      recentTx.forEach((tx, idx) => {
        console.log(`   ${idx + 1}. ${tx.id}`)
        console.log(`      User: ${tx.user?.name || 'N/A'}`)
        console.log(`      Amount: Rp ${Number(tx.amount).toLocaleString('id-ID')}`)
        console.log(`      Status: ${tx.status}`)
        console.log(`      Payment: ${tx.paymentMethod || 'N/A'}`)
        console.log(`      Date: ${tx.createdAt.toLocaleString('id-ID')}\n`)
      })
    } else {
      console.log('   No transactions found\n')
    }

    console.log('✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
testInvoiceGeneration()
