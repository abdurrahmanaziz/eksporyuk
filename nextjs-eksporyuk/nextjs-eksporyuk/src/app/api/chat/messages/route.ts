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

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { messageId, content } = await request.json()
    
    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'messageId and content required' },
        { status: 400 }
      )
    }
    
    // Get the message to verify ownership
    const message = await chatService.getMessage(messageId)
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }
    
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Update the message
    const updatedMessage = await chatService.editMessage(messageId, content)
    
    return NextResponse.json({
      success: true,
      message: updatedMessage
    })
  } catch (error: any) {
    console.error('[API] Edit message error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
