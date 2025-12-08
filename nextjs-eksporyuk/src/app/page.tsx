import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-between items-center mb-12">
            <div className="text-2xl font-bold">Eksporyuk</div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-blue-600 hover:bg-gray-100">
                  Daftar Gratis
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">
              Platform Komunitas & Membership Lengkap
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Bergabunglah dengan komunitas eksklusif, akses kelas premium, 
              dan dapatkan penghasilan melalui program affiliate kami.
            </p>
            <div className="space-x-4">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Mulai Sekarang
                </Button>
              </Link>
              <Link href="/tentang">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Pelajari Lebih Lanjut
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Komunitas Aktif</h3>
              <p className="text-gray-600">
                Bergabung dengan grup eksklusif, diskusi, dan networking dengan member lainnya.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Kelas & Kursus Premium</h3>
              <p className="text-gray-600">
                Akses ratusan kelas dan kursus dari mentor berpengalaman di berbagai bidang.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Program Affiliate</h3>
              <p className="text-gray-600">
                Dapatkan komisi hingga 30% dengan menjadi affiliate dan promosikan produk kami.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Paket Membership</h2>
          <p className="text-center text-gray-600 mb-12">Pilih paket yang sesuai dengan kebutuhan Anda</p>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">1 Bulan</h3>
              <div className="text-3xl font-bold mb-4">Rp 99K</div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ Akses semua kelas</li>
                <li>✓ Akses grup VIP</li>
                <li>✓ Event & webinar</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Pilih Paket</Button>
              </Link>
            </div>

            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">3 Bulan</h3>
              <div className="text-3xl font-bold mb-4">Rp 249K</div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ Akses semua kelas</li>
                <li>✓ Akses grup VIP</li>
                <li>✓ Event & webinar</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Pilih Paket</Button>
              </Link>
            </div>

            <div className="border-2 border-blue-600 rounded-lg p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                Paling Laris
              </div>
              <h3 className="text-lg font-semibold mb-2">6 Bulan</h3>
              <div className="text-3xl font-bold mb-4">Rp 449K</div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ Akses semua kelas</li>
                <li>✓ Akses grup VIP</li>
                <li>✓ Event & webinar</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Pilih Paket</Button>
              </Link>
            </div>

            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">12 Bulan</h3>
              <div className="text-3xl font-bold mb-4">Rp 799K</div>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ Akses semua kelas</li>
                <li>✓ Akses grup VIP</li>
                <li>✓ Event & webinar</li>
              </ul>
              <Link href="/register">
                <Button className="w-full">Pilih Paket</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Siap Memulai Perjalanan Anda?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Bergabunglah dengan ribuan member yang sudah merasakan manfaatnya
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Daftar Sekarang - Gratis!
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-white mb-4">Eksporyuk</div>
              <p className="text-sm">Platform komunitas dan membership lengkap untuk pengembangan bisnis dan karir Anda.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produk</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/membership">Membership</Link></li>
                <li><Link href="/kursus">Kursus</Link></li>
                <li><Link href="/event">Event</Link></li>
                <li><Link href="/komunitas">Komunitas</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tentang">Tentang Kami</Link></li>
                <li><Link href="/kontak">Kontak</Link></li>
                <li><Link href="/karir">Karir</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/privacy">Kebijakan Privasi</Link></li>
                <li><Link href="/terms">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 Eksporyuk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
