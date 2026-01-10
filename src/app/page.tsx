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

// Default settings
const defaultSettings = {
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

// Fetch settings from database
async function getSalesPageSettings() {
  try {
    const settings = await prisma.salesPageSettings.findFirst()
    return settings || defaultSettings
  } catch (error) {
    console.error('Error fetching sales page settings:', error)
    return defaultSettings
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="features-container">
          <div className="features-header">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Fitur Unggulan</span>
            <h2 className="features-title">{settings?.featuresTitle || 'Semua yang Anda Butuhkan untuk Sukses Ekspor'}</h2>
            <p className="features-subtitle">{settings?.featuresSubtitle || 'Platform lengkap untuk belajar dan praktik ekspor dengan bimbingan mentor berpengalaman'}</p>
          </div>
          
          <div className="features-grid">
            {(features.length > 0 ? features : [
              { icon: '📚', title: 'Belajar & Praktek', description: 'Dibimbing langkah demi langkah, mulai dari persiapan dokumen, mencari buyer, hingga pengiriman.' },
              { icon: '💬', title: 'Konsultasi Online & Offline', description: 'Dapatkan bimbingan langsung dari praktisi ekspor berpengalaman kapanpun Anda butuh.' },
              { icon: '👥', title: 'Komunitas Solid', description: 'Bergabung dengan ribuan eksportir dan calon eksportir untuk berbagi pengalaman dan peluang.' },
              { icon: '📋', title: 'Prosedur yang Benar', description: 'Pelajari prosedur ekspor yang sesuai standar internasional dan regulasi Indonesia.' },
              { icon: '🏆', title: 'Sertifikat Kelulusan', description: 'Dapatkan sertifikat resmi setelah menyelesaikan program pembelajaran ekspor.' },
              { icon: '🌍', title: 'Akses Materi Global', description: 'Materi pembelajaran yang selalu diupdate sesuai perkembangan pasar ekspor global.' },
            ]).map((feature, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="pricing-container">
          <div className="pricing-header">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Pilihan Paket</span>
            <h2 className="pricing-title">{settings?.pricingTitle || 'Pilih Paket Membership Anda'}</h2>
            <p className="pricing-subtitle">{settings?.pricingSubtitle || 'Investasi terbaik untuk masa depan bisnis ekspor Anda'}</p>
          </div>
          
          <div className="pricing-grid">
            {(pricingPlans.length > 0 ? pricingPlans : [
              { id: '1', name: '1 Bulan', price: 299000, isPopular: false },
              { id: '2', name: '3 Bulan', price: 699000, isPopular: false },
              { id: '3', name: '6 Bulan', price: 1199000, isPopular: true },
              { id: '4', name: '12 Bulan', price: 1999000, isPopular: false },
            ]).map((plan) => (
              <div key={plan.id} className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}>
                <h3 className="pricing-name">{plan.name}</h3>
                <div className="pricing-price">Rp {formatPrice(plan.price)}</div>
                <div className="pricing-period">Sekali bayar</div>
                <ul className="pricing-features">
                  <li>Akses semua materi</li>
                  <li>Konsultasi dengan mentor</li>
                  <li>Akses grup komunitas</li>
                  <li>Sertifikat kelulusan</li>
                </ul>
                <Link href="/register" className="pricing-cta">
                  Pilih Paket
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="testimonials-container">
          <div className="testimonials-header">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Testimoni</span>
            <h2 className="testimonials-title">{settings?.testimonialsTitle || 'Apa Kata Mereka?'}</h2>
            <p className="testimonials-subtitle">{settings?.testimonialsSubtitle || 'Kisah sukses dari member yang telah berhasil ekspor'}</p>
          </div>
          
          <div className="testimonials-grid">
            {(testimonials.length > 0 ? testimonials : [
              { name: 'Budi Santoso', role: 'Eksportir Furniture', content: 'Awalnya saya ragu bisa ekspor karena tidak punya pengalaman. Tapi berkat bimbingan mentor di Eksporyuk, saya berhasil kirim 1 kontainer furniture ke Dubai bulan lalu!', avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=0D8ABC&color=fff' },
              { name: 'Siti Rahmawati', role: 'Pengusaha Kerajinan', content: 'Materi yang diajarkan sangat praktis dan mudah dipahami. Komunitasnya juga sangat supportif, kita bisa sharing kendala dan dapat solusi cepat.', avatar: 'https://ui-avatars.com/api/?name=Siti+Rahmawati&background=9333ea&color=fff' },
              { name: 'Ahmad Fauzi', role: 'Eksportir Makanan', content: 'Investasi terbaik untuk bisnis saya. Modul tentang regulasi ekspor makanan sangat membantu saya menembus pasar Jepang yang ketat.', avatar: 'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=16a34a&color=fff' },
            ]).map((testimonial, i) => (
              <div key={i} className="testimonial-card">
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="faq-container">
          <div className="faq-header">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="faq-title">{settings?.faqTitle || 'Pertanyaan yang Sering Ditanyakan'}</h2>
          </div>
          
          <div className="space-y-4">
            {(faqs.length > 0 ? faqs : [
              { question: 'Apakah pemula bisa ikut kelas ini?', answer: 'Sangat bisa! Materi kami disusun dari dasar (nol) hingga mahir. Anda akan dibimbing langkah demi langkah mulai dari riset produk, mencari buyer, hingga pengiriman.' },
              { question: 'Apakah harus punya produk sendiri untuk ekspor?', answer: 'Tidak harus. Di komunitas Eksporyuk, kami mengajarkan cara menjadi trader ekspor (menjual produk orang lain/supplier) sehingga Anda bisa mulai tanpa harus produksi sendiri.' },
              { question: 'Apakah ada bimbingan sampai closing?', answer: 'Ya, kami menyediakan grup diskusi dan sesi konsultasi rutin dengan mentor. Anda bisa bertanya kapan saja jika menemui kendala dalam proses ekspor Anda.' },
              { question: 'Berapa lama akses materinya?', answer: 'Akses materi berlaku sesuai paket yang Anda ambil (1 bulan, 3 bulan, 6 bulan, atau 12 bulan). Selama masa aktif, Anda bebas mengakses semua materi dan update terbaru.' },
              { question: 'Apakah dijamin pasti berhasil ekspor?', answer: 'Keberhasilan tergantung pada ketekunan Anda mempraktekkan materi. Namun, kami memberikan roadmap yang sudah terbukti berhasil mencetak ribuan eksportir baru.' },
            ]).map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-question">{faq.question}</button>
                <div className="faq-answer">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0066CC 0%, #0052CC 100%)'}}>
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
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0066CC, #0052CC)'}}>
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-xl font-bold">{settings?.navbarLogoText || 'Eksporyuk'}</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">{settings?.footerDescription || 'Platform edukasi ekspor #1 di Indonesia untuk membantu UMKM go international.'}</p>
              <div className="space-y-2">
                <p className="text-gray-400">
                  <span className="inline-block mr-2">📧</span>
                  {settings?.footerEmail || 'info@eksporyuk.com'}
                </p>
                <p className="text-gray-400">
                  <span className="inline-block mr-2">📞</span>
                  {settings?.footerPhone || '+62 812-3456-7890'}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Perusahaan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bantuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
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
}