/**
 * POST /api/chat/rooms/create
 * Create or get a chat room with a mentor/user
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { chatService } from '@/lib/services/chatService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { mentorId, mentorName } = body
    
    if (!mentorId) {
      return NextResponse.json(
        { error: 'mentorId required' },
        { status: 400 }
      )
    }
    
    // Create or get existing room
    const room = await chatService.getOrCreateDirectRoom(session.user.id, mentorId)
    
    return NextResponse.json({
      success: true,
      roomId: room.id,
      room
    })
  } catch (error: any) {
    console.error('[API] Create chat room error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat room', message: error.message },
      { status: 500 }
    )
  }
}
