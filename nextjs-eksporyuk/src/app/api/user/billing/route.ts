import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/user/billing - Get user's billing/invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, EXPIRED, CANCELLED
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    // Filter by status
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Get transactions with basic fields
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ])

    // Format transactions - extract info from metadata
    const formattedTransactions = transactions.map(tx => {
      // Parse metadata 
      const metadata = typeof tx.metadata === 'object' && tx.metadata !== null 
        ? tx.metadata as Record<string, any>
        : {}
      
      // Determine item name from description or metadata
      const membershipName = metadata.membershipType || metadata.membershipName || ''
      const itemName = tx.description || membershipName || `Transaksi ${tx.type}`
      
      // Get unique code from metadata
      const uniqueCode = metadata.uniqueCode || 0
      
      // Calculate final amount (already stored in amount field)
      const originalAmount = tx.originalAmount ? Number(tx.originalAmount) : Number(tx.amount)
      const discountAmount = tx.discountAmount ? Number(tx.discountAmount) : 0
      const finalAmount = Number(tx.amount)
      
      // Calculate time remaining for pending transactions
      let timeRemaining = null
      let expiresIn = null
      if (tx.status === 'PENDING' && tx.expiredAt) {
        const now = new Date()
        const expires = new Date(tx.expiredAt)
        const diffMs = expires.getTime() - now.getTime()
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60))
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          timeRemaining = `${hours} jam ${minutes} menit`
          expiresIn = diffMs
        } else {
          timeRemaining = 'Expired'
          expiresIn = 0
        }
      }

      // Get VA info from metadata
      const vaNumber = metadata.vaNumber || metadata.va_number || metadata.account_number || null
      const vaBank = metadata.bankCode || metadata.vaBank || metadata.bank_code || tx.paymentMethod?.replace('_', ' ') || null

      return {
        id: tx.id,
        invoiceNumber: tx.invoiceNumber || tx.id,
        itemName,
        itemType: tx.type,
        amount: finalAmount,
        originalAmount,
        discountAmount,
        uniqueCode,
        finalAmount,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        paymentUrl: tx.paymentUrl,
        expiresAt: tx.expiredAt,
        timeRemaining,
        expiresIn,
        paidAt: tx.paidAt,
        createdAt: tx.createdAt,
        // Payment details
        vaNumber,
        vaBank,
      }
    })

    // Get summary stats
    const [pendingCount, paidCount, pendingTxs] = await Promise.all([
      prisma.transaction.count({
        where: { userId: session.user.id, status: 'PENDING' }
      }),
      prisma.transaction.count({
        where: { userId: session.user.id, status: 'SUCCESS' }
      }),
      prisma.transaction.findMany({
        where: { userId: session.user.id, status: 'PENDING' },
        select: { amount: true }
      })
    ])

    // Sum pending amounts manually since aggregate with Decimal is tricky
    const totalPending = pendingTxs.reduce((sum, tx) => sum + Number(tx.amount), 0)

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + transactions.length < total
      },
      summary: {
        pending: pendingCount,
        paid: paidCount,
        totalPending
      }
    })
  } catch (error) {
    console.error('Error fetching billing:', error)
    return NextResponse.json({ 
      error: 'Gagal mengambil data tagihan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
