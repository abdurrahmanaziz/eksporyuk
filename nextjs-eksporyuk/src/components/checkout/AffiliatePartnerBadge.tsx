'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'

interface AffiliatePartnerBadgeProps {
  className?: string
}

interface AffiliateInfo {
  code: string
  name: string
  username: string | null
  avatar: string | null
}

/**
 * Component to display affiliate partner info on checkout pages
 * Reads from affiliate_ref cookie OR URL params, and fetches affiliate name
 */
export default function AffiliatePartnerBadge({ className = '' }: AffiliatePartnerBadgeProps) {
  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAffiliateInfo = async () => {
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      // Try to get affiliate code from cookie first
      let affiliateCode = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_ref='))
        ?.split('=')[1]

      // Fallback: Check URL params if no cookie (handles race condition with AffiliateTracker)
      if (!affiliateCode) {
        const urlParams = new URLSearchParams(window.location.search)
        affiliateCode = urlParams.get('ref') || urlParams.get('aff') || urlParams.get('affiliate') || undefined
        
        // If found in URL, set the cookie for future page loads
        if (affiliateCode) {
          const expires = new Date()
          expires.setDate(expires.getDate() + 30)
          document.cookie = `affiliate_ref=${affiliateCode}; path=/; expires=${expires.toUTCString()}`
        }
      }

      if (!affiliateCode) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/affiliate/by-ref?code=${affiliateCode}`)
        const data = await response.json()

        if (data.success && data.affiliate) {
          setAffiliate(data.affiliate)
        }
      } catch (error) {
        console.error('Failed to fetch affiliate info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAffiliateInfo()
  }, [])

  // Don't show anything while loading or if no affiliate
  if (loading || !affiliate) {
    return null
  }

  return (
    <p className={`text-xs text-center text-gray-500 ${className}`}>
      🤝 Partner Komunitas: <span className="font-medium text-gray-600">{affiliate.name}</span>
    </p>
  )
}
