const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fix() {
  const txnId = 'txn_1767578979716_psftdqns4jb'
  
  console.log(`\n🔧 FIXING NEW PROBLEMATIC TRANSACTION\n`)
  
  const txn = await prisma.transaction.findUnique({ where: { id: txnId } })
  
  if (!txn) {
    console.log(`❌ Transaction not found`)
    await prisma.$disconnect()
    return
  }

  console.log(`Transaction: ${txn.id}`)
  console.log(`User: ${txn.userId}`)
  console.log(`Status: ${txn.status}`)

  const membershipId = txn.membershipId || txn.metadata?.membershipId
  
  if (!membershipId) {
    console.log(`❌ No membershipId found`)
    await prisma.$disconnect()
    return
  }

  const mem = await prisma.membership.findUnique({
    where: { id: membershipId }
  })

  if (!mem) {
    console.log(`❌ Membership not found`)
    await prisma.$disconnect()
    return
  }

  console.log(`Membership: ${mem.name} (${mem.duration})`)

  // Calculate endDate
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

  console.log(`\n✅ Deactivated ${deactivated.count} old memberships`)

  // Upsert new membership
  const um = await prisma.userMembership.upsert({
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

  console.log(`✅ UserMembership created/updated: ${um.id}`)

  // Check if user role needs upgrade
  const user = await prisma.user.findUnique({ where: { id: txn.userId } })
  
  if (user.role === 'MEMBER_FREE' || user.role === 'CUSTOMER') {
    await prisma.user.update({
      where: { id: txn.userId },
      data: { role: 'MEMBER_PREMIUM' }
    })
    console.log(`✅ User role upgraded to MEMBER_PREMIUM`)
  } else {
    console.log(`ℹ️  User role already: ${user.role}`)
  }

  // Auto-join groups
  const membershipGroups = await prisma.membershipGroup.findMany({
    where: { membershipId: membershipId }
  })

  for (const mg of membershipGroups) {
    await prisma.groupMember.create({
      data: {
        groupId: mg.groupId,
        userId: txn.userId,
        role: 'MEMBER'
      }
    }).catch(() => {})
  }

  console.log(`✅ Added to ${membershipGroups.length} groups`)

  // Auto-enroll courses
  const membershipCourses = await prisma.membershipCourse.findMany({
    where: { membershipId: membershipId }
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
  console.log(`\n✅ TRANSACTION FIXED!\n`)

  await prisma.$disconnect()
}

fix()
