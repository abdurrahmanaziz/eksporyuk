import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const placement = searchParams.get('placement')

    if (!placement) {
      return NextResponse.json({ error: 'Placement required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const now = new Date()

    // Build basic where clause with proper date filtering
    let where: any = {
      isActive: true,
      placement: placement as any,
      startDate: { lte: now },
      endDate: { gte: now },
    }

    // Get banners
    let banners = await prisma.banner.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        videoUrl: true,
        linkUrl: true,
        linkText: true,
        placement: true,
        displayType: true,
        backgroundColor: true,
        textColor: true,
        buttonColor: true,
        buttonTextColor: true,
        isSponsored: true,
        sponsorName: true,
        sponsorLogo: true,
        targetRoles: true,
        targetMemberships: true,
        targetProvinces: true,
      },
    })

    // Filter by targeting in JavaScript (since SQLite doesn't support array operations)
    if (session?.user) {
      const userRole = session.user.role

      // Admin can see all banners without filtering
      if (userRole === 'ADMIN') {
        // No filtering needed for admin
      } else {
        // Get user membership for non-admin users
        const userMembership = await prisma.userMembership.findFirst({
          where: {
            userId: session.user.id,
            status: 'ACTIVE',
          },
          include: {
            membership: true,
          },
        })

        const membershipSlug = userMembership?.membership?.slug || 'none'

        banners = banners.filter(banner => {
          const targetRoles = (banner.targetRoles as string[]) || []
          const targetMemberships = (banner.targetMemberships as string[]) || []

          // If no targeting specified, show to everyone
          if (targetRoles.length === 0 && targetMemberships.length === 0) {
            return true
          }

          // Check role targeting - show if role is in target list OR no role targeting
          const roleMatch = targetRoles.length === 0 || targetRoles.includes(userRole)

          // Check membership targeting - show if membership is in target list OR no membership targeting
          const membershipMatch = targetMemberships.length === 0 || targetMemberships.includes(membershipSlug)

          return roleMatch && membershipMatch
        })
      }
    }
    // For non-logged in users, show all banners (public banners)

    // Limit results based on placement
    let limit = 1
    if (placement === 'DASHBOARD') {
      limit = 5 // Carousel can have multiple
    } else if (placement === 'FEED') {
      limit = 3 // Multiple feed banners rotate
    }
    banners = banners.slice(0, limit)

    return NextResponse.json(banners)
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}
