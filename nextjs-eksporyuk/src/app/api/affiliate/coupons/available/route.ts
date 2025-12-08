import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/affiliate/coupons/available - Get admin coupons available for affiliates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'AFFILIATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        isAffiliateEnabled: true,
        isActive: true,
        createdBy: null, // Only admin coupons
      },
      include: {
        _count: {
          select: {
            generatedCoupons: {
              where: {
                createdBy: session.user.id,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ coupons })
  } catch (error: any) {
    console.error('Error fetching available coupons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error.message },
      { status: 500 }
    )
  }
}
