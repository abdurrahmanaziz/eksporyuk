import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// PATCH /api/reports/[id] - Review report
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { status, reviewNote, action } = await req.json()
    // action: 'DELETE_CONTENT' | 'BAN_USER' | 'WARNING' | null

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Update report
    const report = await prisma.report.update({
      where: { id: params.id },
      data: {
        status,
        reviewNote,
        reviewedById: session.user.id,
        reviewedAt: new Date()
      },
      include: {
        post: true,
        comment: true,
        reportedUser: true
      }
    })

    // Take action based on decision
    if (status === 'RESOLVED') {
      if (action === 'DELETE_CONTENT') {
        if (report.postId) {
          await prisma.post.delete({ where: { id: report.postId } })
        } else if (report.commentId) {
          await prisma.postComment.delete({ where: { id: report.commentId } })
        }
      } else if (action === 'BAN_USER' && report.userId) {
        // Create global ban
        await prisma.bannedUser.create({
          data: {
            userId: report.userId,
            groupId: null, // Global ban
            reason: `Banned due to report: ${report.reason}`,
            bannedById: session.user.id
          }
        })
        
        // Notify user
        await prisma.notification.create({
          data: {
            userId: report.userId,
            type: 'BAN',
            title: 'Account Banned',
            message: `Your account has been banned. Reason: ${report.reason}`,
            link: '/profile'
          }
        })
      }
    }

    // Notify reporter
    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        type: 'REPORT_REVIEWED',
        title: 'Report Reviewed',
        message: `Your report has been reviewed and marked as ${status.toLowerCase()}`,
        link: `/community`
      }
    })

    return NextResponse.json({ 
      report,
      message: 'Report reviewed successfully' 
    })
  } catch (error) {
    console.error('Review report error:', error)
    return NextResponse.json(
      { error: 'Failed to review report' },
      { status: 500 }
    )
  }
}

// GET /api/reports/[id] - Get single report
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
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
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        },
        comment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
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
        group: {
          select: {
            id: true,
            name: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}
