'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Crown, Lock, Star, Users, BookOpen, Award, 
  CheckCircle2, ArrowRight, Sparkles, TrendingUp,
  Clock, Gift, Shield, Zap, Target, Play,
  ChevronRight, Heart, MessageCircle, Rocket,
  CreditCard, Receipt, AlertCircle, ExternalLink, Wallet
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Pending Transaction interface
interface PendingTransaction {
  id: string
  invoiceNumber: string
  amount: number
  originalAmount: number
  discountAmount: number
  paymentUrl: string | null
  expiredAt: string | null
  membershipName: string
  membershipSlug: string
}

// Premium features list
const premiumFeatures = [
  {
    icon: BookOpen,
    title: 'Akses Semua Materi',
    description: 'Video tutorial, modul, dan panduan ekspor lengkap',
    locked: true
  },
  {
    icon: Users,
    title: 'Komunitas Eksklusif',
    description: 'Networking dengan eksportir berpengalaman',
    locked: true
  },
  {
    icon: Award,
    title: 'Sertifikasi Resmi',
    description: 'Sertifikat yang diakui industri ekspor',
    locked: true
  },
  {
    icon: MessageCircle,
    title: 'Konsultasi Mentor',
    description: 'Tanya jawab langsung dengan mentor ahli',
    locked: true
  },
  {
    icon: Target,
    title: 'Sistem Database Buyer',
    description: 'Akses database pembeli internasional',
    locked: true
  },
  {
    icon: TrendingUp,
    title: 'Analitik Bisnis',
    description: 'Tools analisis untuk keputusan bisnis',
    locked: true
  }
]

// Testimonials
const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'Eksportir Kerajinan',
    avatar: '👨‍💼',
    content: 'Dalam 3 bulan mengikuti program ini, saya berhasil mendapatkan buyer dari Jepang dan Amerika!',
    rating: 5
  },
  {
    name: 'Siti Rahayu',
    role: 'Pengusaha UMKM',
    avatar: '👩‍💼',
    content: 'Materi yang diberikan sangat lengkap dan mudah dipahami. Support mentornya luar biasa!',
    rating: 5
  },
  {
    name: 'Ahmad Wijaya',
    role: 'Eksportir Makanan',
    avatar: '👨‍🍳',
    content: 'Sekarang produk saya sudah diekspor ke 5 negara berbeda. Terima kasih Eksporyuk!',
    rating: 5
  }
]

// Membership benefits comparison
const membershipBenefits = [
  { feature: 'Akses Dashboard', free: true, premium: true },
  { feature: 'Profil & Pengaturan', free: true, premium: true },
  { feature: 'Notifikasi', free: true, premium: true },
  { feature: 'Semua Video Materi', free: false, premium: true },
  { feature: 'Modul Pembelajaran', free: false, premium: true },
  { feature: 'Database Buyer', free: false, premium: true },
  { feature: 'Grup Komunitas', free: false, premium: true },
  { feature: 'Konsultasi Mentor', free: false, premium: true },
  { feature: 'Sertifikasi', free: false, premium: true },
  { feature: 'Webinar Eksklusif', free: false, premium: true },
  { feature: 'Bonus Materials', free: false, premium: true },
  { feature: 'Lifetime Updates', free: false, premium: true },
]

export default function FreeUserDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [countdownLoaded, setCountdownLoaded] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [hoursRemaining, setHoursRemaining] = useState(0)
  const [minutesRemaining, setMinutesRemaining] = useState(0)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  
  // Pending transaction states
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null)
  const [paymentCountdown, setPaymentCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [loadingPending, setLoadingPending] = useState(true)

  // Fetch pending transactions
  useEffect(() => {
    const fetchPendingTransaction = async () => {
      try {
        const res = await fetch('/api/user/billing?status=PENDING&limit=1')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.transactions.length > 0) {
            const tx = data.transactions[0]
            // Parse metadata for membership info
            setPendingTransaction({
              id: tx.id,
              invoiceNumber: tx.invoiceNumber,
              amount: tx.finalAmount || tx.amount,
              originalAmount: tx.originalAmount || tx.amount,
              discountAmount: tx.discountAmount || 0,
              paymentUrl: tx.paymentUrl,
              expiredAt: tx.expiresAt,
              membershipName: tx.itemName || 'Membership',
              membershipSlug: tx.membershipSlug || '',
            })
          }
        }
      } catch (error) {
        console.error('Error fetching pending transaction:', error)
      } finally {
        setLoadingPending(false)
      }
    }

    if (session?.user?.id) {
      fetchPendingTransaction()
    }
  }, [session])

  // Payment countdown timer
  useEffect(() => {
    if (pendingTransaction?.expiredAt) {
      const updatePaymentCountdown = () => {
        const now = new Date()
        const expiry = new Date(pendingTransaction.expiredAt!)
        const diff = expiry.getTime() - now.getTime()
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          setPaymentCountdown({ hours, minutes, seconds })
        } else {
          setPaymentCountdown({ hours: 0, minutes: 0, seconds: 0 })
        }
      }
      
      updatePaymentCountdown()
      const interval = setInterval(updatePaymentCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [pendingTransaction])

  // Fetch user data to get accurate trialEndsAt from createdAt
  useEffect(() => {
    const fetchTrialInfo = async () => {
      try {
        const res = await fetch('/api/user/trial-info')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.trialEndsAt) {
            setTrialEndsAt(data.trialEndsAt)
          }
        }
      } catch (error) {
        console.error('Error fetching trial info:', error)
        // Fallback to session if API fails
        if (session?.trialEndsAt) {
          setTrialEndsAt(session.trialEndsAt)
        }
      }
    }

    if (session?.user?.id) {
      // Try session first for immediate display
      if (session.trialEndsAt) {
        setTrialEndsAt(session.trialEndsAt)
      }
      // Then fetch fresh data from API
      fetchTrialInfo()
    }
  }, [session])

  // Calculate trial countdown
  useEffect(() => {
    if (trialEndsAt) {
      const updateCountdown = () => {
        const now = new Date()
        const trialEnd = new Date(trialEndsAt)
        const diff = trialEnd.getTime() - now.getTime()
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          
          setDaysRemaining(days)
          setHoursRemaining(hours)
          setMinutesRemaining(minutes)
          setSecondsRemaining(seconds)
        } else {
          // Trial sudah berakhir
          setDaysRemaining(0)
          setHoursRemaining(0)
          setMinutesRemaining(0)
          setSecondsRemaining(0)
        }
        setCountdownLoaded(true)
      }
      
      updateCountdown()
      const interval = setInterval(updateCountdown, 1000) // Update setiap detik
      return () => clearInterval(interval)
    }
  }, [trialEndsAt])

  const userName = session?.user?.name || 'Member'

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Show pending transaction UI if exists
  if (!loadingPending && pendingTransaction) {
    // Clean up membership name - remove duplicate prefix and repeated names
    let cleanMembershipName = pendingTransaction.membershipName
      .replace(/^Membership:\s*/i, '')
      .replace(/^Membership\s*/i, '')
    
    // Handle "Paket 6 Bulan - Paket 6 Bulan" -> "Paket 6 Bulan"
    const parts = cleanMembershipName.split(' - ')
    if (parts.length === 2 && parts[0].trim() === parts[1].trim()) {
      cleanMembershipName = parts[0].trim()
    }
    
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Hero Section - Payment Pending with gradient */}
        <section 
          className="rounded-2xl text-white p-6 md:p-8 text-center relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' }}
        >
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium mb-4 border border-white/10">
              <AlertCircle className="w-4 h-4 text-orange-300" />
              <span className="text-orange-100">Tagihan Menunggu Pembayaran</span>
            </div>
            
            {/* Greeting */}
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Hai {userName}! 💳</h2>
            <p className="text-blue-50 max-w-xl mx-auto mb-6 text-sm font-light leading-relaxed">
              Anda memiliki tagihan yang belum dibayar. Selesaikan pembayaran untuk mengaktifkan membership Anda!
            </p>
            
            {/* Payment Card - White card inside gradient */}
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl shadow-2xl p-5 w-full max-w-sm mx-auto transform transition-transform hover:scale-[1.01] duration-300">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0 text-blue-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-sm md:text-base leading-tight">Membership: {cleanMembershipName}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">#{pendingTransaction.invoiceNumber}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-100 dark:border-gray-700 my-3"></div>
              
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Tagihan</span>
                <div className="flex flex-col items-end">
                  {pendingTransaction.discountAmount > 0 && pendingTransaction.originalAmount > pendingTransaction.amount && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-gray-400 line-through decoration-gray-300 dark:decoration-gray-600">
                        {formatPrice(pendingTransaction.originalAmount)}
                      </span>
                      <span className="bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-100 dark:border-transparent">
                        Diskon {Math.round((pendingTransaction.discountAmount / pendingTransaction.originalAmount) * 100)}%
                      </span>
                    </div>
                  )}
                  <span className="text-2xl font-bold tracking-tight" style={{ color: '#2563EB' }}>{formatPrice(pendingTransaction.amount)}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {pendingTransaction.paymentUrl && (
                  <Link href={pendingTransaction.paymentUrl} target="_blank">
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-lg font-bold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] transform hover:-translate-y-0.5">
                      <CreditCard className="w-4 h-4" />
                      Bayar Sekarang
                    </button>
                  </Link>
                )}
                <Link href="/dashboard/billing" className="w-full">
                  <button className="mx-auto text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1 py-1 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 w-full">
                    <Receipt className="w-4 h-4" />
                    Lihat Detail Tagihan
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Steps */}
        <section className="py-2">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Cara Menyelesaikan Pembayaran</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ikuti langkah-langkah berikut untuk mengaktifkan membership Anda</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 border-t-2 border-dashed border-gray-300 dark:border-gray-600"></div>
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative group hover:shadow-md transition-shadow">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs absolute -top-3 left-4 shadow-md border-2 border-white dark:border-gray-800">1</div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">Lihat Tagihan</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Klik "Lihat Detail Tagihan" untuk melihat informasi pembayaran lengkap.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative group hover:shadow-md transition-shadow">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs absolute -top-3 left-4 shadow-md border-2 border-white dark:border-gray-800">2</div>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">Lakukan Pembayaran</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Transfer sesuai nominal ke rekening yang tertera atau gunakan metode pembayaran lainnya.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative group hover:shadow-md transition-shadow">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs absolute -top-3 left-4 shadow-md border-2 border-white dark:border-gray-800">3</div>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">Membership Aktif</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Setelah pembayaran terverifikasi, membership Anda akan langsung aktif!
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Preview */}
        <section className="py-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-5">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center gap-1.5">
              Yang Akan Anda Dapatkan <span className="text-xl">🎁</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Setelah pembayaran selesai, Anda akan mendapatkan akses ke:</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Semua Materi</span>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Komunitas</span>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Sertifikasi</span>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-2">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Mentoring</span>
            </div>
          </div>
        </section>
        
        {/* Bottom spacer */}
        <div className="h-6"></div>
      </div>
    )
  }

  // Default: Show upgrade UI for free users without pending transaction
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      {/* Hero Section - Trial Countdown */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span className="text-white text-sm font-medium">Penawaran Terbatas untuk Anda!</span>
            </div>
            
            {/* Greeting */}
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
              Selamat Datang, {userName}! 👋
            </h1>
            <p className="text-white/90 text-sm md:text-lg mb-8 max-w-2xl mx-auto">
              Anda sedang dalam periode trial. Upgrade ke Premium untuk membuka semua fitur dan mulai perjalanan ekspor Anda!
            </p>
            
            {/* Countdown Timer */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-lg mx-auto mb-8">
              <p className="text-white/80 text-sm mb-3 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Penawaran berakhir dalam:
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="bg-white rounded-xl px-3 py-3 min-w-[60px]">
                  <div className="text-2xl md:text-3xl font-bold text-orange-600">{daysRemaining}</div>
                  <div className="text-xs text-gray-500">Hari</div>
                </div>
                <span className="text-white text-2xl font-bold">:</span>
                <div className="bg-white rounded-xl px-3 py-3 min-w-[60px]">
                  <div className="text-2xl md:text-3xl font-bold text-orange-600">{String(hoursRemaining).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500">Jam</div>
                </div>
                <span className="text-white text-2xl font-bold">:</span>
                <div className="bg-white rounded-xl px-3 py-3 min-w-[60px]">
                  <div className="text-2xl md:text-3xl font-bold text-orange-600">{String(minutesRemaining).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500">Menit</div>
                </div>
                <span className="text-white text-2xl font-bold">:</span>
                <div className="bg-white rounded-xl px-3 py-3 min-w-[60px]">
                  <div className="text-2xl md:text-3xl font-bold text-orange-600">{String(secondsRemaining).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-500">Detik</div>
                </div>
              </div>
            </div>
            
            {/* CTA Button */}
            <Link href="/pricing">
              <button className="group bg-white hover:bg-gray-50 text-orange-600 font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-3">
                <Crown className="w-5 h-5" />
                <span>Upgrade ke Premium Sekarang</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="px-4 py-12 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Mengapa Harus Upgrade ke Premium?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dapatkan akses penuh ke semua materi, mentor berpengalaman, dan komunitas eksportir terbesar di Indonesia
          </p>
        </div>
        
        {/* Features Grid with Lock Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {premiumFeatures.map((feature, index) => (
            <div 
              key={index}
              className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              {/* Lock Badge */}
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1.5 rounded-full shadow-md">
                <Lock className="w-3 h-3" />
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/5 rounded-2xl transition-colors"></div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white text-center">
              Perbandingan Akses Member
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Fitur</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <span>Free</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="flex items-center justify-center gap-2 text-orange-600 font-bold">
                      <Crown className="w-4 h-4" />
                      <span>Premium</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {membershipBenefits.map((benefit, index) => (
                  <tr key={index} className={`border-b border-gray-50 ${index % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="py-3 px-6 text-gray-700">{benefit.feature}</td>
                    <td className="py-3 px-6 text-center">
                      {benefit.free ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Apa Kata Mereka yang Sudah Bergabung?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">5000+</div>
              <div className="text-white/80 text-sm">Member Aktif</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">100+</div>
              <div className="text-white/80 text-sm">Video Tutorial</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">50+</div>
              <div className="text-white/80 text-sm">Negara Tujuan</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">4.9</div>
              <div className="text-white/80 text-sm">Rating Kepuasan</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-4">
            <Gift className="w-4 h-4 text-orange-600" />
            <span className="text-orange-600 text-sm font-medium">Dapatkan Bonus Eksklusif!</span>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Siap Memulai Perjalanan Ekspor Anda?
          </h3>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Bergabung dengan ribuan eksportir sukses lainnya. Upgrade sekarang dan dapatkan akses langsung ke semua materi!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard/upgrade">
              <button className="group bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-3">
                <Rocket className="w-5 h-5" />
                <span>Upgrade Premium Sekarang</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <Link href="/dashboard/my-membership">
              <button className="text-gray-600 hover:text-gray-900 font-medium px-6 py-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all inline-flex items-center gap-2">
                <span>Lihat Pilihan Membership</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
          
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Pembayaran Aman</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Akses Instan</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Garansi 7 Hari</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
