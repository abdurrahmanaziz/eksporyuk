'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Token tidak valid')
      router.push('/auth/forgot-password')
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword) {
      toast.error('Password baru harus diisi')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success(data.message)
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else {
        toast.error(data.error || 'Gagal mereset password')
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Password Berhasil Direset!
            </h1>

            <p className="text-gray-600 mb-6">
              Password Anda telah berhasil diubah. Anda akan diarahkan ke halaman login...
            </p>

            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Login Sekarang
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Link Tidak Valid
            </h1>

            <p className="text-gray-600 mb-6">
              Link reset password tidak valid atau sudah kadaluarsa.
            </p>

            <Button
              onClick={() => router.push('/auth/forgot-password')}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Minta Link Baru
            </Button>
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
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
              <p className="text-sm text-gray-600">Buat password baru untuk akun Anda</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-sm font-semibold mb-2 block">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="h-12 pr-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-500 mt-1">Password minimal 6 karakter</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold mb-2 block">
                Konfirmasi Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                className="h-12"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Password cocok
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
              <p className="font-semibold mb-1">💡 Tips Password Kuat:</p>
              <ul className="space-y-0.5 ml-4">
                <li>• Minimal 6 karakter</li>
                <li>• Kombinasi huruf dan angka</li>
                <li>• Jangan gunakan password yang mudah ditebak</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-base font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Mereset...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/auth/login"
              className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
