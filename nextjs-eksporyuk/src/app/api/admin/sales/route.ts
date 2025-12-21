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
    
    // Filter parameters (support both old/new param names)
    const startDate = searchParams.get('startDate') || searchParams.get('dateFrom')
    const endDate = searchParams.get('endDate') || searchParams.get('dateTo')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const membershipDuration = searchParams.get('membershipDuration') // NEW: Filter by membership duration
    const userId = searchParams.get('userId')
    const affiliateId = searchParams.get('affiliateId')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search') || searchParams.get('invoice') || ''
    const paymentMethod = searchParams.get('paymentMethod')
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
    
    // Filter by payment method if provided (VA | EWALLET | QRIS | RETAIL | MANUAL)
    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod
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
                // duration intentionally omitted to avoid enum decode errors from legacy values
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
                // duration intentionally omitted to avoid enum decode errors
                price: true,
                reminders: true,
              }
            })
            // Safely fetch duration via raw SQL (use quoted table name for PostgreSQL)
            let derivedDuration: string | null = null
            try {
              const dRows: any[] = await prisma.$queryRaw`SELECT duration FROM "Membership" WHERE id = ${membershipId} LIMIT 1`
              derivedDuration = (dRows?.[0]?.duration as string) || null
            } catch (_) {
              derivedDuration = null
            }
            
            if (membership) {
              return {
                ...tx,
                // attach relation without enum duration
                membership: {
                  membership: membership
                },
                // ensure metadata carries duration for UI grouping/filtering
                metadata: {
                  ...(tx.metadata as any || {}),
                  membershipDuration: (tx.metadata as any)?.membershipDuration || derivedDuration || null,
                }
              }
            }
          }
        }
        // If it has membership relation but no metadata duration, try to derive
        if (tx.type === 'MEMBERSHIP' && tx.membership && !((tx.metadata as any)?.membershipDuration)) {
          const mId = tx.membership.membership.id
          let derivedDuration: string | null = null
          try {
            const dRows: any[] = await prisma.$queryRaw`SELECT duration FROM "Membership" WHERE id = ${mId} LIMIT 1`
            derivedDuration = (dRows?.[0]?.duration as string) || null
          } catch (_) {
            derivedDuration = null
          }
          return {
            ...tx,
            metadata: {
              ...(tx.metadata as any || {}),
              membershipDuration: derivedDuration,
            }
          }
        }
        return tx
      })
    )
    
    // Enrich transactions with affiliate data from metadata for PENDING transactions
    // This shows affiliate info even before payment is completed
    const fullyEnrichedTransactions = await Promise.all(
      enrichedTransactions.map(async (tx) => {
        // If transaction doesn't have affiliateConversion but has affiliate data in metadata
        if (!tx.affiliateConversion) {
          const metadata = tx.metadata as any
          const affiliateId = metadata?.affiliate_id || metadata?.affiliateId
          const affiliateName = metadata?.affiliate_name || metadata?.affiliateName
          
          if (affiliateId || affiliateName) {
            // Try to find the affiliate profile
            let affiliateProfile = null
            
            // First try to find by existing mapping from conversions
            if (affiliateId) {
              const existingConversion = await prisma.affiliateConversion.findFirst({
                where: {
                  transaction: {
                    metadata: {
                      path: ['affiliate_id'],
                      equals: affiliateId
                    }
                  }
                },
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
              })
              affiliateProfile = existingConversion?.affiliate
            }
            
            // Create a virtual affiliateConversion object for display
            // Note: commissionAmount is null for PENDING - only shown after SUCCESS
            return {
              ...tx,
              // Virtual affiliate data from metadata (for display only)
              affiliateFromMetadata: {
                name: affiliateName || affiliateProfile?.user?.name || null,
                affiliateId: affiliateId,
                affiliate: affiliateProfile ? {
                  id: affiliateProfile.id,
                  user: affiliateProfile.user
                } : null,
                // Commission only shown if transaction is SUCCESS
                commissionAmount: tx.status === 'SUCCESS' ? (metadata?.commissionAmount || null) : null,
              }
            }
          }
        }
        return tx
      })
    )
    
    // Filter by membership duration if specified
    let filteredTransactions = fullyEnrichedTransactions
    if (filterDuration) {
      filteredTransactions = fullyEnrichedTransactions.filter(tx => {
        if (tx.type !== 'MEMBERSHIP') return false
        // Prefer metadata-derived duration to avoid enum decoding on relation
        const duration = (tx.metadata as any)?.membershipDuration 
          || (tx.metadata as any)?.duration 
          || tx.membership?.membership?.duration
        return String(duration) === String(filterDuration)
      })
    }
    
    // Debug: Log full first transaction to see data structure
    if (filteredTransactions.length > 0) {
      const firstTx = filteredTransactions[0]
      console.log('[Sales API] First enriched transaction:', JSON.stringify({
        id: firstTx.id,
        type: firstTx.type,
        amount: firstTx.amount,
        hasAffiliateConversion: !!firstTx.affiliateConversion,
        affiliateConversion: firstTx.affiliateConversion ? {
          id: firstTx.affiliateConversion.id,
          commissionAmount: firstTx.affiliateConversion.commissionAmount,
          affiliateName: firstTx.affiliateConversion.affiliate?.user?.name,
        } : null,
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
                // duration intentionally omitted to avoid enum decode errors from legacy values
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
