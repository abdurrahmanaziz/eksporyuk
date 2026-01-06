const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  try {
    // Just check first transaction
    const txn = await prisma.transaction.findUnique({
      where: { id: 'txn_1767537356659_7qc99jkqobv' }
    })
    
    if (!txn) {
      console.log('Transaction not found')
      process.exit(1)
    }

    console.log('TXN Found:', txn.status)
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: txn.userId }
    })
    console.log('User:', user.email, user.role)
    
    // Get memberships for this user
    const ums = await prisma.userMembership.findMany({
      where: { userId: txn.userId }
    })
    
    console.log(`User has ${ums.length} memberships:`)
    ums.forEach(um => {
      console.log(`  - TXN: ${um.transactionId} / Status: ${um.status}`)
    })
    
  } finally {
    await prisma.$disconnect()
  }
}

check()
