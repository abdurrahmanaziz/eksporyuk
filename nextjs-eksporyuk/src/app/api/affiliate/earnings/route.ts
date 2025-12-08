import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({
        summary: {
          totalEarnings: 0,
          paidOut: 0,
          pending: 0,
          available: 0,
        },
        monthly: [],
        transactions: [],
      })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const period = searchParams.get('period') || '30d'

    // Calculate date range for transactions
    const now = new Date()
    let startDate: Date | undefined

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (period === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }

    // Build where clause for transactions
    const whereClause: any = {
      affiliateId: affiliateProfile.id,
    }

    if (status === 'paid') {
      whereClause.paidOut = true
    } else if (status === 'pending') {
      whereClause.paidOut = false
    }

    if (startDate) {
      whereClause.createdAt = { gte: startDate }
    }

    // Get all conversions for summary
    const allConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
      },
      select: {
        commissionAmount: true,
        paidOut: true,
      },
    })

    const totalEarnings = allConversions.reduce(
      (sum, c) => sum + Number(c.commissionAmount),
      0
    )

    const paidOut = allConversions
      .filter(c => c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    const pending = allConversions
      .filter(c => !c.paidOut)
      .reduce((sum, c) => sum + Number(c.commissionAmount), 0)

    // Available = pending (bisa ditarik jika sudah memenuhi minimum)
    const available = pending

    // Get filtered transactions
    const transactions = await prisma.affiliateConversion.findMany({
      where: whereClause,
      include: {
        transaction: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
            userProduct: {
              include: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    // Calculate monthly earnings for chart
    const monthlyData: Map<string, { earnings: number; conversions: number }> = new Map()
    
    // Get conversions for the chart period
    const chartPeriod = period === 'all' ? undefined : startDate
    const chartConversions = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        ...(chartPeriod && { createdAt: { gte: chartPeriod } }),
      },
      select: {
        createdAt: true,
        commissionAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by month
    chartConversions.forEach(conversion => {
      const date = new Date(conversion.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const existing = monthlyData.get(monthKey) || { earnings: 0, conversions: 0 }
      monthlyData.set(monthKey, {
        earnings: existing.earnings + Number(conversion.commissionAmount),
        conversions: existing.conversions + 1,
      })
    })

    // Convert to array and format
    const monthly = Array.from(monthlyData.entries())
      .map(([month, data]) => {
        const [year, monthNum] = month.split('-')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
          earnings: data.earnings,
          conversions: data.conversions,
        }
      })
      .slice(-12) // Last 12 months max

    return NextResponse.json({
      summary: {
        totalEarnings,
        paidOut,
        pending,
        available,
      },
      monthly,
      transactions,
    })
  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}
