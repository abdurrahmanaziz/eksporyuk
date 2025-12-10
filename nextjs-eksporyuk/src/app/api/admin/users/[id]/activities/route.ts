import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const userId = params.id
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    // Build where clause
    const where: any = {
      userId: userId
    }

    if (type === 'membership') {
      where.action = {
        contains: 'membership'
      }
    }

    // Fetch activities
    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      activities
    })
  } catch (error) {
    console.error('Get user activities error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
