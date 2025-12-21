import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Build where clause for conversions
    const where: any = {
      affiliateId: affiliate.id,
      transaction: {
        type: 'SUPPLIER_MEMBERSHIP',
      },
    }

    if (status === 'paid') {
      where.paidOut = true
    } else if (status === 'pending') {
      where.paidOut = false
    }

    // Get supplier conversions
    const conversions = await prisma.affiliateConversion.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            status: true,
            customerName: true,
            customerEmail: true,
            paidAt: true,
            metadata: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats
    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliate.id,
        transaction: {
          type: 'SUPPLIER_MEMBERSHIP',
        },
      },
    })

    const stats = {
      totalSuppliers: allConversions.length,
      activeSuppliers: allConversions.filter(c => c.transaction?.status === 'PAID').length,
      totalCommission: allConversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      paidCommission: allConversions
        .filter(c => c.paidOut)
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0),
      pendingCommission: allConversions
        .filter(c => !c.paidOut)
        .reduce((sum, c) => sum + Number(c.commissionAmount), 0),
    }

    return NextResponse.json({
      conversions,
      stats,
    })
  } catch (error) {
    console.error('Error fetching supplier conversions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
