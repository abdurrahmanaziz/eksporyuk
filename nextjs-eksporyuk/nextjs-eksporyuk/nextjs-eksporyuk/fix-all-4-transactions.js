const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  const txnIds = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf',
    'txn_1767578979716_psftdqns4jb'
  ]

  console.log(`\n${'='.repeat(70)}`)
  console.log('FIXING ALL 4 TRANSACTIONS WITH CORRECT LOGIC')
  console.log('='.repeat(70) + '\n')

  for (const txnId of txnIds) {
    console.log(`\n🔧 Fixing: ${txnId.substring(0, 30)}...`)

    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    
    if (!txn) {
      console.log(`❌ Transaction not found`)
      continue
    }

    const membershipId = txn.membershipId || txn.metadata?.membershipId
    
    if (!membershipId) {
      console.log(`❌ No membershipId`)
      continue
    }

    const mem = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!mem) {
      console.log(`❌ Membership not found`)
      continue
    }

    const now = new Date()
    let endDate = new Date(now)
    
    switch (mem.duration) {
      case 'ONE_MONTH':
        endDate.setMonth(endDate.getMonth() + 1)
        break
      case 'THREE_MONTHS':
        endDate.setMonth(endDate.getMonth() + 3)
        break
      case 'SIX_MONTHS':
        endDate.setMonth(endDate.getMonth() + 6)
        break
      case 'TWELVE_MONTHS':
        endDate.setFullYear(endDate.getFullYear() + 1)
        break
      case 'LIFETIME':
        endDate.setFullYear(endDate.getFullYear() + 100)
        break
    }

    const existingForThisTxn = await prisma.userMembership.findFirst({
      where: {
        userId: txn.userId,
        transactionId: txnId,
      },
    })

    if (existingForThisTxn) {
      console.log(`✅ UM already exists for this txn`)
      continue
    }

    // DELETE old UM for same membership (not just deactivate)
    const existingForThisMem = await prisma.userMembership.findFirst({
      where: {
        userId: txn.userId,
        membershipId: membershipId,
      },
    })

    if (existingForThisMem) {
      await prisma.userMembership.delete({
        where: { id: existingForThisMem.id },
      })
      console.log(`  Deleted old UM for same membership type: ${existingForThisMem.id}`)
    }

    // Deactivate all other active memberships (different type)
    const deactivated = await prisma.userMembership.updateMany({
      where: {
        userId: txn.userId,
        membershipId: { not: membershipId },
        isActive: true,
      },
      data: {
        isActive: false,
        status: 'EXPIRED',
      },
    })

    if (deactivated.count > 0) {
      console.log(`  Deactivated ${deactivated.count} other memberships`)
    }

    // CREATE new UM for this transaction
    const um = await prisma.userMembership.create({
      data: {
        id: `um_${txn.id}`,
        userId: txn.userId,
        membershipId: membershipId,
        status: 'ACTIVE',
        isActive: true,
        activatedAt: now,
        startDate: now,
        endDate,
        price: txn.amount,
        transactionId: txn.id,
        updatedAt: now,
      },
    })

    console.log(`  ✅ Created UM: ${um.id}`)

    const user = await prisma.user.findUnique({ where: { id: txn.userId } })
    
    if (user.role === 'MEMBER_FREE' || user.role === 'CUSTOMER') {
      await prisma.user.update({
        where: { id: txn.userId },
        data: { role: 'MEMBER_PREMIUM' },
      })
      console.log(`  ✅ Role upgraded to MEMBER_PREMIUM`)
    }

    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId: membershipId },
    })

    for (const mg of membershipGroups) {
      await prisma.groupMember.create({
        data: {
          groupId: mg.groupId,
          userId: txn.userId,
          role: 'MEMBER',
        },
      }).catch(() => {})
    }

    if (membershipGroups.length > 0) {
      console.log(`  ✅ Added to ${membershipGroups.length} groups`)
    }

    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId: membershipId },
    })

    for (const mc of membershipCourses) {
      await prisma.courseEnrollment.create({
        data: {
          id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: txn.userId,
          courseId: mc.courseId,
        },
      }).catch(() => {})
    }

    if (membershipCourses.length > 0) {
      console.log(`  ✅ Enrolled in ${membershipCourses.length} courses`)
    }

    console.log(`✅ Transaction fixed!`)
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log('✅ ALL TRANSACTIONS PROCESSED')
  console.log('='.repeat(70) + '\n')

  await prisma.$disconnect()
}

fix().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
