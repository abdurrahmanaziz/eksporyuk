'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Syarat dan Ketentuan</h1>
          <p className="text-gray-600 mt-2">Terakhir diperbarui: 25 Desember 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Penerimaan Syarat</h2>
            <p className="text-gray-700 leading-relaxed">
              Dengan mengakses dan menggunakan platform Ekspor Yuk ("Platform", "Layanan") yang tersedia di 
              <strong> eksporyuk.com</strong>, Anda menyetujui untuk terikat dengan Syarat dan Ketentuan ini. 
              Jika Anda tidak menyetujui syarat-syarat ini, mohon untuk tidak menggunakan Platform kami.
            </p>
          </section>

          {/* Description */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Deskripsi Layanan</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ekspor Yuk adalah platform membership dan komunitas yang menyediakan:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Edukasi dan pelatihan bisnis ekspor</li>
              <li>Kursus online dan webinar</li>
              <li>Database buyer dan supplier</li>
              <li>Komunitas dan networking</li>
              <li>Program affiliate</li>
              <li>Template dokumen ekspor</li>
              <li>Mentoring dan konsultasi</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Pendaftaran Akun</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">3.1 Kelayakan</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anda harus berusia minimal 18 tahun untuk membuat akun dan menggunakan layanan kami.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">3.2 Informasi Akun</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anda bertanggung jawab untuk:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Memberikan informasi yang akurat dan lengkap</li>
              <li>Menjaga kerahasiaan password Anda</li>
              <li>Semua aktivitas yang terjadi di bawah akun Anda</li>
              <li>Memberitahu kami jika ada penggunaan tidak sah</li>
            </ul>
          </section>

          {/* Membership */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Membership dan Pembayaran</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">4.1 Paket Membership</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kami menawarkan berbagai paket membership dengan harga dan fitur yang berbeda. Detail lengkap 
              tersedia di halaman pricing.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">4.2 Pembayaran</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Semua harga dalam Rupiah Indonesia (IDR)</li>
              <li>Pembayaran diproses melalui payment gateway resmi (Xendit)</li>
              <li>Membership aktif setelah pembayaran berhasil dikonfirmasi</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">4.3 Kebijakan Pengembalian Dana</h3>
            <p className="text-gray-700 leading-relaxed">
              Pembayaran membership bersifat <strong>non-refundable</strong> kecuali dalam kondisi khusus yang 
              akan dipertimbangkan secara kasus per kasus. Untuk permintaan refund, hubungi support@eksporyuk.com 
              dalam waktu 7 hari setelah pembelian.
            </p>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Kode Etik Pengguna</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anda setuju untuk <strong>tidak</strong> melakukan hal-hal berikut:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Membagikan akun atau kredensial login dengan orang lain</li>
              <li>Mendistribusikan ulang konten premium tanpa izin</li>
              <li>Melakukan aktivitas penipuan atau penyalahgunaan sistem</li>
              <li>Mengirim spam atau materi promosi yang tidak diminta</li>
              <li>Melanggar hak kekayaan intelektual pihak lain</li>
              <li>Mengunggah konten ilegal, berbahaya, atau menyinggung</li>
              <li>Mencoba meretas atau mengganggu sistem platform</li>
              <li>Menggunakan bot atau scraper tanpa izin</li>
            </ul>
          </section>

          {/* Affiliate Program */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Program Affiliate</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">6.1 Pendaftaran</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Program affiliate terbuka untuk member yang memenuhi syarat. Pendaftaran dapat disetujui atau 
              ditolak atas kebijakan kami.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">6.2 Komisi</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Komisi dihitung berdasarkan persentase atau nilai tetap per produk</li>
              <li>Komisi masuk ke wallet setelah transaksi berhasil</li>
              <li>Penarikan minimal dan jadwal diatur dalam dashboard affiliate</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">6.3 Larangan Affiliate</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Membeli melalui link sendiri (self-referral)</li>
              <li>Menggunakan iklan berbayar dengan brand "Ekspor Yuk" tanpa izin</li>
              <li>Membuat klaim palsu atau menyesatkan tentang layanan</li>
              <li>Cookie stuffing atau manipulasi tracking</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Hak Kekayaan Intelektual</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">7.1 Konten Platform</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Semua konten di platform, termasuk teks, grafik, logo, video, kursus, dan materi lainnya, 
              adalah milik Ekspor Yuk atau pemberi lisensi kami dan dilindungi oleh hukum hak cipta.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">7.2 Lisensi Terbatas</h3>
            <p className="text-gray-700 leading-relaxed">
              Dengan membership aktif, Anda diberikan lisensi terbatas, non-eksklusif, dan tidak dapat 
              dipindahtangankan untuk mengakses dan menggunakan konten untuk keperluan pribadi dan edukasi.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Disclaimer</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">8.1 Tidak Ada Jaminan Hasil</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Konten edukasi dan informasi yang kami berikan bersifat informatif. Kami <strong>tidak menjamin</strong> 
              hasil bisnis, pendapatan, atau keberhasilan ekspor tertentu. Hasil bergantung pada berbagai faktor 
              termasuk usaha, kondisi pasar, dan keputusan bisnis Anda sendiri.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">8.2 Layanan "Sebagaimana Adanya"</h3>
            <p className="text-gray-700 leading-relaxed">
              Platform disediakan "sebagaimana adanya" tanpa jaminan apapun, baik tersurat maupun tersirat, 
              termasuk jaminan kelayakan untuk tujuan tertentu.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Batasan Tanggung Jawab</h2>
            <p className="text-gray-700 leading-relaxed">
              Dalam kondisi apapun, Ekspor Yuk, direktur, karyawan, atau afiliasinya tidak bertanggung jawab 
              atas kerusakan tidak langsung, insidental, khusus, konsekuensial, atau punitif, termasuk kehilangan 
              keuntungan, data, atau goodwill, yang timbul dari penggunaan atau ketidakmampuan menggunakan platform.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Penghentian</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kami berhak untuk menangguhkan atau menghentikan akses Anda ke platform kapan saja, dengan atau 
              tanpa pemberitahuan, jika:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Melanggar Syarat dan Ketentuan ini</li>
              <li>Terlibat dalam aktivitas penipuan</li>
              <li>Melakukan tindakan yang merugikan pengguna lain atau platform</li>
              <li>Atas keputusan kami sendiri</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Hukum yang Berlaku</h2>
            <p className="text-gray-700 leading-relaxed">
              Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. 
              Setiap sengketa yang timbul akan diselesaikan secara musyawarah, dan jika tidak tercapai, 
              melalui pengadilan yang berwenang di Indonesia.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Perubahan Syarat</h2>
            <p className="text-gray-700 leading-relaxed">
              Kami dapat memodifikasi Syarat dan Ketentuan ini kapan saja. Perubahan material akan diberitahukan 
              melalui email atau notifikasi platform. Penggunaan berkelanjutan setelah perubahan berarti Anda 
              menerima syarat yang diperbarui.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Hubungi Kami</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Ekspor Yuk</strong></p>
              <p className="text-gray-700">Email: support@eksporyuk.com</p>
              <p className="text-gray-700">Website: https://eksporyuk.com</p>
            </div>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2025 Ekspor Yuk. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy-policy" className="text-orange-600 hover:text-orange-700">
              Kebijakan Privasi
            </Link>
            <span>|</span>
            <Link href="/" className="text-orange-600 hover:text-orange-700">
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
