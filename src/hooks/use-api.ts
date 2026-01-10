'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Admin Dashboard Stats
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    // Refetch every 30 seconds for real-time updates
    refetchInterval: 30000,
  })
}

// Admin Analytics
export function useAdminAnalytics(period: string = '7d') {
  return useQuery({
    queryKey: ['admin', 'analytics', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    // Stale time 1 minute for analytics
    staleTime: 60 * 1000,
  })
}

// Xendit Balance
export function useXenditBalance() {
  return useQuery({
    queryKey: ['admin', 'xendit', 'balance'],
    queryFn: async () => {
      const res = await fetch('/api/admin/xendit/balance')
      const data = await res.json()
      
      // If it's a configuration error, return null instead of throwing
      if (data.isConfigurationError) {
        console.log('[XENDIT] Not configured, returning null balance')
        return null
      }
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch balance')
      }
      
      return data.data
    },
    // Refetch every minute
    refetchInterval: 60000,
    // Don't retry on configuration errors
    retry: (failureCount, error) => {
      return failureCount < 3 && !error.message?.includes('dikonfigurasi')
    },
  })
}

// User Settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// User Affiliate Status
export function useAffiliateStatus() {
  return useQuery({
    queryKey: ['user', 'affiliate-status'],
    queryFn: async () => {
      const res = await fetch('/api/user/affiliate-status')
      if (!res.ok) throw new Error('Failed to fetch affiliate status')
      return res.json()
    },
  })
}

// Chat Rooms
export function useChatRooms() {
  return useQuery({
    queryKey: ['chat', 'rooms'],
    queryFn: async () => {
      const res = await fetch('/api/chat/rooms')
      if (!res.ok) throw new Error('Failed to fetch chat rooms')
      return res.json()
    },
    refetchInterval: 30000, // Refetch every 30s for new messages
  })
}

// Notifications
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
    refetchInterval: 30000, // Refetch every 30s
  })
}

// Member Access
export function useMemberAccess() {
  return useQuery({
    queryKey: ['member', 'access'],
    queryFn: async () => {
      const res = await fetch('/api/member/access')
      if (!res.ok) throw new Error('Failed to fetch member access')
      return res.json()
    },
  })
}

// Affiliate Credits
export function useAffiliateCredits() {
  return useQuery({
    queryKey: ['admin', 'affiliate', 'credits'],
    queryFn: async () => {
      const res = await fetch('/api/admin/affiliate/credits')
      if (!res.ok) throw new Error('Failed to fetch credits')
      return res.json()
    },
  })
}

// Update Affiliate Credit (mutation)
export function useUpdateAffiliateCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { userId: string; credits: number }) => {
      const res = await fetch('/api/admin/affiliate/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update credits')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliate', 'credits'] })
    },
  })
}

// Leaderboard
export function useLeaderboard(period: string = '30d', limit: number = 10) {
  return useQuery({
    queryKey: ['affiliate', 'leaderboard', period, limit],
    queryFn: async () => {
      const res = await fetch(`/api/affiliate/leaderboard?period=${period}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      return res.json()
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

// Presence Update (mutation)
export function useUpdatePresence() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/presence', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to update presence')
      return res.json()
    },
  })
}
