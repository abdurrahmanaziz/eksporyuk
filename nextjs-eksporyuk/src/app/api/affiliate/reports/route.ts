import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


/**
 * GET /api/affiliate/reports
 * Fetch affiliate performance reports
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '30days'
    const type = searchParams.get('type') || 'summary'

    // Get affiliate profile
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate profile not found' }, { status: 404 })
    }

    // Calculate date range
    let startDate = new Date()
    switch (range) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'thismonth':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        break
      case 'lastmonth':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1)
        break
      case 'thisyear':
        startDate = new Date(startDate.getFullYear(), 0, 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }

    // Fetch affiliate links
    const links = await prisma.affiliateLink.findMany({
      where: {
        affiliateId: affiliate.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        membership: true,
        product: true,
        course: true
      }
    })

    // Calculate stats
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
    const totalConversions = links.reduce((sum, link) => sum + link.conversions, 0)
    const totalRevenue = links.reduce((sum, link) => sum + link.revenue, 0)
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Mock report data (replace with real data later)
    const reports = [
      {
        period: range,
        clicks: totalClicks,
        conversions: totalConversions,
        revenue: totalRevenue,
        commission: totalRevenue * 0.25, // Assuming 25% commission
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        links: links.length
      }
    ]

    return NextResponse.json({
      success: true,
      reports,
      summary: {
        totalClicks,
        totalConversions,
        totalRevenue,
        totalCommission: totalRevenue * 0.25,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        activeLinks: links.length,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('❌ Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
