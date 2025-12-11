import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const membershipDuration = searchParams.get('membershipDuration') // NEW: Filter by membership duration
    const userId = searchParams.get('userId')
    const affiliateId = searchParams.get('affiliateId')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search')
    const membershipName = searchParams.get('membershipName')
    const productName = searchParams.get('productName')
    const courseName = searchParams.get('courseName')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '200')
    
    // Build where clause
    const where: any = {}
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    // Handle type filter with membership duration
    if (type && type !== 'ALL') {
      // Check if type includes duration (e.g., "MEMBERSHIP_ONE_MONTH")
      if (type.startsWith('MEMBERSHIP_')) {
        where.type = 'MEMBERSHIP'
        // Duration will be filtered after query (via membership relation or metadata)
      } else {
        where.type = type
      }
    }
    
    // Filter by membership duration (will be applied in post-processing)
    const filterDuration = membershipDuration || (type?.startsWith('MEMBERSHIP_') ? type.replace('MEMBERSHIP_', '') : null)
    
    if (userId) {
      where.userId = userId
    }
    
    if (affiliateId) {
      where.affiliateConversion = {
        affiliateId: affiliateId
      }
    }
    
    if (productId) {
      where.productId = productId
    }
    
    // Filter by membership name
    if (membershipName) {
      where.membership = {
        membership: {
          name: {
            contains: membershipName
          }
        }
      }
    }
    
    // Filter by product name
    if (productName) {
      where.product = {
        name: {
          contains: productName
        }
      }
    }
    
    // Filter by course name
    if (courseName) {
      where.course = {
        title: {
          contains: courseName
        }
      }
    }
    
    // Search by invoice ID, user name, email
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { invoiceNumber: { contains: search } },
        { externalId: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }
    
    // Get total count
    const total = await prisma.transaction.count({ where })
    
    // Get transactions with relations
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            reminders: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            reminders: true,
          }
        },
        membership: {
          select: {
            membership: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                reminders: true,
              }
            }
          }
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          }
        },
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    whatsapp: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
    })
    
    // Enrich transactions with membership data from metadata if relation is null
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        // If it's a MEMBERSHIP transaction but membership relation is null
        if (tx.type === 'MEMBERSHIP' && !tx.membership) {
          const metadata = tx.metadata as any
          const membershipId = metadata?.membershipId
          
          if (membershipId) {
            // Lookup membership directly
            const membership = await prisma.membership.findUnique({
              where: { id: membershipId },
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                reminders: true,
              }
            })
            
            if (membership) {
              return {
                ...tx,
                membership: {
                  membership: membership
                }
              }
            }
          }
        }
        return tx
      })
    )
    
    // Filter by membership duration if specified
    let filteredTransactions = enrichedTransactions
    if (filterDuration) {
      filteredTransactions = enrichedTransactions.filter(tx => {
        if (tx.type !== 'MEMBERSHIP') return false
        
        // Get duration from membership relation or metadata
        const duration = tx.membership?.membership?.duration || (tx.metadata as any)?.membershipDuration || (tx.metadata as any)?.duration
        return duration === filterDuration
      })
    }
    
    // Debug: Log full first transaction to see data structure
    if (filteredTransactions.length > 0) {
      console.log('[Sales API] First enriched transaction:', JSON.stringify({
        id: filteredTransactions[0].id,
        type: filteredTransactions[0].type,
        membership: filteredTransactions[0].membership,
        metadata: (filteredTransactions[0].metadata as any)?.membershipId,
      }, null, 2))
    }
    
    // Get stats
    const stats = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: true,
    })
    
    const successStats = await prisma.transaction.aggregate({
      where: {
        ...where,
        status: 'SUCCESS'
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })
    
    const pendingStats = await prisma.transaction.aggregate({
      where: {
        ...where,
        status: 'PENDING'
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Get unique users and affiliates for filter options
    const users = await prisma.user.findMany({
      where: {
        transactions: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 100,
    })

    const affiliates = await prisma.affiliateProfile.findMany({
      where: {
        conversions: {
          some: {}
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      take: 100,
    })
    
    return NextResponse.json({
      success: true,
      transactions: filteredTransactions,
      pagination: {
        page,
        limit,
        total: filterDuration ? filteredTransactions.length : total,
        totalPages: Math.ceil((filterDuration ? filteredTransactions.length : total) / limit),
      },
      stats: {
        total: {
          count: stats._count || 0,
          amount: Number(stats._sum.amount || 0),
        },
        success: {
          count: successStats._count || 0,
          amount: Number(successStats._sum.amount || 0),
        },
        pending: {
          count: pendingStats._count || 0,
          amount: Number(pendingStats._sum.amount || 0),
        }
      },
      filterOptions: {
        users,
        affiliates,
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}

// Export CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { filters } = body
    
    // Build where clause (same as GET)
    const where: any = {}
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }
    
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status
    }
    
    if (filters.type && filters.type !== 'ALL') {
      where.type = filters.type
    }
    
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            reminders: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
            reminders: true,
          }
        },
        membership: {
          include: {
            membership: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                reminders: true,
              }
            }
          }
        },
        coupon: true,
        affiliateConversion: {
          include: {
            affiliate: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
    })
    
    return NextResponse.json({
      success: true,
      data: transactions,
    })
  } catch (error) {
    console.error('Error exporting sales:', error)
    return NextResponse.json(
      { error: 'Failed to export sales data' },
      { status: 500 }
    )
  }
}
