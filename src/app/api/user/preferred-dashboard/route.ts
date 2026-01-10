import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/user/preferred-dashboard
 * Save user's preferred dashboard choice
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dashboard } = body

    // Validate dashboard value
    const validDashboards = ['member', 'affiliate', 'mentor', 'admin']
    if (!dashboard || !validDashboards.includes(dashboard)) {
      return NextResponse.json({ error: 'Invalid dashboard' }, { status: 400 })
    }

    // Update user's preferred dashboard
    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferredDashboard: dashboard }
    })

    return NextResponse.json({
      success: true,
      message: 'Preferred dashboard saved',
      preferredDashboard: dashboard
    })

  } catch (error) {
    console.error('Error saving preferred dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/user/preferred-dashboard
 * Get user's preferred dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredDashboard: true }
    })

    return NextResponse.json({
      success: true,
      preferredDashboard: user?.preferredDashboard || null
    })

  } catch (error) {
    console.error('Error getting preferred dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
