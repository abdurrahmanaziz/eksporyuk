import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/affiliate/bio/cta/click
 * Track CTA button click
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ctaId } = body

    if (!ctaId) {
      return NextResponse.json(
        { error: 'CTA ID is required' },
        { status: 400 }
      )
    }

    // Increment click count
    await prisma.affiliateBioCTA.update({
      where: { id: ctaId },
      data: { clicks: { increment: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking CTA click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}
