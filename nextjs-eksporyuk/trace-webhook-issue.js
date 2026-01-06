const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function trace() {
  try {
    // Check all 3 failed transactions
    const failed = [
      'txn_1767537356659_7qc99jkqobv',
      'txn_1767578418600_ei37idl5dpe', 
      'txn_1767664508504_y5z6jdh50zf'
    ]

    for (const txnId of failed) {
      console.log(`\n${'='.repeat(70)}`)
      console.log(`Tracing: ${txnId}`)
      console.log('='.repeat(70))

      const txn = await prisma.transaction.findUnique({
        where: { id: txnId },
        select: {
          id: true,
          externalId: true,
          userId: true,
          type: true,
          status: true,
          membershipId: true,
          metadata: true,
          paidAt: true,
          createdAt: true,
          user: {
            select: { email: true, role: true }
          }
        }
      })

      if (!txn) {
        console.log('❌ Transaction not found!')
        continue
      }

      console.log(`Status: ${txn.status}`)
      console.log(`Type: ${txn.type}`)
      console.log(`User: ${txn.user.email} (role=${txn.user.role})`)
      console.log(`User ID: ${txn.userId}`)
      console.log(`membershipId: ${txn.membershipId || 'NULL'}`)
      console.log(`metadata.membershipId: ${txn.metadata?.membershipId || 'NULL'}`)
      console.log(`paidAt: ${txn.paidAt}`)
      console.log(`createdAt: ${txn.createdAt}`)

      // Get the membership
      const memId = txn.membershipId || txn.metadata?.membershipId
      if (memId) {
        const mem = await prisma.membership.findUnique({
          where: { id: memId },
          select: { id: true, name: true, duration: true }
        })
        if (mem) {
          console.log(`Membership: ${mem.name} (${mem.duration})`)
        }
      }

      // Check UserMembership for THIS transaction
      const um = await prisma.userMembership.findFirst({
        where: {
          userId: txn.userId,
          transactionId: txnId
        },
        select: {
          id: true,
          status: true,
          isActive: true,
          activatedAt: true
        }
      })

      console.log(`\nUserMembership for this txn: ${um ? '✅ EXISTS' : '❌ MISSING'}`)
      if (um) {
        console.log(`  Status: ${um.status}`)
        console.log(`  Active: ${um.isActive}`)
        console.log(`  Activated: ${um.activatedAt}`)
      }

      // Check ALL UserMemberships for user
      const allUMs = await prisma.userMembership.findMany({
        where: { userId: txn.userId },
        select: {
          id: true,
          transactionId: true,
          status: true,
          isActive: true,
          membership: { select: { name: true } }
        }
      })

      console.log(`\nAll user's memberships (${allUMs.length}):`)
      for (const u of allUMs) {
        const isCurrent = u.transactionId === txnId
        console.log(`  ${isCurrent ? '>>> ' : '    '}${u.membership.name} / TXN=${u.transactionId} / Status=${u.status}`)
      }

      // Try to understand what should happen
      console.log(`\n🔍 Analysis:`)
      if (txn.type === 'MEMBERSHIP') {
        if (!memId) {
          console.log(`❌ PROBLEM: Transaction type is MEMBERSHIP but no membershipId found!`)
        } else if (!um) {
          console.log(`❌ PROBLEM: Webhook should have created UserMembership but didn't`)
          console.log(`   Possible reasons:`)
          console.log(`   1. Webhook never called (check if external_id exists)`)
          console.log(`   2. Webhook failed silently (check server logs)`)
          console.log(`   3. Database constraint violation (check schema)`)
        }
      }

      // Check for duplicate memberships (possible constraint issue)
      if (memId && allUMs.length > 0) {
        const sameMem = allUMs.find(u => u.membership.name === allUMs[0].membership.name && u.isActive)
        if (sameMem && sameMem.transactionId !== txnId) {
          console.log(`\n⚠️  User already has ACTIVE membership of this type!`)
          console.log(`   Could cause: unique constraint violation on (userId, membershipId)`)
        }
      }
    }

  } finally {
    await prisma.$disconnect()
  }
}

trace().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
