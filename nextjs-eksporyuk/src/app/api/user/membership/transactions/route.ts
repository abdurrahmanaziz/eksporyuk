import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch user's membership transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'MEMBERSHIP',
      },
      include: {
        membership: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to last 20 transactions
    })

    return NextResponse.json(
      { 
        transactions,
        count: transactions.length,
        message: 'Success'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('[API] Error fetching membership transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
