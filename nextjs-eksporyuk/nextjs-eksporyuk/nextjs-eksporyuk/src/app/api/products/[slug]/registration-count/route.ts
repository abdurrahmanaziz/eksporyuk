import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Get product by slug
    const product = await prisma.product.findFirst({
      where: { slug },
      select: {
        id: true,
        maxParticipants: true,
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Count transactions with status SUCCESS (paid registrations)
    const paidCount = await prisma.transaction.count({
      where: {
        productId: product.id,
        status: 'SUCCESS'
      }
    })

    // Count transactions with status PENDING_CONFIRMATION
    const pendingCount = await prisma.transaction.count({
      where: {
        productId: product.id,
        status: 'PENDING_CONFIRMATION'
      }
    })

    return NextResponse.json({
      success: true,
      paidCount,
      pendingCount,
      maxParticipants: product.maxParticipants,
      availableSpots: product.maxParticipants ? Math.max(0, product.maxParticipants - paidCount) : null
    })
  } catch (error) {
    console.error('[Registration Count API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration count' },
      { status: 500 }
    )
  }
}
