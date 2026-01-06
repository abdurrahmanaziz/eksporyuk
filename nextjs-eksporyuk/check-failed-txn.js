const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const failedTxns = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf'
  ]

  for (const id of failedTxns) {
    const tx = await prisma.transaction.findUnique({
      where: { id }
    })

    console.log(`\n🔍 Transaction: ${id}`)
    console.log(`   Status: ${tx?.status}`)
    console.log(`   Type: ${tx?.type}`)
    console.log(`   membershipId: ${tx?.membershipId || 'NULL ❌'}`)
    console.log(`   metadata.membershipId: ${tx?.metadata?.membershipId || 'NULL ❌'}`)
    console.log(`   paidAt: ${tx?.paidAt}`)
    console.log(`   metadata: ${JSON.stringify(tx?.metadata, null, 2)}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
