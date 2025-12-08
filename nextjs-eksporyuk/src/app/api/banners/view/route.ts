import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { bannerId } = await req.json()

    if (!bannerId) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 })
    }

    // Get session (optional for view tracking)
    const session = await getServerSession(authOptions)

    // Get user info
    const userId = session?.user?.id || null
    const sessionId = req.cookies.get('session')?.value || null
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
    const userAgent = req.headers.get('user-agent') || null
    const referer = req.headers.get('referer') || null

    // Check if banner exists and is active
    const banner = await prisma.banner.findUnique({
      where: { id: bannerId },
    })

    if (!banner || !banner.isActive) {
      return NextResponse.json({ error: 'Banner not found or inactive' }, { status: 404 })
    }

    // Check schedule
    const now = new Date()
    if (banner.startDate && new Date(banner.startDate) > now) {
      return NextResponse.json({ error: 'Banner not started yet' }, { status: 400 })
    }
    if (banner.endDate && new Date(banner.endDate) < now) {
      return NextResponse.json({ error: 'Banner expired' }, { status: 400 })
    }

    // Check view limit
    if (banner.viewLimit && banner.totalViews >= banner.viewLimit) {
      return NextResponse.json({ error: 'View limit reached' }, { status: 400 })
    }

    // Check targeting (role, membership)
    if (session?.user) {
      const targetRoles = banner.targetRoles as string[]
      const targetMemberships = banner.targetMemberships as string[]

      // Check role targeting
      if (targetRoles.length > 0 && !targetRoles.includes(session.user.role)) {
        return NextResponse.json({ error: 'Not targeted for this role' }, { status: 403 })
      }

      // Check membership targeting
      if (targetMemberships.length > 0) {
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
        if (!targetMemberships.includes(membershipSlug)) {
          return NextResponse.json({ error: 'Not targeted for this membership' }, { status: 403 })
        }
      }
    }

    // Prevent duplicate views (same user/session within 1 hour)
    if (userId || sessionId) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentView = await prisma.bannerView.findFirst({
        where: {
          bannerId,
          ...(userId ? { userId } : { sessionId }),
          viewedAt: {
            gte: oneHourAgo,
          },
        },
      })

      if (recentView) {
        return NextResponse.json({ message: 'Already counted' }, { status: 200 })
      }
    }

    // Track view
    await prisma.$transaction([
      prisma.bannerView.create({
        data: {
          bannerId,
          userId,
          sessionId,
          ipAddress,
          userAgent,
          referer,
        },
      }),
      prisma.banner.update({
        where: { id: bannerId },
        data: {
          totalViews: {
            increment: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking banner view:', error)
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}
