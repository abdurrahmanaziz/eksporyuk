/**
 * GET /api/chat/messages?roomId=xxx
 * Get messages from a chat room
 */

// Force this route to be dynamic
export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { chatService } from '@/lib/services/chatService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const beforeId = searchParams.get('beforeId')
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId required' },
        { status: 400 }
      )
    }
    
    const messages = await chatService.getMessages(
      roomId,
      limit,
      beforeId || undefined
    )
    
    return NextResponse.json({
      success: true,
      messages,
      hasMore: messages.length === limit
    })
  } catch (error: any) {
    console.error('[API] Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
