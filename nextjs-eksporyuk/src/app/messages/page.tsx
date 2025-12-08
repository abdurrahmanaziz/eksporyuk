'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MessagesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to /chat which has all the features
    router.replace('/chat')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>
  )
}
