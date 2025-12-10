'use client'

import { useState, useEffect, useCallback } from 'react'
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
}

export default function AdminLeaderboardPage() {
  const [data, setData] = useState<LeaderboardData>({
    allTime: [],
    weekly: [],
    monthly: []
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/affiliates/leaderboard/modern')
      
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
      showAllTime={true} // Admin can see both tabs
      onRefresh={fetchData}
      isLoading={isLoading}
    />
  )
}
