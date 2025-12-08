/**
 * POST /api/chat/read
 * Mark messages as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { chatService } from '@/lib/services/chatService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { roomId } = body
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId required' },
        { status: 400 }
      )
    }
    
    const result = await chatService.markAsRead(roomId, session.user.id)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Messages marked as read'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to mark as read' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] Mark as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
