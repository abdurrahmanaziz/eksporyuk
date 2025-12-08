'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  PartyPopper, 
  Sparkles, 
  GraduationCap, 
  Link2, 
  Wallet, 
  Trophy,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Gift,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'

interface AffiliateInfo {
  affiliateCode: string
  shortLink: string
  tier: number
  commissionRate: number
  isNewAffiliate: boolean
}

export default function AffiliateWelcomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAffiliateInfo()
    }
  }, [status])

  useEffect(() => {
    // Auto-dismiss confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const fetchAffiliateInfo = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.affiliate) {
        setAffiliateInfo({
          affiliateCode: data.affiliate.affiliateCode,
          shortLink: data.affiliate.shortLink,
          tier: data.affiliate.tier,
          commissionRate: Number(data.affiliate.commissionRate),
          isNewAffiliate: data.affiliate.isNewAffiliate || !data.affiliate.trainingCompleted,
        })
        
        // Mark welcome as shown
        await fetch('/api/affiliate/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markWelcomeShown: true }),
        })
      }
    } catch (error) {
      console.error('Error fetching affiliate info:', error)
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    { icon: Gift, text: 'Komisi hingga 50% per penjualan', color: 'text-green-500' },
    { icon: Link2, text: 'Link affiliate custom & short links', color: 'text-blue-500' },
    { icon: Trophy, text: 'Bonus dari challenge & kompetisi', color: 'text-yellow-500' },
    { icon: TrendingUp, text: 'Sistem tier dengan komisi naik', color: 'text-purple-500' },
  ]

  const steps = [
    {
      icon: GraduationCap,
      title: 'Selesaikan Training',
      description: 'Pelajari strategi dan tips sukses affiliate',
      href: '/affiliate/training',
      action: 'Mulai Training',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Link2,
      title: 'Buat Link Pertama',
      description: 'Buat link affiliate untuk produk/membership',
      href: '/affiliate/links',
      action: 'Buat Link',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Wallet,
      title: 'Setup Rekening',
      description: 'Tambahkan rekening untuk pencairan',
      href: '/affiliate/wallet',
      action: 'Tambah Rekening',
      color: 'from-orange-500 to-amber-600',
    },
    {
      icon: Users,
      title: 'Mulai Promosi',
      description: 'Bagikan link dan dapatkan komisi!',
      href: '/affiliate/dashboard',
      action: 'Ke Dashboard',
      color: 'from-purple-500 to-pink-600',
    },
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Mempersiapkan halaman...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Confetti Effect (CSS animation) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Aplikasi Disetujui!
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <PartyPopper className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Selamat Datang, Affiliate!
            </h1>
            <Sparkles className="w-10 h-10 text-yellow-500" />
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Halo <span className="font-semibold text-orange-600">{session?.user?.name}</span>! 
            Anda resmi menjadi bagian dari keluarga affiliate Eksporyuk.
          </p>
        </div>

        {/* Affiliate Info Card */}
        {affiliateInfo && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white mb-12 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-orange-100 text-sm mb-1">Kode Affiliate Anda</p>
                <p className="text-3xl font-mono font-bold tracking-wider">
                  {affiliateInfo.affiliateCode}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center px-4 py-2 bg-white/20 rounded-xl">
                  <p className="text-orange-100 text-xs">Status</p>
                  <p className="text-xl font-bold">Aktif ✓</p>
                </div>
              </div>
            </div>
            {affiliateInfo.shortLink && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-orange-100 text-sm mb-2">Short Link Anda</p>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <code className="flex-1 font-mono text-lg">{affiliateInfo.shortLink}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(affiliateInfo.shortLink)
                    }}
                    className="px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            🎁 Keuntungan Menjadi Affiliate
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3 ${benefit.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{benefit.text}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            🚀 Langkah Selanjutnya
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Ikuti langkah-langkah berikut untuk memulai perjalanan affiliate Anda
          </p>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              
              return (
                <div
                  key={index}
                  className={`relative rounded-2xl border-2 transition-all ${
                    isActive 
                      ? 'border-orange-400 bg-orange-50 shadow-lg' 
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="p-6 flex items-center gap-5">
                    {/* Step Number */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">LANGKAH {index + 1}</span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Mulai di sini
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{step.title}</h3>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                    </div>

                    {/* Action */}
                    <Link
                      href={step.href}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors flex-shrink-0 ${
                        index === 0
                          ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {step.action}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skip to Dashboard */}
        <div className="text-center">
          <Link
            href="/affiliate/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Lewati untuk sekarang, langsung ke Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Confetti Animation Styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s linear forwards;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
