'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ModernLeaderboard from '@/components/leaderboard/ModernLeaderboard'
import Head from 'next/head'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

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

export default function AffiliateLeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<LeaderboardData>({
    allTime: [],
    weekly: [],
    monthly: []
  })
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not AFFILIATE role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'AFFILIATE') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchData = useCallback(async () => {
    if (session?.user?.role !== 'AFFILIATE') return

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
        console.log('✅ Affiliate leaderboard data updated:', new Date().toLocaleTimeString('id-ID'))
        console.log('📊 Your Performance - All Time:', result.allTime[0] ? `Rank ${result.allTime[0].rank} - Rp ${result.allTime[0].points.toLocaleString('id-ID')}` : 'No data')
        console.log('📊 Your Performance - Weekly:', result.weekly[0] ? `Rank ${result.weekly[0].rank} - Rp ${result.weekly[0].points.toLocaleString('id-ID')}` : 'No data')
      } else if (response.status === 403) {
        console.log('Access denied to leaderboard')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.role, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'AFFILIATE') {
      fetchData()
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [status, session, fetchData])

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Not authenticated or wrong role
  if (status === 'unauthenticated' || session?.user?.role !== 'AFFILIATE') {
    return null
  }

  return (
    <>
      <Head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your affiliate performance across different time periods
          </p>
        </div>

        {/* Stats Cards */}
        {data.allTime.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* All-Time Stats */}
            {data.allTime[0] && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    All-Time Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold">Rp {Number(data.allTime[0].points).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-muted-foreground">Total Earnings</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-blue-600">{data.allTime[0].conversions}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Stats */}
            {data.weekly[0] && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold">Rp {Number(data.weekly[0].points).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-muted-foreground">Weekly Earnings</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-600">{data.weekly[0].conversions}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Stats */}
            {data.monthly[0] && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold">Rp {Number(data.monthly[0].points).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-muted-foreground">Monthly Earnings</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-purple-600">{data.monthly[0].conversions}</p>
                      <p className="text-xs text-muted-foreground">Conversions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Leaderboard Component */}
        <div className="bg-card rounded-lg border">
          <ModernLeaderboard 
            data={data}
            showAllTime={true}
            onRefresh={fetchData}
            isLoading={isLoading}
          />
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About Your Performance</CardTitle>
            <CardDescription>How your earnings are calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-sm mb-2">What's Included</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Successful affiliate conversions</li>
                  <li>✓ Commission from direct referrals</li>
                  <li>✓ All payment methods</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Performance Periods</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ All-Time: Entire history</li>
                  <li>✓ Monthly: Current month</li>
                  <li>✓ Weekly: Current week (Mon-Today)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
