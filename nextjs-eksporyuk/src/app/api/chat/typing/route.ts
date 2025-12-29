/**
 * POST /api/chat/typing
 * Send typing indicator
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
    const { roomId, isTyping } = body
    
    if (!roomId || typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'roomId and isTyping (boolean) required' },
        { status: 400 }
      )
    }
    
    const result = await chatService.sendTyping(roomId, session.user.id, isTyping)
    
    if (result.success) {
      return NextResponse.json({
        success: true
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send typing indicator' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] Send typing error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
