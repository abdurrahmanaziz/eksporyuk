import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/sales
 * Get sales records with filtering
 * Query params: period, type, userId, status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, isFounder: true, isCoFounder: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admin, founder, co-founder can view all sales
    const isAuthorized = user.role === 'ADMIN' || user.isFounder || user.isCoFounder

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        startDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2020-01-01') // Far past
        break
    }

    // Build query
    const where: any = {
      createdAt: {
        gte: startDate
      }
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    // Non-authorized users can only see their own sales
    if (!isAuthorized) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Get transactions (sales)
    const [sales, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          product: {
            select: {
              id: true,
              name: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          },
          coupon: {
            select: {
              code: true,
              discountValue: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    // Calculate statistics
    const stats = await prisma.transaction.aggregate({
      where: {
        ...where,
        status: 'SUCCESS'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Get sales by type
    const salesByType = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        ...where,
        status: 'SUCCESS'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalRevenue: Number(stats._sum.amount || 0),
        totalSales: stats._count.id,
        byType: salesByType.map(item => ({
          type: item.type,
          revenue: Number(item._sum.amount || 0),
          count: item._count.id
        }))
      },
      period
    })

  } catch (error: any) {
    console.error('Sales fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales
 * Create manual sale record (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, isFounder: true }
    })

    if (!user || (user.role !== 'ADMIN' && !user.isFounder)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      type,
      amount,
      description,
      productId,
      courseId,
      membershipId,
      affiliateId,
      status = 'SUCCESS'
    } = body

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    // Create manual transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
        status,
        invoiceNumber,
        description: description || `Manual ${type} Sale`,
        paymentMethod: 'MANUAL',
        paymentProvider: 'MANUAL',
        productId,
        courseId,
        metadata: {
          createdBy: user.id,
          membershipId,
          affiliateId,
          isManual: true
        } as any
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Process revenue distribution if successful
    if (status === 'SUCCESS') {
      const { processRevenueDistribution } = await import('@/lib/revenue-split')
      
      await processRevenueDistribution({
        amount: Number(amount),
        type: type as any,
        affiliateId,
        membershipId,
        courseId,
        productId,
        transactionId: transaction.id
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Manual sale recorded',
      transaction
    })

  } catch (error: any) {
    console.error('Manual sale error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create sale' },
      { status: 500 }
    )
  }
}
