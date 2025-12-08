import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET - Get OneSignal statistics and subscriber list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admin can access
    if (!session?.user?.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'stats'

    if (type === 'stats') {
      // Get overall statistics using raw queries for OneSignal fields
      const totalUsers = await prisma.user.count()
      
      const subscribedResult = await prisma.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count FROM User WHERE oneSignalPlayerId IS NOT NULL
      `
      const subscribedUsers = Number(subscribedResult[0]?.count || 0)

      // Get subscription trend (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentResult = await prisma.$queryRaw<Array<{count: bigint}>>`
        SELECT COUNT(*) as count FROM User 
        WHERE oneSignalSubscribedAt >= ${thirtyDaysAgo.toISOString()}
      `
      const recentSubscriptions = Number(recentResult[0]?.count || 0)

      // Get subscribers by membership tier
      const tierCounts = await prisma.$queryRaw<Array<{role: string, count: bigint}>>`
        SELECT role, COUNT(*) as count FROM User 
        WHERE oneSignalPlayerId IS NOT NULL
        GROUP BY role
      `

      // Get subscribers by province (top 10)
      const provinceCounts = await prisma.$queryRaw<Array<{province: string, count: bigint}>>`
        SELECT province, COUNT(*) as count FROM User 
        WHERE oneSignalPlayerId IS NOT NULL AND province IS NOT NULL
        GROUP BY province
        ORDER BY count DESC
        LIMIT 10
      `

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers,
          subscribedUsers,
          subscriptionRate: totalUsers > 0 ? Math.round((subscribedUsers / totalUsers) * 100) : 0,
          recentSubscriptions,
          tierCounts: tierCounts.map(t => ({ role: t.role, count: Number(t.count) })),
          provinceCounts: provinceCounts
            .filter(p => p.province)
            .map(p => ({ province: p.province, count: Number(p.count) }))
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
