const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find pending transactions
  const transactions = await prisma.transaction.findMany({
    where: { status: 'PENDING' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      originalAmount: true,
      discountAmount: true,
      metadata: true,
      description: true
    }
  })
  
  console.log('Pending Transactions:')
  transactions.forEach(tx => {
    console.log('\n---')
    console.log('Invoice:', tx.invoiceNumber)
    console.log('Amount:', tx.amount)
    console.log('OriginalAmount:', tx.originalAmount)
    console.log('DiscountAmount:', tx.discountAmount)
    console.log('Metadata:', JSON.stringify(tx.metadata, null, 2))
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
