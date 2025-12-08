import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get supplier profile
    const supplierProfile = await prisma.supplierProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        companyName: true,
        viewCount: true,
        totalProducts: true,
        totalChats: true,
        rating: true,
        totalReviews: true,
        isVerified: true
      }
    })

    if (!supplierProfile) {
      return NextResponse.json(
        { error: 'Supplier profile not found' },
        { status: 404 }
      )
    }

    // Get active products
    const activeProducts = await prisma.supplierProduct.count({
      where: {
        supplierId: supplierProfile.id,
        status: 'ACTIVE'
      }
    })

    // Get product stats
    const productStats = await prisma.supplierProduct.aggregate({
      where: {
        supplierId: supplierProfile.id
      },
      _sum: {
        viewCount: true,
        likeCount: true,
        inquiryCount: true
      }
    })

    // Get membership info
    const membership = await prisma.supplierMembership.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        endDate: {
          gte: new Date()
        }
      },
      include: {
        package: {
          select: {
            name: true,
            type: true,
            features: true
          }
        }
      }
    })

    // Get recent product views (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentProducts = await prisma.supplierProduct.findMany({
      where: {
        supplierId: supplierProfile.id,
        updatedAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        status: true,
        updatedAt: true
      },
      orderBy: {
        viewCount: 'desc'
      },
      take: 5
    })

    // Calculate engagement rate
    const totalViews = productStats._sum.viewCount || 0
    const totalLikes = productStats._sum.likeCount || 0
    const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0

    // Get pending products
    const pendingProducts = await prisma.supplierProduct.count({
      where: {
        supplierId: supplierProfile.id,
        status: 'PENDING_REVIEW'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          companyName: supplierProfile.companyName,
          totalViews: supplierProfile.viewCount,
          totalProducts: supplierProfile.totalProducts,
          activeProducts,
          pendingProducts,
          totalChats: supplierProfile.totalChats,
          rating: supplierProfile.rating,
          totalReviews: supplierProfile.totalReviews,
          isVerified: supplierProfile.isVerified,
          engagementRate: parseFloat(engagementRate as string)
        },
        productStats: {
          totalViews: productStats._sum.viewCount || 0,
          totalLikes: productStats._sum.likeCount || 0,
          totalInquiries: productStats._sum.inquiryCount || 0
        },
        membership: membership ? {
          packageName: membership.package.name,
          tier: membership.package.type,
          startDate: membership.startDate,
          endDate: membership.endDate,
          isActive: membership.isActive,
          daysRemaining: membership.endDate 
            ? Math.ceil((membership.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null
        } : null,
        topProducts: recentProducts
      }
    })
  } catch (error) {
    console.error('Error fetching supplier stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
