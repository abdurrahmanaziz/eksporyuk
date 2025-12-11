import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST /api/affiliate/track-click - Track affiliate click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    // Find affiliate link
    const link = await prisma.affiliateLink.findFirst({
      where: {
        code: code,
        isActive: true,
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 404 })
    }

    // Get request info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    // Create click record
    await prisma.affiliateClick.create({
      data: {
        linkId: link.id,
        ipAddress,
        userAgent,
        referrer,
      },
    })

    // Increment click count on link
    await prisma.affiliateLink.update({
      where: { id: link.id },
      data: {
        clicks: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}
