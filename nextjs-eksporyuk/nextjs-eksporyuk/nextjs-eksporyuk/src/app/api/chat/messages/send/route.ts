/**
 * POST /api/chat/messages/send
 * Send message to chat room
 * 
 * Endpoint ini merupakan alias dari /api/chat/send untuk kompatibilitas
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
    const { roomId, content, type, attachment, replyToId } = body
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId required' },
        { status: 400 }
      )
    }
    
    // Jika ada attachment, extract URL dan metadata
    const attachmentUrl = attachment?.url || null
    const attachmentType = attachment?.type || null
    const attachmentName = attachment?.name || null
    const attachmentSize = attachment?.size || null
    
    const message = await chatService.sendMessage({
      roomId,
      senderId: session.user.id,
      content: content || '',
      type: type || 'TEXT',
      attachmentUrl,
      attachmentType,
      attachmentName,
      attachmentSize,
      replyToId
    })
    
    return NextResponse.json({
      success: true,
      ...message
    })
  } catch (error: any) {
    console.error('[API] Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message', message: error.message },
      { status: 500 }
    )
  }
}
