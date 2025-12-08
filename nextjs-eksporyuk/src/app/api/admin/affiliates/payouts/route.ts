import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/affiliates/payouts
 * 
 * List all payout requests with filters and stats
 */
export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // 3. Build where clause
    const where: any = {}

    // Filter by status
    if (status !== 'ALL') {
      where.status = status
    }

    // Search by user name, email, or affiliate code
    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            affiliateProfile: {
              affiliateCode: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ]
    }

    // 4. Fetch payouts with pagination
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  affiliateProfile: {
                    select: {
                      affiliateCode: true,
                      tier: true,
                      totalEarnings: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ])

    // 6. Calculate stats
    async function calculatePayoutStats() {
      const [
        totalRequests,
        pendingAmount,
        approvedAmount,
        rejectedCount,
      ] = await Promise.all([
        prisma.payout.count(),
        prisma.payout.aggregate({
          _sum: { amount: true },
          where: { status: 'PENDING' },
        }),
        prisma.payout.aggregate({
          _sum: { amount: true },
          where: { status: 'APPROVED' },
        }),
        prisma.payout.count({
          where: { status: 'REJECTED' },
        }),
      ])

      return {
        totalRequests,
        pendingAmount: Number(pendingAmount._sum.amount || 0),
        approvedAmount: Number(approvedAmount._sum.amount || 0),
        rejectedCount,
      }
    }

    const stats = await calculatePayoutStats()

    // 7. Return response
    return NextResponse.json({
      success: true,
      payouts,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
