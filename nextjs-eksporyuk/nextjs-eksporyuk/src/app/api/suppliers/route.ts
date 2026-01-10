import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { checkDatabaseAccess } from '@/lib/export-database'

// GET /api/suppliers - List suppliers (member access with quota check)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check quota access
    const access = await checkDatabaseAccess(session.user.id, 'supplier')
    
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: 'Database access quota exceeded',
          message: `You have used ${access.viewsUsed} of ${access.monthlyQuota} views this month. Upgrade your membership for more access.`,
          quotaExceeded: true,
          viewsUsed: access.viewsUsed,
          monthlyQuota: access.monthlyQuota,
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''

    const skip = (page - 1) * limit

    // Build filters - members only see verified suppliers
    const where: any = {
      verified: true,
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { products: { contains: search } },
        { city: { contains: search } },
      ]
    }

    if (country) {
      where.country = country
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
          products: true,
          certifications: true,
          rating: true,
          totalReviews: true,
          verified: true,
          // Hide sensitive contact info in list view
          contactPerson: false,
          phone: false,
          email: false,
          website: false,
        },
        orderBy: [
          { verified: 'desc' },
          { rating: 'desc' },
        ],
      }),
      prisma.supplier.count({ where }),
    ])

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      quota: {
        viewsUsed: access.viewsUsed,
        monthlyQuota: access.monthlyQuota,
        viewsRemaining: access.monthlyQuota - access.viewsUsed,
      },
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
