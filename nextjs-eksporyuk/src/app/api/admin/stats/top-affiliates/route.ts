import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/stats/top-affiliates - Get top affiliates for current month
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get top 10 affiliates by total earnings (active affiliates only)
    const topAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        isActive: true,
        approvedAt: { not: null }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        totalEarnings: 'desc'
      },
      take: 10
    })

    // Format the data
    const formattedAffiliates = topAffiliates.map((affiliate, index) => ({
      rank: index + 1,
      affiliateId: affiliate.id,
      name: affiliate.user?.name || affiliate.user?.email || 'Unknown',
      sales: affiliate.totalConversions || 0,
      commission: affiliate.totalEarnings || 0
    }))

    // Get current month name in Indonesian
    const now = new Date()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const currentMonth = monthNames[now.getMonth()]
    const currentYear = now.getFullYear()

    return NextResponse.json({
      affiliates: formattedAffiliates,
      period: `Bulan ${currentMonth} ${currentYear}`,
      totalAffiliates: formattedAffiliates.length
    })

  } catch (error) {
    console.error('Error fetching top affiliates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top affiliates' },
      { status: 500 }
    )
  }
}
