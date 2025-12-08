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
 * Reads from affiliate_ref cookie and fetches affiliate name
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

      // Get affiliate code from cookie
      const affiliateCode = document.cookie
        .split('; ')
        .find(row => row.startsWith('affiliate_ref='))
        ?.split('=')[1]

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
    <div className={`flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-800">
        <span className="font-medium">Partner Komunitas:</span>{' '}
        <span className="font-semibold">{affiliate.name}</span>
      </span>
    </div>
  )
}
