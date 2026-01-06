const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  const failed = [
    'txn_1767537356659_7qc99jkqobv',
    'txn_1767578418600_ei37idl5dpe',
    'txn_1767664508504_y5z6jdh50zf'
  ]

  for (const txnId of failed) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Fixing: ${txnId}`)

    const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
    if (!txn) {
      console.log('❌ Transaction not found')
      continue
    }

    const membershipId = txn.membershipId || txn.metadata?.membershipId
    if (!membershipId) {
      console.log('❌ No membershipId found')
      continue
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!membership) {
      console.log('❌ Membership not found')
      continue
    }

    const now = new Date()
    let endDate = new Date(now)
    switch (membership.duration) {
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

    console.log(`User: ${txn.userId}`)
    console.log(`Membership: ${membership.name} (${membership.duration})`)
    console.log(`Duration until: ${endDate.toLocaleDateString('id-ID')}`)

    // Deactivate old memberships
    const deactivated = await prisma.userMembership.updateMany({
      where: {
        userId: txn.userId,
        isActive: true
      },
      data: {
        isActive: false,
        status: 'EXPIRED'
      }
    })
    console.log(`Deactivated ${deactivated.count} old memberships`)

    // Upsert new membership
    const userMembership = await prisma.userMembership.upsert({
      where: {
        userId_membershipId: {
          userId: txn.userId,
          membershipId: membershipId,
        }
      },
      update: {
        status: 'ACTIVE',
        isActive: true,
        activatedAt: now,
        startDate: now,
        endDate,
        price: txn.amount,
        transactionId: txn.id,
        updatedAt: now,
      },
      create: {
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
    console.log(`✅ UserMembership created/updated: ${userMembership.id}`)

    // Upgrade user role if needed
    const user = await prisma.user.findUnique({ where: { id: txn.userId } })
    if (user.role === 'MEMBER_FREE' || user.role === 'CUSTOMER') {
      await prisma.user.update({
        where: { id: txn.userId },
        data: { role: 'MEMBER_PREMIUM' }
      })
      console.log(`✅ User role upgraded to MEMBER_PREMIUM`)
    }

    // Get groups/courses for membership
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId }
    })
    const groupIds = membershipGroups.map(mg => mg.groupId)

    for (const groupId of groupIds) {
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: txn.userId,
          role: 'MEMBER'
        }
      }).catch(() => {})
    }
    console.log(`✅ Added to ${groupIds.length} groups`)

    // Enroll in courses
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId }
    })
    for (const mc of membershipCourses) {
      await prisma.courseEnrollment.create({
        data: {
          id: `enroll_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: txn.userId,
          courseId: mc.courseId,
        }
      }).catch(() => {})
    }
    console.log(`✅ Enrolled in ${membershipCourses.length} courses`)

    console.log(`✅ FIXED`)
  }

  await prisma.$disconnect()
  console.log(`\n✅ All transactions fixed!`)
}

fix().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
