import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}


export const dynamic = 'force-dynamic';
/**
 * POST /api/public/bio/cta/[id]/click
 * Track CTA button click (public endpoint)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Increment click count
    await prisma.affiliateBioCTA.update({
      where: { id, isActive: true },
      data: {
        clicks: { increment: 1 }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking CTA click:', error)
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
