'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'

export default function ChatBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { data: session } = useSession()

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        const total = data.rooms.reduce((sum: number, room: any) => sum + room.unreadCount, 0)
        setUnreadCount(total)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // Setup Pusher for real-time updates
    if (session?.user?.id) {
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })

      const channel = pusher.subscribe(`user-${session.user.id}`)
      
      channel.bind('new-message', () => {
        fetchUnreadCount()
      })

      channel.bind('message-read', () => {
        fetchUnreadCount()
      })

      return () => {
        channel.unbind_all()
        channel.unsubscribe()
      }
    }
  }, [session?.user?.id])

  if (unreadCount === 0) return null

  return (
    <span 
      className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white"
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
