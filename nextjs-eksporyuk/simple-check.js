const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const txnId = 'txn_1767537356659_7qc99jkqobv'
  
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
  const user = await prisma.user.findUnique({ where: { id: txn.userId } })
  
  const ums = await prisma.userMembership.findMany({
    where: { userId: txn.userId }
  })
  
  console.log(`User: ${user.email} | Role: ${user.role}`)
  console.log(`TXN Status: ${txn.status}`)
  console.log(`TXN membershipId: ${txn.membershipId}`)
  console.log(`User has ${ums.length} memberships:`)
  ums.forEach(um => {
    console.log(`  TXN=${um.transactionId}, memberId=${um.membershipId}, status=${um.status}`)
  })
  
  const currentUM = ums.find(um => um.transactionId === txnId)
  console.log(`\n✅ Webhook created UM for this TXN: ${currentUM ? 'YES' : 'NO'}`)
  
  if (!currentUM && ums.length > 0) {
    console.log(`\n❌ Issue: User has memberships but NOT for this transaction`)
    console.log(`🔍 Webhook likely DID NOT run or FAILED to create the membership`)
  }
  
  await prisma.$disconnect()
}

check()
