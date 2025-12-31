'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Fitur Chat</h1>
          <p className="text-gray-500">
            Fitur chat sedang dalam pengembangan. Silakan coba lagi nanti.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
