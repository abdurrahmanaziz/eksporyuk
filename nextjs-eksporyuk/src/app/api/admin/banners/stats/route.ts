import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Fetch all banners and calculate stats in JavaScript
    const allBanners = await prisma.banner.findMany({
      select: {
        isActive: true,
        startDate: true,
        endDate: true,
        totalViews: true,
        totalClicks: true,
      }
    })

    const totalBanners = allBanners.length
    
    // Count active banners (isActive AND within date range)
    const activeBanners = allBanners.filter(b => {
      if (!b.isActive) return false
      const startOk = !b.startDate || new Date(b.startDate) <= now
      const endOk = !b.endDate || new Date(b.endDate) >= now
      return startOk && endOk
    }).length

    const totalViews = allBanners.reduce((sum, b) => sum + (b.totalViews || 0), 0)
    const totalClicks = allBanners.reduce((sum, b) => sum + (b.totalClicks || 0), 0)
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0

    return NextResponse.json({
      totalBanners,
      activeBanners,
      totalViews,
      totalClicks,
      ctr,
    })
  } catch (error) {
    console.error('Error fetching banner stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
