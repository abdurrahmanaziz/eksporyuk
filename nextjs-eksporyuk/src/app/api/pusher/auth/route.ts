import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    
    const socketId = params.get('socket_id')
    const channelName = params.get('channel_name')

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
    }

    console.log('[Pusher Auth] Authenticating:', { socketId, channelName, userId: session.user.id })

    // Verify user has access to this channel
    // For presence channels (presence-*), user must be part of the conversation
    if (channelName.startsWith('presence-')) {
      const roomId = channelName.replace('presence-room-', '')
      
      // You can add additional validation here to check if user is part of the room
      // For now, we'll allow if user is authenticated
    }

    // For private channels (private-*), authenticate the user
    if (channelName.startsWith('private-')) {
      const auth = pusher.authorizeChannel(socketId, channelName)
      return NextResponse.json(auth)
    }

    // For presence channels, include user data
    if (channelName.startsWith('presence-')) {
      const presenceData = {
        user_id: session.user.id,
        user_info: {
          name: session.user.name || 'Anonymous',
          avatar: session.user.image || null,
        },
      }

      const auth = pusher.authorizeChannel(socketId, channelName, presenceData)
      return NextResponse.json(auth)
    }

    return NextResponse.json({ error: 'Invalid channel type' }, { status: 400 })
  } catch (error) {
    console.error('[Pusher Auth] Error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
