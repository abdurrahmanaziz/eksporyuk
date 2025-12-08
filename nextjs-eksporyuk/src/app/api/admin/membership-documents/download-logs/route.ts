import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET /api/admin/membership-documents/download-logs - Get all download logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = {}
    if (documentId) where.documentId = documentId
    if (userId) where.userId = userId
    if (status) where.status = status
    if (verified === 'true') where.adminVerified = true
    if (verified === 'false') where.adminVerified = false

    const [logs, total] = await Promise.all([
      prisma.documentDownloadLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { downloadedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          document: {
            select: {
              id: true,
              title: true,
              category: true,
              minimumLevel: true,
            },
          },
        },
      }),
      prisma.documentDownloadLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching download logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/membership-documents/download-logs/export - Export logs to CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as string
    if (!['ADMIN', 'FOUNDER', 'CO_FOUNDER'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { documentId, userId, status, verified, startDate, endDate } = body

    const where: any = {}
    if (documentId) where.documentId = documentId
    if (userId) where.userId = userId
    if (status) where.status = status
    if (verified !== undefined) where.adminVerified = verified
    if (startDate || endDate) {
      where.downloadedAt = {}
      if (startDate) where.downloadedAt.gte = new Date(startDate)
      if (endDate) where.downloadedAt.lte = new Date(endDate)
    }

    const logs = await prisma.documentDownloadLog.findMany({
      where,
      orderBy: { downloadedAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        document: {
          select: {
            title: true,
            category: true,
            minimumLevel: true,
          },
        },
      },
    })

    // Convert to CSV format
    const headers = [
      'ID',
      'User Name',
      'User Email',
      'User Role',
      'Document Title',
      'Document Category',
      'Minimum Level',
      'Membership Level',
      'Downloaded At',
      'IP Address',
      'Status',
      'Admin Verified',
      'Notes',
    ]

    const rows = logs.map((log) => [
      log.id,
      log.user.name,
      log.user.email,
      log.user.role,
      log.document.title,
      log.document.category,
      log.document.minimumLevel,
      log.membershipLevel,
      new Date(log.downloadedAt).toISOString(),
      log.ipAddress || '',
      log.status,
      log.adminVerified ? 'Yes' : 'No',
      log.notes || '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="download-logs-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
