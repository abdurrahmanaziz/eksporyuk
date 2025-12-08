'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import Pusher from 'pusher-js'

interface OnlineStatusBadgeProps {
  isOnline: boolean
  lastSeenAt?: string | Date | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  userId?: string // For real-time updates
}

/**
 * ONLINE STATUS BADGE
 * Green dot indicator dengan optional last seen text
 * Real-time updates via Pusher
 */
export default function OnlineStatusBadge({
  isOnline: initialOnline,
  lastSeenAt,
  size = 'md',
  showLabel = false,
  userId
}: OnlineStatusBadgeProps) {
  const [isOnline, setIsOnline] = useState(initialOnline)

  useEffect(() => {
    if (!userId) return

    let pusher: Pusher | null = null

    try {
      pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        forceTLS: true
      })

      // Subscribe to global status channel
      const channel = pusher.subscribe('public-channel')
      
      channel.bind('user-status-changed', (data: any) => {
        if (data.userId === userId) {
          setIsOnline(data.isOnline)
        }
      })

    } catch (error) {
      console.error('[PUSHER_STATUS_ERROR]', error)
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe('public-channel')
        pusher.disconnect()
      }
    }
  }, [userId])

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const getLastSeenText = () => {
    if (!lastSeenAt) return null
    
    try {
      const date = typeof lastSeenAt === 'string' ? new Date(lastSeenAt) : lastSeenAt
      return formatDistanceToNow(date, { addSuffix: true, locale: idLocale })
    } catch {
      return null
    }
  }

  if (!showLabel) {
    return (
      <div className="relative inline-flex">
        <span
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          } ${isOnline ? 'animate-pulse' : ''}`}
          title={isOnline ? 'Online' : getLastSeenText() || 'Offline'}
        />
        {isOnline && (
          <span
            className={`absolute ${sizeClasses[size]} rounded-full bg-green-500 opacity-75 animate-ping`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex">
        <span
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        {isOnline && (
          <span
            className={`absolute ${sizeClasses[size]} rounded-full bg-green-500 opacity-75 animate-ping`}
          />
        )}
      </div>
      <span className="text-xs text-gray-600">
        {isOnline ? 'Online' : getLastSeenText() || 'Offline'}
      </span>
    </div>
  )
}
