import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const period = searchParams.get('period') || '30d'

    // Get affiliate profile
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!affiliateProfile) {
      return NextResponse.json({
        overview: {
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
          conversionRate: 0,
          avgOrderValue: 0,
          clickTrend: 0,
          conversionTrend: 0,
          earningsTrend: 0,
        },
        daily: [],
        topProducts: [],
        topLinks: [],
      })
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
    }

    // Get previous period for trend calculation
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays)

    // Current period data
    const [currentClicks, currentConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: startDate },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: startDate },
        },
        include: {
          transaction: {
            select: {
              amount: true,
            },
          },
        },
      }),
    ])

    // Previous period data for trends
    const [previousClicks, previousConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { 
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { 
            gte: previousPeriodStart,
            lt: startDate,
          },
        },
        select: {
          commissionAmount: true,
        },
      }),
    ])

    const currentEarnings = currentConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)
    const previousEarnings = previousConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)
    
    const avgOrderValue = currentConversions.length > 0
      ? currentConversions.reduce((sum, conv) => sum + Number(conv.transaction?.amount || 0), 0) / currentConversions.length
      : 0

    // Calculate trends
    const clickTrend = previousClicks > 0 ? ((currentClicks - previousClicks) / previousClicks) * 100 : 0
    const conversionTrend = previousConversions.length > 0 
      ? ((currentConversions.length - previousConversions.length) / previousConversions.length) * 100 
      : 0
    const earningsTrend = previousEarnings > 0 ? ((currentEarnings - previousEarnings) / previousEarnings) * 100 : 0

    // Daily breakdown - simplified aggregation
    const dailyClicksRaw = await prisma.affiliateClick.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
    })

    const dailyConversionsRaw = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        commissionAmount: true,
      },
    })

    // Create daily map
    const dailyMap = new Map<string, { date: string; clicks: number; conversions: number; earnings: number }>()
    
    // Fill clicks
    dailyClicksRaw.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, clicks: 0, conversions: 0, earnings: 0 })
      }
      const entry = dailyMap.get(date)!
      entry.clicks += 1
    })

    // Fill conversions
    dailyConversionsRaw.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, clicks: 0, conversions: 0, earnings: 0 })
      }
      const entry = dailyMap.get(date)!
      entry.conversions += 1
      entry.earnings += Number(item.commissionAmount)
    })

    const daily = Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Top Products - Get from transactions
    const conversionsWithProduct = await prisma.affiliateConversion.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        createdAt: { gte: startDate },
      },
      include: {
        transaction: {
          include: {
            userProduct: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Aggregate by product
    const productMap = new Map<string, { id: string; name: string; conversions: number; earnings: number }>()
    
    conversionsWithProduct.forEach((conv) => {
      const userProduct = conv.transaction?.userProduct
      if (userProduct?.product) {
        const productId = userProduct.product.id
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: userProduct.product.id,
            name: userProduct.product.name,
            conversions: 0,
            earnings: 0,
          })
        }
        const entry = productMap.get(productId)!
        entry.conversions += 1
        entry.earnings += Number(conv.commissionAmount)
      }
    })

    // Get clicks per product
    const topProductsData = await Promise.all(
      Array.from(productMap.values())
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 10)
        .map(async (product) => {
          const clicks = await prisma.affiliateClick.count({
            where: {
              affiliateId: affiliateProfile.id,
              productId: product.id,
              createdAt: { gte: startDate },
            },
          })

          return {
            ...product,
            clicks,
            conversionRate: clicks > 0 ? (product.conversions / clicks) * 100 : 0,
          }
        })
    )

    // Top Links
    const linkClicks = await prisma.affiliateClick.findMany({
      where: {
        affiliateId: affiliateProfile.id,
        linkId: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        linkId: true,
        link: {
          select: {
            id: true,
            code: true,
            shortCode: true,
          },
        },
      },
    })

    const linkMap = new Map<string, { id: string; slug: string; clicks: number }>()
    
    linkClicks.forEach(click => {
      if (click.link) {
        const linkId = click.link.id
        if (!linkMap.has(linkId)) {
          linkMap.set(linkId, {
            id: click.link.id,
            slug: click.link.shortCode || click.link.code,
            clicks: 0,
          })
        }
        linkMap.get(linkId)!.clicks += 1
      }
    })

    const topLinksData = await Promise.all(
      Array.from(linkMap.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10)
        .map(async (link) => {
          // Get conversions - simplified
          const conversions = await prisma.affiliateConversion.count({
            where: {
              affiliateId: affiliateProfile.id,
              createdAt: { gte: startDate },
            },
          })

          const earnings = await prisma.affiliateConversion.aggregate({
            where: {
              affiliateId: affiliateProfile.id,
              createdAt: { gte: startDate },
            },
            _sum: {
              commissionAmount: true,
            },
          })

          return {
            ...link,
            conversions,
            earnings: Number(earnings._sum.commissionAmount || 0),
            conversionRate: link.clicks > 0 ? (conversions / link.clicks) * 100 : 0,
          }
        })
    )

    const conversionRate = currentClicks > 0 ? (currentConversions.length / currentClicks) * 100 : 0

    return NextResponse.json({
      overview: {
        totalClicks: currentClicks,
        totalConversions: currentConversions.length,
        totalEarnings: currentEarnings,
        conversionRate,
        avgOrderValue,
        clickTrend,
        conversionTrend,
        earningsTrend,
      },
      daily,
      topProducts: topProductsData,
      topLinks: topLinksData,
    })
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
