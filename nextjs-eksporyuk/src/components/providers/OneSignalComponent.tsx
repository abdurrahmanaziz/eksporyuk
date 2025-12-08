'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

declare global {
  interface Window {
    OneSignalDeferred?: any[]
    OneSignal?: any
    oneSignalInitialized?: boolean
  }
}

export default function OneSignalComponent() {
  const { data: session } = useSession()
  const initRef = useRef(false)
  const syncRef = useRef(false)

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    
    if (!appId || appId === 'your-onesignal-app-id' || initRef.current) {
      return
    }

    initRef.current = true

    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.defer = true
    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false }
          })

          window.oneSignalInitialized = true

          if (session?.user?.id) {
            await OneSignal.login(session.user.id)
            
            // Auto-tag user dengan data comprehensive untuk segmentasi
            await updateUserTags(OneSignal, session.user)

            // Setup subscription change listener untuk sync Player ID
            setupSubscriptionListener(OneSignal, session.user)
          }
        } catch (err) {
          console.error('[OneSignal] Error:', err)
        }
      })
    }
    document.head.appendChild(script)
  }, [session])

  return null
}

async function updateUserTags(OneSignal: any, user: any) {
  try {
    const tags: Record<string, string> = {
      userId: user.id,
      email: user.email || '',
      name: user.name || '',
      role: user.role || 'MEMBER_FREE',
    }

    // Membership Tier Tag
    if (user.role) {
      if (user.role.includes('LIFETIME')) {
        tags.membershipTier = 'LIFETIME'
        tags.membershipStatus = 'active'
      } else if (user.role.includes('PRO')) {
        tags.membershipTier = 'PRO'
        tags.membershipStatus = 'active'
      } else if (user.role.includes('STARTER')) {
        tags.membershipTier = 'STARTER'
        tags.membershipStatus = 'active'
      } else if (user.role === 'MEMBER_FREE') {
        tags.membershipTier = 'FREE'
        tags.membershipStatus = 'free'
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        tags.membershipTier = 'ADMIN'
        tags.membershipStatus = 'admin'
      }
    }

    // Geographic Tags
    if (user.province) {
      tags.province = user.province
    }
    if (user.city) {
      tags.city = user.city
    }
    if (user.district) {
      tags.district = user.district
    }

    // Affiliate Status
    if (user.affiliateMenuEnabled) {
      tags.isAffiliate = 'true'
    }

    // Founder/Co-Founder Status
    if (user.isFounder) {
      tags.isFounder = 'true'
    }
    if (user.isCoFounder) {
      tags.isCoFounder = 'true'
    }

    // Profile Completion
    if (user.profileCompleted) {
      tags.profileCompleted = 'true'
    }

    // Email Verified
    if (user.emailVerified) {
      tags.emailVerified = 'true'
    }

    // Notification Preferences
    if (user.emailNotifications !== undefined) {
      tags.emailNotificationsEnabled = user.emailNotifications ? 'true' : 'false'
    }
    if (user.whatsappNotifications !== undefined) {
      tags.whatsappNotificationsEnabled = user.whatsappNotifications ? 'true' : 'false'
    }

    // User Engagement Level (based on last activity)
    const lastActiveAt = user.lastActiveAt ? new Date(user.lastActiveAt) : null
    if (lastActiveAt) {
      const daysSinceActive = Math.floor(
        (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceActive <= 1) {
        tags.engagementLevel = 'very_active'
      } else if (daysSinceActive <= 7) {
        tags.engagementLevel = 'active'
      } else if (daysSinceActive <= 30) {
        tags.engagementLevel = 'moderate'
      } else if (daysSinceActive <= 90) {
        tags.engagementLevel = 'low'
      } else {
        tags.engagementLevel = 'inactive'
      }
    }

    // Add timestamp
    tags.lastTagUpdate = new Date().toISOString()

    await OneSignal.User.addTags(tags)

    console.log('[OneSignal] User tags updated:', Object.keys(tags).length, 'tags')
  } catch (error) {
    console.error('[OneSignal] Failed to update user tags:', error)
  }
}

/**
 * Setup listener untuk perubahan subscription status
 * Ketika user opt-in/opt-out web push, auto-sync ke backend
 */
async function setupSubscriptionListener(OneSignal: any, user: any) {
  try {
    // Listener untuk perubahan push subscription
    if (OneSignal.User && typeof OneSignal.User.PushSubscription === 'object') {
      OneSignal.User.PushSubscription.addEventListener('change', async (subscription: any) => {
        try {
          // Ambil Player ID dari subscription
          const playerId = subscription.id || OneSignal.User.onesignalId

          if (playerId) {
            // Sync Player ID ke backend
            const response = await fetch('/api/users/onesignal-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                playerId,
                tags: {
                  email: user.email,
                  role: user.role,
                  userId: user.id
                }
              })
            })

            if (!response.ok) {
              console.error('[OneSignal] Sync failed:', response.status)
            } else {
              console.log('[OneSignal] Player ID synced successfully')
            }
          }
        } catch (error) {
          console.error('[OneSignal] Sync error:', error)
        }
      })
    }

    // Juga trigger sync langsung saat setup selesai
    const playerId = OneSignal.User?.onesignalId
    if (playerId) {
      const response = await fetch('/api/users/onesignal-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId,
          tags: {
            email: user.email,
            role: user.role,
            userId: user.id
          }
        })
      })

      if (response.ok) {
        console.log('[OneSignal] Initial Player ID sync completed')
      }
    }
  } catch (error) {
    console.error('[OneSignal] Failed to setup subscription listener:', error)
  }
}
