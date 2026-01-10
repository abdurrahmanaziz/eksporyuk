'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Package, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Star,
  Shield,
  Globe,
  MessageSquare,
  BarChart3,
  Zap,
  ArrowRight,
  Crown,
  Sparkles,
  Store,
  Factory,
  Truck,
  Award,
  DollarSign,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface SupplierPackage {
  id: string
  name: string
  type: 'FREE' | 'PREMIUM' | 'ENTERPRISE'
  price: number
  duration: string
  features: string[]
  popular?: boolean
}

interface WhyChooseUsSection {
  title: string
  highlight?: boolean
  items: Array<{ text: string; checked: boolean }>
}

export default function SupplierLandingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [packages, setPackages] = useState<SupplierPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/supplier/packages')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          // Transform packages to include features as array
          const transformedPackages = data.packages
            .filter((pkg: any) => pkg.type === 'FREE') // Only show FREE package
            .map((pkg: any) => {
              const features: string[] = []
              
              if (pkg.features.maxProducts > 0) {
                features.push(
                  pkg.features.maxProducts === 999 
                    ? 'Upload Produk Unlimited' 
                    : `Upload hingga ${pkg.features.maxProducts} produk`
                )
              }
              if (pkg.features.chatEnabled) features.push('Chat dengan Buyer')
              if (pkg.features.verifiedBadge) features.push('Badge Terverifikasi')
              if (pkg.features.customURL) features.push('Custom URL Profil')
              if (pkg.features.statistics) features.push('Dashboard Statistik')
              if (pkg.features.ranking) features.push('Ranking Supplier')
              if (pkg.features.priority) features.push('Prioritas di Pencarian')
              if (pkg.features.catalogDownload) features.push('Export Katalog PDF')
              if (pkg.features.multiLanguage) features.push('Multi-language Support')
              
              return {
                id: pkg.id,
                name: pkg.name,
                type: pkg.type,
                price: pkg.price,
                duration: pkg.duration === 'MONTHLY' ? 'bulan' : pkg.duration === 'YEARLY' ? 'tahun' : 'lifetime',
                features,
                popular: false
              }
            })
          
          setPackages(transformedPackages)
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const handleGetStarted = () => {
    if (session?.user) {
      // User already logged in, redirect to supplier onboarding
      router.push('/supplier/onboarding')
    } else {
      // Not logged in, redirect to login with callback
      router.push('/auth/login?callbackUrl=/supplier/onboarding&supplier=true')
    }
  }

  const benefits = [
    {
      icon: Building2,
      title: 'Profil Perusahaan Profesional',
      description: 'Tampilkan profil perusahaan dengan logo, banner, dan informasi lengkap'
    },
    {
      icon: Package,
      title: 'Katalog Produk Unlimited',
      description: 'Upload produk tanpa batas dengan gambar dan deskripsi detail'
    },
    {
      icon: Users,
      title: 'Jangkau Ribuan Buyer',
      description: 'Terhubung dengan komunitas eksportir dan buyer potensial'
    },
    {
      icon: MessageSquare,
      title: 'Chat Langsung dengan Buyer',
      description: 'Komunikasi real-time dengan calon pembeli melalui sistem chat'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analitik',
      description: 'Pantau performa produk, views, dan engagement'
    },
    {
      icon: Shield,
      title: 'Badge Verifikasi',
      description: 'Dapatkan badge terverifikasi setelah validasi dokumen legalitas'
    }
  ]

  const features = [
    { icon: CheckCircle, text: 'Custom URL Profil (Premium)' },
    { icon: CheckCircle, text: 'SEO Optimized Product Pages' },
    { icon: CheckCircle, text: 'Multi-language Support' },
    { icon: CheckCircle, text: 'Export Katalog PDF' },
    { icon: CheckCircle, text: 'Prioritas di Pencarian' },
    { icon: CheckCircle, text: 'Statistik Detail & Ranking' }
  ]

  const whoCanJoin = [
    {
      icon: Factory,
      title: 'Produsen & Manufaktur',
      description: 'Pabrik dan produsen yang ingin memperluas pasar ekspor'
    },
    {
      icon: Store,
      title: 'Distributor Resmi',
      description: 'Distributor resmi produk lokal yang siap ekspor'
    },
    {
      icon: Package,
      title: 'Penyedia Jasa & Ekspor',
      description: 'Perusahaan jasa dan trading ekspor'
    },
    {
      icon: Truck,
      title: 'Grosir & Retail Besar',
      description: 'Supplier grosir dengan stok produk konsisten'
    }
  ]

  const registrationSteps = [
    {
      number: '1',
      title: 'Registrasi Data',
      description: 'Daftar dengan email Gmail Anda dan lengkapi data perusahaan'
    },
    {
      number: '2',
      title: 'Verifikasi Dokumen',
      description: 'Upload dokumen legalitas perusahaan untuk verifikasi'
    },
    {
      number: '3',
      title: 'Tambah Produk',
      description: 'Upload produk pertama Anda dan mulai menjangkau buyer'
    },
    {
      number: '4',
      title: 'Mulai Berjualan',
      description: 'Terima inquiry dari buyer dan kembangkan bisnis Anda'
    }
  ]

  const whyChooseUs: WhyChooseUsSection[] = [
    {
      title: 'Marketplace Biasa',
      items: [
        { text: 'Biaya listing tinggi', checked: false },
        { text: 'Persaingan tidak sehat', checked: false },
        { text: 'Tidak ada verifikasi buyer', checked: false },
        { text: 'Fitur terbatas untuk gratis', checked: false },
        { text: 'Dukungan minim', checked: false }
      ]
    },
    {
      title: 'Ekosistem Bisnis Kami',
      highlight: true,
      items: [
        { text: 'Mulai GRATIS selamanya', checked: true },
        { text: 'Komunitas eksportir solid saling mendukung', checked: true },
        { text: 'Buyer terverifikasi dengan proses screening', checked: true },
        { text: 'Fitur lengkap bahkan untuk paket gratis', checked: true },
        { text: 'Dukungan ekspor dan komunitas', checked: true }
      ]
    }
  ]

  const faqs = [
    {
      question: 'Apakah ada biaya pendaftaran?',
      answer: 'Tidak ada biaya pendaftaran sama sekali. Kami menyediakan paket GRATIS selamanya yang sudah lengkap dengan fitur dasar untuk memulai bisnis ekspor Anda.'
    },
    {
      question: 'Dokumen apa saja yang dibutuhkan?',
      answer: 'Untuk verifikasi, Anda memerlukan: NIB (Nomor Induk Berusaha), NPWP Perusahaan, Akta Pendirian Perusahaan, dan KTP Direktur. Namun, Anda bisa mendaftar terlebih dahulu dan melengkapi dokumen secara bertahap.'
    },
    {
      question: 'Berapa lama proses verifikasi?',
      answer: 'Proses verifikasi dokumen memakan waktu 2-3 hari kerja setelah semua dokumen lengkap diupload. Anda akan mendapat notifikasi via email dan WhatsApp setelah verifikasi selesai.'
    },
    {
      question: 'Apakah bisa upgrade ke paket berbayar nanti?',
      answer: 'Tentu saja! Anda bisa memulai dengan paket GRATIS dan upgrade kapan saja sesuai kebutuhan bisnis. Kami akan memberikan notifikasi saat ada fitur premium yang cocok untuk bisnis Anda.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Bergabung dengan 500+ Supplier Terpercaya</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Tingkatkan Bisnis Anda
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Jangkau Pasar Ekspor Global
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Daftarkan perusahaan Anda di platform Eksporyuk dan terhubung dengan ribuan eksportir 
              dan buyer potensial. Mulai gratis, upgrade kapan saja.
            </p>
            
            <div className="flex justify-center">
              <a
                href="#packages"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Daftar Sekarang - GRATIS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Tanpa Biaya Bulanan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Setup 5 Menit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Support 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Kenapa Bergabung dengan Eksporyuk?
            </h2>
            <p className="text-xl text-gray-600">
              Platform terlengkap untuk supplier dan produsen lokal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Join Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Siapa yang Bisa Bergabung?
            </h2>
            <p className="text-xl text-gray-600">
              Kami menerima partner strategis yang serius ingin berkembang di pasar ekspor untuk berbagai skala bisnis, dari UMKM hingga perusahaan besar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whoCanJoin.map((item, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keuntungan Bergabung */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Keuntungan Bergabung
            </h2>
            <p className="text-xl text-gray-600">
              Nikmati berbagai manfaat eksklusif yang dirancang khusus untuk pertumbuhan bisnis eksport Anda
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Kepastian Pembayaran
              </h3>
              <p className="text-gray-600">
                Sistem pembayaran yang terpercaya dengan escrow untuk memastikan setiap transaksi aman dan pasti diterima.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Akses Pasar Luas
              </h3>
              <p className="text-gray-600">
                Dapatkan akses ke ribuan buyer potensial dari berbagai negara yang siap berbisnis dengan Anda.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-green-50 border border-green-200">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Jaminan Eksklusif
              </h3>
              <p className="text-gray-600">
                Dapatkan prioritas dalam pencarian dan ranking untuk meningkatkan visibilitas produk Anda di buyer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Process */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Proses Pendaftaran
            </h2>
            <p className="text-xl text-gray-600">
              Langkah mudah untuk memulai perjalanan ekspor bisnis Anda bersama kami
            </p>
            <Link 
              href="#" 
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Lihat Panduan Lengkap →
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {registrationSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
                {index < registrationSteps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-xl text-gray-600">
              Kami bukan sekadar marketplace, kami adalah ekosistem bisnis yang mendukung pertumbuhan Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {whyChooseUs.map((section, index) => (
              <div 
                key={index}
                className={`p-8 rounded-2xl ${
                  section.highlight 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-4 border-blue-300 shadow-2xl' 
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                {section.highlight && (
                  <div className="inline-block px-4 py-1 bg-yellow-400 text-gray-900 rounded-full text-sm font-bold mb-4">
                    PALING POPULER
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-6 ${section.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {item.checked ? (
                        <CheckCircle className={`w-6 h-6 flex-shrink-0 ${section.highlight ? 'text-green-300' : 'text-green-500'}`} />
                      ) : (
                        <div className="w-6 h-6 flex-shrink-0 rounded-full border-2 border-red-400 flex items-center justify-center">
                          <span className="text-red-400">✗</span>
                        </div>
                      )}
                      <span className={section.highlight ? 'text-blue-50' : 'text-gray-700'}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Keamanan Data Terjamin
                </h4>
                <p className="text-gray-700">
                  Kami menggunakan enkripsi SSL dan sistem keamanan berlapis untuk melindungi data perusahaan dan transaksi Anda. Privasi dan keamanan adalah prioritas utama kami.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Fitur Lengkap untuk
                <span className="block text-blue-600">Mengembangkan Bisnis</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Dapatkan semua tools yang Anda butuhkan untuk memasarkan produk dan 
                terhubung dengan buyer potensial di satu platform.
              </p>
              
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <Globe className="w-32 h-32 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Jangkau Global
                  </h3>
                  <p className="text-gray-600">
                    Ekspor ke 50+ negara dengan 1 platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="packages" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mulai Gratis Sekarang
            </h2>
            <p className="text-xl text-gray-600">
              Daftar sekarang dan dapatkan akses GRATIS untuk memulai bisnis ekspor Anda
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                className="relative rounded-3xl p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    100% GRATIS
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      Gratis Selamanya
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm mt-2">
                    Tidak perlu kartu kredit • Langsung aktif
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-300" />
                      <span className="text-blue-50">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mb-6 p-4 bg-white/10 rounded-xl">
                  <p className="text-white text-sm font-medium mb-1">
                    📧 Catatan Penting:
                  </p>
                  <p className="text-blue-100 text-xs">
                    Gunakan email <span className="font-semibold">@gmail.com</span> untuk mendaftar atau login dengan Google.
                  </p>
                </div>

                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 bg-white text-blue-600 hover:bg-gray-100 hover:scale-105 transform"
                >
                  🚀 Daftar Sekarang - GRATIS
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pertanyaan Sering Diajukan
            </h2>
            <p className="text-xl text-gray-600">
              Jawaban untuk pertanyaan umum seputar pendaftaran supplier
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Siap Tingkatkan Bisnis Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabung dengan 500+ supplier yang sudah mempercayai platform kami
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 inline-flex items-center gap-2"
          >
            Daftar Gratis Sekarang
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  )
}
