'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, getCsrfToken } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get safe callback URL (avoid auth pages loop)
  const rawCallbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/dashboard'
  const callbackUrl = (rawCallbackUrl.includes('/login') || 
                       rawCallbackUrl.includes('/register') || 
                       rawCallbackUrl.includes('/auth/')) 
                      ? '/dashboard' 
                      : rawCallbackUrl

  useEffect(() => {
    // Get CSRF token on mount
    getCsrfToken().then(token => {
      if (token) setCsrfToken(token)
    })
    
    // Debug: Check available providers from NextAuth
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(providers => {
        console.log('[LOGIN] Available providers:', providers)
        // NextAuth returns object with provider IDs as keys, e.g. { google: {...}, credentials: {...} }
        const hasGoogle = providers && typeof providers === 'object' && 'google' in providers
        console.log('[LOGIN] Google provider available:', hasGoogle)
        if (hasGoogle) {
          console.log('[LOGIN] Google provider config:', providers.google)
        } else {
          console.warn('[LOGIN] ⚠️ Google provider not found in NextAuth providers!')
        }
      })
      .catch(err => {
        console.error('[LOGIN] Failed to fetch providers:', err)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('[LOGIN] Attempting login for:', email)
      
      // Direct POST to NextAuth callback endpoint (same as working-login)
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          password: password,
          csrfToken: csrfToken,
          callbackUrl: callbackUrl,
          json: 'true'
        }).toString()
      })

      console.log('[LOGIN] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[LOGIN] Response data:', data)
        
        if (data.url) {
          // Success - redirect using window.location for proper session
          window.location.href = data.url
        } else {
          setError('Login berhasil tapi tidak ada redirect URL')
        }
      } else {
        const text = await response.text()
        console.log('[LOGIN] Error response:', text)
        setError('Email atau password salah')
      }
    } catch (error: any) {
      console.error('[LOGIN] Unexpected error:', error)
      setError('Terjadi kesalahan sistem: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      console.log('[LOGIN] Google button clicked')
      console.log('[LOGIN] Callback URL:', callbackUrl)
      console.log('[LOGIN] Calling signIn with provider: google')
      
      const result = await signIn('google', { 
        callbackUrl: callbackUrl,
        redirect: true 
      })
      
      console.log('[LOGIN] signIn result:', result)
      
      // If we reach here, signIn didn't redirect (which is unusual)
      if (!result) {
        console.error('[LOGIN] signIn returned undefined/null')
        setError('Gagal menginisiasi login Google. Provider mungkin tidak aktif.')
      }
    } catch (error) {
      console.error('[LOGIN] Google login error:', error)
      setError('Gagal login dengan Google: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo */}
        <div className="text-center">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                EY
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-gray-900">Ekspor Yuk</div>
                <div className="text-xs text-gray-600">Platform Komunitas & Membership</div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Masuk ke Akun Anda</CardTitle>
            <CardDescription className="text-center">
              Pilih metode login yang Anda inginkan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Masuk dengan Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Atau masuk dengan email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@eksporyuk.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password"
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    Lupa Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                onClick={(e) => {
                  console.log('[LOGIN] Button clicked, isLoading:', isLoading)
                  if (isLoading) {
                    e.preventDefault()
                  }
                }}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center text-sm mt-4">
              <span className="text-gray-600">Belum punya akun? </span>
              <Link href="/auth/register" className="text-orange-600 hover:text-orange-700 font-semibold">
                Daftar Sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}