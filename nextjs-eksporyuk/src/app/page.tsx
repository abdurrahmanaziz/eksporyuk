import Link from 'next/link'
import { prisma } from '@/lib/prisma'

// Types for SalesPageSettings JSON fields
interface Feature {
  icon: string
  title: string
  description: string
}

interface Testimonial {
  name: string
  role: string
  content: string
  avatar: string
}

interface FAQ {
  question: string
  answer: string
}

interface CtaStat {
  value: string
  label: string
}

interface MembershipPlan {
  id: string
  name: string
  price: number
  isPopular?: boolean
}

// Fetch settings from database
async function getSalesPageSettings() {
  try {
    let settings = await prisma.salesPageSettings.findFirst()
    
    // Return default if no settings exist
    if (!settings) {
      return {
        heroTitle: 'Belajar Ekspor Mudah dan Praktis di Komunitas',
        heroHighlight: 'Mudah dan Praktis',
        heroDescription: 'Dibimbing langsung oleh praktisi ekspor berpengalaman. Mulai dari persiapan dokumen, mencari buyer, hingga pengiriman barang ke luar negeri.',
        heroBadgeText: '7,000+ Calon Eksportir Bergabung',
        heroCtaText: 'Mulai Belajar Sekarang',
        heroCtaSecondaryText: 'Lihat Fitur',
        navbarLogoText: 'Eksporyuk',
        navbarCtaText: 'Gabung Komunitas',
        featuresTitle: 'Semua yang Anda Butuhkan untuk Sukses Ekspor',
        featuresSubtitle: 'Platform lengkap untuk belajar dan praktik ekspor dengan bimbingan mentor berpengalaman',
        featuresData: [
          { icon: '📚', title: 'Belajar & Praktek', description: 'Dibimbing langkah demi langkah, mulai dari persiapan dokumen, mencari buyer, hingga pengiriman.' },
          { icon: '💬', title: 'Konsultasi Online & Offline', description: 'Dapatkan bimbingan langsung dari praktisi ekspor berpengalaman kapanpun Anda butuh.' },
          { icon: '👥', title: 'Komunitas Solid', description: 'Bergabung dengan ribuan eksportir dan calon eksportir untuk berbagi pengalaman dan peluang.' },
          { icon: '📋', title: 'Prosedur yang Benar', description: 'Pelajari prosedur ekspor yang sesuai standar internasional dan regulasi Indonesia.' },
          { icon: '🏆', title: 'Sertifikat Kelulusan', description: 'Dapatkan sertifikat resmi setelah menyelesaikan program pembelajaran ekspor.' },
          { icon: '🌍', title: 'Akses Materi Global', description: 'Materi pembelajaran yang selalu diupdate sesuai perkembangan pasar ekspor global.' },
        ],
        pricingTitle: 'Pilih Paket Membership Anda',
        pricingSubtitle: 'Investasi terbaik untuk masa depan bisnis ekspor Anda',
        pricingShowFromDb: true,
        testimonialsTitle: 'Apa Kata Mereka?',
        testimonialsSubtitle: 'Kisah sukses dari member yang telah berhasil ekspor',
        testimonialsData: [
          { name: 'Budi Santoso', role: 'Eksportir Furniture', content: 'Awalnya saya ragu bisa ekspor karena tidak punya pengalaman. Tapi berkat bimbingan mentor di Eksporyuk, saya berhasil kirim 1 kontainer furniture ke Dubai bulan lalu!', avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=0D8ABC&color=fff' },
          { name: 'Siti Rahmawati', role: 'Pengusaha Kerajinan', content: 'Materi yang diajarkan sangat praktis dan mudah dipahami. Komunitasnya juga sangat supportif, kita bisa sharing kendala dan dapat solusi cepat.', avatar: 'https://ui-avatars.com/api/?name=Siti+Rahmawati&background=9333ea&color=fff' },
          { name: 'Ahmad Fauzi', role: 'Eksportir Makanan', content: 'Investasi terbaik untuk bisnis saya. Modul tentang regulasi ekspor makanan sangat membantu saya menembus pasar Jepang yang ketat.', avatar: 'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=16a34a&color=fff' },
        ],
        faqTitle: 'Pertanyaan yang Sering Ditanyakan',
        faqData: [
          { question: 'Apakah pemula bisa ikut kelas ini?', answer: 'Sangat bisa! Materi kami disusun dari dasar (nol) hingga mahir. Anda akan dibimbing langkah demi langkah mulai dari riset produk, mencari buyer, hingga pengiriman.' },
          { question: 'Apakah harus punya produk sendiri untuk ekspor?', answer: 'Tidak harus. Di komunitas Eksporyuk, kami mengajarkan cara menjadi trader ekspor (menjual produk orang lain/supplier) sehingga Anda bisa mulai tanpa harus produksi sendiri.' },
          { question: 'Apakah ada bimbingan sampai closing?', answer: 'Ya, kami menyediakan grup diskusi dan sesi konsultasi rutin dengan mentor. Anda bisa bertanya kapan saja jika menemui kendala dalam proses ekspor Anda.' },
          { question: 'Berapa lama akses materinya?', answer: 'Akses materi berlaku sesuai paket yang Anda ambil (1 bulan, 3 bulan, 6 bulan, atau 12 bulan). Selama masa aktif, Anda bebas mengakses semua materi dan update terbaru.' },
          { question: 'Apakah dijamin pasti berhasil ekspor?', answer: 'Keberhasilan tergantung pada ketekunan Anda mempraktekkan materi. Namun, kami memberikan roadmap yang sudah terbukti berhasil mencetak ribuan eksportir baru.' },
        ],
        ctaTitle: 'Siap Memulai Perjalanan Ekspor Anda?',
        ctaDescription: 'Bergabung sekarang dan dapatkan akses ke materi ekslusif serta bimbingan dari mentor berpengalaman.',
        ctaButtonText: 'Gabung Komunitas Sekarang!',
        ctaStats: [
          { value: '7,000+', label: 'Member Aktif' },
          { value: '50+', label: 'Materi Lengkap' },
          { value: '5', label: 'Mentor Expert' },
        ],
        footerDescription: 'Platform edukasi ekspor #1 di Indonesia untuk membantu UMKM go international.',
        footerEmail: 'info@eksporyuk.com',
        footerPhone: '+62 812-3456-7890',
      }
    }
    
    return settings
  } catch (error) {
    console.error('Error fetching sales page settings:', error)
    // Return null to indicate fetch failed - will use defaults in component
    return null
  }
}

// Fetch membership packages for pricing section
async function getMembershipPackages() {
  try {
    const memberships = await prisma.membership.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        isPopular: true,
      }
    })
    return memberships
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return []
  }
}

export default async function HomePage() {
  const settings = await getSalesPageSettings()
  const memberships = await getMembershipPackages()
  
  // Parse JSON fields with defaults
  const features: Feature[] = (settings?.featuresData as Feature[]) || []
  const testimonials: Testimonial[] = (settings?.testimonialsData as Testimonial[]) || []
  const faqs: FAQ[] = (settings?.faqData as FAQ[]) || []
  const ctaStats: CtaStat[] = (settings?.ctaStats as CtaStat[]) || []
  
  // Determine pricing data source
  const useMembershipFromDb = settings?.pricingShowFromDb !== false
  const pricingPlans = useMembershipFromDb ? memberships : (settings?.pricingCustomData as MembershipPlan[] || [])
  
  // Helper to format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price)
  }

  return (
    <div className="min-h-screen bg-white font-poppins">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-content">
            <Link href="/" className="nav-logo">
              <div className="nav-logo-icon">
                <span>E</span>
              </div>
              <span className="nav-logo-text">
                {settings?.navbarLogoText || 'Eksporyuk'}
              </span>
            </Link>
            
            <div className="nav-links">
              <a href="#features" className="nav-link">Fitur</a>
              <a href="#pricing" className="nav-link">Harga</a>
              <a href="#testimonials" className="nav-link">Testimoni</a>
              <a href="#faq" className="nav-link">FAQ</a>
            </div>
            
            <div className="nav-actions">
              <Link href="/auth/login" className="btn btn-ghost">
                Masuk
              </Link>
              <a href="#pricing" className="btn btn-primary">
                {settings?.navbarCtaText || 'Gabung Komunitas'}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span className="hero-badge-text">{settings?.heroBadgeText || '7,000+ Calon Eksportir Bergabung'}</span>
            </div>
            
            <h1 className="hero-title">
              {settings?.heroTitle?.split(settings?.heroHighlight || '')[0]}
              <span className="hero-highlight">
                {settings?.heroHighlight || 'Mudah dan Praktis'}
              </span>
              {settings?.heroTitle?.split(settings?.heroHighlight || '')[1] || ' di Komunitas'}
            </h1>
            
            <p className="hero-description">
              {settings?.heroDescription || 'Dibimbing langsung oleh praktisi ekspor berpengalaman. Mulai dari persiapan dokumen, mencari buyer, hingga pengiriman barang ke luar negeri.'}
            </p>
            
            <div className="hero-actions">
              <a href="#pricing" className="btn-hero-primary">
                {settings?.heroCtaText || 'Mulai Belajar Sekarang'}
              </a>
              <a href="#features" className="btn-hero-secondary">
                {settings?.heroCtaSecondaryText || 'Lihat Fitur'}
              </a>
            </div>
          </div>
          
          {/* Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl shadow-blue-500/20 border border-gray-200 overflow-hidden max-w-5xl mx-auto transform hover:scale-[1.01] transition-transform duration-500">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-sm text-gray-500 font-mono">dashboard.eksporyuk.com</div>
              </div>
              <div className="p-8 bg-slate-50 min-h-[400px] relative overflow-hidden">
                {/* Sidebar Mockup */}
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 p-6 hidden md:block">
                  <div className="space-y-4">
                    <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="space-y-2 mt-8">
                      <div className="h-10 w-full bg-blue-50 text-blue-600 rounded-lg flex items-center px-4 font-medium text-sm">Dashboard</div>
                      <div className="h-10 w-full hover:bg-gray-50 rounded-lg flex items-center px-4 text-gray-500 text-sm">Materi Belajar</div>
                      <div className="h-10 w-full hover:bg-gray-50 rounded-lg flex items-center px-4 text-gray-500 text-sm">Komunitas</div>
                      <div className="h-10 w-full hover:bg-gray-50 rounded-lg flex items-center px-4 text-gray-500 text-sm">Sertifikat</div>
                    </div>
                  </div>
                </div>
                
                {/* Main Content Mockup */}
                <div className="md:ml-64 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
                        <div className="h-8 w-12 bg-blue-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart Area */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-end justify-between gap-2">
                    {[40, 60, 45, 70, 50, 80, 65, 85, 75, 90, 60, 95].map((h, i) => (
                      <div key={i} className="w-full bg-blue-500/10 rounded-t-lg relative group">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg transition-all duration-1000 ease-out"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 w-32 bg-gray-100 rounded" />
                      <div className="h-5 w-20 bg-green-100 text-green-600 text-xs rounded-full flex items-center justify-center">Live Update</div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100" />
                          <div className="flex-1">
                            <div className="h-3 w-48 bg-gray-100 rounded mb-1" />
                            <div className="h-2 w-24 bg-gray-50 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute top-10 right-10 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce duration-[3000ms]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">👑</div>
                    <div>
                      <div className="text-xs text-gray-500">Status Member</div>
                      <div className="font-bold text-gray-900">Premium Aktif</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Fitur Unggulan</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">{settings?.featuresTitle || 'Semua yang Anda Butuhkan untuk Sukses Ekspor'}</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">{settings?.featuresSubtitle || 'Platform lengkap untuk belajar dan praktik ekspor dengan bimbingan mentor berpengalaman'}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(features.length > 0 ? features : [
              { icon: '📚', title: 'Belajar & Praktek', description: 'Dibimbing langkah demi langkah, mulai dari persiapan dokumen, mencari buyer, hingga pengiriman.' },
              { icon: '💬', title: 'Konsultasi Online & Offline', description: 'Dapatkan bimbingan langsung dari praktisi ekspor berpengalaman kapanpun Anda butuh.' },
              { icon: '👥', title: 'Komunitas Solid', description: 'Bergabung dengan ribuan eksportir dan calon eksportir untuk berbagi pengalaman dan peluang.' },
              { icon: '📋', title: 'Prosedur yang Benar', description: 'Pelajari prosedur ekspor yang sesuai standar internasional dan regulasi Indonesia.' },
              { icon: '🏆', title: 'Sertifikat Kelulusan', description: 'Dapatkan sertifikat resmi setelah menyelesaikan program pembelajaran ekspor.' },
              { icon: '🌍', title: 'Akses Materi Global', description: 'Materi pembelajaran yang selalu diupdate sesuai perkembangan pasar ekspor global.' },
            ]).map((feature, i) => (
              <div key={i} className="group p-8 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-100 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Pilihan Paket</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">{settings?.pricingTitle || 'Pilih Paket Membership Anda'}</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">{settings?.pricingSubtitle || 'Investasi terbaik untuk masa depan bisnis ekspor Anda'}</p>
          </div>
          
          <div className={`grid gap-6 ${pricingPlans.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
            {(pricingPlans.length > 0 ? pricingPlans : [
              { id: '1', name: '1 Bulan', price: 299000, isPopular: false },
              { id: '2', name: '3 Bulan', price: 699000, isPopular: false },
              { id: '3', name: '6 Bulan', price: 1199000, isPopular: true },
              { id: '4', name: '12 Bulan', price: 1999000, isPopular: false },
            ]).map((plan) => (
              <div key={plan.id} className={`relative p-8 bg-white rounded-2xl border ${plan.isPopular ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-gray-200 shadow-lg'} transition-all hover:shadow-xl`}>
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Paling Populer
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-sm text-gray-500">Rp</span>
                  <span className="text-4xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Akses semua materi</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Konsultasi dengan mentor</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Akses grup komunitas</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Sertifikat kelulusan</li>
                </ul>
                <Link href="/register" className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${plan.isPopular ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  Pilih Paket
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Testimoni</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">{settings?.testimonialsTitle || 'Apa Kata Mereka?'}</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">{settings?.testimonialsSubtitle || 'Kisah sukses dari member yang telah berhasil ekspor'}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {(testimonials.length > 0 ? testimonials : [
              { name: 'Budi Santoso', role: 'Eksportir Furniture', content: 'Awalnya saya ragu bisa ekspor karena tidak punya pengalaman. Tapi berkat bimbingan mentor di Eksporyuk, saya berhasil kirim 1 kontainer furniture ke Dubai bulan lalu!', avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=0D8ABC&color=fff' },
              { name: 'Siti Rahmawati', role: 'Pengusaha Kerajinan', content: 'Materi yang diajarkan sangat praktis dan mudah dipahami. Komunitasnya juga sangat supportif, kita bisa sharing kendala dan dapat solusi cepat.', avatar: 'https://ui-avatars.com/api/?name=Siti+Rahmawati&background=9333ea&color=fff' },
              { name: 'Ahmad Fauzi', role: 'Eksportir Makanan', content: 'Investasi terbaik untuk bisnis saya. Modul tentang regulasi ekspor makanan sangat membantu saya menembus pasar Jepang yang ketat.', avatar: 'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=16a34a&color=fff' },
            ]).map((testimonial, i) => (
              <div key={i} className="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed italic">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full shadow-sm"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">{settings?.faqTitle || 'Pertanyaan yang Sering Ditanyakan'}</h2>
          </div>
          
          <div className="space-y-4">
            {(faqs.length > 0 ? faqs : [
              { question: 'Apakah pemula bisa ikut kelas ini?', answer: 'Sangat bisa! Materi kami disusun dari dasar (nol) hingga mahir. Anda akan dibimbing langkah demi langkah mulai dari riset produk, mencari buyer, hingga pengiriman.' },
              { question: 'Apakah harus punya produk sendiri untuk ekspor?', answer: 'Tidak harus. Di komunitas Eksporyuk, kami mengajarkan cara menjadi trader ekspor (menjual produk orang lain/supplier) sehingga Anda bisa mulai tanpa harus produksi sendiri.' },
              { question: 'Apakah ada bimbingan sampai closing?', answer: 'Ya, kami menyediakan grup diskusi dan sesi konsultasi rutin dengan mentor. Anda bisa bertanya kapan saja jika menemui kendala dalam proses ekspor Anda.' },
              { question: 'Berapa lama akses materinya?', answer: 'Akses materi berlaku sesuai paket yang Anda ambil (1 bulan, 3 bulan, 6 bulan, atau 12 bulan). Selama masa aktif, Anda bebas mengakses semua materi dan update terbaru.' },
              { question: 'Apakah dijamin pasti berhasil ekspor?', answer: 'Keberhasilan tergantung pada ketekunan Anda mempraktekkan materi. Namun, kami memberikan roadmap yang sudah terbukti berhasil mencetak ribuan eksportir baru.' },
            ]).map((faq, i) => (
              <div key={i} className="p-6 bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{settings?.ctaTitle || 'Siap Memulai Perjalanan Ekspor Anda?'}</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">{settings?.ctaDescription || 'Bergabung sekarang dan dapatkan akses ke materi ekslusif serta bimbingan dari mentor berpengalaman.'}</p>
          <a href="#pricing" className="inline-block px-10 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
            {settings?.ctaButtonText || 'Gabung Komunitas Sekarang!'}
          </a>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
            {(ctaStats.length > 0 ? ctaStats : [
              { value: '7,000+', label: 'Member Aktif' },
              { value: '50+', label: 'Materi Lengkap' },
              { value: '5', label: 'Mentor Expert' },
            ]).map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-white">{settings?.navbarLogoText || 'Eksporyuk'}</span>
              </Link>
              <p className="text-sm leading-relaxed">{settings?.footerDescription || 'Platform edukasi ekspor #1 di Indonesia untuk membantu UMKM go international.'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Menu</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Harga</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimoni</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: {settings?.footerEmail || 'info@eksporyuk.com'}</li>
                <li>WhatsApp: {settings?.footerPhone || '+62 812-3456-7890'}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} {settings?.navbarLogoText || 'Eksporyuk'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
