const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const txnId = 'txn_1767578979716_psftdqn'
  
  console.log(`\n🔍 INVESTIGATING NEW PROBLEM TRANSACTION\n`)
  
  const txn = await prisma.transaction.findUnique({ 
    where: { id: txnId } 
  })
  
  const user = await prisma.user.findUnique({ 
    where: { id: txn.userId } 
  })

  console.log(`Transaction ID: ${txn.id}`)
  console.log(`Status: ${txn.status}`)
  console.log(`Type: ${txn.type}`)
  console.log(`Amount: Rp${txn.amount}`)
  console.log(`Created: ${txn.createdAt.toLocaleString('id-ID')}`)
  console.log(`\nUser ID: ${txn.userId}`)
  console.log(`Email: ${user.email}`)
  console.log(`Role: ${user.role}`)
  
  const membershipId = txn.membershipId || txn.metadata?.membershipId
  console.log(`\nmembershipId (direct): ${txn.membershipId || 'NULL'}`)
  console.log(`membershipId (metadata): ${txn.metadata?.membershipId || 'NULL'}`)
  
  const mem = await prisma.membership.findUnique({
    where: { id: membershipId }
  })
  if (mem) {
    console.log(`Membership: ${mem.name} (${mem.duration})`)
  }

  // Check UserMembership
  const um = await prisma.userMembership.findFirst({
    where: { userId: txn.userId, transactionId: txnId }
  })

  console.log(`\nUserMembership for THIS txn: ${um ? '✅ EXISTS' : '❌ MISSING'}`)

  // Check all user memberships
  const allUM = await prisma.userMembership.findMany({
    where: { userId: txn.userId }
  })

  console.log(`\nUser has ${allUM.length} total memberships:`)
  for (const u of allUM) {
    const isCurrent = u.transactionId === txnId
    console.log(`  ${isCurrent ? '→ ' : '  '}TXN=${u.transactionId}, memberId=${u.membershipId}, status=${u.status}, active=${u.isActive}`)
  }

  // Check for duplicate constraint
  if (!um && membershipId) {
    const existing = await prisma.userMembership.findFirst({
      where: {
        userId: txn.userId,
        membershipId: membershipId,
        transactionId: { not: txnId }
      }
    })
    if (existing) {
      console.log(`\n⚠️  CAUSE: User already has UserMembership with same membershipId`)
      console.log(`   Existing UM transactionId: ${existing.transactionId}`)
      console.log(`   This should have been handled by upsert() pattern`)
    }
  }

  await prisma.$disconnect()
}

check()
