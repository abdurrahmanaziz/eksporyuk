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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // 3. Build where clause
    const where: any = {}

    // Status filter
    if (status === 'PENDING') {
      where.isActive = false
    } else if (status === 'ACTIVE') {
      where.isActive = true
    } else if (status === 'INACTIVE') {
      where.isActive = false
    }
    // If status is 'ALL', don't add any filter

    // Search filter - for user fields, we need to pre-filter by userId
    let userIdFilter: string[] | undefined
    if (search) {
      // First find matching users
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        },
        select: { id: true }
      })
      userIdFilter = matchingUsers.map(u => u.id)
      
      // Combine user ID filter with affiliate code filter
      where.OR = [
        { affiliateCode: { contains: search, mode: 'insensitive' } },
        { shortLinkUsername: { contains: search, mode: 'insensitive' } },
        ...(userIdFilter.length > 0 ? [{ userId: { in: userIdFilter } }] : [])
      ]
    }

    // 4. Get affiliates REALTIME from AffiliateConversion (data from Sejoli)
    const affiliateStats = await prisma.$queryRaw<Array<{
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
      ORDER BY "totalEarnings" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `
    
    const totalAffiliatesCount = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT "affiliateId")::bigint as count 
      FROM "AffiliateConversion"
    `
    const total = Number(totalAffiliatesCount[0]?.count || 0)
    
    // Get users for affiliates manually
    const userIds = affiliateStats.map(a => a.affiliateId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      }
    })
    const userMap = new Map(users.map(u => [u.id, u]))
    
    // Build affiliate data structure
    const affiliates = affiliateStats.map(stat => ({
      id: stat.affiliateId, // Use userId as affiliate ID
      userId: stat.affiliateId,
      user: userMap.get(stat.affiliateId) || null,
      affiliateCode: '', // Not used in Sejoli import
      shortLinkUsername: undefined,
      tier: 1,
      commissionRate: 0,
      totalClicks: 0,
      totalConversions: Number(stat.totalConversions),
      totalEarnings: Number(stat.totalEarnings),
      totalSales: 0, // Will be filled from transactions
      isActive: true,
      approvedAt: stat.firstCommission?.toISOString(),
      createdAt: stat.firstCommission?.toISOString() || new Date().toISOString(),
    }))
    
    console.log('[ADMIN_AFFILIATES_API] Query result:', {
      affiliatesFound: affiliates.length,
      total,
      page,
      limit,
    })

    // 5. Get wallet data for each affiliate (REALTIME)
    const affiliatesWithWallet = await Promise.all(
      affiliates.map(async (affiliate) => {
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
        const txIds = affiliateTxs.map(a => a.transactionId)
        
        const salesData = await prisma.transaction.aggregate({
          where: { id: { in: txIds } },
          _sum: { amount: true }
        })

        return {
          ...affiliate,
          wallet,
          totalSales: Number(salesData._sum.amount || 0),
        }
      })
    )

    // 6. Calculate stats
    const stats = await calculateAffiliateStats()

    // 7. Return response
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
 * Calculate affiliate statistics - REALTIME from AffiliateConversion
 */
async function calculateAffiliateStats() {
  // Get unique affiliate IDs from AffiliateConversion (realtime data from Sejoli)
  const uniqueAffiliates = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "affiliateId") as count 
    FROM "AffiliateConversion"
  `
  const totalAffiliates = Number(uniqueAffiliates[0]?.count || 0)
  
  // Get total earnings and count from AffiliateConversion (realtime)
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
  const txIds = affiliateTransactions.map(a => a.transactionId)
  
  const salesData = await prisma.transaction.aggregate({
    where: {
      id: { in: txIds }
    },
    _sum: {
      amount: true,
    },
  })
  
  // Get affiliate user IDs
  const affiliateUserIds = await prisma.$queryRaw<{ affiliateId: string }[]>`
    SELECT DISTINCT "affiliateId" FROM "AffiliateConversion"
  `
  const userIds = affiliateUserIds.map(a => a.affiliateId)
  
  // Pending payouts (sum of balance for affiliate users)
  const pendingPayoutsData = await prisma.wallet.aggregate({
    _sum: {
      balance: true,
    },
    where: {
      balance: { gt: 0 },
      userId: { in: userIds }
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
    activeAffiliates: totalAffiliates, // All affiliates with commissions are active
    pendingApproval: 0, // No pending approval in imported data
    totalEarnings: Number(earningsData._sum.commissionAmount || 0),
    totalSales: Number(salesData._sum.amount || 0),
    pendingPayouts: Number(pendingPayoutsData._sum.balance || 0),
    totalPayouts: Number(totalPayoutsData._sum.amount || 0),
  }
}
