'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Redirect to new checkout design at /checkout/[slug]
export default function MembershipCheckoutRedirect() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  useEffect(() => {
    // Preserve query parameters (ref, coupon, etc.)
    const searchParams = new URLSearchParams(window.location.search)
    const queryString = searchParams.toString()
    const redirectUrl = `/checkout/${slug}${queryString ? `?${queryString}` : ''}`
    
    router.replace(redirectUrl)
  }, [slug, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengarahkan ke halaman checkout...</p>
      </div>
    </div>
  )
}
