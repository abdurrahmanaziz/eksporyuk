'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(true)

  // Validate token on page load
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError('Token tidak ditemukan. Mohon gunakan link dari email Anda.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validasi
    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          newPassword 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Gagal mereset password')
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Terjadi kesalahan pada server')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!tokenValid && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Link Tidak Valid</CardTitle>
            <CardDescription>
              Token reset password tidak ditemukan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Mohon gunakan link reset password dari email Anda. Jika link sudah kadaluarsa, minta link baru.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => router.push('/forgot-password')}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            >
              Minta Link Baru
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Password Berhasil Direset</CardTitle>
            <CardDescription>
              Password akun Anda telah diperbarui
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password Anda telah berhasil direset. Anda sekarang dapat login dengan password baru.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600"
            >
              Login Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-orange-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-2xl">Reset Password</CardTitle>
          </div>
          <CardDescription>
            Masukkan password baru untuk akun Anda
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

            {/* Password Baru */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                Password Baru
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {newPassword && (
                <div className="text-xs text-gray-500">
                  {newPassword.length >= 8 ? (
                    <span className="text-green-600">✓ Password kuat</span>
                  ) : (
                    <span className="text-amber-600">⚠ Minimal 8 karakter</span>
                  )}
                </div>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <div className="text-xs text-gray-500">
                  {newPassword === confirmPassword ? (
                    <span className="text-green-600">✓ Password cocok</span>
                  ) : (
                    <span className="text-red-600">✗ Password tidak cocok</span>
                  )}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {loading ? 'Memproses...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>💡 Tips Password yang Kuat:</strong><br/>
              • Minimal 8 karakter<br/>
              • Campurkan huruf besar, kecil, angka, dan simbol<br/>
              • Hindari informasi pribadi (nama, tanggal lahir, dll)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
