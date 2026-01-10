'use client'

import { useState, useEffect, useCallback } from 'react'
import ModernLeaderboard from '@/components/leaderboard/ModernLeaderboard'
import Head from 'next/head'

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
      // Add cache busting to ensure fresh data
      const timestamp = Date.now()
      const response = await fetch(`/api/admin/affiliates/leaderboard/modern?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
        console.log('✅ Leaderboard data updated:', new Date().toLocaleTimeString('id-ID'))
        console.log('📊 All Time Top 3:', result.allTime.slice(0, 3).map((a: any) => `${a.name} (Rp ${a.points.toLocaleString('id-ID')})`))
        console.log('📊 Weekly Top 3:', result.weekly.slice(0, 3).map((a: any) => `${a.name} (Rp ${a.points.toLocaleString('id-ID')})`))
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
    <>
      <Head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      <ModernLeaderboard 
        data={data}
        showAllTime={true} // Admin can see all time tab - default active
        onRefresh={fetchData}
        isLoading={isLoading}
      />
    </>
  )
}
