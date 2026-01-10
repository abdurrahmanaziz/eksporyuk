import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { description: { contains: search } },
        { externalId: { contains: search } },
      ]
    }

    // Fetch transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: {
          id: true,
          invoiceNumber: true,
          type: true,
          status: true,
          amount: true,
          description: true,
          paymentMethod: true,
          paymentUrl: true,
          externalId: true,
          createdAt: true,
          paidAt: true,
          expiredAt: true,
          product: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            }
          },
          membership: {
            select: {
              id: true,
              membershipId: true,
              membership: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      transactions,
      total,
      page,
      totalPages,
    })

  } catch (error) {
    console.error('[API] Error fetching user transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
