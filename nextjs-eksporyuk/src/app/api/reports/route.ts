import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/reports - Create report
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, reason, description, postId, commentId, userId, groupId } = await req.json()

    if (!type || !reason) {
      return NextResponse.json(
        { error: 'Type and reason are required' },
        { status: 400 }
      )
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        type,
        reason,
        description,
        postId,
        commentId,
        userId,
        groupId
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })

    await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'REPORT',
            title: 'New Report',
            message: `${session.user.name} reported a ${type.toLowerCase()}`,
            link: `/admin/reports/${report.id}`
          }
        })
      )
    )

    return NextResponse.json({ report, message: 'Report submitted successfully' })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}

// GET /api/reports - Get reports (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const reports = await prisma.report.findMany({
      where: {
        ...(status && { status }),
        ...(type && { type })
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                name: true
              }
            }
          }
        },
        comment: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        reviewedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
