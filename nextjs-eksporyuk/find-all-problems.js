const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findProblems() {
  console.log(`\n🔍 FINDING ALL PROBLEMATIC TRANSACTIONS\n`)
  
  // Get ALL SUCCESS membership transactions
  const txns = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      status: 'SUCCESS'
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Total SUCCESS transactions: ${txns.length}\n`)

  const problems = []

  for (const txn of txns) {
    const membershipId = txn.membershipId || txn.metadata?.membershipId
    
    if (!membershipId) {
      console.log(`⚠️  ${txn.id} - NO membershipId`)
      continue
    }

    const um = await prisma.userMembership.findFirst({
      where: {
        userId: txn.userId,
        transactionId: txn.id
      }
    })

    if (!um) {
      const user = await prisma.user.findUnique({ where: { id: txn.userId } })
      problems.push({
        txnId: txn.id,
        userId: txn.userId,
        userEmail: user?.email || 'UNKNOWN',
        membershipId: membershipId,
        createdAt: txn.createdAt
      })
      
      console.log(`❌ ${txn.id}`)
      console.log(`   User: ${user?.email} (${txn.userId})`)
      console.log(`   Membership: ${membershipId}`)
      console.log(`   Created: ${txn.createdAt.toLocaleString('id-ID')}`)
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUMMARY: Found ${problems.length} problematic transactions\n`)

  if (problems.length > 0) {
    console.log('Details:')
    problems.forEach((p, i) => {
      console.log(`${i+1}. ${p.txnId}`)
      console.log(`   User: ${p.userEmail}`)
      console.log(`   Date: ${p.createdAt.toLocaleDateString('id-ID')}`)
    })
  }

  await prisma.$disconnect()
}

findProblems()
