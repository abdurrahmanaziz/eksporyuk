'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CheckoutRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect ke unified checkout dengan preserve query params
    const params = new URLSearchParams(searchParams.toString())
    router.push(`/checkout-unified?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat halaman checkout...</p>
      </div>
    </div>
  )
}
