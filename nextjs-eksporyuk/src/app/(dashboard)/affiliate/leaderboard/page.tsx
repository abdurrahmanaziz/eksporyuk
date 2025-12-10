'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import ModernLeaderboard from '@/components/leaderboard/ModernLeaderboard'

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  avatar?: string | null
  points: number
  conversions: number
}

interface LeaderboardData {
  allTime: LeaderboardEntry[]
  weekly: LeaderboardEntry[]
  monthly: LeaderboardEntry[]
  currentUserRank?: {
    allTime?: number
    weekly?: number
    monthly?: number
  }
}

export default function AffiliateLeaderboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<LeaderboardData>({
    allTime: [],
    weekly: [],
    monthly: [],
    currentUserRank: undefined
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/affiliate/leaderboard/modern')
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <ModernLeaderboard 
      data={data}
      showAllTime={false} // Affiliate only sees weekly
      currentUserId={session?.user?.id}
      onRefresh={fetchData}
      isLoading={isLoading}
    />
  )
}
