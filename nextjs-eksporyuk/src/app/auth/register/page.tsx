'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PublicHeader } from '@/components/layout/public/PublicHeader'
import { PublicFooter } from '@/components/layout/public/PublicFooter'
import { Loader2, Mail, Lock, User, Smartphone } from 'lucide-react'

export default function RegisterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [step, setStep] = useState<'method' | 'complete-profile' | 'credentials'>('method')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [brandColor, setBrandColor] = useState('#3b82f6'); // Default blue
  const [logoAffiliate, setLogoAffiliate] = useState('/images/logo-dark.png');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          if(data.brandColor) setBrandColor(data.brandColor);
          if(data.logoAffiliate) setLogoAffiliate(data.logoAffiliate);
        }
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
      }
    }
    fetchSettings();
  }, []);


  useEffect(() => {
    // If logged in via Google/Facebook but profile incomplete
    if (status === 'authenticated' && session?.user) {
      // Check if WhatsApp is missing (user came from OAuth)
      const needsProfile = !session.user.whatsapp
      if (needsProfile) {
        setStep('complete-profile')
        setFormData(prev => ({
          ...prev,
          name: session.user.name || '',
          email: session.user.email || '',
        }))
      } else {
        // User is fully authenticated and has a complete profile
        router.push('/dashboard') // Redirect to dashboard
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

  const handleFacebookRegister = async () => {
    setIsLoading(true)
    try {
      await signIn('facebook', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Facebook sign in error:', error)
      setError('Gagal login dengan Facebook. Pastikan credentials sudah di-setup.')
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
        // Manually update the session to reflect the change
        await signIn('credentials', {
          redirect: false,
          ...session?.user, // This is a bit of a hack, might need a better way
          whatsapp: formData.whatsapp,
        });
        router.push('/dashboard')
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Automatically sign in the user after successful registration
        const signInResponse = await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        })

        if (signInResponse?.ok) {
          router.push('/dashboard') // Redirect to dashboard on successful login
        } else {
          setError(signInResponse?.error || 'Gagal login setelah registrasi.')
          setStep('credentials'); // Stay on credentials form to show error
          setIsLoading(false)
        }
      } else {
        setError(data.message || 'Gagal mendaftar')
        setIsLoading(false)
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server.')
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'method':
        return (
          <>
            <CardHeader>
              <CardTitle 
                className="text-2xl font-bold text-center"
                style={{ color: brandColor }}
              >
                Buat Akun Baru
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Pilih metode pendaftaran yang paling nyaman untuk Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Button 
                variant="outline" 
                className="w-full hover:bg-gray-50"
                onClick={() => setStep('credentials')}
              >
                <Mail className="mr-2 h-4 w-4" /> Daftar dengan Email
              </Button>
              <Button 
                variant="outline" 
                className="w-full hover:bg-gray-50"
                onClick={handleGoogleRegister} 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.96 1.62-3.36 0-6.09-2.82-6.09-6.3s2.73-6.3 6.09-6.3c1.8 0 3.06.72 3.96 1.62l2.64-2.64C18.09 2.49 15.48 1.2 12.48 1.2 7.23 1.2 3.24 5.22 3.24 10.5s3.99 9.3 9.24 9.3c2.82 0 5.16-1.02 6.9-2.82 1.8-1.8 2.4-4.32 2.4-6.36 0-.54-.06-.96-.12-1.32H12.48z" fill="currentColor"/></svg>}
                Daftar dengan Google
              </Button>
              <div className="mt-4 text-center text-sm text-gray-500">
                Sudah punya akun?{' '}
                <Link href="/auth/login" className="underline" style={{ color: brandColor }}>
                  Login di sini
                </Link>
              </div>
            </CardContent>
          </>
        )
      case 'credentials':
        return (
          <>
            <CardHeader>
              <CardTitle 
                className="text-2xl font-bold text-center"
                style={{ color: brandColor }}
              >
                Lengkapi Data Diri
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Hanya butuh beberapa detik untuk memulai.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCredentialsRegister}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="name" type="text" placeholder="John Doe" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="pl-10 bg-gray-50 border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                     <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="email" type="email" placeholder="m@example.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="pl-10 bg-gray-50 border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                     <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="whatsapp" type="tel" placeholder="081234567890" required value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="pl-10 bg-gray-50 border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="pl-10 bg-gray-50 border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} className="pl-10 bg-gray-50 border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  <Button type="submit" className="w-full font-semibold text-white" disabled={isLoading} style={{ backgroundColor: brandColor }}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Buat Akun & Masuk'}
                  </Button>
                </div>
              </form>
               <div className="mt-4 text-center text-sm text-gray-500">
                <a onClick={() => setStep('method')} className="underline cursor-pointer" style={{ color: brandColor }}>
                  &larr; Kembali ke pilihan metode
                </a>
              </div>
            </CardContent>
          </>
        )
      case 'complete-profile':
        return (
          <>
            <CardHeader>
              <CardTitle 
                className="text-2xl font-bold text-center"
                style={{ color: brandColor }}
              >
                Satu Langkah Terakhir
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Lengkapi profil Anda untuk melanjutkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompleteProfile}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" type="text" value={formData.name} disabled className="bg-gray-200 border-gray-300 cursor-not-allowed" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} disabled className="bg-gray-200 border-gray-300 cursor-not-allowed" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input id="whatsapp" type="tel" placeholder="081234567890" required value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="pl-10 bg-gray-50 border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  <Button type="submit" className="w-full font-semibold text-white" disabled={isLoading} style={{ backgroundColor: brandColor }}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Simpan & Lanjutkan'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-gray-800">
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
          {renderStep()}
        </Card>
      </main>
      <PublicFooter />
    </div>
  )
}