'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Email harus diisi')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Format email tidak valid')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Gagal mengirim link reset password')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Email Terkirim!
            </h1>

            <p className="text-gray-600 mb-6">
              Kami telah mengirim link reset password ke email Anda. 
              Silakan cek inbox atau folder spam.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900 text-left">
              <p className="font-semibold mb-2">📧 Langkah selanjutnya:</p>
              <ol className="space-y-1 ml-4 text-xs">
                <li>1. Buka email dari EksporYuk</li>
                <li>2. Klik link "Reset Password"</li>
                <li>3. Masukkan password baru Anda</li>
                <li>4. Login dengan password baru</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Kembali ke Login
              </Button>

              <Button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full"
              >
                Kirim Ulang Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              EksporYuk
            </h1>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lupa Password?</h2>
              <p className="text-sm text-gray-600">Kami akan kirim link reset ke email Anda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="h-12"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Masukkan email yang terdaftar di akun Anda
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-base font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  Kirim Link Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Link>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-6 text-xs text-yellow-900">
            <p>
              <strong>💡 Tips:</strong> Pastikan Anda cek folder spam jika tidak menerima email dalam beberapa menit.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Belum punya akun?{' '}
          <Link href="/auth/register" className="text-orange-600 hover:text-orange-700 font-semibold">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  )
}
