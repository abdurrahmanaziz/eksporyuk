import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Fetch member location statistics (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total members
    const total = await prisma.user.count({
      where: { isActive: true }
    })

    // Get members with location
    const withLocation = await prisma.user.count({
      where: {
        isActive: true,
        profileCompleted: true,
        province: { not: null },
        city: { not: null }
      }
    })

    // Get GPS verified members
    const verified = await prisma.user.count({
      where: {
        isActive: true,
        locationVerified: true,
        latitude: { not: null },
        longitude: { not: null }
      }
    })

    // Get province distribution
    const provinces = await prisma.user.groupBy({
      by: ['province'],
      where: {
        isActive: true,
        profileCompleted: true,
        province: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get city distribution (top 50)
    const cities = await prisma.user.groupBy({
      by: ['city', 'province'],
      where: {
        isActive: true,
        profileCompleted: true,
        city: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 50
    })

    // Get recent profile completions (last 7 days)
    const recentCompletions = await prisma.user.count({
      where: {
        isActive: true,
        profileCompleted: true,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        province: { not: null }
      }
    })

    return NextResponse.json({
      total,
      withLocation,
      verified,
      provinces: provinces.filter(p => p.province),
      cities: cities.filter(c => c.city),
      recentCompletions,
      completionRate: total > 0 ? Math.round((withLocation / total) * 100) : 0,
      verificationRate: withLocation > 0 ? Math.round((verified / withLocation) * 100) : 0
    })

  } catch (error) {
    console.error('Error fetching member stats:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
