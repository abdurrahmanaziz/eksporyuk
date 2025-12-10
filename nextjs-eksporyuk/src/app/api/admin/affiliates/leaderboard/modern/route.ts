import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const startTime = Date.now()
    console.log('🔄 Fetching leaderboard from AffiliateProfile.totalEarnings...')

    // Get all affiliates ordered by totalEarnings
    // This is the ACCURATE data synced from WordPress (same as /admin/affiliates)
    const allAffiliates = await prisma.affiliateProfile.findMany({
      where: {
        totalEarnings: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        totalEarnings: 'desc'
      },
      take: 10
    })

    console.log(`✅ Top: ${allAffiliates[0]?.user?.name} - Rp ${Number(allAffiliates[0]?.totalEarnings).toLocaleString('id-ID')}`)

    // Format data - SAME for all tabs
    const leaderboardData = allAffiliates.map((aff, index) => ({
      rank: index + 1,
      userId: aff.userId,
      affiliateId: aff.id,
      name: aff.user?.name || 'Unknown',
      avatar: aff.user?.avatar,
      points: Number(aff.totalEarnings),
      conversions: aff.totalConversions
    }))

    const endTime = Date.now()
    console.log(`✅ Fetched in ${endTime - startTime}ms`)

    // Return SAME data for all tabs - from AffiliateProfile.totalEarnings
    return NextResponse.json(
      {
        allTime: leaderboardData,
        weekly: leaderboardData,
        monthly: leaderboardData,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
