'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Lock, 
  Smartphone, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  Shield,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function MigrationPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [csWhatsapp, setCsWhatsapp] = useState<string>('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/payment')
        if (response.ok) {
          const data = await response.json()
          setCsWhatsapp(data.data?.customerServiceWhatsApp || '')
        }
      } catch (error) {
        console.error('Failed to fetch CS WhatsApp:', error)
      }
    }
    fetchSettings()
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      question: "Apakah data saya aman setelah migrasi?",
      answer: "Ya, 100% aman! Semua data membership dan transaksi Anda sudah otomatis ter-migrasi ke platform baru. Kami menggunakan sistem enkripsi dan backup yang aman."
    },
    {
      question: "Password saya tidak berfungsi, bagaimana?",
      answer: "Gunakan fitur 'Lupa Password' di halaman login. Anda akan menerima email untuk reset password. Pastikan email yang Anda gunakan sama dengan yang terdaftar sebelumnya."
    },
    {
      question: "Apakah membership saya masih aktif?",
      answer: "Ya! Masa aktif membership Anda tetap sesuai jadwal. Tidak ada perubahan pada durasi atau benefits membership Anda. Cek status di menu Dashboard setelah login."
    },
    {
      question: "Saldo komisi dan wallet saya bagaimana?",
      answer: "Semua saldo Anda tetap aman dan sudah ter-migrasi. Anda bisa langsung cek di menu 'Wallet' setelah login. Tidak ada pengurangan atau perubahan nilai."
    },
    {
      question: "Apakah ada fitur yang berubah atau hilang?",
      answer: "Semua fitur utama tetap ada bahkan ditingkatkan! Beberapa menu mungkin berpindah lokasi, tapi semua fungsi masih bisa diakses. Lihat panduan di halaman ini untuk navigasi baru."
    },
    {
      question: "Bagaimana jika saya mengalami masalah saat login?",
      answer: `Hubungi tim support kami via WhatsApp (${csWhatsapp ? csWhatsapp : '+62 857-1912-5758'}) atau email (support@eksporyuk.com). Kami siap membantu Anda 24/7.`
    }
  ]

  const newFeatures = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Komunitas Interaktif",
      description: "Bergabunglah dalam diskusi, ajukan pertanyaan, dan berkolaborasi dengan sesama anggota.",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Materi Eksklusif",
      description: "Akses kursus, webinar, dan konten premium yang dirancang untuk kesuksesan ekspor Anda.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Event & Networking",
      description: "Ikuti acara online dan offline untuk memperluas jaringan dan pengetahuan Anda.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Keamanan Terjamin",
      description: "Keamanan berlapis dengan enkripsi data untuk melindungi akun dan privasi Anda.",
      color: "from-purple-500 to-pink-500"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-6 py-2 rounded-full mb-6 border border-blue-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-sm">Platform Baru Sudah Live!</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Selamat Datang di <br/>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Eksporyuk Platform Baru
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Platform edukasi ekspor yang lebih modern, cepat, dan powerful untuk mendukung kesuksesan bisnis Anda
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/auth/login"
                className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Login Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href="#panduan"
                className="flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-blue-300 transition-all"
              >
                Lihat Panduan
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ✨ Fitur Baru yang Lebih Powerful
            </h2>
            <p className="text-lg text-gray-600">
              Upgrade besar-besaran untuk pengalaman yang lebih baik
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newFeatures.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section id="panduan" className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🚀 Panduan Login Platform Baru
            </h2>
            <p className="text-lg text-gray-600">
              Ikuti langkah mudah ini untuk mulai menggunakan platform baru
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-blue-500">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ExternalLink className="w-6 h-6 text-blue-600" />
                      Buka Platform Baru
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      Akses platform baru melalui browser favorit Anda (Chrome, Firefox, Safari, atau Edge)
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">URL Platform Baru:</p>
                      <a 
                        href="https://eksporyuk.com" 
                        target="_blank"
                        className="text-lg font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                      >
                        eksporyuk.com
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-purple-500">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-purple-600" />
                      Masukkan Email Anda
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      Gunakan email yang sama dengan akun lama Anda. Sistem akan otomatis mengenali akun Anda.
                    </p>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">Contoh:</p>
                      <code className="text-purple-700 font-mono">nama.anda@email.com</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-green-500">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Lock className="w-6 h-6 text-green-600" />
                      Masukkan Password
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      Gunakan password lama Anda. Jika lupa, klik tombol "Lupa Password" untuk reset.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">Password Anda <strong>tetap sama</strong> seperti platform lama</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">Jika lupa, gunakan fitur <strong>"Lupa Password"</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-orange-500">
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-orange-600" />
                      Selamat! Anda Berhasil Login
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      Setelah login, Anda akan langsung masuk ke dashboard dengan semua data Anda yang sudah ter-migrasi.
                    </p>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Yang bisa Anda lakukan:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>✓ Cek status membership</li>
                        <li>✓ Akses materi dan kursus yang Anda ikuti</li>
                        <li>✓ Bergabung di grup diskusi komunitas</li>
                        <li>✓ Eksplorasi fitur-fitur baru yang lebih powerful</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-l-4 border-red-500 rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">⚠️ Informasi Penting</h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Akun Anda sudah <strong>otomatis ter-migrasi</strong> ke platform baru</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Semua data membership, transaksi, dan saldo wallet <strong>tetap aman</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Masa aktif membership Anda <strong>tidak berubah</strong></p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p>Tidak ada biaya tambahan atau perubahan harga untuk migrasi ini</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ❓ Pertanyaan yang Sering Ditanyakan
              </h2>
              <p className="text-lg text-gray-600">
                Temukan jawaban untuk pertanyaan umum tentang migrasi platform
              </p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">{faq.question}</span>
                    </div>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <div className="pl-10 text-gray-600 leading-relaxed border-l-2 border-blue-200 ml-3">
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Smartphone className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Butuh Bantuan?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Tim support kami siap membantu Anda 24/7
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href={csWhatsapp ? `https://wa.me/${csWhatsapp.replace(/\D/g, '')}` : '#'}
                target="_blank"
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all group"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Smartphone className="w-6 h-6" />
                  <span className="text-xl font-bold">WhatsApp Support</span>
                </div>
                <p className="text-white/80 mb-3">Chat langsung dengan tim kami</p>
                <p className="text-2xl font-bold">{csWhatsapp || '+62 812-3456-7890'}</p>
              </a>
              
              <a 
                href="mailto:support@eksporyuk.com"
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all group"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Mail className="w-6 h-6" />
                  <span className="text-xl font-bold">Email Support</span>
                </div>
                <p className="text-white/80 mb-3">Kirim pertanyaan detail via email</p>
                <p className="text-xl font-bold">support@eksporyuk.com</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Siap Memulai Perjalanan Baru?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Login sekarang dan rasakan pengalaman platform yang lebih powerful
            </p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              Login ke Platform Baru
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
