const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function trace() {
  const failed = ['txn_1767537356659_7qc99jkqobv', 'txn_1767578418600_ei37idl5dpe', 'txn_1767664508504_y5z6jdh50zf']

  for (const txnId of failed) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`TXN: ${txnId}`)

    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    const user = await prisma.user.findUnique({ where: { id: txn.userId } })

    console.log(`Status: ${txn.status} | Type: ${txn.type}`)
    console.log(`User: ${user.email} | Role: ${user.role}`)
    console.log(`membershipId: ${txn.membershipId || txn.metadata?.membershipId || 'NONE'}`)

    const um = await prisma.userMembership.findFirst({
      where: { userId: txn.userId, transactionId: txnId }
    })

    const allUM = await prisma.userMembership.findMany({
      where: { userId: txn.userId },
      include: { membership: { select: { name: true } } }
    })

    console.log(`\n✅ UserMembership for THIS txn: ${um ? 'YES' : 'NO'}`)
    console.log(`📦 User has ${allUM.length} membership(s):`)
    allUM.forEach(u => {
      const marker = u.transactionId === txnId ? '→ ' : '  '
      console.log(`${marker}${u.membership.name} (${u.status}, active=${u.isActive})`)
    })

    console.log(`\n🔍 Issue: Webhook did NOT create UserMembership`)
  }
  await prisma.$disconnect()
}

trace()
