import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/products/[id]/registration-count
 * Get PAID registration count for an event product
 * Only counts Transaction records with status = 'COMPLETED'
 * Returns: { count: number, maxParticipants: number, paidCount: number, pendingCount: number }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId

    // Get product to verify it exists and is an event
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        productType: true,
        maxParticipants: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Only count for events
    if (product.productType !== 'EVENT') {
      return NextResponse.json(
        { count: 0, maxParticipants: null, paidCount: 0, pendingCount: 0 }
      )
    }

    // Count ONLY COMPLETED transactions (paid registrations)
    const paidCount = await prisma.transaction.count({
      where: {
        productId: productId,
        status: 'COMPLETED'
      }
    })

    // Count PENDING transactions (not yet paid)
    const pendingCount = await prisma.transaction.count({
      where: {
        productId: productId,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      count: paidCount, // Only paid count counts toward quota
      maxParticipants: product.maxParticipants,
      paidCount: paidCount,
      pendingCount: pendingCount,
      productId: productId,
      message: 'Only completed (paid) transactions count toward event quota'
    })
  } catch (error) {
    console.error('[API] Registration count error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration count' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

