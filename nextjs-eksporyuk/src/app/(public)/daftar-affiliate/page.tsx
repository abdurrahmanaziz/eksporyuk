'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  Share2,
  CheckCircle,
  Loader2,
  DollarSign,
  TrendingUp,
  Gift,
  Users,
  ArrowRight,
  Eye,
  EyeOff,
  XCircle,
  LogIn,
  Mail,
} from 'lucide-react'
import Image from 'next/image'

export default function DaftarAffiliatePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mode, setMode] = useState<'register' | 'login'>('register') // register or login (for existing user)
  const [step, setStep] = useState(1) // 1: Account, 2: Affiliate Info
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)
  const [affiliateCode, setAffiliateCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingUser, setCheckingUser] = useState(false)

  // Account form state (for new registration)
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Login form state (for existing user)
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })

  // Affiliate form state
  const [affiliateData, setAffiliateData] = useState({
    whatsapp: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    motivation: '',
  })

  // Check if logged in user already has affiliate
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkExistingAffiliate()
    }
  }, [status, session])

  const checkExistingAffiliate = async () => {
    setCheckingUser(true)
    try {
      const res = await fetch('/api/user/affiliate-status')
      const data = await res.json()
      
      if (data.hasAffiliate) {
        // Already has approved affiliate, redirect to affiliate dashboard
        router.push('/affiliate/dashboard')
      } else if (data.hasPendingApplication) {
        // Has pending application, redirect to status page
        router.push('/dashboard/affiliate-status')
      } else if (data.hasRejectedApplication) {
        // Was rejected, can reapply - show step 2 directly
        setMode('register')
        setStep(2)
      } else {
        // Can apply, switch to step 2 directly
        setMode('register')
        setStep(2)
      }
    } catch (error) {
      console.error('Error checking affiliate status:', error)
    } finally {
      setCheckingUser(false)
    }
  }

  // Handle login for existing user
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      })

      if (result?.error) {
        setError('Email atau password salah')
        setSubmitting(false)
        return
      }

      // After login, useEffect will check and redirect or show step 2
    } catch (error) {
      setError('Gagal login. Silakan coba lagi.')
      setSubmitting(false)
    }
  }

  // Handle step 1 submit (new registration)
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!accountData.name || !accountData.email || !accountData.password) {
      setError('Semua field wajib diisi')
      return
    }

    if (accountData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    if (accountData.password !== accountData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(accountData.email)) {
      setError('Format email tidak valid')
      return
    }

    setStep(2)
  }

  // Handle final submit (affiliate info)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validation
    if (!affiliateData.whatsapp || !affiliateData.bankName || !affiliateData.bankAccountName || !affiliateData.bankAccountNumber) {
      setError('Semua field wajib diisi')
      setSubmitting(false)
      return
    }

    try {
      // If user is logged in, use apply API (kondisi 3)
      if (session?.user) {
        const res = await fetch('/api/affiliate/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...affiliateData,
            fromPublic: true, // Flag to bypass affiliateMenuEnabled check
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Gagal mendaftar')
        }

        setAutoApproved(data.autoApproved || false)
        setAffiliateCode(data.affiliate?.affiliateCode || '')
        setSuccess(true)
      } else {
        // New user registration
        const res = await fetch('/api/affiliate/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...accountData,
            ...affiliateData,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Gagal mendaftar')
        }

        setAutoApproved(data.autoApproved || false)
        setAffiliateCode(data.affiliate?.affiliateCode || '')
        setSuccess(true)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (status === 'loading' || checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className={`w-16 h-16 ${autoApproved ? 'bg-green-100' : 'bg-orange-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <CheckCircle className={`w-10 h-10 ${autoApproved ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          
          {autoApproved ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 Selamat, Anda Sudah Gabung Rich Affiliate!</h2>
              <p className="text-gray-600 mb-4">
                Akun Anda langsung aktif. Anda sudah bisa mulai promosi dan dapatkan komisi!
              </p>
              {affiliateCode && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Kode Affiliate Anda:</p>
                  <p className="text-2xl font-bold text-orange-600">{affiliateCode}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
              <p className="text-gray-600 mb-6">
                {session?.user 
                  ? 'Aplikasi affiliate Anda sedang direview oleh admin. Anda akan menerima notifikasi segera.'
                  : 'Akun Anda telah dibuat dan aplikasi affiliate sedang direview oleh admin. Anda akan menerima email konfirmasi segera.'
                }
              </p>
            </>
          )}
          
          <div className="space-y-3">
            <Link
              href={autoApproved 
                ? (session?.user ? '/affiliate/dashboard' : '/login') 
                : (session?.user ? '/dashboard/affiliate-status' : '/login')
              }
              className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-medium"
            >
              {autoApproved 
                ? (session?.user ? 'Ke Dashboard Affiliate' : 'Login ke Dashboard')
                : (session?.user ? 'Lihat Status Aplikasi' : 'Login ke Dashboard')
              }
            </Link>
            <Link
              href="/"
              className="block text-orange-600 hover:underline"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="font-bold text-xl text-gray-900">Eksporyuk</span>
          </Link>
          {!session?.user && (
            <button 
              onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
              className="text-orange-600 hover:underline font-medium flex items-center gap-1"
            >
              {mode === 'register' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sudah punya akun? Login
                </>
              ) : (
                'Belum punya akun? Daftar'
              )}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left - Benefits */}
          <div>
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-4">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Gabung<br />
                <span className="text-orange-500">Rich Affiliate</span>
              </h1>
              <p className="text-lg text-gray-600">
                Dapatkan penghasilan tambahan dengan mempromosikan produk dan membership Eksporyuk!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Komisi Hingga 30%</h3>
                  <p className="text-gray-600">Dapatkan komisi dari setiap penjualan melalui link affiliate Anda</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dashboard Real-time</h3>
                  <p className="text-gray-600">Pantau performa, klik, konversi, dan penghasilan secara real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bonus & Challenge</h3>
                  <p className="text-gray-600">Ikuti challenge bulanan dan dapatkan bonus tambahan</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Marketing Kit Lengkap</h3>
                  <p className="text-gray-600">Akses banner, copywriting, dan materi promosi siap pakai</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Show login form if mode is login and user not logged in */}
            {mode === 'login' && !session?.user ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Login Akun</h2>
                  <p className="text-gray-600">Masuk dengan akun Anda yang sudah ada</p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800">{error}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Masukkan password"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition font-medium mt-6"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Login...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Login & Gabung Rich Affiliate
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Progress Steps - only show for registration flow */}
                {!session?.user && (
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        1
                      </div>
                      <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        2
                      </div>
                    </div>
                  </div>
                )}

                {/* Show logged in user info */}
                {session?.user && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-gray-600">Login sebagai:</p>
                    <p className="font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-sm text-gray-600">{session.user.email}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-800">{error}</span>
                  </div>
                )}

                {/* Step 1: Account Info - only for new registration */}
                {step === 1 && !session?.user && (
                  <form onSubmit={handleAccountSubmit} className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Buat Akun</h2>
                      <p className="text-gray-600">Langkah 1: Informasi akun</p>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => signIn('google', { callbackUrl: '/daftar-affiliate?step=2' })}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Daftar dengan Google
                      </button>

                      <button
                        type="button"
                        onClick={() => signIn('facebook', { callbackUrl: '/daftar-affiliate?step=2' })}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-all font-medium"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Daftar dengan Facebook
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">Atau daftar dengan email</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountData.name}
                        onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                        placeholder="Masukkan nama lengkap"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={accountData.email}
                        onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={accountData.password}
                          onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                          placeholder="Minimal 6 karakter"
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Konfirmasi Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                        placeholder="Ulangi password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-medium mt-6"
                    >
                      Lanjutkan
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                )}

                {/* Step 2: Affiliate Info - for both new and existing users */}
                {step === 2 && (
                  <form onSubmit={handleFinalSubmit} className="space-y-4">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Informasi Affiliate</h2>
                      <p className="text-gray-600">{session?.user ? 'Lengkapi data untuk gabung Rich Affiliate' : 'Langkah 2: Data pembayaran'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={affiliateData.whatsapp}
                        onChange={(e) => setAffiliateData({ ...affiliateData, whatsapp: e.target.value })}
                        placeholder="08123456789"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Bank <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={affiliateData.bankName}
                        onChange={(e) => setAffiliateData({ ...affiliateData, bankName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="">Pilih Bank</option>
                        <option value="BCA">BCA</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="BNI">BNI</option>
                        <option value="BRI">BRI</option>
                        <option value="BSI">BSI</option>
                        <option value="CIMB Niaga">CIMB Niaga</option>
                        <option value="Permata">Permata</option>
                        <option value="Danamon">Danamon</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Pemilik Rekening <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={affiliateData.bankAccountName}
                        onChange={(e) => setAffiliateData({ ...affiliateData, bankAccountName: e.target.value })}
                        placeholder="Sesuai buku tabungan"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Rekening <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={affiliateData.bankAccountNumber}
                        onChange={(e) => setAffiliateData({ ...affiliateData, bankAccountNumber: e.target.value })}
                        placeholder="1234567890"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivasi (Opsional)
                      </label>
                      <textarea
                        value={affiliateData.motivation}
                        onChange={(e) => setAffiliateData({ ...affiliateData, motivation: e.target.value })}
                        placeholder="Ceritakan mengapa Anda ingin gabung Rich Affiliate..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      {!session?.user && (
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                          Kembali
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`${session?.user ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition font-medium`}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Mendaftar...
                          </>
                        ) : (
                          <>
                            <Share2 className="w-5 h-5" />
                            Gabung Rich Affiliate
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Dengan mendaftar, Anda setuju dengan{' '}
                      <Link href="/terms" className="text-orange-600 hover:underline">
                        syarat dan ketentuan
                      </Link>{' '}
                      program affiliate.
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
