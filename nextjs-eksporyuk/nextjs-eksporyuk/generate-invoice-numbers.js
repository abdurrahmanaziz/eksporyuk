/**
 * Simple Fix: Generate Invoice Numbers
 * Generate INV format for all transactions without invoiceNumber
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateInvoiceNumbers() {
  console.log('📄 Generating Invoice Numbers...\n')

  // Get transactions without invoice number
  const txWithoutInvoice = await prisma.transaction.findMany({
    where: {
      OR: [
        { invoiceNumber: null },
        { invoiceNumber: '' }
      ]
    },
    orderBy: { createdAt: 'asc' }
  })

  console.log(`Found ${txWithoutInvoice.length} transactions without invoice number\n`)

  if (txWithoutInvoice.length === 0) {
    console.log('✅ All transactions already have invoice numbers!')
    return
  }

  // Get last invoice number to continue sequence
  const lastInvoice = await prisma.transaction.findFirst({
    where: {
      invoiceNumber: {
        startsWith: 'INV',
        not: null
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let nextNumber = 1
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/INV(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }

  console.log(`Starting from: INV${String(nextNumber).padStart(6, '0')}\n`)

  let generated = 0
  let errors = []

  for (const tx of txWithoutInvoice) {
    try {
      const invoiceNumber = `INV${String(nextNumber).padStart(6, '0')}`
      
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { invoiceNumber }
      })

      generated++
      nextNumber++

      if (generated % 100 === 0) {
        console.log(`   Progress: ${generated}/${txWithoutInvoice.length} generated...`)
      }

    } catch (error) {
      errors.push({ txId: tx.id, error: error.message })
      console.error(`   ❌ Error for TX ${tx.id}:`, error.message)
    }
  }

  console.log(`\n✅ Successfully generated ${generated} invoice numbers`)
  
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`)
  }

  // Verify
  const remaining = await prisma.transaction.count({
    where: {
      OR: [
        { invoiceNumber: null },
        { invoiceNumber: '' }
      ]
    }
  })

  console.log(`\n📊 Verification:`)
  console.log(`   Before: ${txWithoutInvoice.length} without invoice`)
  console.log(`   Generated: ${generated}`)
  console.log(`   Remaining: ${remaining}`)
  
  if (remaining === 0) {
    console.log(`   ✅ All transactions now have invoice numbers!`)
  }
}

generateInvoiceNumbers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
