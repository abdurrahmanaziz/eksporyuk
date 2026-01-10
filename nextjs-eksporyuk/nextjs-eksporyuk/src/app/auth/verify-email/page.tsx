'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Token verifikasi tidak ditemukan')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(data.message || 'Email berhasil diverifikasi!')
        
        // Logout to refresh session, then redirect to login
        console.log('✅ Email verified, logging out to refresh session...')
        
        // Start countdown
        let count = 3
        const countdownInterval = setInterval(() => {
          count--
          setCountdown(count)
          if (count <= 0) {
            clearInterval(countdownInterval)
          }
        }, 1000)
        
        // Logout after 3 seconds
        setTimeout(async () => {
          await signOut({ redirect: false })
          router.push('/login?verified=true')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verifikasi gagal')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Terjadi kesalahan saat verifikasi email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Memverifikasi Email...'}
            {status === 'success' && 'Email Terverifikasi!'}
            {status === 'error' && 'Verifikasi Gagal'}
          </CardTitle>
          
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">
                  Email Anda telah berhasil diverifikasi! ✓
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Anda akan logout otomatis dalam {countdown} detik untuk refresh session...
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Silakan login kembali untuk menggunakan akun Anda dengan email yang terverifikasi.
              </p>
              <Button 
                onClick={async () => {
                  await signOut({ redirect: false })
                  router.push('/login?verified=true')
                }}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Login Sekarang
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Silakan coba lagi atau hubungi support jika masalah berlanjut.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Ke Dashboard
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <p className="text-sm text-muted-foreground">
              Mohon tunggu sebentar...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}