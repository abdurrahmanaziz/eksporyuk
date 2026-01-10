import { prisma } from './prisma'
import { grantFeaturePermission, AVAILABLE_FEATURES } from './features'

/**
 * Auto-assign features to user based on their membership
 */
export async function autoAssignMembershipFeatures(
  userId: string,
  membershipId: string
) {
  try {
    // Get membership details
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!membership) {
      throw new Error('Membership not found')
    }

    // Define features by membership type/duration
    const membershipFeatures = getMembershipFeatures(membership.duration, membership.name)

    // Grant features to user
    const results = []
    for (const feature of membershipFeatures) {
      try {
        const result = await grantFeaturePermission(
          userId,
          feature.key,
          true,
          feature.value
        )
        results.push({ feature: feature.key, success: true, result })
      } catch (error) {
        console.error(`Error granting feature ${feature.key}:`, error)
        results.push({ feature: feature.key, success: false, error })
      }
    }

    return results
  } catch (error) {
    console.error('Error auto-assigning membership features:', error)
    throw error
  }
}

/**
 * Define features based on membership type
 */
export function getMembershipFeatures(duration: string, membershipName: string) {
  const baseName = membershipName.toLowerCase()
  
  // Basic features for all memberships
  const baseFeatures = [
    { key: AVAILABLE_FEATURES.WALLET_ACCESS, value: null }
  ]

  // Features based on duration
  if (duration === 'MONTHLY') {
    return [
      ...baseFeatures,
      { key: AVAILABLE_FEATURES.CREATE_COURSE, value: { maxCourses: 3 } },
      { key: AVAILABLE_FEATURES.EXPORT_DATABASE, value: { formats: ['csv'] } }
    ]
  }

  if (duration === 'YEARLY') {
    return [
      ...baseFeatures,
      { key: AVAILABLE_FEATURES.CREATE_COURSE, value: { maxCourses: 10 } },
      { key: AVAILABLE_FEATURES.EXPORT_DATABASE, value: { formats: ['csv', 'excel'] } },
      { key: AVAILABLE_FEATURES.ADVANCED_ANALYTICS, value: null },
      { key: AVAILABLE_FEATURES.EVENT_MANAGEMENT, value: { maxEvents: 10 } }
    ]
  }

  if (duration === 'LIFETIME') {
    return [
      ...baseFeatures,
      { key: AVAILABLE_FEATURES.CREATE_COURSE, value: { maxCourses: 50 } },
      { key: AVAILABLE_FEATURES.EXPORT_DATABASE, value: { formats: ['csv', 'excel', 'json'] } },
      { key: AVAILABLE_FEATURES.ADVANCED_ANALYTICS, value: null },
      { key: AVAILABLE_FEATURES.EVENT_MANAGEMENT, value: { maxEvents: 50 } },
      { key: AVAILABLE_FEATURES.BULK_OPERATIONS, value: { maxBatchSize: 5000 } },
      { key: AVAILABLE_FEATURES.TEMPLATE_EDITOR, value: null }
    ]
  }

  // Premium memberships get more features
  if (baseName.includes('premium') || baseName.includes('pro')) {
    return [
      ...baseFeatures,
      { key: AVAILABLE_FEATURES.CREATE_COURSE, value: { maxCourses: 20 } },
      { key: AVAILABLE_FEATURES.EXPORT_DATABASE, value: { formats: ['csv', 'excel'] } },
      { key: AVAILABLE_FEATURES.ADVANCED_ANALYTICS, value: null },
      { key: AVAILABLE_FEATURES.EVENT_MANAGEMENT, value: { maxEvents: 20 } },
      { key: AVAILABLE_FEATURES.BULK_OPERATIONS, value: { maxBatchSize: 2000 } }
    ]
  }

  // VIP memberships get all features
  if (baseName.includes('vip') || baseName.includes('ultimate')) {
    return [
      ...baseFeatures,
      { key: AVAILABLE_FEATURES.CREATE_COURSE, value: { maxCourses: 100 } },
      { key: AVAILABLE_FEATURES.EXPORT_DATABASE, value: { formats: ['csv', 'excel', 'json', 'pdf'] } },
      { key: AVAILABLE_FEATURES.ADVANCED_ANALYTICS, value: null },
      { key: AVAILABLE_FEATURES.EVENT_MANAGEMENT, value: { maxEvents: 100 } },
      { key: AVAILABLE_FEATURES.BULK_OPERATIONS, value: { maxBatchSize: 10000 } },
      { key: AVAILABLE_FEATURES.TEMPLATE_EDITOR, value: null },
      { key: AVAILABLE_FEATURES.AFFILIATE_MANAGEMENT, value: { maxAffiliates: 500 } },
      { key: AVAILABLE_FEATURES.REVENUE_SHARE, value: { percentage: 15 } }
    ]
  }

  // Default basic features
  return baseFeatures
}

/**
 * Remove membership features when membership expires or is cancelled
 */
export async function removeMembershipFeatures(userId: string, membershipId: string) {
  try {
    // Get membership details
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId }
    })

    if (!membership) {
      return { success: false, error: 'Membership not found' }
    }

    // Get features to remove
    const membershipFeatures = getMembershipFeatures(membership.duration, membership.name)
    const featureKeys = membershipFeatures.map(f => f.key)

    // Remove only membership-specific features, keep any manually granted features
    const deletedFeatures = await prisma.userPermission.deleteMany({
      where: {
        userId,
        feature: { in: featureKeys }
      }
    })

    return { 
      success: true, 
      removedCount: deletedFeatures.count,
      removedFeatures: featureKeys 
    }
  } catch (error) {
    console.error('Error removing membership features:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check user's membership status and sync features
 */
export async function syncUserMembershipFeatures(userId: string) {
  try {
    // Get user's active memberships
    const activeMemberships = await prisma.userMembership.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        isActive: true,
        endDate: { gt: new Date() }
      },
      include: {
        membership: true
      }
    })

    if (activeMemberships.length === 0) {
      // No active membership, remove all membership features
      await prisma.userPermission.deleteMany({
        where: {
          userId,
          feature: { 
            in: Object.values(AVAILABLE_FEATURES)
          }
        }
      })
      
      return { 
        success: true, 
        action: 'removed_all',
        message: 'All membership features removed - no active membership'
      }
    }

    // Get highest tier membership (LIFETIME > YEARLY > MONTHLY)
    const sortedMemberships = activeMemberships.sort((a, b) => {
      const tierOrder: Record<string, number> = { 'LIFETIME': 3, 'YEARLY': 2, 'MONTHLY': 1, 'ONE_MONTH': 1, 'THREE_MONTHS': 1, 'SIX_MONTHS': 2, 'TWELVE_MONTHS': 2 }
      const durationA = a.membership.duration as string
      const durationB = b.membership.duration as string
      return (tierOrder[durationB] || 0) - (tierOrder[durationA] || 0)
    })

    const primaryMembership = sortedMemberships[0]

    // Auto-assign features for the primary membership
    const featureResults = await autoAssignMembershipFeatures(
      userId, 
      primaryMembership.membershipId
    )

    return {
      success: true,
      action: 'synced',
      primaryMembership: primaryMembership.membership.name,
      featuresGranted: featureResults.filter(r => r.success).length,
      featuresTotal: featureResults.length
    }

  } catch (error) {
    console.error('Error syncing membership features:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get membership feature comparison
 */
export function getMembershipFeatureComparison() {
  return [
    {
      duration: 'MONTHLY',
      name: 'Monthly Plan',
      features: getMembershipFeatures('MONTHLY', 'Monthly')
    },
    {
      duration: 'YEARLY', 
      name: 'Yearly Plan',
      features: getMembershipFeatures('YEARLY', 'Yearly')
    },
    {
      duration: 'LIFETIME',
      name: 'Lifetime Plan', 
      features: getMembershipFeatures('LIFETIME', 'Lifetime')
    },
    {
      duration: 'PREMIUM',
      name: 'Premium Plan',
      features: getMembershipFeatures('YEARLY', 'Premium Pro')
    },
    {
      duration: 'VIP',
      name: 'VIP Plan',
      features: getMembershipFeatures('LIFETIME', 'VIP Ultimate')
    }
  ]
}