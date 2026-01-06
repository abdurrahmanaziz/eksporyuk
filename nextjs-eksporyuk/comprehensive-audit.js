const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function audit() {
  console.log('\n========== COMPREHENSIVE PAYMENT AUDIT ==========\n')

  // 1. Check all MEMBERSHIP type transactions with SUCCESS status
  console.log('1️⃣  SCANNING ALL SUCCESSFUL MEMBERSHIP TRANSACTIONS...\n')
  
  const successTransactions = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      status: 'SUCCESS'
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${successTransactions.length} successful membership transactions\n`)

  let problemCount = 0
  let problematicTxns = []

  for (const txn of successTransactions) {
    const membershipId = txn.membershipId || txn.metadata?.membershipId
    if (!membershipId) {
      console.log(`⚠️  TXN ${txn.id}: NO membershipId found`)
      problemCount++
      problematicTxns.push(txn.id)
      continue
    }

    // Check if UserMembership exists for this transaction
    const um = await prisma.userMembership.findFirst({
      where: {
        userId: txn.userId,
        transactionId: txn.id
      }
    })

    if (!um) {
      console.log(`❌ TXN ${txn.id.substring(0, 25)}...`)
      console.log(`   User: ${txn.userId}`)
      console.log(`   membershipId: ${membershipId}`)
      console.log(`   Status: UserMembership NOT CREATED`)
      problemCount++
      problematicTxns.push(txn.id)
    }
  }

  if (problemCount === 0) {
    console.log(`✅ All ${successTransactions.length} transactions have UserMembership created\n`)
  } else {
    console.log(`\n⚠️  Found ${problemCount} transactions WITHOUT UserMembership\n`)
  }

  // 2. Check for users with MEMBER_FREE role but have active memberships
  console.log('2️⃣  CHECKING FOR MEMBER_FREE USERS WITH ACTIVE MEMBERSHIPS...\n')

  const memberFreeUsers = await prisma.user.findMany({
    where: { role: 'MEMBER_FREE' }
  })

  let inconsistentUsers = 0

  for (const user of memberFreeUsers) {
    const activeMemberships = await prisma.userMembership.findMany({
      where: {
        userId: user.id,
        isActive: true,
        status: 'ACTIVE'
      }
    })

    if (activeMemberships.length > 0) {
      console.log(`⚠️  User: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   But has ${activeMemberships.length} ACTIVE memberships!`)
      inconsistentUsers++
    }
  }

  if (inconsistentUsers === 0) {
    console.log(`✅ No inconsistencies found\n`)
  } else {
    console.log(`\n⚠️  Found ${inconsistentUsers} users with role/membership mismatch\n`)
  }

  // 3. Check for orphaned UserMemberships (no matching transaction)
  console.log('3️⃣  CHECKING FOR ORPHANED USERMEMBERSHIPS...\n')

  const allUMs = await prisma.userMembership.findMany({
    where: { transactionId: { not: null } }
  })

  let orphaned = 0
  for (const um of allUMs) {
    if (!um.transactionId) continue
    
    const txn = await prisma.transaction.findUnique({
      where: { id: um.transactionId }
    })

    if (!txn) {
      console.log(`❌ UserMembership ${um.id}`)
      console.log(`   References non-existent transaction: ${um.transactionId}`)
      orphaned++
    }
  }

  if (orphaned === 0) {
    console.log(`✅ All UserMemberships have valid transactions\n`)
  }

  // 4. Check for recent transactions (last 7 days)
  console.log('4️⃣  CHECKING RECENT TRANSACTIONS (Last 7 days)...\n')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const recentTxns = await prisma.transaction.findMany({
    where: {
      type: 'MEMBERSHIP',
      status: 'SUCCESS',
      createdAt: { gte: sevenDaysAgo }
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${recentTxns.length} recent successful membership transactions\n`)

  let recentProblems = 0
  for (const txn of recentTxns) {
    const membershipId = txn.membershipId || txn.metadata?.membershipId
    
    const um = await prisma.userMembership.findFirst({
      where: {
        userId: txn.userId,
        transactionId: txn.id
      }
    })

    if (!um) {
      console.log(`❌ RECENT PROBLEM: ${txn.id.substring(0, 25)}...`)
      console.log(`   Created: ${txn.createdAt.toLocaleDateString('id-ID')}`)
      recentProblems++
    }
  }

  if (recentProblems === 0) {
    console.log(`✅ All recent transactions processed correctly\n`)
  } else {
    console.log(`\n⚠️  Found ${recentProblems} recent transactions with issues\n`)
  }

  // 5. Validation of the 3 fixed transactions
  console.log('5️⃣  VALIDATING 3 PREVIOUSLY FIXED TRANSACTIONS...\n')

  const fixedTxns = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf'
  ]

  let fixValidation = 0

  for (const txnId of fixedTxns) {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    const user = await prisma.user.findUnique({ where: { id: txn.userId } })
    
    const um = await prisma.userMembership.findFirst({
      where: { userId: txn.userId, transactionId: txnId }
    })

    const hasActiveUM = await prisma.userMembership.findFirst({
      where: { userId: txn.userId, isActive: true }
    })

    if (um && hasActiveUM && (user.role === 'MEMBER_PREMIUM' || user.role === 'MENTOR')) {
      console.log(`✅ ${txnId.substring(0, 25)}... - Valid`)
    } else {
      console.log(`❌ ${txnId.substring(0, 25)}... - PROBLEM:`)
      if (!um) console.log(`   - UserMembership missing`)
      if (!hasActiveUM) console.log(`   - No active membership`)
      if (user.role === 'MEMBER_FREE') console.log(`   - User is MEMBER_FREE`)
      fixValidation++
    }
  }

  if (fixValidation === 0) {
    console.log(`\n✅ All 3 fixed transactions validated successfully\n`)
  } else {
    console.log(`\n⚠️  ${fixValidation} fixed transactions have issues\n`)
  }

  // 6. Summary
  console.log('='*50)
  console.log('AUDIT SUMMARY\n')

  const stats = {
    'Total SUCCESS MEMBERSHIP txns': successTransactions.length,
    'Txns without UserMembership': problemCount,
    'Users with role/membership mismatch': inconsistentUsers,
    'Orphaned UserMemberships': orphaned,
    'Recent txns (7 days) with problems': recentProblems,
    'Fixed txns with issues': fixValidation
  }

  Object.entries(stats).forEach(([key, val]) => {
    const icon = val === 0 ? '✅' : '⚠️'
    console.log(`${icon} ${key}: ${val}`)
  })

  const totalIssues = problemCount + inconsistentUsers + orphaned + recentProblems + fixValidation

  console.log('\n' + '='*50)
  if (totalIssues === 0) {
    console.log('✅ SYSTEM HEALTHY - NO ISSUES FOUND')
  } else {
    console.log(`⚠️  FOUND ${totalIssues} ISSUES - REQUIRES ATTENTION`)
  }
  console.log('='*50 + '\n')

  await prisma.$disconnect()
}

audit().catch(e => {
  console.error('Audit error:', e.message)
  process.exit(1)
})
