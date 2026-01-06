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
      where: { id: txId }
    })

    const user = await prisma.user.findUnique({
      where: { id: tx.userId }
    })

    console.log(`Status: ${tx.status}`)
    console.log(`User: ${user.email}`)
    console.log(`Amount: ${tx.amount}`)
    console.log(`Type: ${tx.type}`)
    console.log(`membershipId: ${tx.membershipId || 'NULL'}`)
    console.log(`metadata.membershipId: ${tx.metadata?.membershipId || 'NULL'}`)
    console.log(`User role: ${user.role}`)
    
    // Get all UserMembership for this user
    const allUM = await prisma.userMembership.findMany({
      where: { userId: tx.userId },
      include: { membership: true }
    })
    
    console.log(`\nUser memberships (${allUM.length} total):`)
    for (const um of allUM) {
      const isThisTxn = um.transactionId === txId
      const marker = isThisTxn ? '✅ THIS TXN' : '  OTHER'
      console.log(`${marker}: ${um.membership.name} (${um.status}, active=${um.isActive})`)
      console.log(`         txnId=${um.transactionId}`)
    }

    // Check if webhook created UM for THIS transaction
    const thisUM = await prisma.userMembership.findFirst({
      where: {
        userId: tx.userId,
        transactionId: txId
      }
    })

    console.log(`\n🔍 Result:`)
    if (thisUM) {
      console.log(`✅ UserMembership CREATED for this transaction`)
    } else {
      console.log(`❌ UserMembership NOT CREATED for this transaction`)
      if (allUM.length > 0) {
        console.log(`⚠️  User HAS other memberships → Webhook likely did NOT run or failed`)
      }
    }
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e)
  process.exit(1)
})
