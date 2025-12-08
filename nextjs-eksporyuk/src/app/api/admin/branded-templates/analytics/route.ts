import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Admin access required'
      }, { status: 401 })
    }

    // Get all templates with usage counts
    const templates = await prisma.brandedTemplate.findMany({
      include: {
        _count: {
          select: { usages: true }
        },
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get usage statistics
    const usageStats = await prisma.brandedTemplateUsage.groupBy({
      by: ['templateId'],
      _count: {
        id: true
      },
      _max: {
        createdAt: true
      }
    })

    // Calculate overview metrics
    const totalTemplates = templates.length
    const activeTemplates = templates.filter(t => t.isActive).length
    const totalUsages = usageStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const avgUsagePerTemplate = totalUsages / Math.max(totalTemplates, 1)

    const templatesWithUsage = templates.map(template => {
      const usage = usageStats.find(u => u.templateId === template.id)
      return {
        ...template,
        usageCount: usage?._count.id || 0,
        lastUsedAt: usage?._max.createdAt
      }
    })

    const mostUsedTemplate = templatesWithUsage.reduce((max, current) => 
      current.usageCount > max.usageCount ? current : max, 
      templatesWithUsage[0] || { name: 'N/A', usageCount: 0 }
    )

    const leastUsedTemplate = templatesWithUsage.reduce((min, current) => 
      current.usageCount < min.usageCount ? current : min, 
      templatesWithUsage[0] || { name: 'N/A', usageCount: 0 }
    )

    // Category breakdown
    const byCategory = templates.reduce((acc: any[], template) => {
      const existing = acc.find(item => item.category === template.category)
      const usageCount = templatesWithUsage.find(t => t.id === template.id)?.usageCount || 0
      
      if (existing) {
        existing.count++
        existing.usages += usageCount
        existing.avgUsage = existing.usages / existing.count
      } else {
        acc.push({
          category: template.category,
          count: 1,
          usages: usageCount,
          avgUsage: usageCount
        })
      }
      return acc
    }, [])

    // Type breakdown
    const byType = templates.reduce((acc: any[], template) => {
      const existing = acc.find(item => item.type === template.type)
      const usageCount = templatesWithUsage.find(t => t.id === template.id)?.usageCount || 0
      
      if (existing) {
        existing.count++
        existing.usages += usageCount
        existing.avgUsage = existing.usages / existing.count
      } else {
        acc.push({
          type: template.type,
          count: 1,
          usages: usageCount,
          avgUsage: usageCount
        })
      }
      return acc
    }, [])

    // Role breakdown
    const byRole = templates.reduce((acc: any[], template) => {
      const roleTarget = template.roleTarget || 'ALL'
      const existing = acc.find(item => item.roleTarget === roleTarget)
      const usageCount = templatesWithUsage.find(t => t.id === template.id)?.usageCount || 0
      
      if (existing) {
        existing.count++
        existing.usages += usageCount
      } else {
        acc.push({
          roleTarget,
          count: 1,
          usages: usageCount
        })
      }
      return acc
    }, [])

    // Recent activity
    const recentActivity = await prisma.brandedTemplateUsage.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: {
            name: true,
            category: true,
            type: true
          }
        }
      }
    })

    const activityWithCounts = await Promise.all(
      recentActivity.map(async (activity) => {
        const usageCount = await prisma.brandedTemplateUsage.count({
          where: { templateId: activity.templateId }
        })
        
        return {
          templateName: activity.template.name,
          category: activity.template.category,
          type: activity.template.type,
          usedAt: activity.createdAt,
          usageCount
        }
      })
    )

    // Performance metrics
    const sortedByUsage = templatesWithUsage.sort((a, b) => b.usageCount - a.usageCount)
    const highPerformers = sortedByUsage.slice(0, 10).map(t => ({
      name: t.name,
      usageCount: t.usageCount,
      category: t.category
    }))
    
    const underutilized = sortedByUsage
      .filter(t => t.usageCount < avgUsagePerTemplate)
      .slice(-10)
      .map(t => ({
        name: t.name,
        usageCount: t.usageCount,
        category: t.category
      }))

    // Time-based stats (mock data for now)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    const lastWeekUsage = await prisma.brandedTemplateUsage.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    const lastMonthUsage = await prisma.brandedTemplateUsage.count({
      where: {
        createdAt: {
          gte: oneMonthAgo
        }
      }
    })

    const analytics = {
      overview: {
        totalTemplates,
        activeTemplates,
        totalUsages,
        avgUsagePerTemplate,
        mostUsedTemplate: {
          name: mostUsedTemplate.name,
          usageCount: mostUsedTemplate.usageCount
        },
        leastUsedTemplate: {
          name: leastUsedTemplate.name,
          usageCount: leastUsedTemplate.usageCount
        }
      },
      byCategory: byCategory.sort((a, b) => b.usages - a.usages),
      byType: byType.sort((a, b) => b.usages - a.usages),
      byRole: byRole.sort((a, b) => b.usages - a.usages),
      recentActivity: activityWithCounts,
      performanceMetrics: {
        highPerformers,
        underutilized,
        trending: highPerformers.slice(0, 5).map(h => ({
          name: h.name,
          growthRate: Math.random() * 50 - 25, // Mock growth rate
          currentUsage: h.usageCount
        }))
      },
      timeBasedStats: {
        lastWeek: lastWeekUsage,
        lastMonth: lastMonthUsage,
        growth: {
          weekly: ((lastWeekUsage - (lastMonthUsage - lastWeekUsage)) / Math.max(lastMonthUsage - lastWeekUsage, 1)) * 100,
          monthly: Math.random() * 20 - 10 // Mock monthly growth
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Error fetching template analytics:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 })
  }
}