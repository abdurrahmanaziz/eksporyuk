import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch transaction with full details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id, // Ensure user can only see their own transactions
      },
      select: {
        id: true,
        invoiceNumber: true,
        type: true,
        status: true,
        amount: true,
        originalAmount: true,
        discountAmount: true,
        description: true,
        paymentMethod: true,
        paymentProvider: true,
        paymentUrl: true,
        externalId: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        customerWhatsapp: true,
        notes: true,
        reference: true,
        metadata: true,
        createdAt: true,
        paidAt: true,
        expiredAt: true,
        product: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          }
        },
        membership: {
          select: {
            id: true,
            membershipId: true,
            startDate: true,
            endDate: true,
            membership: {
              select: {
                name: true,
                slug: true,
              }
            }
          }
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          }
        }
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction,
    })

  } catch (error) {
    console.error('[API] Error fetching transaction detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}
