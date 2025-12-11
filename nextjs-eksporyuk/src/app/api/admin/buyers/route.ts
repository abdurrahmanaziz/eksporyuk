import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET /api/admin/buyers - List all buyers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const verified = searchParams.get('verified')

    const where: any = {}

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { productsInterest: { contains: search } },
        { contactPerson: { contains: search } }
      ]
    }

    if (country) {
      where.country = country
    }

    if (verified === 'true') {
      where.isVerified = true
    } else if (verified === 'false') {
      where.isVerified = false
    }

    const [buyers, total] = await Promise.all([
      prisma.buyer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          addedByUser: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.buyer.count({ where })
    ])

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Get buyers error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/buyers - Create new buyer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const buyer = await prisma.buyer.create({
      data: {
        ...body,
        addedBy: session.user.id
      }
    })

    return NextResponse.json({ buyer }, { status: 201 })
  } catch (error: any) {
    console.error('Create buyer error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
