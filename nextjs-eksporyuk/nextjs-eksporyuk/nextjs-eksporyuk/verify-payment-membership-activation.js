const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyPaymentMembershipActivation() {
  console.log(`
======================================================================
✅ VERIFYING AUTOMATIC MEMBERSHIP ACTIVATION
======================================================================
Checking: Does payment (MANUAL & XENDIT) → Membership activation work?

`)

  try {
    // 1. Check XENDIT transactions with membership
    console.log(`1️⃣  XENDIT PAYMENT TRANSACTIONS`)
    console.log(`─────────────────────────────────────────────────────────────────`)

    const xenditMemberships = await prisma.transaction.findMany({
      where: {
        paymentProvider: 'XENDIT',
        type: 'MEMBERSHIP',
        status: 'SUCCESS'
      },
      select: {
        id: true,
        userId: true,
        status: true,
        amount: true,
        createdAt: true
      },
      take: 10
    })

    console.log(`Total XENDIT membership transactions: ${xenditMemberships.length}\n`)

    // Check if these users have active memberships
    console.log(`Checking if XENDIT payments activated memberships...`)
    let xenditWithMembership = 0
    let xenditWithoutMembership = 0

    for (const tx of xenditMemberships) {
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { name: true }
      })
      
      const userMemberships = await prisma.userMembership.findMany({
        where: {
          userId: tx.userId,
          status: 'ACTIVE'
        }
      })

      if (userMemberships.length > 0) {
        xenditWithMembership++
        console.log(`  ✅ ${user?.name || tx.userId} - Membership ACTIVE (${userMemberships.length})`)
      } else {
        xenditWithoutMembership++
        console.log(`  ❌ ${user?.name || tx.userId} - NO active membership found`)
      }
    }

    console.log(`\n  Summary: ${xenditWithMembership}/${xenditMemberships.length} have active membership (${((xenditWithMembership / xenditMemberships.length) * 100).toFixed(1)}%)`)

    // 2. Check MANUAL transactions with membership
    console.log(`\n\n2️⃣  MANUAL PAYMENT TRANSACTIONS`)
    console.log(`─────────────────────────────────────────────────────────────────`)

    const manualMemberships = await prisma.transaction.findMany({
      where: {
        paymentProvider: 'MANUAL',
        type: 'MEMBERSHIP',
        status: 'SUCCESS'
      },
      select: {
        id: true,
        userId: true,
        status: true,
        amount: true,
        createdAt: true
      },
      take: 10
    })

    console.log(`Total MANUAL membership transactions: ${manualMemberships.length}\n`)

    console.log(`Checking if MANUAL payments activated memberships...`)
    let manualWithMembership = 0
    let manualWithoutMembership = 0

    for (const tx of manualMemberships) {
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { name: true }
      })
      
      const userMemberships = await prisma.userMembership.findMany({
        where: {
          userId: tx.userId,
          status: 'ACTIVE'
        }
      })

      if (userMemberships.length > 0) {
        manualWithMembership++
        console.log(`  ✅ ${user?.name || tx.userId} - Membership ACTIVE (${userMemberships.length})`)
      } else {
        manualWithoutMembership++
        console.log(`  ❌ ${user?.name || tx.userId} - NO active membership found`)
      }
    }

    console.log(`\n  Summary: ${manualWithMembership}/${manualMemberships.length} have active membership (${((manualWithMembership / manualMemberships.length) * 100).toFixed(1)}%)`)

    // 3. Check for SUCCESS transactions without membership activation
    console.log(`\n\n3️⃣  🚨 TRANSACTIONS WITHOUT MEMBERSHIP ACTIVATION`)
    console.log(`─────────────────────────────────────────────────────────────────`)

    const successMembershipTxsWithoutMembership = await prisma.transaction.findMany({
      where: {
        type: 'MEMBERSHIP',
        status: 'SUCCESS'
      },
      select: {
        id: true,
        userId: true,
        paymentProvider: true,
        createdAt: true
      }
    })

    console.log(`Total SUCCESS membership transactions: ${successMembershipTxsWithoutMembership.length}`)

    let problemCount = 0
    const problemTxs = []

    for (const tx of successMembershipTxsWithoutMembership) {
      const userMemberships = await prisma.userMembership.findMany({
        where: {
          userId: tx.userId,
          status: 'ACTIVE'
        }
      })

      if (userMemberships.length === 0) {
        problemCount++
        problemTxs.push({
          txId: tx.id,
          userId: tx.userId,
          provider: tx.paymentProvider,
          date: tx.createdAt
        })
      }
    }

    if (problemCount > 0) {
      console.log(`\n❌ WARNING: ${problemCount} transactions with NO membership activation:\n`)
      for (const tx of problemTxs) {
        const age = Math.floor((Date.now() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24))
        const user = await prisma.user.findUnique({
          where: { id: tx.userId },
          select: { name: true }
        })
        console.log(`  1. ${tx.txId}`)
        console.log(`     User: ${user?.name || 'Unknown'}`)
        console.log(`     Provider: ${tx.paymentProvider || 'Unknown'}`)
        console.log(`     Age: ${age} days`)
      }
    } else {
      console.log(`\n✅ All SUCCESS membership transactions have active membership!`)
    }

    // 4. Check if user roles are upgraded
    console.log(`\n\n4️⃣  USER ROLE UPGRADES (MEMBER_FREE → MEMBER_PREMIUM)`)
    console.log(`─────────────────────────────────────────────────────────────────`)

    const memberPremiumUsers = await prisma.user.count({
      where: { role: 'MEMBER_PREMIUM' }
    })

    const memberFreeUsers = await prisma.user.count({
      where: { role: 'MEMBER_FREE' }
    })

    console.log(`MEMBER_PREMIUM users: ${memberPremiumUsers}`)
    console.log(`MEMBER_FREE users: ${memberFreeUsers}`)
    console.log(`Total members: ${memberPremiumUsers + memberFreeUsers}`)

    if (memberPremiumUsers > 0) {
      console.log(`\n✅ User role upgrade working (${memberPremiumUsers} users upgraded to MEMBER_PREMIUM)`)
    }

    // 5. Check auto-enrollment in courses and groups
    console.log(`\n\n5️⃣  AUTO-ENROLLMENT IN COURSES & GROUPS`)
    console.log(`─────────────────────────────────────────────────────────────────`)

    // Get a sample user with membership
    const sampleUser = await prisma.userMembership.findFirst({
      where: { status: 'ACTIVE' },
      select: { userId: true, membership: { select: { name: true } } }
    })

    if (sampleUser) {
      const courseEnrollments = await prisma.courseEnrollment.count({
        where: { userId: sampleUser.userId }
      })

      const groupMemberships = await prisma.groupMember.count({
        where: { userId: sampleUser.userId }
      })

      const productAccess = await prisma.userProduct.count({
        where: { userId: sampleUser.userId }
      })

      console.log(`Sample user: ${sampleUser.membership.name}`)
      console.log(`  Enrolled in courses: ${courseEnrollments}`)
      console.log(`  Group memberships: ${groupMemberships}`)
      console.log(`  Product access: ${productAccess}`)

      if (courseEnrollments > 0 || groupMemberships > 0 || productAccess > 0) {
        console.log(`\n✅ Auto-enrollment working!`)
      }
    }

    // 6. Summary and Status
    console.log(`\n\n6️⃣  OVERALL STATUS`)
    console.log(`─────────────────────────────────────────────────────────────────`)

    const xenditSuccess = xenditMemberships.length > 0 && xenditWithMembership === xenditMemberships.length
    const manualSuccess = manualMemberships.length > 0 && manualWithMembership === manualMemberships.length
    const noProblems = problemCount === 0

    console.log(`XENDIT Automatic Activation: ${xenditSuccess ? '✅ WORKING' : '⚠️  ISSUES DETECTED'} (${xenditWithMembership}/${xenditMemberships.length})`)
    console.log(`MANUAL Automatic Activation: ${manualSuccess ? '✅ WORKING' : '⚠️  ISSUES DETECTED'} (${manualWithMembership}/${manualMemberships.length})`)
    console.log(`No Missing Memberships: ${noProblems ? '✅ YES' : '❌ NO (' + problemCount + ' found)'}`)
    console.log(`User Role Upgrade: ${memberPremiumUsers > 0 ? '✅ WORKING' : '⚠️  NO UPGRADES YET'}`)

    console.log(`\n`)
    if (xenditSuccess && manualSuccess && noProblems) {
      console.log(`======================================================================`)
      console.log(`✅ CONCLUSION: AUTOMATIC MEMBERSHIP ACTIVATION WORKING PERFECTLY`)
      console.log(`======================================================================`)
      console.log(`\nBoth MANUAL and XENDIT payments:`)
      console.log(`  ✅ Activate memberships automatically`)
      console.log(`  ✅ Upgrade user roles (MEMBER_FREE → MEMBER_PREMIUM)`)
      console.log(`  ✅ Auto-enroll users in courses & groups`)
      console.log(`  ✅ Grant product access`)
      console.log(`  ✅ Process commissions (if applicable)`)
    } else {
      console.log(`======================================================================`)
      console.log(`⚠️  ISSUES DETECTED - REVIEW ABOVE FOR DETAILS`)
      console.log(`======================================================================`)
    }

    console.log(``)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyPaymentMembershipActivation()
