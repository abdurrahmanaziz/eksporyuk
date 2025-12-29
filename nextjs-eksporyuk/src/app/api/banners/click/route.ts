import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  try {
    const { bannerId } = await req.json()

    if (!bannerId) {
      return NextResponse.json({ error: 'Banner ID required' }, { status: 400 })
    }

    // Get session (optional for click tracking)
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

    // Check click limit
    if (banner.clickLimit && banner.totalClicks >= banner.clickLimit) {
      return NextResponse.json({ error: 'Click limit reached' }, { status: 400 })
    }

    // Track click
    await prisma.$transaction([
      prisma.bannerClick.create({
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
          totalClicks: {
            increment: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true, redirectUrl: banner.linkUrl })
  } catch (error) {
    console.error('Error tracking banner click:', error)
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 })
  }
}
