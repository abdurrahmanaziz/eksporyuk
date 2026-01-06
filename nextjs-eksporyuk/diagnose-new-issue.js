const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function diagnose() {
  const txnId = 'txn_1767578979716_psftdqns4jb'
  const userId = 'cmjmtou2e001fitz0pjwgpl60'
  
  console.log(`\n🔍 DIAGNOSING WHY FIX DIDN'T WORK\n`)
  
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
  
  console.log(`Transaction: ${txn.id}`)
  console.log(`Status: ${txn.status}`)
  console.log(`Created: ${txn.createdAt.toLocaleString('id-ID')}`)
  console.log(`User: ${userId}`)
  
  const membershipId = txn.membershipId || txn.metadata?.membershipId
  console.log(`\nmembershipId: ${membershipId}`)
  
  const mem = await prisma.membership.findUnique({
    where: { id: membershipId }
  })
  
  if (!mem) {
    console.log(`❌ PROBLEM 1: Membership record doesn't exist!`)
  } else {
    console.log(`Membership exists: ${mem.name}`)
  }

  // Check if webhook created the UM
  const um = await prisma.userMembership.findFirst({
    where: {
      userId: userId,
      transactionId: txnId
    }
  })

  console.log(`\nUserMembership for THIS txn: ${um ? 'EXISTS' : 'MISSING'}`)

  // Check all user memberships
  const allUM = await prisma.userMembership.findMany({
    where: { userId: userId }
  })

  console.log(`\nUser's all memberships (${allUM.length}):`)
  for (const u of allUM) {
    console.log(`  - TXN=${u.transactionId.substring(0, 20)}... / memberId=${u.membershipId}`)
  }

  // Is user in MEMBER_FREE?
  const user = await prisma.user.findUnique({ where: { id: userId } })
  console.log(`\nUser role: ${user.role}`)

  // Key question: Did webhook even run?
  // Check if there's any indication webhook was called
  console.log(`\n🤔 ANALYSIS:`)
  
  if (!um && allUM.length === 0) {
    console.log(`❌ ISSUE: Webhook NEVER RAN`)
    console.log(`   - User has NO memberships (old or new)`)
    console.log(`   - Most likely: Webhook signature verification failed OR webhook endpoint not called`)
  } else if (!um && allUM.length > 0) {
    console.log(`⚠️  ISSUE: Webhook PARTIALLY RAN`)
    console.log(`   - Old memberships were deactivated`)
    console.log(`   - But UserMembership.upsert() FAILED`)
    console.log(`   - Check: Is Prisma update deployed to production?`)
  }

  await prisma.$disconnect()
}

diagnose()
