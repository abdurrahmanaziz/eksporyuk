import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/admin/affiliate-links - Get all affiliate links (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all affiliate links with short codes
    const links = await prisma.affiliateLink.findMany({
      where: {
        isActive: true,
        shortCode: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        membership: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      links: links.map(link => ({
        id: link.id,
        code: link.code,
        shortCode: link.shortCode,
        couponCode: link.couponCode,
        linkType: link.linkType,
        membershipId: link.membershipId,
        productId: link.productId,
        userId: link.userId,
        userName: link.user?.name,
        targetName: link.membership?.name || link.product?.name,
        createdAt: link.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching affiliate links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    )
  }
}
