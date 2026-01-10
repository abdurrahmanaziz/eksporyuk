const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const failedTxns = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe', 
    'txn_1767664508504_y5z6jdh50zf'
  ]

  for (const txId of failedTxns) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Transaction: ${txId}`)
    console.log('='.repeat(60))

    const tx = await prisma.transaction.findUnique({
      where: { id: txId },
      include: { user: true }
    })

    console.log(`Status: ${tx.status}`)
    console.log(`User: ${tx.user.email}`)
    console.log(`Amount: ${tx.amount}`)
    console.log(`Type: ${tx.type}`)
    console.log(`membershipId: ${tx.membershipId || 'NULL'}`)
    console.log(`metadata.membershipId: ${tx.metadata?.membershipId || 'NULL'}`)
    
    // Get all UserMembership for this user
    const allUM = await prisma.userMembership.findMany({
      where: { userId: tx.userId },
      include: { membership: true }
    })
    
    console.log(`\nUser's all memberships:`)
    for (const um of allUM) {
      console.log(`  - ${um.membership.name} (${um.status}, isActive=${um.isActive})`)
      console.log(`    transactionId: ${um.transactionId}`)
      console.log(`    activatedAt: ${um.activatedAt}`)
    }

    // Check if webhook was called (look for any UM with same transactionId)
    const thisUM = await prisma.userMembership.findFirst({
      where: {
        userId: tx.userId,
        transactionId: txId
      }
    })

    console.log(`\n✅ UserMembership for THIS transaction: ${thisUM ? 'EXISTS' : '❌ MISSING'}`)
    
    if (!thisUM && allUM.length > 0) {
      console.log(`⚠️  User HAS other memberships but NOT for this transaction`)
      console.log(`⚠️  This suggests webhook did NOT create UserMembership for this payment`)
    }

    // Check user role
    console.log(`\nUser role: ${tx.user.role}`)
    if (tx.user.role === 'MEMBER_PREMIUM') {
      console.log(`✅ Role is MEMBER_PREMIUM`)
    } else {
      console.log(`❌ Role is ${tx.user.role} (should be MEMBER_PREMIUM)`)
    }
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e)
  process.exit(1)
})
