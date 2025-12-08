import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch affiliate credit balance and transactions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get or create credit account
    let credit = await prisma.affiliateCredit.findUnique({
      where: { affiliateId: affiliate.id },
    })

    if (!credit) {
      credit = await prisma.affiliateCredit.create({
        data: {
          affiliateId: affiliate.id,
          balance: 0,
          totalTopUp: 0,
          totalUsed: 0,
        },
      })
    }

    // Get recent transactions
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const transactions = await prisma.affiliateCreditTransaction.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      credit,
      transactions,
    })
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Top up credits (for testing, in production this would be called after payment)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, paymentId, description } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Get or create credit account
    let credit = await prisma.affiliateCredit.findUnique({
      where: { affiliateId: affiliate.id },
    })

    if (!credit) {
      credit = await prisma.affiliateCredit.create({
        data: {
          affiliateId: affiliate.id,
          balance: 0,
          totalTopUp: 0,
          totalUsed: 0,
        },
      })
    }

    const balanceBefore = credit.balance
    const balanceAfter = balanceBefore + amount

    // Create transaction and update balance
    const [transaction, updatedCredit] = await prisma.$transaction([
      prisma.affiliateCreditTransaction.create({
        data: {
          creditId: credit.id,
          affiliateId: affiliate.id,
          type: 'TOPUP',
          amount,
          balanceBefore,
          balanceAfter,
          description: description || `Top up ${amount} credits`,
          paymentId,
          status: 'COMPLETED',
        },
      }),
      prisma.affiliateCredit.update({
        where: { id: credit.id },
        data: {
          balance: balanceAfter,
          totalTopUp: credit.totalTopUp + amount,
        },
      }),
    ])

    return NextResponse.json({
      transaction,
      credit: updatedCredit,
    })
  } catch (error) {
    console.error('Error topping up credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
