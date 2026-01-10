const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const ROLE_BASED_TEMPLATES = [
  // ============================================
  // SUPPLIER CATEGORY
  // ============================================
  {
    name: 'Supplier Registration Confirmation',
    slug: 'supplier-registration-confirmation',
    category: 'SUPPLIER',
    type: 'EMAIL',
    subject: '🎉 Terima Kasih! Pendaftaran Supplier Anda Diterima',
    content: `Halo {name},

Terima kasih telah mendaftar sebagai supplier di {site_name}!

Kami telah menerima pendaftaran Anda dengan informasi berikut:

📋 Data Pendaftaran:
- Nama Toko: {shop_name}
- Kategori: {shop_category}
- Kontak: {phone}
- Email: {email}

⏳ Status Pendaftaran: SEDANG DIVERIFIKASI

Tim kami akan melakukan verifikasi data Anda dalam 1-3 hari kerja. Anda akan menerima email notifikasi ketika pendaftaran Anda telah disetujui.

📋 Dokumen yang Diperlukan:
- KTP/Identitas Pemilik
- Surat Izin Usaha (jika ada)
- Foto Toko/Produk
- Rekening Bank untuk Pembayaran

💡 Tips untuk Mempercepat Verifikasi:
1. Lengkapi profil toko Anda sepenuhnya
2. Upload foto produk berkualitas tinggi
3. Pastikan deskripsi produk detail dan jelas
4. Respons cepat terhadap pertanyaan tim kami

🔗 Lihat Status Pendaftaran:
{registration_status_link}

Jika Anda memiliki pertanyaan, hubungi tim support kami di {support_email}

Salam hangat,
Tim {site_name}`,
    ctaText: 'Cek Status Pendaftaran',
    ctaLink: '{registration_status_link}',
    tags: ['supplier', 'registration', 'welcome'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true,
    variables: {
      'name': 'Nama supplier',
      'site_name': 'Nama platform',
      'shop_name': 'Nama toko',
      'shop_category': 'Kategori toko',
      'phone': 'Nomor telepon',
      'email': 'Email supplier',
      'registration_status_link': 'Link ke halaman status',
      'support_email': 'Email support'
    }
  },

  {
    name: 'Supplier Registration Approved',
    slug: 'supplier-registration-approved',
    category: 'SUPPLIER',
    type: 'EMAIL',
    subject: '✅ Selamat! Pendaftaran Supplier Anda Telah Disetujui',
    content: `Halo {name},

Selamat! 🎉 Pendaftaran Anda sebagai supplier telah disetujui!

Akun supplier Anda sekarang aktif dan siap digunakan.

✅ Status: APPROVED
📅 Tanggal Persetujuan: {approval_date}

🚀 Langkah Selanjutnya:
1. Login ke dashboard supplier Anda
2. Lengkapi profil toko dengan detail lebih lanjut
3. Upload produk pertama Anda
4. Atur metode pembayaran
5. Mulai terima pesanan!

📊 Dashboard Supplier:
{dashboard_link}

💰 Fitur yang Tersedia:
- Kelola Produk & Inventaris
- Terima dan Proses Pesanan
- Lacak Pengiriman
- Lihat Laporan Penjualan
- Kelola Review & Rating
- Penarikan Hasil Penjualan

📞 Dukungan Seller:
- Email: {support_email}
- WhatsApp: {support_phone}
- Chat: {chat_link}

Kami siap membantu Anda sukses berjualan! Jangan ragu untuk menghubungi tim support kami.

Salam hangat,
Tim {site_name}`,
    ctaText: 'Login ke Dashboard',
    ctaLink: '{dashboard_link}',
    tags: ['supplier', 'approved', 'welcome'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Supplier Registration Rejected',
    slug: 'supplier-registration-rejected',
    category: 'SUPPLIER',
    type: 'EMAIL',
    subject: '⚠️ Pendaftaran Supplier Anda Ditolak - {site_name}',
    content: `Halo {name},

Kami telah meninjau pendaftaran Anda sebagai supplier di {site_name}.

Sayangnya, kami tidak dapat menyetujui pendaftaran Anda pada saat ini.

❌ Status: REJECTED
📅 Tanggal: {rejection_date}

📝 Alasan Penolakan:
{rejection_reason}

💡 Apa yang Bisa Anda Lakukan:
1. Perbaiki dokumen atau informasi yang kurang lengkap
2. Pastikan semua data sesuai dengan ketentuan kami
3. Hubungi tim support untuk konsultasi
4. Coba daftar ulang setelah perbaikan

📞 Hubungi Tim Support:
Email: {support_email}
WhatsApp: {support_phone}

Kami tetap terbuka untuk membantu Anda memenuhi persyaratan untuk menjadi supplier di {site_name}.

Salam hangat,
Tim {site_name}`,
    ctaText: 'Hubungi Support',
    ctaLink: '{support_link}',
    tags: ['supplier', 'rejected', 'appeal'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Supplier Product Listed',
    slug: 'supplier-product-listed',
    category: 'SUPPLIER',
    type: 'EMAIL',
    subject: '🎉 Produk Anda Berhasil Dipublikasikan!',
    content: `Halo {name},

Selamat! Produk Anda telah berhasil dipublikasikan dan tersedia untuk dibeli.

✅ Status: PUBLISHED
📅 Tanggal Publikasi: {publish_date}

📦 Detail Produk:
- Nama: {product_name}
- SKU: {sku}
- Harga: {price}
- Stok: {stock}

🔍 Produk Anda Dapat Ditemukan:
- Link Langsung: {product_link}
- Kategori: {category}
- Status: Aktif

💡 Tips Meningkatkan Penjualan:
1. Tambahkan foto berkualitas tinggi
2. Tulis deskripsi yang detail dan menarik
3. Respons cepat terhadap pertanyaan pembeli
4. Kelola rating dan review dengan baik
5. Ikuti promosi dan flash sale

📊 Pantau Performa:
{dashboard_link}

Jika ada pertanyaan atau masalah, hubungi team support kami.

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Produk',
    ctaLink: '{product_link}',
    tags: ['supplier', 'product', 'published'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Supplier Sales Report',
    slug: 'supplier-sales-report',
    category: 'SUPPLIER',
    type: 'EMAIL',
    subject: '📊 Laporan Penjualan Mingguan - {week}',
    content: `Halo {name},

Berikut adalah laporan penjualan mingguan Anda untuk periode {week}.

📈 RINGKASAN PENJUALAN:
- Total Pesanan: {total_orders}
- Total Revenue: {total_revenue}
- Produk Terjual: {items_sold}
- Pembeli Baru: {new_customers}

⭐ RATING & REVIEW:
- Rating Rata-rata: {average_rating}
- Total Review: {total_reviews}
- Review Positif: {positive_reviews}

📦 PENGIRIMAN:
- Pengiriman Tepat Waktu: {on_time_percentage}%
- Komplain Pengiriman: {shipping_complaints}
- Dikembalikan: {returns}

💰 PENGHASILAN:
- Penjualan Bersih: {net_sales}
- Komisi: {commission_amount}
- Pembayaran Siap Tarik: {available_payout}

🎯 TARGET MINGGU INI:
- Penjualan Target: {target_sales}
- Status: {target_status}
- Ranking Kategori: #{ranking}

💡 REKOMENDASI:
{recommendations}

📊 Dashboard Lengkap:
{dashboard_link}

Terus semangat dan tingkatkan penjualan Anda!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Dashboard',
    ctaLink: '{dashboard_link}',
    tags: ['supplier', 'report', 'analytics'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // MENTOR CATEGORY
  // ============================================
  {
    name: 'Mentor Registration Confirmation',
    slug: 'mentor-registration-confirmation',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '🎓 Terima Kasih! Pendaftaran Mentor Anda Diterima',
    content: `Halo {name},

Terima kasih telah mendaftar sebagai mentor di {site_name}!

Kami telah menerima aplikasi Anda dan sedang dalam proses verifikasi.

📋 DATA APLIKASI:
- Nama Lengkap: {name}
- Keahlian: {expertise}
- Pengalaman: {experience} tahun
- Status: SEDANG DIVERIFIKASI

⏳ Proses Verifikasi:
Kami akan meninjau:
✓ Kredensial dan pengalaman Anda
✓ Kualifikasi profesional
✓ Referensi dan portofolio
✓ Kualitas konten yang akan diajarkan

Proses ini biasanya memakan waktu 3-7 hari kerja.

📌 Yang Perlu Anda Persiapkan:
1. CV/Resume lengkap
2. Sertifikat keahlian (jika ada)
3. Portofolio atau karya terbaik
4. Pesan singkat tentang mengapa ingin menjadi mentor
5. Foto profil profesional

🎬 Siap Membuat Kursus:
Setelah disetujui, Anda bisa:
- Membuat kursus online
- Menjadwalkan sesi live
- Berinteraksi dengan siswa
- Mendapatkan penghasilan
- Membangun reputasi sebagai expert

❓ Pertanyaan Sering Diajukan:
{faq_link}

📞 Hubungi Tim Support:
Email: {support_email}
WhatsApp: {support_phone}

Kami sangat antusias untuk berkolaborasi dengan Anda!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Status Aplikasi',
    ctaLink: '{application_status_link}',
    tags: ['mentor', 'registration', 'welcome'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Mentor Registration Approved',
    slug: 'mentor-registration-approved',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '✅ Selamat! Anda Telah Disetujui Sebagai Mentor',
    content: `Halo {name},

Selamat! 🎉 Aplikasi Anda sebagai mentor telah DISETUJUI!

Anda sekarang adalah mentor resmi di {site_name} dan siap mulai berbagi keahlian Anda.

✅ APPROVAL DATE: {approval_date}
🎓 MENTOR ID: {mentor_id}

🚀 LANGKAH SELANJUTNYA:

1️⃣ LENGKAPI PROFIL MENTOR
   - Foto profil berkualitas
   - Bio lengkap dengan keahlian
   - URL portfolio/website (opsional)
   - {profile_setup_link}

2️⃣ BUAT KURSUS PERTAMA
   - Tentukan topik kursus
   - Siapkan materi pembelajaran
   - Buat video/konten
   - {create_course_link}

3️⃣ ATUR HARGA & JADWAL
   - Tentukan harga kursus
   - Buat jadwal sesi live
   - Atur paket mentoring
   - {pricing_setup_link}

📊 DASHBOARD MENTOR:
{mentor_dashboard_link}

💰 SISTEM PENGHASILAN:
- Revenue dari Kursus: 70% untuk Anda
- Revenue dari Sesi Live: 75% untuk Anda
- Minimum Payout: {minimum_payout}
- {payout_policy_link}

🎯 FITUR TERSEDIA:
✓ Kelola Kursus & Siswa
✓ Sesi Live & Q&A
✓ Feedback & Rating
✓ Analytics Kelas
✓ Certificate Issuing
✓ Messaging Sistem

📚 PANDUAN MENTOR:
- Kualitas Konten: {quality_guidelines_link}
- Etika Mengajar: {code_of_conduct_link}
- Tips Sukses: {success_tips_link}

🎓 KOMUNITAS MENTOR:
Bergabung dengan mentor lainnya untuk berbagi pengalaman dan tips.
Forum: {mentor_community_link}

❓ BANTUAN:
- Help Center: {help_center_link}
- Email Support: {support_email}
- WhatsApp: {support_phone}

Kami bangga memiliki Anda sebagai bagian dari tim mentor kami!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Mulai Setup Profil',
    ctaLink: '{profile_setup_link}',
    tags: ['mentor', 'approved', 'welcome'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Mentor Course Published',
    slug: 'mentor-course-published',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '🎓 Selamat! Kursus "{course_name}" Telah Dipublikasikan!',
    content: `Halo {name},

Kursus Anda telah berhasil dipublikasikan dan kini tersedia untuk siswa!

✅ COURSE PUBLISHED
📅 Tanggal: {publish_date}

📚 DETAIL KURSUS:
- Judul: {course_name}
- Kategori: {category}
- Durasi: {duration}
- Harga: {price}
- Status: AKTIF

🎯 STATISTIK AWAL:
- Siswa Terdaftar: {enrolled_students}
- Rating: {rating}
- Views: {total_views}

🔍 KURSUS ANDA TERSEDIA DI:
- Link Kursus: {course_link}
- Kategori Page: {category_link}
- Search Results

💡 TIPS MENINGKATKAN ENROLLMENT:

1. Tambahkan Preview Video
   - Gunakan 1-2 menit pertama sebagai preview
   - Tunjukkan value proposition
   - {add_preview_link}

2. Optimasi Deskripsi
   - Tulis learning outcomes dengan jelas
   - Sebutkan siapa target audience
   - {edit_course_link}

3. Promosi Kursus
   - Buat promo launching (10-30% diskon)
   - Share di media sosial
   - {promotion_setup_link}

4. Engagement Siswa
   - Respons cepat terhadap pertanyaan
   - Buat announcement & updates
   - {engagement_tools_link}

📊 DASHBOARD KURSUS:
{course_dashboard_link}

🎉 BONUS UNTUK KURSUS BARU:
- Featured placement (minggu pertama)
- Akses ke marketing tools
- Support priority dari tim kami

📞 BANTUAN:
Jika ada pertanyaan atau perlu bantuan teknis:
Email: {support_email}
WhatsApp: {support_phone}

Semoga kursus Anda sukses!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Kursus',
    ctaLink: '{course_link}',
    tags: ['mentor', 'course', 'published'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Mentor Student Enrolled',
    slug: 'mentor-student-enrolled',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '👨‍🎓 Siswa Baru! {student_name} Terdaftar di Kursus Anda',
    content: `Halo {name},

Selamat! Seorang siswa baru telah terdaftar di kursus Anda.

✅ SISWA BARU TERDAFTAR
👤 Nama: {student_name}
📚 Kursus: {course_name}
📅 Tanggal Pendaftaran: {enrollment_date}

📊 STATISTIK KURSUS ANDA:
- Total Siswa: {total_students}
- Siswa Aktif: {active_students}
- Rating Kursus: {course_rating}
- Progres Siswa: {average_progress}%

💬 REKOMENDASI UNTUK ANDA:
1. Kirim pesan welcome ke siswa baru
2. Buat announcement tentang materi terbaru
3. Respons pertanyaan dalam 24 jam
4. Pantau progress siswa secara rutin

🎯 TINGKATKAN ENGAGEMENT:
- Buat video recap mingguan
- Adakan Q&A session live
- Buat interactive quiz/assignment
- Berikan feedback personal

📊 ANALYTICS SISWA:
- Total Enrollment: {total_enrollments}
- Completion Rate: {completion_rate}%
- Student Satisfaction: {satisfaction_rate}%

📞 DUKUNGAN MENTOR:
Email: {support_email}
WhatsApp: {support_phone}

Terima kasih telah menjadi mentor luar biasa!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Lihat Detail Siswa',
    ctaLink: '{student_dashboard_link}',
    tags: ['mentor', 'student', 'enrollment'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // MEMBERSHIP - FREE vs PREMIUM
  // ============================================
  {
    name: 'Free Membership Activated',
    slug: 'membership-free-activated',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '🎉 Selamat! Membership Gratis Anda Sudah Aktif',
    content: `Halo {name},

Selamat! 🎉 Membership gratis Anda telah AKTIF.

Anda sekarang memiliki akses ke fitur-fitur eksklusif {site_name}!

✅ STATUS: AKTIF
📅 Tanggal Aktivasi: {activation_date}
⏰ Berlaku Hingga: {expiry_date}

🎁 MANFAAT MEMBERSHIP GRATIS:

✓ AKSES KONTEN PEMBELAJARAN
  - Akses 50+ kursus fundamental
  - Materi pembelajaran berkualitas
  - Update konten setiap bulan

✓ KOMUNITAS
  - Bergabung dengan forum diskusi
  - Networking dengan member lain
  - Akses grup WhatsApp eksklusif

✓ FITUR DASAR
  - Bookmark konten favorit
  - Download materi (limited)
  - Progress tracking sederhana

✓ PROMOSI & PENAWARAN
  - Diskon khusus untuk upgrade
  - Early access flash sale
  - Newsletter eksklusif

📚 MULAI BELAJAR SEKARANG:
- Rekomendasi Kursus: {recommended_courses_link}
- Browse Semua Kursus: {all_courses_link}
- Trending Sekarang: {trending_link}

💡 TIPS MEMAKSIMALKAN MEMBERSHIP:
1. Lengkapi profil Anda
2. Ikuti 1-2 kursus untuk memulai
3. Ikuti sesi live & webinar gratis
4. Berinteraksi di forum komunitas
5. Share progress Anda

🚀 UPGRADE KE PREMIUM:
Jika ingin akses unlimited dan fitur premium:
- Unlimited course access
- Download unlimited
- Certificate professional
- Priority support
- Live mentoring

Cek paket premium kami: {premium_upgrade_link}

❓ BANTUAN:
- FAQ: {faq_link}
- Help Center: {help_center_link}
- Email: {support_email}

Selamat belajar!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Mulai Belajar',
    ctaLink: '{recommended_courses_link}',
    tags: ['membership', 'free', 'activated'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Premium Membership Activated',
    slug: 'membership-premium-activated',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '👑 Selamat! Anda Sekarang Member Premium {site_name}',
    content: `Halo {name},

Terima kasih! 🎉 Anda sekarang adalah member PREMIUM {site_name}!

Nikmati semua fitur premium tanpa batasan.

✅ PREMIUM MEMBERSHIP AKTIF
📅 Aktivasi: {activation_date}
⏰ Berlaku Hingga: {expiry_date}
💳 Paket: {plan_type}

👑 FITUR PREMIUM YANG ANDA DAPATKAN:

✓ UNLIMITED COURSE ACCESS
  - 500+ kursus lengkap tersedia
  - Akses selamanya (lifetime)
  - Update konten berkala

✓ DOWNLOAD UNLIMITED
  - Download semua materi
  - Akses offline tanpa batas
  - Format multiple (PDF, Video, doc)

✓ SERTIFIKAT PROFESIONAL
  - Certificate of completion
  - LinkedIn integration
  - Recognizable credentials

✓ PRIORITY SUPPORT
  - 24/7 customer support
  - Dedicated support team
  - Response time < 2 jam

✓ LIVE MENTORING
  - 1-on-1 mentoring sessions
  - Group mentoring
  - Career consultation

✓ NETWORKING PREMIUM
  - VIP community access
  - Exclusive networking events
  - Job opportunities board

✓ ADVANCED FEATURES
  - Progress analytics detailed
  - Learning path personalized
  - Skill assessment tests
  - Career guidance

🎓 REKOMENDASI KURSUS UNTUK ANDA:
Berdasarkan profil Anda:
{recommended_courses_list}

📊 DASHBOARD PREMIUM:
{premium_dashboard_link}

🎯 TARGET BELAJAR ANDA:
Mari buat target pembelajaran:
- Pilih skill yang ingin dikuasai
- Set timeline realistis
- Track progress mingguan
{goal_setting_link}

💼 CAREER SUPPORT:
- Resume review
- Interview preparation
- Job placement assistance
{career_support_link}

🎁 BONUS BULAN INI:
- Free 1 mentoring session
- Access exclusive masterclass
- Priority in new course launches

📞 DEDICATED SUPPORT TEAM:
Anda sekarang memiliki dedicated support:
- WhatsApp: {premium_support_whatsapp}
- Email: {premium_support_email}
- Phone: {premium_support_phone}

❓ PERTANYAAN UMUM:
- Bagaimana cancel membership? {cancellation_policy_link}
- Apa jaminan kepuasan? {satisfaction_guarantee_link}
- Berapa banyak kursus yang bisa saya ambil? Unlimited!

Terima kasih telah memilih kami untuk perjalanan belajar Anda!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Akses Semua Kursus',
    ctaLink: '{all_courses_link}',
    tags: ['membership', 'premium', 'activated'],
    priority: 'NORMAL',
    isDefault: false,
    isActive: true
  },

  {
    name: 'Premium Membership Expiring Soon',
    slug: 'membership-premium-expiring-soon',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '⏰ Reminder: Premium Membership Anda Akan Berakhir {days_left} Hari Lagi',
    content: `Halo {name},

⏰ Membership premium Anda akan berakhir dalam {days_left} hari.

Tanggal Ekspirasi: {expiry_date}

Untuk melanjutkan menikmati semua keuntungan premium, silakan renew sekarang juga!

🎁 PENAWARAN RENEWAL KHUSUS:
- Diskon 20% untuk renewal
- Bonus 1 bulan gratis jika renew 3 bulan
- Akses premium tanpa putus

🔄 RENEW SEKARANG:
{renewal_link}

💳 PAKET RENEWAL TERSEDIA:
- 1 Bulan: {price_1month} (Diskon 20%)
- 3 Bulan: {price_3month} + 1 bulan gratis
- 12 Bulan: {price_12month} + 2 bulan gratis

👑 MANFAAT YANG AKAN HILANG:
Jika tidak renew, Anda akan kehilangan:
❌ Unlimited course access
❌ Download privileges
❌ Priority support
❌ Live mentoring
❌ Certificate access
❌ Networking premium

📚 KURSUS YANG SEDANG ANDA IKUTI:
- {course_1}: {progress_1}% selesai
- {course_2}: {progress_2}% selesai
- {course_3}: {progress_3}% selesai

Jangan sampai progress Anda terhenti! Renew sekarang.

🎯 SPECIAL OFFER:
Jika renewal sebelum {offer_deadline}, dapatkan:
✓ 20% discount on any plan
✓ Free bonus course worth {bonus_value}
✓ 3 free mentoring sessions

🚀 UPGRADE PLAN?
Ingin upgrade ke paket yang lebih tinggi?
{upgrade_options_link}

📞 BUTUH BANTUAN?
Jika ada pertanyaan tentang renewal:
Email: {support_email}
WhatsApp: {support_phone}

Jangan lewatkan kesempatan ini!

Salam hangat,
Tim {site_name}`,
    ctaText: 'Renew Sekarang',
    ctaLink: '{renewal_link}',
    tags: ['membership', 'premium', 'expiring'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  }
]

async function seedRoleBasedTemplates() {
  try {
    console.log('🌱 Starting role-based email template seeding...\n')

    let created = 0
    let skipped = 0

    for (const template of ROLE_BASED_TEMPLATES) {
      try {
        const existing = await prisma.brandedTemplate.findFirst({
          where: { slug: template.slug }
        })

        if (existing) {
          console.log(`⏭️  SKIPPED: "${template.name}" (already exists)`)
          skipped++
          continue
        }

        const newTemplate = await prisma.brandedTemplate.create({
          data: {
            id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...template,
            updatedAt: new Date()
          }
        })

        console.log(`✅ CREATED: "${newTemplate.name}" (${newTemplate.slug})`)
        created++
      } catch (err) {
        console.error(`❌ ERROR creating "${template.name}":`, err.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 SEEDING SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Created: ${created} templates`)
    console.log(`⏭️  Skipped: ${skipped} templates`)
    console.log(`📦 Total: ${ROLE_BASED_TEMPLATES.length} templates in seed`)

    // Verify results
    const supplierTemplates = await prisma.brandedTemplate.count({
      where: { category: 'SUPPLIER' }
    })
    const mentorTemplates = await prisma.brandedTemplate.count({
      where: { category: 'MENTOR' }
    })
    const totalAffiliate = await prisma.brandedTemplate.count({
      where: { category: 'AFFILIATE' }
    })

    console.log('\n' + '='.repeat(60))
    console.log('📈 DATABASE VERIFICATION')
    console.log('='.repeat(60))
    console.log(`📌 SUPPLIER Templates: ${supplierTemplates}`)
    console.log(`📌 MENTOR Templates: ${mentorTemplates}`)
    console.log(`📌 MEMBERSHIP Templates (Free+Premium): 2 new added`)
    console.log(`📌 Total AFFILIATE Templates: ${totalAffiliate}`)

    // Check for duplicates
    const allTemplates = await prisma.brandedTemplate.findMany({
      select: { slug: true }
    })

    const slugCounts = {}
    allTemplates.forEach(t => {
      slugCounts[t.slug] = (slugCounts[t.slug] || 0) + 1
    })

    const duplicates = Object.entries(slugCounts).filter(([_, count]) => count > 1)

    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATES FOUND:')
      duplicates.forEach(([slug, count]) => {
        console.log(`  - "${slug}": ${count} instances`)
      })
    } else {
      console.log('\n✅ No duplicates found!')
    }

    console.log('\n✨ Role-based template seeding completed successfully!')
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedRoleBasedTemplates()
