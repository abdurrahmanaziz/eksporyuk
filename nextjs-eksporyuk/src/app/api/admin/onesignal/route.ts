import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// GET - Get OneSignal statistics and subscriber list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admin can access
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'

    if (type === 'stats') {
      // Get overall statistics using Prisma ORM (SQLite compatible)
      const totalUsers = await prisma.user.count()
      
      // Use Prisma ORM instead of raw SQL for better SQLite compatibility
      const subscribedUsers = await prisma.user.count({
        where: { oneSignalPlayerId: { not: null } }
      })

      // Get subscription trend (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentSubscriptions = await prisma.user.count({
        where: {
          oneSignalSubscribedAt: { gte: thirtyDaysAgo }
        }
      })

      // Get subscribers by membership tier using groupBy
      const tierCountsRaw = await prisma.user.groupBy({
        by: ['role'],
        where: { oneSignalPlayerId: { not: null } },
        _count: { role: true }
      })

      const tierCounts = tierCountsRaw.map(t => ({
        role: t.role,
        count: t._count.role
      }))

      // Get subscribers by province (top 10) using groupBy
      const provinceCountsRaw = await prisma.user.groupBy({
        by: ['province'],
        where: {
          oneSignalPlayerId: { not: null },
          province: { not: null }
        },
        _count: { province: true },
        orderBy: { _count: { province: 'desc' } },
        take: 10
      })

      const provinceCounts = provinceCountsRaw.map(p => ({
        province: p.province || '',
        count: p._count.province
      }))

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers,
          subscribedUsers,
          subscriptionRate: totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 100) : 0,
          recentSubscriptions,
          tierCounts,
          provinceCounts: provinceCounts.filter(p => p.province)
        }
      })
    }

    if (type === 'subscribers') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100) // Sanitize: 1-100
      const search = searchParams.get('search') || ''
      const tier = searchParams.get('tier')
      const province = searchParams.get('province')
      const offset = (page - 1) * limit

      // Build WHERE clause with parameterized query using Prisma ORM instead of raw SQL
      const whereConditions: any = {
        oneSignalPlayerId: { not: null }
      }

      if (search) {
        whereConditions.OR = [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      }

      if (tier) {
        whereConditions.role = tier
      }

      if (province) {
        whereConditions.province = { contains: province }
      }

      // Get subscribers using Prisma ORM (safe from SQL injection)
      const subscribers = await prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          province: true,
          city: true,
          avatar: true,
          oneSignalPlayerId: true,
          oneSignalSubscribedAt: true,
          oneSignalTags: true,
          lastActiveAt: true,
          isOnline: true,
        },
        orderBy: { oneSignalSubscribedAt: 'desc' },
        take: limit,
        skip: offset,
      })

      const total = await prisma.user.count({ where: whereConditions })

      return NextResponse.json({
        success: true,
        subscribers: subscribers.map(s => ({
          ...s,
          isOnline: Boolean(s.isOnline),
          oneSignalTags: s.oneSignalTags && typeof s.oneSignalTags === 'string' 
            ? JSON.parse(s.oneSignalTags) 
            : s.oneSignalTags || null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Admin OneSignal] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
