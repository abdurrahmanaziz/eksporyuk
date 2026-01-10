import { prisma } from './prisma'

// Database access - ALL PREMIUM MEMBERS GET UNLIMITED
// Only FREE users are blocked (handled by middleware)
export type DatabaseType = 'buyer' | 'supplier' | 'forwarder'

/**
 * Check if user can access database entry
 * Premium members = UNLIMITED access
 * Free members = BLOCKED (redirected by middleware)
 */
export async function checkDatabaseAccess(
  userId: string,
  databaseType: DatabaseType
): Promise<{
  hasAccess: boolean
  quota: number
  used: number
  remaining: number
  isUnlimited: boolean
}> {
  // Get user's role
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { role: true }
  })

  // Free users should be blocked by middleware
  // But as fallback, return no access
  if (user?.role === 'MEMBER_FREE') {
    return {
      hasAccess: false,
      quota: 0,
      used: 0,
      remaining: 0,
      isUnlimited: false
    }
  }

  // All premium members get unlimited access
  return {
    hasAccess: true,
    quota: -1,
    used: 0,
    remaining: -1,
    isUnlimited: true
  }
}

/**
 * Track database view (for analytics only, no quota enforcement)
 */
export async function trackDatabaseView(
  userId: string,
  databaseType: DatabaseType,
  entryId: string
): Promise<boolean> {
  // Just track for analytics, no access control
  try {
    if (databaseType === 'buyer') {
      await prisma.buyerView.create({
        data: { userId, buyerId: entryId }
      })
      await prisma.buyer.update({
        where: { id: entryId },
        data: { viewCount: { increment: 1 } }
      })
    } else if (databaseType === 'supplier') {
      await prisma.supplierView.create({
        data: { userId, supplierId: entryId }
      })
      await prisma.supplier.update({
        where: { id: entryId },
        data: { viewCount: { increment: 1 } }
      })
    } else if (databaseType === 'forwarder') {
      await prisma.forwarderView.create({
        data: { userId, forwarderId: entryId }
      })
      await prisma.forwarder.update({
        where: { id: entryId },
        data: { viewCount: { increment: 1 } }
      })
    }

    return true
  } catch (error) {
    console.error('Track database view error:', error)
    return false
  }
}

/**
 * Check if user has premium features
 */
export async function hasPremiumAccess(userId: string): Promise<{
  canDownloadCSV: boolean
  hasAPIAccess: boolean
  isPriorityListing: boolean
  hasVerifiedBadge: boolean
}> {
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
      isActive: true
    },
    include: {
      package: true
    }
  })

  if (!membership) {
    return {
      canDownloadCSV: false,
      hasAPIAccess: false,
      isPriorityListing: false,
      hasVerifiedBadge: false
    }
  }

  const slug = membership.package.slug
  
  return {
    canDownloadCSV: ['3-month', '6-month', '12-month', 'lifetime'].includes(slug),
    hasAPIAccess: ['6-month', '12-month', 'lifetime'].includes(slug),
    isPriorityListing: ['12-month', 'lifetime'].includes(slug),
    hasVerifiedBadge: ['12-month', 'lifetime'].includes(slug)
  }
}

/**
 * Get user's database stats
 */
export async function getDatabaseStats(userId: string) {
  const buyerAccess = await checkDatabaseAccess(userId, 'buyer')
  const supplierAccess = await checkDatabaseAccess(userId, 'supplier')
  const forwarderAccess = await checkDatabaseAccess(userId, 'forwarder')
  const premiumAccess = await hasPremiumAccess(userId)

  return {
    buyer: buyerAccess,
    supplier: supplierAccess,
    forwarder: forwarderAccess,
    premium: premiumAccess
  }
}
