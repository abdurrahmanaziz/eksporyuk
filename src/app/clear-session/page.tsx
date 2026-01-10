'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ClearSessionPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'clearing' | 'success' | 'error'>('clearing')
  const [message, setMessage] = useState('Clearing session...')

  useEffect(() => {
    clearSession()
  }, [])

  const clearSession = async () => {
    try {
      setStatus('clearing')
      setMessage('Logging out and clearing cookies...')

      // Step 1: Sign out from NextAuth
      await signOut({ redirect: false })

      // Step 2: Clear session via API
      await fetch('/api/auth/clear-session')

      // Step 3: Clear all cookies client-side
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
      })

      setStatus('success')
      setMessage('Session cleared successfully!')

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      console.error('Clear session error:', error)
      setStatus('error')
      setMessage('Failed to clear session automatically')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Clear Session</CardTitle>
          <CardDescription className="text-center">
            Fixing session mismatch issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            {status === 'clearing' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <p className="text-center font-medium text-green-600">{message}</p>
                <p className="text-sm text-muted-foreground text-center">
                  Redirecting to login...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-red-500" />
                <p className="text-center font-medium text-red-600">{message}</p>
                <div className="space-y-2 w-full">
                  <Button 
                    onClick={clearSession} 
                    className="w-full"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => router.push('/login')} 
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-medium">📝 Manual Steps (if needed):</p>
            <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
              <li>Open DevTools (F12)</li>
              <li>Go to: Application → Cookies</li>
              <li>Delete all cookies for localhost:3000</li>
              <li>Go to /login</li>
              <li>Login with: <code className="bg-background px-1 rounded">admin@eksporyuk.com</code> / <code className="bg-background px-1 rounded">password123</code></li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
