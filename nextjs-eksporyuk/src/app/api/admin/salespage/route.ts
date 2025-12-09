import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Fetch sales page settings
export async function GET() {
  try {
    // Allow public access for frontend to load settings
    let settings = await prisma.salesPageSettings.findFirst()
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.salesPageSettings.create({
        data: {
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
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching sales page settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT - Update sales page settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Get existing settings or create new
    let settings = await prisma.salesPageSettings.findFirst()
    
    if (settings) {
      settings = await prisma.salesPageSettings.update({
        where: { id: settings.id },
        data: {
          ...body,
          updatedAt: new Date(),
        }
      })
    } else {
      settings = await prisma.salesPageSettings.create({
        data: body
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating sales page settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
