import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/affiliates
 * 
 * Get list of all affiliates with stats and filters
 * Combines data from AffiliateProfile (registered) and AffiliateConversion (imported from Sejoli)
 * 
 * Query params:
 * - status: ALL | PENDING | ACTIVE | INACTIVE
 * - search: search by name, email, or affiliate code
 * - page: page number (default: 1)
 * - limit: items per page (default: 50)
 * - source: ALL | REGISTERED | IMPORTED (filter by data source)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN_AFFILIATES_API] GET request received')
    
    // 1. Check admin authentication
    const session = await getServerSession(authOptions)
    
    console.log('[ADMIN_AFFILIATES_API] Session check:', {
      hasSession: !!session,
      role: session?.user?.role,
    })
    
    if (!session || session.user.role !== 'ADMIN') {
      console.log('[ADMIN_AFFILIATES_API] Unauthorized access attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search') || ''
    const source = searchParams.get('source') || 'ALL'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // 3. Get affiliates from AffiliateProfile (registered affiliates)
    const profileWhere: any = {}
    
    // Status filter for AffiliateProfile
    if (status === 'PENDING') {
      profileWhere.applicationStatus = 'PENDING'
    } else if (status === 'ACTIVE') {
      profileWhere.isActive = true
      profileWhere.applicationStatus = 'APPROVED'
    } else if (status === 'INACTIVE') {
      profileWhere.isActive = false
    }
    
    // Search filter
    if (search) {
      profileWhere.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { shortLinkUsername: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Get registered affiliates from AffiliateProfile
    const registeredAffiliates = source === 'IMPORTED' ? [] : await prisma.affiliateProfile.findMany({
      where: profileWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // 4. Get conversion stats from AffiliateConversion (Sejoli import data)
    const conversionStats = await prisma.$queryRaw<Array<{
      affiliateId: string
      totalEarnings: bigint
      totalConversions: bigint
      firstCommission: Date
    }>>`
      SELECT 
        "affiliateId",
        SUM("commissionAmount")::bigint as "totalEarnings",
        COUNT(*)::bigint as "totalConversions",
        MIN("createdAt") as "firstCommission"
      FROM "AffiliateConversion"
      GROUP BY "affiliateId"
    `
    
    // Create a map of conversion stats by affiliateId/userId
    const conversionStatsMap = new Map(
      conversionStats.map(stat => [stat.affiliateId, stat])
    )

    // 5. Get affiliates ONLY from AffiliateConversion (not in AffiliateProfile)
    const registeredUserIds = new Set(registeredAffiliates.map(a => a.userId))
    const importedOnlyUserIds = conversionStats
      .map(s => s.affiliateId)
      .filter(id => !registeredUserIds.has(id))
    
    // Get users for imported-only affiliates
    const importedUsers = source === 'REGISTERED' ? [] : await prisma.user.findMany({
      where: { 
        id: { in: importedOnlyUserIds },
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      }
    })
    const importedUserMap = new Map(importedUsers.map(u => [u.id, u]))

    // 6. Build combined affiliate list
    const allAffiliates: any[] = []
    
    // Add registered affiliates with their conversion stats
    for (const affiliate of registeredAffiliates) {
      const stats = conversionStatsMap.get(affiliate.userId)
      allAffiliates.push({
        id: affiliate.id,
        userId: affiliate.userId,
        user: affiliate.user,
        affiliateCode: affiliate.affiliateCode,
        shortLinkUsername: affiliate.shortLinkUsername,
        tier: affiliate.tier,
        commissionRate: Number(affiliate.commissionRate),
        totalClicks: affiliate.totalClicks,
        totalConversions: stats ? Number(stats.totalConversions) : affiliate.totalConversions,
        totalEarnings: stats ? Number(stats.totalEarnings) : Number(affiliate.totalEarnings),
        totalSales: Number(affiliate.totalSales),
        isActive: affiliate.isActive,
        applicationStatus: affiliate.applicationStatus,
        approvedAt: affiliate.approvedAt?.toISOString(),
        createdAt: affiliate.createdAt.toISOString(),
        source: 'REGISTERED',
        bankName: affiliate.bankName,
        bankAccountName: affiliate.bankAccountName,
        bankAccountNumber: affiliate.bankAccountNumber,
        whatsapp: affiliate.whatsapp,
      })
    }
    
    // Add imported-only affiliates (from AffiliateConversion)
    for (const [userId, user] of importedUserMap) {
      const stats = conversionStatsMap.get(userId)
      if (stats) {
        allAffiliates.push({
          id: userId,
          userId: userId,
          user: user,
          affiliateCode: '',
          shortLinkUsername: null,
          tier: 1,
          commissionRate: 0,
          totalClicks: 0,
          totalConversions: Number(stats.totalConversions),
          totalEarnings: Number(stats.totalEarnings),
          totalSales: 0,
          isActive: true,
          applicationStatus: 'IMPORTED',
          approvedAt: stats.firstCommission?.toISOString(),
          createdAt: stats.firstCommission?.toISOString() || new Date().toISOString(),
          source: 'IMPORTED',
          bankName: null,
          bankAccountName: null,
          bankAccountNumber: null,
          whatsapp: null,
        })
      }
    }

    // Sort by totalEarnings desc
    allAffiliates.sort((a, b) => b.totalEarnings - a.totalEarnings)
    
    // Apply pagination
    const total = allAffiliates.length
    const paginatedAffiliates = allAffiliates.slice(skip, skip + limit)
    
    console.log('[ADMIN_AFFILIATES_API] Query result:', {
      registeredCount: registeredAffiliates.length,
      importedCount: importedUsers.length,
      totalAffiliates: total,
      page,
      limit,
    })

    // 7. Get wallet data for each affiliate
    const affiliatesWithWallet = await Promise.all(
      paginatedAffiliates.map(async (affiliate) => {
        const wallet = await prisma.wallet.findUnique({
          where: { userId: affiliate.userId },
          select: {
            balance: true,
            balancePending: true,
            totalEarnings: true,
            totalPayout: true,
          },
        })

        // Get total sales from transactions for this affiliate
        const affiliateTxs = await prisma.affiliateConversion.findMany({
          where: { affiliateId: affiliate.userId },
          select: { transactionId: true }
        })
        const txIds = affiliateTxs.map((a: { transactionId: string }) => a.transactionId)
        
        const salesData = await prisma.transaction.aggregate({
          where: { id: { in: txIds } },
          _sum: { amount: true }
        })

        return {
          ...affiliate,
          wallet,
          totalSales: Number(salesData._sum.amount || 0) || affiliate.totalSales,
        }
      })
    )

    // 8. Calculate stats
    const stats = await calculateAffiliateStats()

    // 9. Return response
    return NextResponse.json({
      success: true,
      affiliates: affiliatesWithWallet,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Error fetching affiliates:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate affiliate statistics - from both AffiliateProfile and AffiliateConversion
 */
async function calculateAffiliateStats() {
  // Get registered affiliates count from AffiliateProfile
  const registeredCount = await prisma.affiliateProfile.count()
  
  // Get pending approval count
  const pendingCount = await prisma.affiliateProfile.count({
    where: { applicationStatus: 'PENDING' }
  })
  
  // Get active affiliates count
  const activeCount = await prisma.affiliateProfile.count({
    where: { isActive: true, applicationStatus: 'APPROVED' }
  })
  
  // Get unique affiliate IDs from AffiliateConversion (imported from Sejoli)
  const uniqueImported = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "affiliateId") as count 
    FROM "AffiliateConversion"
    WHERE "affiliateId" NOT IN (
      SELECT "userId" FROM "AffiliateProfile"
    )
  `
  const importedOnlyCount = Number(uniqueImported[0]?.count || 0)
  
  const totalAffiliates = registeredCount + importedOnlyCount
  
  // Get total earnings from AffiliateConversion
  const earningsData = await prisma.affiliateConversion.aggregate({
    _sum: {
      commissionAmount: true,
    },
    _count: {
      id: true,
    },
  })
  
  // Get total sales value from transactions linked to commissions
  const affiliateTransactions = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  })
  const txIds = affiliateTransactions.map((a: { transactionId: string }) => a.transactionId)
  
  const salesData = await prisma.transaction.aggregate({
    where: {
      id: { in: txIds }
    },
    _sum: {
      amount: true,
    },
  })
  
  // Get all affiliate user IDs (from both sources)
  const affiliateProfiles = await prisma.affiliateProfile.findMany({
    select: { userId: true }
  })
  const profileUserIds = affiliateProfiles.map((a: { userId: string }) => a.userId)
  
  const conversionUserIds = await prisma.$queryRaw<{ affiliateId: string }[]>`
    SELECT DISTINCT "affiliateId" FROM "AffiliateConversion"
  `
  const convUserIds = conversionUserIds.map((a: { affiliateId: string }) => a.affiliateId)
  
  const allAffiliateUserIds = [...new Set([...profileUserIds, ...convUserIds])]
  
  // Pending payouts (sum of balance for affiliate users)
  const pendingPayoutsData = await prisma.wallet.aggregate({
    _sum: {
      balance: true,
    },
    where: {
      balance: { gt: 0 },
      userId: { in: allAffiliateUserIds }
    },
  })
  
  // Total payouts (approved)
  const totalPayoutsData = await prisma.payout.aggregate({
    _sum: {
      amount: true,
    },
    where: {
      status: 'APPROVED',
    },
  })

  return {
    totalAffiliates,
    registeredAffiliates: registeredCount,
    importedAffiliates: importedOnlyCount,
    activeAffiliates: activeCount,
    pendingApproval: pendingCount,
    totalEarnings: Number(earningsData._sum.commissionAmount || 0),
    totalSales: Number(salesData._sum.amount || 0),
    pendingPayouts: Number(pendingPayoutsData._sum.balance || 0),
    totalPayouts: Number(totalPayoutsData._sum.amount || 0),
  }
}
