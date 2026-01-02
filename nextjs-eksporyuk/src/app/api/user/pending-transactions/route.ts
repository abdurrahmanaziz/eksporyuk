import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/pending-transactions
 * Returns pending transactions for the current user
 * Used to show invoices that need payment instead of upgrade prompt
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get pending transactions for this user (including those waiting for admin confirmation)
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'PENDING_CONFIRMATION'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to last 10 pending transactions
    })

    // Filter out expired transactions (older than 72 hours by default)
    const now = new Date()
    const activePending = pendingTransactions.filter(t => {
      const expiryHours = 72 // Default Xendit expiry
      const createdAt = new Date(t.createdAt).getTime()
      const expiryTime = createdAt + (expiryHours * 60 * 60 * 1000)
      return expiryTime > now.getTime()
    })

    return NextResponse.json({
      success: true,
      hasPendingTransactions: activePending.length > 0,
      pendingTransactions: activePending.map(t => ({
        id: t.id,
        amount: t.amount.toString(),
        status: t.status,
        type: t.type,
        createdAt: t.createdAt,
        paymentUrl: t.paymentUrl,
        invoiceNumber: t.invoiceNumber,
        customerEmail: t.customerEmail
      }))
    })

  } catch (error) {
    console.error('Error fetching pending transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
