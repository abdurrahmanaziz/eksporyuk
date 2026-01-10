const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Check if UserMembership exists for these transactions
  const failedTxns = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf'
  ]

  console.log('CHECKING WHY UserMembership WASN\'T CREATED\n')

  for (const txId of failedTxns) {
    const tx = await prisma.transaction.findUnique({
      where: { id: txId }
    })

    const um = await prisma.userMembership.findFirst({
      where: { transactionId: txId }
    })

    const membership = tx?.membershipId || tx?.metadata?.membershipId
      ? await prisma.membership.findUnique({
          where: { id: tx?.membershipId || tx?.metadata?.membershipId }
        })
      : null

    console.log(`\n📋 TXN: ${txId}`)
    console.log(`   User ID: ${tx?.userId}`)
    console.log(`   Membership ID: ${tx?.membershipId || tx?.metadata?.membershipId}`)
    console.log(`   Membership Exists: ${membership ? '✅' : '❌ NOT FOUND'}`)
    console.log(`   UserMembership Created: ${um ? '✅ YES' : '❌ NO'}`)

    if (!um && membership) {
      console.log(`\n   💡 PROBLEM: Membership exists but webhook didn't create UserMembership`)
      console.log(`      Possible causes:`)
      console.log(`      1. Webhook handler not reached (POST /api/webhooks/xendit not called)`)
      console.log(`      2. Webhook handler crashed silently`)
      console.log(`      3. UserMembership.create() failed`)

      // Check if there are similar users to understand the pattern
      const userMemberships = await prisma.userMembership.findMany({
        where: { userId: tx?.userId },
        take: 5
      })
      
      console.log(`      4. User has other memberships: ${userMemberships.length > 0 ? 'YES' : 'NO'}`)
      
      if (userMemberships.length > 0) {
        console.log(`         Existing memberships:`)
        for (const um of userMemberships) {
          console.log(`         - ${um.membershipId} (${um.status})`)
        }
      }
    }
  }

  await prisma.$disconnect()
}

main().catch(console.error)
