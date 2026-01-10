const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function audit() {
  console.log(`\n${'='.repeat(70)}`)
  console.log('FINAL COMPREHENSIVE AUDIT - All Payment Transactions')
  console.log('='.repeat(70) + '\n')

  // Check all SUCCESS membership transactions
  const allTxns = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      status: 'SUCCESS'
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`1️⃣  CHECKING ALL ${allTxns.length} SUCCESSFUL MEMBERSHIP TRANSACTIONS\n`)

  let problemTxns = []

  for (const txn of allTxns) {
    const membershipId = txn.membershipId || txn.metadata?.membershipId
    
    if (!membershipId) {
      problemTxns.push({ txnId: txn.id, issue: 'NO membershipId' })
      continue
    }

    const um = await prisma.userMembership.findFirst({
      where: { userId: txn.userId, transactionId: txn.id }
    })

    if (!um) {
      problemTxns.push({
        txnId: txn.id,
        userId: txn.userId,
        issue: 'UserMembership NOT CREATED'
      })
    }
  }

  if (problemTxns.length === 0) {
    console.log(`✅ ALL ${allTxns.length} transactions have UserMembership created\n`)
  } else {
    console.log(`❌ PROBLEMS FOUND: ${problemTxns.length} transactions\n`)
    problemTxns.forEach(p => {
      console.log(`  - ${p.txnId}: ${p.issue}`)
    })
  }

  // Check 4 known transactions
  console.log(`\n2️⃣  VALIDATING 4 REFERENCE TRANSACTIONS\n`)

  const refTxns = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf',
    'txn_1767578979716_psftdqns4jb'
  ]

  let validCount = 0

  for (const txnId of refTxns) {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    if (!txn) {
      console.log(`⚠️  ${txnId.substring(0, 25)}... - NOT FOUND`)
      continue
    }

    const um = await prisma.userMembership.findFirst({
      where: { userId: txn.userId, transactionId: txnId }
    })

    const user = await prisma.user.findUnique({ where: { id: txn.userId } })

    if (um && (user.role === 'MEMBER_PREMIUM' || user.role === 'MENTOR')) {
      console.log(`✅ ${txnId.substring(0, 25)}... - Valid (${user.role})`)
      validCount++
    } else {
      console.log(`❌ ${txnId.substring(0, 25)}... - PROBLEM`)
      if (!um) console.log(`   - UM missing`)
      if (user.role === 'MEMBER_FREE') console.log(`   - Wrong role`)
    }
  }

  console.log(`\n✅ ${validCount}/${refTxns.length} reference transactions valid\n`)

  // Check for MEMBER_FREE with active memberships
  console.log(`3️⃣  CHECKING FOR ROLE/MEMBERSHIP MISMATCHES\n`)

  const memberFreeUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_FREE' }
  })

  let mismatches = 0

  for (const user of memberFreeUsers) {
    const activeUM = await prisma.userMembership.findFirst({
      where: { userId: user.id, isActive: true, status: 'ACTIVE' }
    })

    if (activeUM) {
      console.log(`⚠️  ${user.email} - MEMBER_FREE but has ACTIVE membership`)
      mismatches++
    }
  }

  if (mismatches === 0) {
    console.log(`✅ No role/membership mismatches found\n`)
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`)
  console.log('AUDIT SUMMARY')
  console.log('='.repeat(70))

  const totalIssues = problemTxns.length + (4 - validCount) + mismatches

  console.log(`
Total SUCCESS membership transactions: ${allTxns.length}
Transactions with UserMembership: ${allTxns.length - problemTxns.length}
Transactions without UserMembership: ${problemTxns.length}
Valid reference transactions: ${validCount}/4
Role/membership mismatches: ${mismatches}

${totalIssues === 0 ? '✅ SYSTEM HEALTHY - ALL CLEAR' : `⚠️  TOTAL ISSUES: ${totalIssues}`}
`)

  console.log('='.repeat(70) + '\n')

  await prisma.$disconnect()
}

audit().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
