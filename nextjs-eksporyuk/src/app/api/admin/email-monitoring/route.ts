/**
 * Admin Email Monitoring API
 * Route: /api/admin/email-monitoring
 * 
 * Endpoints:
 * GET /api/admin/email-monitoring/statistics - Email delivery stats
 * GET /api/admin/email-monitoring/logs - Recent email logs
 * GET /api/admin/email-monitoring/templates - Templates and their performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import {
  getEmailStatistics,
  getRecentEmailLogs,
  getEmailTemplate
} from '@/lib/email-tracking-service'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/email-monitoring/statistics
 * Get overall email statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const endpoint = url.pathname.split('/').pop()
    const templateSlug = url.searchParams.get('template')
    const days = parseInt(url.searchParams.get('days') || '30')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    switch (endpoint) {
      case 'statistics':
        return handleStatistics(templateSlug, dateFrom, new Date())

      case 'logs':
        return handleLogs(limit, templateSlug)

      case 'templates':
        return handleTemplatePerformance()

      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Email monitoring API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle statistics endpoint
 */
async function handleStatistics(
  templateSlug: string | null,
  dateFrom: Date,
  dateTo: Date
) {
  const stats = await getEmailStatistics(templateSlug, dateFrom, dateTo)

  // Get detailed breakdown by status
  const where: any = {}
  if (templateSlug) where.templateSlug = templateSlug
  where.createdAt = { gte: dateFrom, lte: dateTo }

  const logs = await prisma.emailNotificationLog.findMany({
    where,
    select: { status: true }
  })

  const statusBreakdown: Record<string, number> = {}
  logs.forEach(log => {
    statusBreakdown[log.status] = (statusBreakdown[log.status] || 0) + 1
  })

  // Get top recipients by opens/clicks
  const topEngaged = await prisma.emailNotificationLog.findMany({
    where: { ...where, openedAt: { not: null } },
    select: {
      recipientEmail: true,
      templateSlug: true,
      openCount: true,
      clickCount: true
    },
    orderBy: [{ openCount: 'desc' }, { clickCount: 'desc' }],
    take: 10
  })

  return NextResponse.json({
    period: { from: dateFrom, to: dateTo },
    stats,
    statusBreakdown,
    topEngagedRecipients: topEngaged
  })
}

/**
 * Handle logs endpoint
 */
async function handleLogs(limit: number, templateSlug: string | null) {
  const logs = await getRecentEmailLogs(limit, templateSlug)

  return NextResponse.json({
    totalLogs: logs.length,
    logs: logs.map(log => ({
      ...log,
      isDelivered: log.deliveredAt !== null,
      isOpened: log.openedAt !== null,
      isClicked: log.clickedAt !== null,
      timeToOpen: log.openedAt && log.sentAt
        ? Math.round((log.openedAt.getTime() - log.sentAt.getTime()) / 1000 / 60) + ' min'
        : null,
      timeToClick: log.clickedAt && log.sentAt
        ? Math.round((log.clickedAt.getTime() - log.sentAt.getTime()) / 1000 / 60) + ' min'
        : null
    }))
  })
}

/**
 * Handle template performance endpoint
 */
async function handleTemplatePerformance() {
  // Get all commission templates
  const templates = await prisma.brandedTemplate.findMany({
    where: {
      category: { in: ['AFFILIATE', 'TRANSACTION', 'SYSTEM'] }
    },
    select: { slug: true, name: true }
  })

  // Get stats for each template
  const performance = await Promise.all(
    templates.map(async template => {
      const stats = await getEmailStatistics(template.slug)
      return {
        template: template.name,
        slug: template.slug,
        stats
      }
    })
  )

  return NextResponse.json({
    totalTemplates: performance.length,
    performance: performance.sort((a, b) => {
      const aDelivery = parseFloat(a.stats?.deliveryRate || '0')
      const bDelivery = parseFloat(b.stats?.deliveryRate || '0')
      return bDelivery - aDelivery
    })
  })
}
