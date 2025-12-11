/**
 * GET /api/chat/rooms
 * Get user's chat rooms
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { chatService } from '@/lib/services/chatService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const rooms = await chatService.getUserRooms(session.user.id)
    const totalUnread = await chatService.getTotalUnreadCount(session.user.id)
    
    return NextResponse.json({
      success: true,
      rooms,
      totalUnread
    })
  } catch (error: any) {
    console.error('[API] Get chat rooms error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
