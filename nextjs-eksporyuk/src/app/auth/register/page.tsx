'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [step, setStep] = useState<'method' | 'complete-profile' | 'credentials'>('method')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    // If logged in via Google but profile incomplete
    if (status === 'authenticated' && session?.user) {
      // Check if WhatsApp is missing (user came from Google OAuth)
      const needsProfile = !session.user.whatsapp
      if (needsProfile) {
        setStep('complete-profile')
        setFormData(prev => ({
          ...prev,
          name: session.user.name || '',
          email: session.user.email || '',
        }))
      } else {
        router.push('/demo')
      }
    }
  }, [session, status, router])

  const handleGoogleRegister = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Gagal login dengan Google. Pastikan credentials sudah di-setup.')
      setIsLoading(false)
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!formData.whatsapp) {
      setError('Nomor WhatsApp wajib diisi')
      setIsLoading(false)
      return
    }

    try {
      // Save profile to database
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp: formData.whatsapp,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Profil berhasil dilengkapi!')
        router.push('/demo')
      } else {
        setError(data.error || 'Gagal menyimpan profil')
      }
    } catch (error) {
      setError('Terjadi kesalahan sistem')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (!formData.name || !formData.email || !formData.whatsapp || !formData.password) {
      setError('Semua field wajib diisi')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter')
      setIsLoading(false)
      return
    }

    try {
      // Register via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        alert('Registrasi berhasil! Silakan login.')
        router.push('/login')
      } else {
        setError(data.error || 'Gagal registrasi')
      }
    } catch (error) {
      setError('Terjadi kesalahan sistem')
    } finally {
      setIsLoading(false)
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

        {/* Method Selection */}
        {step === 'method' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Daftar Akun Baru</CardTitle>
              <CardDescription className="text-center">
                Pilih metode pendaftaran yang Anda inginkan
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Google Register Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={handleGoogleRegister}
                disabled={isLoading}
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
                Daftar dengan Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Atau</span>
                </div>
              </div>

              <Button
                type="button"
                variant="default"
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => setStep('credentials')}
              >
                Daftar dengan Email & Password
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm mt-4">
                <span className="text-gray-600">Sudah punya akun? </span>
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-semibold">
                  Masuk Sekarang
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Profile (after Google OAuth) */}
        {step === 'complete-profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Lengkapi Profil Anda</CardTitle>
              <CardDescription className="text-center">
                Satu langkah lagi untuk menyelesaikan pendaftaran
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div>
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={formData.name}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 08xxxxxxxxxx (tanpa +62)
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Menyimpan...' : 'Selesaikan Pendaftaran'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Credentials Registration */}
        {step === 'credentials' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Daftar dengan Email</CardTitle>
              <CardDescription className="text-center">
                Isi form di bawah untuk membuat akun baru
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCredentialsRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 8 karakter"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang password"
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
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('method')}
                >
                  Kembali
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-600">
          <p>
            Dengan mendaftar, Anda menyetujui{' '}
            <Link href="/terms" className="text-orange-600 hover:underline">
              Syarat & Ketentuan
            </Link>
            {' '}dan{' '}
            <Link href="/privacy" className="text-orange-600 hover:underline">
              Kebijakan Privasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}