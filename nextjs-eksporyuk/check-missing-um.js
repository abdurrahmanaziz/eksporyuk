const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const txnId = 'txn_1767578418600_ei37idl5dpe'
  
  console.log(`\n🔍 CHECKING MISSING UserMembership\n`)
  
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
  
  console.log(`Transaction: ${txnId}`)
  console.log(`User: ${txn.userId}`)
  console.log(`Status: ${txn.status}`)
  
  const user = await prisma.user.findUnique({ where: { id: txn.userId } })
  console.log(`User email: ${user.email}`)
  console.log(`User role: ${user.role}`)
  
  const membershipId = txn.membershipId || txn.metadata?.membershipId
  console.log(`\nmembershipId: ${membershipId}`)
  
  // Check for THIS txn's UM
  const thisUM = await prisma.userMembership.findFirst({
    where: { userId: txn.userId, transactionId: txnId }
  })
  
  console.log(`\nUserMembership for THIS txn: ${thisUM ? '✅' : '❌'}`)
  
  // Check ALL user's UMs
  const allUMs = await prisma.userMembership.findMany({
    where: { userId: txn.userId }
  })
  
  console.log(`\nUser's total memberships: ${allUMs.length}`)
  for (const um of allUMs) {
    console.log(`  - TXN=${um.transactionId?.substring(0, 20) || 'NULL'}... / memberId=${um.membershipId} / status=${um.status}`)
  }
  
  if (!thisUM && allUMs.length > 0) {
    console.log(`\n⚠️  UM was created but now missing!`)
    console.log(`   This suggests it was deleted or had an issue`)
  }
  
  await prisma.$disconnect()
}

check()
