import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()
    const transactionId = params.id

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.status === 'FAILED') {
      return NextResponse.json({ error: 'Transaction already rejected' }, { status: 400 })
    }

    // Get current metadata to preserve existing data
    const currentMetadata = (transaction.metadata as any) || {}

    // Update transaction status and store rejection reason
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: 'FAILED',
        updatedAt: new Date(),
        notes: reason, // Store rejection reason in notes field
        metadata: {
          ...currentMetadata,
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: session.user?.email || 'admin'
        }
      },
    })

    // Send rejection notification (optional - can be expanded)
    // await notificationService.sendTransactionRejected(transaction, reason)

    return NextResponse.json({ 
      success: true, 
      transaction: updatedTransaction,
      message: 'Payment rejected successfully'
    })

  } catch (error) {
    console.error('Error rejecting payment:', error)
    return NextResponse.json({ 
      error: 'Failed to reject payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
