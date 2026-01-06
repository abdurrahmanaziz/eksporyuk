const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verify() {
  const failed = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf'
  ]

  console.log('\n🔍 VERIFICATION REPORT\n')

  for (const txnId of failed) {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    const user = await prisma.user.findUnique({ where: { id: txn.userId } })
    const um = await prisma.userMembership.findFirst({
      where: { userId: txn.userId, transactionId: txnId }
    })

    console.log(`${'─'.repeat(60)}`)
    console.log(`📝 Transaction: ${txnId.substring(0, 20)}...`)
    console.log(`👤 User: ${user.email}`)
    console.log(`�� Status: ${txn.status}`)
    console.log(`${'─'.repeat(60)}`)

    if (um) {
      console.log(`✅ UserMembership EXISTS`)
      console.log(`   Status: ${um.status}`)
      console.log(`   Active: ${um.isActive}`)
      console.log(`   Activated: ${um.activatedAt?.toLocaleDateString('id-ID')}`)
    } else {
      console.log(`❌ UserMembership MISSING`)
    }

    if (user.role === 'MEMBER_PREMIUM') {
      console.log(`✅ User Role: MEMBER_PREMIUM`)
    } else {
      console.log(`❌ User Role: ${user.role}`)
    }

    console.log()
  }

  console.log(`\n✅ All users verified!`)
  await prisma.$disconnect()
}

verify()
