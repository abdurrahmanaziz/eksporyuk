'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Terjadi kesalahan')
        return
      }

      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError('Gagal mengirim link reset password')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Cek Email Anda</CardTitle>
            <CardDescription>
              Link reset password telah dikirim
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Kami telah mengirimkan link reset password ke email Anda. 
                Cek inbox (atau folder spam) untuk menemukan email dari kami.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
              <p>Link reset password:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Berlaku selama 1 jam</li>
                <li>Hanya bisa digunakan sekali</li>
                <li>Jangan bagikan ke siapapun</li>
              </ul>
            </div>

            <Button 
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            >
              Kembali ke Login
            </Button>

            <p className="text-center text-sm text-gray-600">
              Email tidak terkirim?{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Coba lagi
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/login"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
          <CardTitle className="text-2xl">Lupa Password?</CardTitle>
          <CardDescription>
            Masukkan email Anda, kami akan mengirimkan link untuk mereset password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Sudah ingat password?{' '}
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Kembali ke Login
              </Link>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>💡 Tips:</strong> Link reset password akan dikirim ke email terdaftar Anda. 
              Link berlaku selama 1 jam dan hanya bisa digunakan sekali.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
