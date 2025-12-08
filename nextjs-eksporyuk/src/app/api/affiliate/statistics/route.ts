import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
        overview: {
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
          conversionRate: 0,
          avgCommission: 0,
        },
        timeRange: {
          today: { clicks: 0, conversions: 0, earnings: 0 },
          yesterday: { clicks: 0, conversions: 0, earnings: 0 },
          thisWeek: { clicks: 0, conversions: 0, earnings: 0 },
          lastWeek: { clicks: 0, conversions: 0, earnings: 0 },
          thisMonth: { clicks: 0, conversions: 0, earnings: 0 },
          lastMonth: { clicks: 0, conversions: 0, earnings: 0 },
        },
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        topReferrers: [],
      })
    }

    const now = new Date()
    
    // Calculate date ranges
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    thisWeekStart.setHours(0, 0, 0, 0)
    const lastWeekStart = new Date(thisWeekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Overview stats
    const [totalClicks, conversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: { affiliateId: affiliateProfile.id },
      }),
      prisma.affiliateConversion.findMany({
        where: { affiliateId: affiliateProfile.id },
        select: { commissionAmount: true },
      }),
    ])

    const totalConversions = conversions.length
    const totalEarnings = conversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    const avgCommission = totalConversions > 0 ? totalEarnings / totalConversions : 0

    // Today stats
    const [todayClicks, todayConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: todayStart },
        },
        select: { commissionAmount: true },
      }),
    ])
    const todayEarnings = todayConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)

    // Yesterday stats
    const [yesterdayClicks, yesterdayConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
        select: { commissionAmount: true },
      }),
    ])
    const yesterdayEarnings = yesterdayConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)

    // This week stats
    const [thisWeekClicks, thisWeekConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: thisWeekStart },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: thisWeekStart },
        },
        select: { commissionAmount: true },
      }),
    ])
    const thisWeekEarnings = thisWeekConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)

    // Last week stats
    const [lastWeekClicks, lastWeekConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: lastWeekStart,
            lt: thisWeekStart,
          },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: lastWeekStart,
            lt: thisWeekStart,
          },
        },
        select: { commissionAmount: true },
      }),
    ])
    const lastWeekEarnings = lastWeekConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)

    // This month stats
    const [thisMonthClicks, thisMonthConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: thisMonthStart },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: { gte: thisMonthStart },
        },
        select: { commissionAmount: true },
      }),
    ])
    const thisMonthEarnings = thisMonthConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)

    // Last month stats
    const [lastMonthClicks, lastMonthConversions] = await Promise.all([
      prisma.affiliateClick.count({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),
      prisma.affiliateConversion.findMany({
        where: {
          affiliateId: affiliateProfile.id,
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        select: { commissionAmount: true },
      }),
    ])
    const lastMonthEarnings = lastMonthConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0)

    // Device breakdown (simplified - from user agent)
    const allClicks = await prisma.affiliateClick.findMany({
      where: { affiliateId: affiliateProfile.id },
      select: { userAgent: true },
    })

    let desktop = 0, mobile = 0, tablet = 0
    allClicks.forEach(click => {
      const ua = click.userAgent.toLowerCase()
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        mobile++
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        tablet++
      } else {
        desktop++
      }
    })

    const total = allClicks.length || 1
    const devices = {
      desktop: Math.round((desktop / total) * 100),
      mobile: Math.round((mobile / total) * 100),
      tablet: Math.round((tablet / total) * 100),
    }

    // Top referrers
    const referrerClicks = await prisma.affiliateClick.findMany({
      where: { affiliateId: affiliateProfile.id },
      select: { referrer: true },
    })

    const referrerMap = new Map<string, number>()
    referrerClicks.forEach(click => {
      const source = click.referrer || 'Direct'
      referrerMap.set(source, (referrerMap.get(source) || 0) + 1)
    })

    const topReferrers = Array.from(referrerMap.entries())
      .map(([source, clicks]) => ({
        source,
        clicks,
        conversions: 0, // Simplified - would need complex query to match
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
        avgCommission,
      },
      timeRange: {
        today: {
          clicks: todayClicks,
          conversions: todayConversions.length,
          earnings: todayEarnings,
        },
        yesterday: {
          clicks: yesterdayClicks,
          conversions: yesterdayConversions.length,
          earnings: yesterdayEarnings,
        },
        thisWeek: {
          clicks: thisWeekClicks,
          conversions: thisWeekConversions.length,
          earnings: thisWeekEarnings,
        },
        lastWeek: {
          clicks: lastWeekClicks,
          conversions: lastWeekConversions.length,
          earnings: lastWeekEarnings,
        },
        thisMonth: {
          clicks: thisMonthClicks,
          conversions: thisMonthConversions.length,
          earnings: thisMonthEarnings,
        },
        lastMonth: {
          clicks: lastMonthClicks,
          conversions: lastMonthConversions.length,
          earnings: lastMonthEarnings,
        },
      },
      devices,
      topReferrers,
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
