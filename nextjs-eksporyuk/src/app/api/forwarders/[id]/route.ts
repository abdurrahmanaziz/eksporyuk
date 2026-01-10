import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { checkDatabaseAccess, trackDatabaseView } from '@/lib/export-database'

// GET /api/forwarders/[id] - Get forwarder detail (with quota tracking)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forwarderId = params.id

    // Check quota access
    const access = await checkDatabaseAccess(session.user.id, 'forwarder')
    
    if (!access.hasAccess) {
      return NextResponse.json(
        {
          error: 'Database access quota exceeded',
          message: `You have used ${access.viewsUsed} of ${access.monthlyQuota} views this month. Upgrade your membership for more access.`,
          quotaExceeded: true,
          viewsUsed: access.viewsUsed,
          monthlyQuota: access.monthlyQuota,
        },
        { status: 403 }
      )
    }

    // Get forwarder details
    const forwarder = await prisma.forwarder.findUnique({
      where: { id: forwarderId },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!forwarder) {
      return NextResponse.json(
        { error: 'Forwarder not found' },
        { status: 404 }
      )
    }

    // Track this view (increment quota usage)
    await trackDatabaseView(session.user.id, 'forwarder', forwarderId)

    return NextResponse.json({
      forwarder,
      quota: {
        viewsUsed: access.viewsUsed + 1, // Include this view
        monthlyQuota: access.monthlyQuota,
        viewsRemaining: access.monthlyQuota - access.viewsUsed - 1,
      },
    })
  } catch (error) {
    console.error('Error fetching forwarder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forwarder' },
      { status: 500 }
    )
  }
}
