import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { checkDatabaseAccess, trackDatabaseView } from '@/lib/export-database'

export const dynamic = 'force-dynamic'

// GET /api/buyers - List buyers for members (with quota check)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''

    // Check quota
    const access = await checkDatabaseAccess(session.user.id, 'buyer')

    const where: any = {
      isVerified: true // Only show verified for members
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { productsInterest: { contains: search } }
      ]
    }

    if (country) {
      where.country = country
    }

    const [buyers, total] = await Promise.all([
      prisma.buyer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          companyName: true,
          country: true,
          city: true,
          businessType: true,
          productsInterest: true,
          rating: true,
          totalDeals: true,
          isVerified: true,
          // Hide sensitive data for preview
          contactPerson: false,
          email: false,
          phone: false,
          website: false,
          address: false
        },
        orderBy: { viewCount: 'desc' }
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
      },
      quota: {
        hasAccess: access.hasAccess,
        used: access.used,
        remaining: access.remaining,
        isUnlimited: access.isUnlimited
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
