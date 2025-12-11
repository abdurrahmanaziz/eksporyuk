import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { syncUserMembershipFeatures, autoAssignMembershipFeatures, removeMembershipFeatures } from '@/lib/membership-features'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


// POST - Sync user membership features
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, action, membershipId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    let result
    
    switch (action) {
      case 'sync':
        result = await syncUserMembershipFeatures(userId)
        break
        
      case 'assign':
        if (!membershipId) {
          return NextResponse.json(
            { error: 'Missing membershipId for assign action' },
            { status: 400 }
          )
        }
        result = await autoAssignMembershipFeatures(userId, membershipId)
        break
        
      case 'remove':
        if (!membershipId) {
          return NextResponse.json(
            { error: 'Missing membershipId for remove action' },
            { status: 400 }
          )
        }
        result = await removeMembershipFeatures(userId, membershipId)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: sync, assign, or remove' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `Features ${action} completed successfully`,
      result
    })

  } catch (error) {
    console.error('Error syncing membership features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}