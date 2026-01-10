/**
 * POST /api/chat/send
 * Send message to chat room
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
    const { roomId, content, type, attachmentUrl, attachmentType, replyToId } = body
    
    if (!roomId || !content) {
      return NextResponse.json(
        { error: 'roomId and content required' },
        { status: 400 }
      )
    }
    
    const message = await chatService.sendMessage({
      roomId,
      senderId: session.user.id,
      content,
      type,
      attachmentUrl,
      attachmentType,
      replyToId
    })
    
    return NextResponse.json({
      success: true,
      message
    })
  } catch (error: any) {
    console.error('[API] Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message', message: error.message },
      { status: 500 }
    )
  }
}
