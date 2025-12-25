'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Kebijakan Privasi</h1>
          <p className="text-gray-600 mt-2">Terakhir diperbarui: 25 Desember 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Pendahuluan</h2>
            <p className="text-gray-700 leading-relaxed">
              Selamat datang di Ekspor Yuk ("kami", "kita", atau "Platform"). Kami berkomitmen untuk melindungi privasi Anda. 
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi 
              informasi pribadi Anda ketika Anda menggunakan platform kami di <strong>eksporyuk.com</strong>.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Informasi yang Kami Kumpulkan</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kami mengumpulkan beberapa jenis informasi untuk memberikan layanan yang lebih baik kepada Anda:
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Informasi yang Anda Berikan</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Nama lengkap dan nama pengguna</li>
              <li>Alamat email</li>
              <li>Nomor telepon/WhatsApp</li>
              <li>Foto profil</li>
              <li>Informasi pembayaran (diproses secara aman oleh payment gateway)</li>
              <li>Data bisnis ekspor (jika Anda adalah supplier)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Informasi dari Login Sosial</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Jika Anda login menggunakan Google atau Facebook, kami menerima:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Nama profil publik Anda</li>
              <li>Alamat email yang terkait dengan akun tersebut</li>
              <li>Foto profil (jika tersedia)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Informasi yang Dikumpulkan Secara Otomatis</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Alamat IP dan lokasi geografis umum</li>
              <li>Jenis browser dan perangkat</li>
              <li>Halaman yang dikunjungi dan waktu kunjungan</li>
              <li>Data penggunaan dan interaksi dengan platform</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Penggunaan Informasi</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Menyediakan dan memelihara layanan platform</li>
              <li>Memproses transaksi dan membership</li>
              <li>Mengirim notifikasi terkait akun dan layanan</li>
              <li>Memberikan dukungan pelanggan</li>
              <li>Mengirim materi edukasi dan promosi (dengan persetujuan Anda)</li>
              <li>Meningkatkan dan mengembangkan platform</li>
              <li>Mencegah penipuan dan menjaga keamanan</li>
              <li>Mematuhi kewajiban hukum</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Berbagi Informasi</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kami <strong>tidak menjual</strong> informasi pribadi Anda. Kami hanya membagikan informasi dalam situasi berikut:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Penyedia Layanan:</strong> Payment gateway (Xendit), layanan email, dan hosting</li>
              <li><strong>Partner Bisnis:</strong> Mentor dan supplier dalam konteks layanan platform</li>
              <li><strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh hukum atau proses hukum</li>
              <li><strong>Perlindungan:</strong> Untuk melindungi hak, keamanan, dan properti kami atau pengguna lain</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Keamanan Data</h2>
            <p className="text-gray-700 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi Anda, 
              termasuk enkripsi SSL/TLS, hashing password, dan akses terbatas ke data sensitif. Namun, tidak ada metode transmisi 
              internet yang 100% aman, dan kami tidak dapat menjamin keamanan absolut.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookie dan Teknologi Pelacakan</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Kami menggunakan cookie dan teknologi serupa untuk:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Menjaga sesi login Anda</li>
              <li>Mengingat preferensi Anda</li>
              <li>Menganalisis penggunaan platform</li>
              <li>Melacak efektivitas kampanye affiliate</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Anda dapat mengatur browser untuk menolak cookie, namun beberapa fitur platform mungkin tidak berfungsi dengan baik.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Hak Anda</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Mengakses:</strong> Meminta salinan data pribadi Anda</li>
              <li><strong>Memperbaiki:</strong> Memperbarui informasi yang tidak akurat</li>
              <li><strong>Menghapus:</strong> Meminta penghapusan akun dan data Anda</li>
              <li><strong>Berhenti Berlangganan:</strong> Opt-out dari email marketing</li>
              <li><strong>Portabilitas:</strong> Meminta data dalam format yang dapat dipindahkan</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Untuk menggunakan hak-hak ini, hubungi kami di <strong>support@eksporyuk.com</strong>
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Penyimpanan Data</h2>
            <p className="text-gray-700 leading-relaxed">
              Kami menyimpan informasi pribadi Anda selama akun Anda aktif atau selama diperlukan untuk memberikan layanan. 
              Setelah penghapusan akun, kami dapat menyimpan data tertentu untuk memenuhi kewajiban hukum, menyelesaikan sengketa, 
              dan menegakkan perjanjian kami, biasanya tidak lebih dari 5 tahun.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privasi Anak-Anak</h2>
            <p className="text-gray-700 leading-relaxed">
              Platform kami tidak ditujukan untuk anak di bawah 18 tahun. Kami tidak secara sengaja mengumpulkan informasi 
              dari anak-anak. Jika Anda adalah orang tua atau wali dan mengetahui anak Anda telah memberikan informasi pribadi 
              kepada kami, silakan hubungi kami.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Perubahan Kebijakan</h2>
            <p className="text-gray-700 leading-relaxed">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diberitahukan 
              melalui email atau notifikasi di platform. Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui 
              kebijakan yang diperbarui.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Hubungi Kami</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
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
            <Link href="/terms-of-service" className="text-orange-600 hover:text-orange-700">
              Syarat & Ketentuan
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
