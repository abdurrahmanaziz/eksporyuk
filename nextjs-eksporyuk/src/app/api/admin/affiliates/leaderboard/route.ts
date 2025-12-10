import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const sortBy = searchParams.get('sortBy') || 'totalEarnings'

    // Calculate date filter based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '180d':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case '365d':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        startDate = new Date(0) // Beginning of time
        break
    }

    // Get affiliate profiles with their stats
    const affiliates = await prisma.affiliateProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            whatsapp: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            links: true,
            conversions: true,
          },
        },
      },
      orderBy: sortBy === 'createdAt' ? { createdAt: 'desc' } : [
        { totalEarnings: 'desc' },
        { totalConversions: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    // Calculate totals for overview
    const totalAffiliates = await prisma.affiliateProfile.count()
    const totalRevenue = affiliates.reduce((sum, aff) => sum + Number(aff.totalSales), 0)
    const totalConversions = affiliates.reduce((sum, aff) => sum + aff.totalConversions, 0)

    // Transform data for leaderboard
    let leaderboard = affiliates.map((affiliate, index) => {
      // For period-specific data, we need to calculate from conversions and links
      // For now, using total values since period filtering is complex
      const totalClicks = affiliate.totalClicks
      const totalConversions = affiliate.totalConversions
      const totalSales = affiliate.totalSales
      const totalEarnings = affiliate.totalEarnings

      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      const avgOrderValue = totalConversions > 0 ? Number(totalSales) / totalConversions : 0

      return {
        rank: index + 1,
        userId: affiliate.userId,
        name: affiliate.user?.name || 'Unknown',
        email: affiliate.user?.email || '',
        whatsapp: affiliate.user?.whatsapp || '',
        avatar: affiliate.user?.avatar || '',
        totalEarnings: Number(totalEarnings),
        totalConversions: totalConversions,
        totalClicks: totalClicks,
        conversionRate,
        totalSales: Number(totalSales),
        avgOrderValue,
        joinDate: affiliate.createdAt.toISOString(),
        lastActivity: affiliate.user?.updatedAt?.toISOString() || affiliate.updatedAt.toISOString(),
      }
    })

    // Sort leaderboard based on sortBy parameter
    leaderboard.sort((a, b) => {
      let aValue: number, bValue: number

      switch (sortBy) {
        case 'totalEarnings':
          aValue = a.totalEarnings
          bValue = b.totalEarnings
          break
        case 'totalSales':
          aValue = a.totalSales
          bValue = b.totalSales
          break
        case 'totalConversions':
          aValue = a.totalConversions
          bValue = b.totalConversions
          break
        case 'conversionRate':
          aValue = a.conversionRate
          bValue = b.conversionRate
          break
        case 'avgOrderValue':
          aValue = a.avgOrderValue
          bValue = b.avgOrderValue
          break
        case 'createdAt':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
        default:
          aValue = a.totalEarnings
          bValue = b.totalEarnings
      }

      return bValue - aValue // Descending order
    })

    // Re-assign ranks after sorting
    leaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))

    return NextResponse.json({
      leaderboard,
      totalAffiliates,
      totalRevenue,
      totalConversions,
      period,
      sortBy,
    })

  } catch (error) {
    console.error('Error fetching admin leaderboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}