import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch all affiliate credits (admin)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin - first check session role, then fallback to database
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const credits = await prisma.affiliateCredit.findMany({
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { balance: 'desc' },
    })

    // Get total stats
    const totalBalance = credits.reduce((sum, c) => sum + c.balance, 0)
    const totalTopUp = credits.reduce((sum, c) => sum + c.totalTopUp, 0)
    const totalUsed = credits.reduce((sum, c) => sum + c.totalUsed, 0)

    return NextResponse.json({
      credits,
      stats: {
        totalBalance,
        totalTopUp,
        totalUsed,
        totalAffiliates: credits.length,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add/deduct credits for affiliate (admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin - first check session role, then fallback to database
    let isAdmin = session.user.role === 'ADMIN'
    
    if (!isAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      isAdmin = user?.role === 'ADMIN'
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { affiliateId, amount, type, description } = await request.json()

    if (!affiliateId || !amount || !type) {
      return NextResponse.json({ error: 'Affiliate ID, amount, and type are required' }, { status: 400 })
    }

    // Get or create credit account
    let credit = await prisma.affiliateCredit.findUnique({
      where: { affiliateId },
    })

    if (!credit) {
      credit = await prisma.affiliateCredit.create({
        data: {
          affiliateId,
          balance: 0,
        },
      })
    }

    const balanceBefore = credit.balance
    let balanceAfter = balanceBefore

    if (type === 'TOPUP') {
      balanceAfter = balanceBefore + amount
    } else if (type === 'DEDUCT') {
      balanceAfter = balanceBefore - amount
      if (balanceAfter < 0) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
    } else if (type === 'REFUND') {
      balanceAfter = balanceBefore + amount
    }

    // Create transaction
    const [transaction, updatedCredit] = await prisma.$transaction([
      prisma.affiliateCreditTransaction.create({
        data: {
          creditId: credit.id,
          affiliateId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          description: description || `Admin ${type.toLowerCase()}`,
          status: 'COMPLETED',
        },
      }),
      prisma.affiliateCredit.update({
        where: { id: credit.id },
        data: {
          balance: balanceAfter,
          totalTopUp: type === 'TOPUP' || type === 'REFUND' ? credit.totalTopUp + amount : credit.totalTopUp,
          totalUsed: type === 'DEDUCT' ? credit.totalUsed + amount : credit.totalUsed,
        },
      }),
    ])

    return NextResponse.json({
      transaction,
      credit: updatedCredit,
    })
  } catch (error) {
    console.error('Error managing affiliate credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
