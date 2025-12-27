// Backup of original route.ts file
// This file contains the safe backup version
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[MEMBERSHIPS API] Starting request for user:', params.id)
    
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      console.log('[MEMBERSHIPS API] No session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      console.log('[MEMBERSHIPS API] Non-admin user:', session.user.role)
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const userId = params.id
    console.log('[MEMBERSHIPS API] Processing user ID:', userId)

    // Simple user check only
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    if (!user) {
      console.log('[MEMBERSHIPS API] User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[MEMBERSHIPS API] User found:', user.name)

    // Return simple response for now
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        userMemberships: []
      }
    })

  } catch (error) {
    console.error('[MEMBERSHIPS API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}