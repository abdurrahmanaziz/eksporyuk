import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const verified = searchParams.get('verified') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      isSuspended: false
    }

    if (verified) {
      where.isVerified = true
    }

    // Get total count
    const total = await prisma.supplierProfile.count({ where })

    // Get suppliers - simplified without complex relations
    const suppliers = await prisma.supplierProfile.findMany({
      where,
      select: {
        id: true,
        slug: true,
        companyName: true,
        bio: true,
        logo: true,
        banner: true,
        city: true,
        province: true,
        isVerified: true,
        viewCount: true,
        createdAt: true
      },
      orderBy: [
        { isVerified: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    })

    // Get stats - simplified
    const stats = {
      total: await prisma.supplierProfile.count({
        where: {
          isSuspended: false
        }
      }),
      verified: await prisma.supplierProfile.count({
        where: {
          isSuspended: false,
          isVerified: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
