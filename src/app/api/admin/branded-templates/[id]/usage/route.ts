import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


interface Props {
  params: {
    id: string
  }
}

/**
 * POST /api/admin/branded-templates/[id]/usage
 * Track template usage for analytics
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.brandedTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const body = await request.json()
    const { context, success, error, metadata } = body

    // Track usage
    const usage = await prisma.brandedTemplateUsage.create({
      data: {
        templateId: params.id,
        userId: session.user.id,
        userRole: session.user.role,
        context: context || 'MANUAL',
        success: success !== false,
        error: error || null,
        metadata: metadata || {}
      }
    })

    // Update template usage count and last used
    await prisma.brandedTemplate.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1
        },
        lastUsedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        usageId: usage.id,
        templateUsageCount: template.usageCount + 1
      }
    })

  } catch (error) {
    console.error('[Branded Template Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/branded-templates/[id]/usage
 * Get usage analytics for template
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const [template, usages, totalUsages] = await Promise.all([
      prisma.brandedTemplate.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          name: true,
          usageCount: true,
          lastUsedAt: true
        }
      }),
      prisma.brandedTemplateUsage.findMany({
        where: { templateId: params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.brandedTemplateUsage.count({
        where: { templateId: params.id }
      })
    ])

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Usage statistics
    const usageStats = await prisma.brandedTemplateUsage.groupBy({
      by: ['userRole', 'context', 'success'],
      where: { templateId: params.id },
      _count: {
        id: true
      }
    })

    // Daily usage for last 30 days (DB-agnostic, safe aggregation)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentUsages = await prisma.brandedTemplateUsage.findMany({
      where: {
        templateId: params.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    })

    const dailyMap = new Map<string, number>()
    for (const u of recentUsages) {
      const d = new Date(u.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
    }

    const dailyUsage = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, usage_count]) => ({ date, usage_count }))

    return NextResponse.json({
      success: true,
      data: {
        template,
        usages,
        stats: {
          totalUsages,
          usageBreakdown: usageStats,
          dailyUsage
        },
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalUsages / limit)
        }
      }
    })

  } catch (error) {
    console.error('[Branded Template Usage Analytics API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage analytics' },
      { status: 500 }
    )
  }
}