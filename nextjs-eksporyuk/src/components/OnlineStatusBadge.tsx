'use client'

import { cn } from '@/lib/utils'

interface OnlineStatusBadgeProps {
  lastActiveAt: Date | string | null
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function OnlineStatusBadge({ 
  lastActiveAt, 
  showText = false,
  size = 'md'
}: OnlineStatusBadgeProps) {
  if (!lastActiveAt) return null

  const lastActive = new Date(lastActiveAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60

  // Online if active within last 2 minutes
  const isOnline = diffMinutes < 2

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          isOnline 
            ? 'bg-green-500 ring-2 ring-green-100' 
            : 'bg-gray-400'
        )}
      />
      {showText && (
        <span className={cn(
          'text-xs',
          isOnline ? 'text-green-600' : 'text-gray-500'
        )}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  )
}
