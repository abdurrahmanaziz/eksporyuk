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
 * Primary sources:
 * 1. AffiliateProfile (registered affiliates)
 * 2. Users with AFFILIATE role
 * 
 * Query params:
 * - status: ALL | PENDING | ACTIVE | INACTIVE
 * - search: search by name, email, or affiliate code
 * - page: page number (default: 1)
 * - limit: items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ADMIN_AFFILIATES_API] GET request received')
    
    // 1. Check admin authentication
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    // 3. Get affiliates from AffiliateProfile (registered affiliates)
    const profileWhere: any = {}
    
    if (status === 'PENDING') {
      profileWhere.applicationStatus = 'PENDING'
    } else if (status === 'ACTIVE') {
      profileWhere.isActive = true
      profileWhere.applicationStatus = 'APPROVED'
    } else if (status === 'INACTIVE') {
      profileWhere.isActive = false
    }
    
    if (search) {
      profileWhere.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { shortLinkUsername: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const registeredAffiliates = await prisma.affiliateProfile.findMany({
      where: profileWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          }
        }
      },
      orderBy: { totalEarnings: 'desc' },
    })

    // 4. Get users with AFFILIATE role who DON'T have AffiliateProfile
    const profileUserIds = registeredAffiliates.map(a => a.userId)
    
    const affiliateRoleUsers = await prisma.user.findMany({
      where: {
        role: 'AFFILIATE',
        id: { notIn: profileUserIds },
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
        role: true,
        createdAt: true,
      }
    })

    // Also check UserRole table for AFFILIATE role
    const userRoleAffiliates = await prisma.userRole.findMany({
      where: {
        role: 'AFFILIATE',
        userId: { notIn: [...profileUserIds, ...affiliateRoleUsers.map(u => u.id)] }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
          }
        }
      }
    })

    // 5. Get commission stats from AffiliateConversion
    const allUserIds = [
      ...profileUserIds,
      ...affiliateRoleUsers.map(u => u.id),
      ...userRoleAffiliates.map(ur => ur.userId)
    ]
    
    // Try to match by userId - these are valid affiliate commissions
    const conversionStats = allUserIds.length > 0 ? await prisma.$queryRaw<Array<{
      affiliateId: string
      totalEarnings: bigint
      totalConversions: bigint
    }>>`
      SELECT 
        "affiliateId",
        SUM("commissionAmount")::bigint as "totalEarnings",
        COUNT(*)::bigint as "totalConversions"
      FROM "AffiliateConversion"
      WHERE "affiliateId" = ANY(${allUserIds}::text[])
      GROUP BY "affiliateId"
    ` : []
    
    const conversionStatsMap = new Map(
      conversionStats.map(stat => [stat.affiliateId, stat])
    )

    // 6. Build combined affiliate list
    const allAffiliates: any[] = []
    
    // Add registered affiliates from AffiliateProfile
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
    
    // Add users with AFFILIATE role (not in AffiliateProfile)
    for (const user of affiliateRoleUsers) {
      const stats = conversionStatsMap.get(user.id)
      allAffiliates.push({
        id: user.id,
        userId: user.id,
        user: user,
        affiliateCode: '',
        shortLinkUsername: null,
        tier: 1,
        commissionRate: 0,
        totalClicks: 0,
        totalConversions: stats ? Number(stats.totalConversions) : 0,
        totalEarnings: stats ? Number(stats.totalEarnings) : 0,
        totalSales: 0,
        isActive: true,
        applicationStatus: 'ROLE_ASSIGNED',
        approvedAt: null,
        createdAt: user.createdAt.toISOString(),
        source: 'ROLE',
        bankName: null,
        bankAccountName: null,
        bankAccountNumber: null,
        whatsapp: null,
      })
    }
    
    // Add from UserRole table
    for (const userRole of userRoleAffiliates) {
      if (!userRole.user) continue
      const stats = conversionStatsMap.get(userRole.userId)
      allAffiliates.push({
        id: userRole.userId,
        userId: userRole.userId,
        user: userRole.user,
        affiliateCode: '',
        shortLinkUsername: null,
        tier: 1,
        commissionRate: 0,
        totalClicks: 0,
        totalConversions: stats ? Number(stats.totalConversions) : 0,
        totalEarnings: stats ? Number(stats.totalEarnings) : 0,
        totalSales: 0,
        isActive: true,
        applicationStatus: 'ROLE_ASSIGNED',
        approvedAt: null,
        createdAt: userRole.user.createdAt.toISOString(),
        source: 'ROLE',
        bankName: null,
        bankAccountName: null,
        bankAccountNumber: null,
        whatsapp: null,
      })
    }

    // 7. Get wallet data for ALL affiliates first (before sorting)
    const allUserIds = allAffiliates.map(a => a.userId)
    const wallets = await prisma.wallet.findMany({
      where: { userId: { in: allUserIds } },
      select: {
        userId: true,
        balance: true,
        balancePending: true,
        totalEarnings: true,
        totalPayout: true,
      },
    })
    const walletMap = new Map(wallets.map(w => [w.userId, w]))

    // Enrich affiliates with wallet data and calculate realtime earnings
    const affiliatesWithEarnings = allAffiliates.map(affiliate => {
      const wallet = walletMap.get(affiliate.userId) || null
      // Use wallet.totalEarnings if affiliate has no earnings from AffiliateConversion
      const realtimeEarnings = affiliate.totalEarnings > 0 
        ? affiliate.totalEarnings 
        : Number(wallet?.totalEarnings || 0)
      
      return {
        ...affiliate,
        wallet,
        totalEarnings: realtimeEarnings,
      }
    })

    // Sort by totalEarnings desc (now with wallet data included)
    affiliatesWithEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings)
    
    // Apply pagination AFTER sorting
    const total = affiliatesWithEarnings.length
    const paginatedAffiliates = affiliatesWithEarnings.slice(skip, skip + limit)
    
    console.log('[ADMIN_AFFILIATES_API] Query result:', {
      registeredCount: registeredAffiliates.length,
      roleCount: affiliateRoleUsers.length + userRoleAffiliates.length,
      totalAffiliates: total,
      page,
      limit,
    })

    // 8. Calculate stats
    const stats = await calculateAffiliateStats()

    // 9. Return response
    return NextResponse.json({
      success: true,
      affiliates: paginatedAffiliates,
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
 * Calculate affiliate statistics
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
  
  // Get users with AFFILIATE role (not in AffiliateProfile)
  const profileUserIds = await prisma.affiliateProfile.findMany({
    select: { userId: true }
  }).then(profiles => profiles.map(p => p.userId))
  
  const roleOnlyCount = await prisma.user.count({
    where: {
      role: 'AFFILIATE',
      id: { notIn: profileUserIds }
    }
  })
  
  const totalAffiliates = registeredCount + roleOnlyCount
  
  // Get total earnings from AffiliateConversion (ALL commissions - including Sejoli data)
  const totalCommissionData = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: { id: true }
  })
  
  // Get total sales from transactions linked to AffiliateConversion
  const conversionTxIds = await prisma.affiliateConversion.findMany({
    select: { transactionId: true }
  })
  const txIds = conversionTxIds.map(c => c.transactionId)
  
  const totalSalesData = txIds.length > 0 ? await prisma.transaction.aggregate({
    where: { id: { in: txIds } },
    _sum: { amount: true }
  }) : { _sum: { amount: null } }
  
  // Get all affiliate user IDs
  const allAffiliateUserIds = [
    ...profileUserIds,
    ...(await prisma.user.findMany({
      where: { role: 'AFFILIATE', id: { notIn: profileUserIds } },
      select: { id: true }
    })).map(u => u.id)
  ]
  
  // Pending payouts (sum of balance for affiliate users)
  const pendingPayoutsData = allAffiliateUserIds.length > 0 ? await prisma.wallet.aggregate({
    _sum: {
      balance: true,
    },
    where: {
      balance: { gt: 0 },
      userId: { in: allAffiliateUserIds }
    },
  }) : { _sum: { balance: null } }
  
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
    roleOnlyAffiliates: roleOnlyCount,
    activeAffiliates: activeCount,
    pendingApproval: pendingCount,
    totalEarnings: Number(totalCommissionData._sum.commissionAmount || 0),
    totalSales: Number(totalSalesData._sum.amount || 0),
    totalConversions: totalCommissionData._count.id || 0,
    pendingPayouts: Number(pendingPayoutsData._sum.balance || 0),
    totalPayouts: Number(totalPayoutsData._sum.amount || 0),
  }
}
