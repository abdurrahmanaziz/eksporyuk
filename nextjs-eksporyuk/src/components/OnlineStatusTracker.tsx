'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function OnlineStatusTracker() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    // Update heartbeat every 30 seconds
    const updateHeartbeat = async () => {
      try {
        await fetch('/api/users/heartbeat', {
          method: 'POST'
        })
      } catch (error) {
        console.error('Heartbeat error:', error)
      }
    }

    // Initial heartbeat
    updateHeartbeat()

    // Set up interval
    const interval = setInterval(updateHeartbeat, 30000)

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateHeartbeat()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session])

  return null
}
