import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
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

    // 4. Get affiliates with pagination (no relations, use manual lookup)
    const [rawAffiliates, total] = await Promise.all([
      prisma.affiliateProfile.findMany({
        where,
        orderBy: [
          { totalEarnings: 'desc' }, // Highest earners first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.affiliateProfile.count({ where }),
    ])
    
    // Get users for affiliates manually
    const userIds = rawAffiliates.map(a => a.userId)
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
    
    // Combine affiliates with user data
    const affiliates = rawAffiliates.map(aff => ({
      ...aff,
      user: userMap.get(aff.userId) || null
    }))
    
    console.log('[ADMIN_AFFILIATES_API] Query result:', {
      affiliatesFound: affiliates.length,
      total,
      page,
      limit,
    })

    // 5. Get wallet data for each affiliate (use data from AffiliateProfile)
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

        // Use data from AffiliateProfile (already synced from WordPress)
        return {
          ...affiliate,
          wallet,
          // Keep totalEarnings and totalConversions from AffiliateProfile
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
 * Calculate affiliate statistics
 */
async function calculateAffiliateStats() {
  // Get all affiliate userIds first
  const affiliateUserIds = await prisma.affiliateProfile.findMany({
    select: { userId: true }
  })
  const userIds = affiliateUserIds.map(a => a.userId)
  
  const [
    totalAffiliates,
    activeAffiliates,
    pendingApproval,
    affiliateEarningsData,
    pendingPayoutsData,
    totalPayoutsData,
  ] = await Promise.all([
    // Total affiliates
    prisma.affiliateProfile.count(),
    
    // Active affiliates (approved and active)
    prisma.affiliateProfile.count({
      where: {
        isActive: true,
      },
    }),
    
    // Pending approval
    prisma.affiliateProfile.count({
      where: {
        isActive: false,
      },
    }),
    
    // Total earnings from AffiliateProfile (synced from WordPress)
    prisma.affiliateProfile.aggregate({
      _sum: {
        totalEarnings: true,
        totalSales: true,
      },
    }),
    
    // Pending payouts (sum of pending wallet balances for affiliates)
    prisma.wallet.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        balance: { gt: 0 },
        userId: { in: userIds }
      },
    }),
    
    // Total payouts (sum of all approved payouts)
    prisma.payout.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'APPROVED',
      },
    }),
  ])

  return {
    totalAffiliates,
    activeAffiliates,
    pendingApproval,
    totalEarnings: Number(affiliateEarningsData._sum.totalEarnings || 0),
    totalSales: Number(affiliateEarningsData._sum.totalSales || 0),
    pendingPayouts: Number(pendingPayoutsData._sum.balance || 0),
    totalPayouts: Number(totalPayoutsData._sum.amount || 0),
  }
}
