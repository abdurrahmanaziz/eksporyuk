import { prisma } from './prisma'
import { grantFeaturePermission, revokeFeaturePermission } from './features'

/**
 * Activate membership for user
 * - Updates user role to MEMBER_PREMIUM (if was MEMBER_FREE)
 * - Deactivates old membership (enforce 1 active membership)
 * - Activates new membership
 * - Auto-joins default groups
 * - Auto-activates default courses
 * - Auto-grants feature permissions
 */
export async function activateMembership(
  userId: string,
  membershipId: string,
  transactionId: string,
  startDate: Date,
  endDate: Date,
  price: number
) {
  try {
    // 0. Update user role to MEMBER_PREMIUM if currently MEMBER_FREE
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    if (user?.role === 'MEMBER_FREE') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'MEMBER_PREMIUM' }
      })
      console.log(`[Membership] User ${userId} upgraded from MEMBER_FREE to MEMBER_PREMIUM`)
    }

    // 1. Deactivate all existing active memberships for this user
    await prisma.userMembership.updateMany({
      where: {
        userId,
        isActive: true,
        status: 'ACTIVE'
      },
      data: {
        isActive: false,
        status: 'EXPIRED'
      }
    })

    // 2. Create new membership
    const userMembership = await prisma.userMembership.create({
      data: {
        userId,
        membershipId,
        transactionId,
        startDate,
        endDate,
        isActive: true,
        status: 'ACTIVE',
        activatedAt: new Date(),
        price
      }
    })

    // 3. Get membership details (membership data only, relationships fetched separately)
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        name: true,
        slug: true,
        features: true
      }
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    // 4. Get membership groups from junction table
    const membershipGroups = await prisma.membershipGroup.findMany({
      where: { membershipId },
      select: { groupId: true }
    })
    const groupIds = membershipGroups.map(mg => mg.groupId)
    
    for (const groupId of groupIds) {
      // Check if already member
      const existing = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId
          }
        }
      })

      if (!existing) {
        await prisma.groupMember.create({
          data: {
            groupId,
            userId,
            role: 'MEMBER'
          }
        })
      }
    }

    // 5. Auto-activate courses (from membership directly)
    const membershipCourses = await prisma.membershipCourse.findMany({
      where: { membershipId },
      select: { courseId: true }
    })
    const courseIds = membershipCourses.map(mc => mc.courseId)
    
    for (const courseId of courseIds) {
      await activateCourseAccess(userId, courseId, endDate)
    }

    // 6. Auto-activate courses from products
    const membershipProducts = await prisma.membershipProduct.findMany({
      where: { membershipId },
      select: { productId: true }
    })

    for (const mp of membershipProducts) {
      const productCourses = await prisma.productCourse.findMany({
        where: { productId: mp.productId },
        select: { courseId: true }
      })
      
      for (const pc of productCourses) {
        await activateCourseAccess(userId, pc.courseId, endDate)
      }
    }

    // 7. Auto-grant feature permissions from MembershipFeatureAccess
    let featuresGranted = 0
    if (membership.membershipFeatures && membership.membershipFeatures.length > 0) {
      for (const feature of membership.membershipFeatures) {
        if (feature.enabled) {
          try {
            await grantFeaturePermission(
              userId,
              feature.featureKey,
              true,
              feature.value
            )
            featuresGranted++
            console.log(`[Membership] Granted feature ${feature.featureKey} to user ${userId}`)
          } catch (err) {
            console.error(`[Membership] Failed to grant feature ${feature.featureKey}:`, err)
          }
        }
      }
    }

    return {
      success: true,
      userMembership,
      groupsJoined: groupIds.length,
      coursesActivated: courseIds.length,
      featuresGranted
    }
  } catch (error) {
    console.error('Activate membership error:', error)
    throw error
  }
}

/**
 * Activate course access for user
 */
export async function activateCourseAccess(
  userId: string,
  courseId: string,
  expiresAt?: Date | null
) {
  try {
    // Check if progress already exists
    const existing = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (existing) {
      // Update access
      await prisma.userCourseProgress.update({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        data: {
          hasAccess: true,
          accessGrantedAt: new Date(),
          accessExpiresAt: expiresAt,
          lastAccessedAt: new Date()
        }
      })
    } else {
      // Create new progress
      await prisma.userCourseProgress.create({
        data: {
          userId,
          courseId,
          hasAccess: true,
          accessGrantedAt: new Date(),
          accessExpiresAt: expiresAt,
          progress: 0,
          completedLessons: []
        }
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Activate course access error:', error)
    throw error
  }
}

/**
 * Activate product for user
 * - Creates UserProduct record
 * - Auto-joins product groups
 * - Auto-activates product courses
 */
export async function activateProduct(
  userId: string,
  productId: string,
  transactionId: string,
  price: number,
  expiresAt?: Date | null
) {
  try {
    // 1. Create user product
    const userProduct = await prisma.userProduct.create({
      data: {
        userId,
        productId,
        transactionId,
        price,
        expiresAt,
        isActive: true
      }
    })

    // 2. Get product with courses and group
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        courses: {
          include: {
            course: true
          }
        },
        group: true
      }
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // 3. Auto-join group if product has one
    if (product.groupId) {
      const existing = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: product.groupId,
            userId
          }
        }
      })

      if (!existing) {
        await prisma.groupMember.create({
          data: {
            groupId: product.groupId,
            userId,
            role: 'MEMBER'
          }
        })
      }
    }

    // 4. Auto-activate courses
    const courseIds = product.courses.map(pc => pc.courseId)
    
    for (const courseId of courseIds) {
      await activateCourseAccess(userId, courseId, expiresAt)
    }

    return {
      success: true,
      userProduct,
      groupJoined: product.groupId ? 1 : 0,
      coursesActivated: courseIds.length
    }
  } catch (error) {
    console.error('Activate product error:', error)
    throw error
  }
}

/**
 * Check and lock expired memberships/courses
 * Also downgrades users back to MEMBER_FREE if no active memberships
 */
export async function checkAndLockExpiredAccess() {
  try {
    const now = new Date()

    // 1. Lock expired memberships
    const expiredMemberships = await prisma.userMembership.updateMany({
      where: {
        endDate: {
          lt: now
        },
        isActive: true
      },
      data: {
        isActive: false,
        status: 'EXPIRED'
      }
    })

    // 2. Lock expired course access (but keep progress)
    const expiredCourses = await prisma.userCourseProgress.updateMany({
      where: {
        accessExpiresAt: {
          lt: now
        },
        hasAccess: true
      },
      data: {
        hasAccess: false
      }
    })

    // 3. Downgrade users with no active memberships back to MEMBER_FREE
    // Find MEMBER_PREMIUM users who have no active memberships
    const premiumUsersWithoutActiveMembership = await prisma.user.findMany({
      where: {
        role: 'MEMBER_PREMIUM',
        NOT: {
          memberships: {
            some: {
              isActive: true,
              status: 'ACTIVE',
              endDate: { gte: now }
            }
          }
        }
      },
      select: { id: true, email: true }
    })

    // Downgrade them to MEMBER_FREE and revoke all feature permissions
    let usersDowngraded = 0
    let featuresRevoked = 0
    
    for (const user of premiumUsersWithoutActiveMembership) {
      // Revoke all feature permissions
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId: user.id, enabled: true }
      })
      
      for (const permission of userPermissions) {
        try {
          await revokeFeaturePermission(user.id, permission.feature)
          featuresRevoked++
        } catch (err) {
          // Ignore if feature doesn't exist
        }
      }
      
      // Downgrade role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_FREE' }
      })
      console.log(`[Membership] User ${user.email} downgraded to MEMBER_FREE (no active membership)`)
      usersDowngraded++
    }

    return {
      success: true,
      membershipsLocked: expiredMemberships.count,
      coursesLocked: expiredCourses.count,
      usersDowngraded,
      featuresRevoked
    }
  } catch (error) {
    console.error('Lock expired access error:', error)
    throw error
  }
}

/**
 * Upgrade membership with payment mode logic
 */
export async function upgradeMembership(
  userId: string,
  newMembershipId: string,
  paymentMode: 'accumulate' | 'full',
  transactionId: string,
  pricePaid: number
) {
  try {
    // 1. Get current active membership
    const currentMembership = await prisma.userMembership.findFirst({
      where: {
        userId,
        isActive: true,
        status: 'ACTIVE'
      },
      include: {
        membership: true
      }
    })

    let oldMembershipId: string | undefined
    let oldPlanRemaining: number | undefined
    let startDate = new Date()
    let endDate: Date

    if (currentMembership) {
      oldMembershipId = currentMembership.membershipId
      
      // Calculate remaining days
      const now = new Date()
      const remaining = Math.max(0, Math.floor(
        (currentMembership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ))
      oldPlanRemaining = remaining

      // Deactivate old membership
      await prisma.userMembership.update({
        where: { id: currentMembership.id },
        data: {
          isActive: false,
          status: 'EXPIRED'
        }
      })
    }

    // 2. Get new membership details
    const newMembership = await prisma.membership.findUnique({
      where: { id: newMembershipId }
    })

    if (!newMembership) {
      throw new Error('New membership not found')
    }

    // 3. Calculate end date based on duration
    const durationMap = {
      ONE_MONTH: 30,
      THREE_MONTHS: 90,
      SIX_MONTHS: 180,
      TWELVE_MONTHS: 365,
      LIFETIME: 36500 // 100 years
    }

    const days = durationMap[newMembership.duration] || 30
    endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    // 4. Activate new membership (this will also auto-join groups and courses)
    const result = await activateMembership(
      userId,
      newMembershipId,
      transactionId,
      startDate,
      endDate,
      pricePaid
    )

    // 5. Log upgrade
    await prisma.membershipUpgradeLog.create({
      data: {
        userId,
        oldMembershipId,
        newMembershipId,
        paymentMode,
        oldPlanRemaining,
        pricePaid,
        notes: `Upgraded from ${currentMembership?.membership.name || 'None'} to ${newMembership.name}`
      }
    })

    return {
      success: true,
      ...result,
      upgrade: {
        oldMembershipId,
        oldPlanRemaining,
        paymentMode
      }
    }
  } catch (error) {
    console.error('Upgrade membership error:', error)
    throw error
  }
}
