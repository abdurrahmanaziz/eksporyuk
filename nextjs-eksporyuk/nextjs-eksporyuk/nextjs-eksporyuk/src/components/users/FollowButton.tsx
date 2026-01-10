'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserPlus, UserMinus, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  initialFollowing?: boolean
  showMessageButton?: boolean
}

export default function FollowButton({ 
  userId, 
  initialFollowing = false,
  showMessageButton = true 
}: FollowButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkFollowStatus()
  }, [userId])

  const checkFollowStatus = async () => {
    if (!session?.user?.id || session.user.id === userId) return

    try {
      const res = await fetch(`/api/users/${userId}/follow`)
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('Failed to check follow status:', error)
    }
  }

  const handleToggleFollow = async () => {
    if (!session?.user?.id || loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
      } else {
        const errorData = await res.json()
        console.error('Follow error response:', { status: res.status, error: errorData })
        // Still update state if possible
        if (errorData.isFollowing !== undefined) {
          setIsFollowing(errorData.isFollowing)
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessage = () => {
    router.push(`/messages?userId=${userId}`)
  }

  // Jangan tampilkan tombol untuk diri sendiri
  if (!session?.user?.id || session.user.id === userId) {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggleFollow}
        disabled={loading}
      >
        {isFollowing ? (
          <>
            <UserMinus className="w-4 h-4 mr-1" />
            Unfollow
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-1" />
            Follow
          </>
        )}
      </Button>

      {showMessageButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleMessage}
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Message
        </Button>
      )}
    </div>
  )
}
