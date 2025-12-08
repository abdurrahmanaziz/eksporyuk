import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/transactions
 * Get transaction history with filtering
 * Query params: type, status, period, userId
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const period = searchParams.get('period') || 'monthly'
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Only admin/founder can view all transactions
    const isAuthorized = user.role === 'ADMIN' || user.isFounder || user.isCoFounder

    // Date range calculation
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
        startDate = new Date('2020-01-01')
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

    // Non-authorized users can only see their own transactions
    if (!isAuthorized) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
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
              name: true,
              price: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              price: true
            }
          },
          coupon: {
            select: {
              id: true,
              code: true,
              discountType: true,
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

    // Calculate summary stats
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

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalAmount: Number(stats._sum.amount || 0),
        totalCount: stats._count.id
      },
      period
    })

  } catch (error: any) {
    console.error('Transaction fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * Create a new transaction (typically called by payment gateway or admin)
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admin/founder can create manual transactions
    if (user.role !== 'ADMIN' && !user.isFounder) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      userId,
      type,
      amount,
      status = 'PENDING',
      description,
      productId,
      courseId,
      membershipId,
      affiliateId,
      couponId,
      paymentMethod = 'MANUAL',
      metadata
    } = body

    // Validate required fields
    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, amount' },
        { status: 400 }
      )
    }

    // Get customer info
    const customer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Generate invoice number
    const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
    const invoiceNumber = await getNextInvoiceNumber()

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
        status,
        invoiceNumber,
        description: description || `${type} Transaction`,
        productId,
        courseId,
        couponId,
        paymentMethod,
        paymentProvider: 'MANUAL',
        customerName: customer.name || '',
        customerEmail: customer.email || '',
        customerPhone: customer.phone,
        metadata: {
          ...metadata,
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
        },
        product: {
          select: {
            name: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    })

    // If status is SUCCESS, process revenue distribution
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
      message: 'Transaction created successfully',
      transaction
    })

  } catch (error: any) {
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
