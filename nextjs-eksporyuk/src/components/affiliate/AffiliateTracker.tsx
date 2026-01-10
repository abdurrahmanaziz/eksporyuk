'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Global component to track affiliate referrals from URL parameters
 * This should be included in the root layout to capture affiliate codes
 * on ANY page that is visited with ?ref=CODE
 */
export default function AffiliateTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const refCode = searchParams.get('ref') || searchParams.get('aff') || searchParams.get('affiliate')
    const couponCode = searchParams.get('coupon')

    // Only proceed if we have an affiliate code
    if (refCode) {
      // Check if cookie already exists and is the same
      const existingRef = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_ref='))
        ?.split('=')[1]

      // Only set if different (don't reset 30-day timer if same)
      if (existingRef !== refCode) {
        // Set cookie for 30 days
        const expires = new Date()
        expires.setDate(expires.getDate() + 30)
        document.cookie = `affiliate_ref=${refCode}; path=/; expires=${expires.toUTCString()}`

        // Track click via API (fire and forget)
        fetch('/api/affiliate/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: refCode }),
        }).catch(err => console.error('Failed to track affiliate click:', err))
      }
    }

    // Handle coupon code separately
    if (couponCode) {
      const existingCoupon = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_coupon='))
        ?.split('=')[1]

      if (existingCoupon !== couponCode) {
        const expires = new Date()
        expires.setDate(expires.getDate() + 30)
        document.cookie = `affiliate_coupon=${couponCode}; path=/; expires=${expires.toUTCString()}`
      }
    }
  }, [searchParams])

  // This component doesn't render anything visible
  return null
}
