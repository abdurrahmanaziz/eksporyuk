/**
 * Script untuk membuat semua branded templates lengkap
 * Run: node create-all-templates.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Helper function untuk generate slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// All template definitions
const ALL_TEMPLATES = [
  // ========== MEMBERSHIP TEMPLATES ==========
  {
    name: 'Welcome Email - New Member',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Selamat Datang di EksporYuk, {name}! 🎉',
    content: `Halo {name},

Selamat datang di EksporYuk! Kami sangat senang Anda bergabung dengan komunitas eksportir terbaik di Indonesia.

Akun Anda telah berhasil dibuat dengan email: {email}

Sebagai member baru, Anda mendapatkan akses ke:
• Dashboard pribadi untuk memantau aktivitas
• Materi pembelajaran ekspor dasar
• Komunitas diskusi dengan sesama eksportir
• Update terbaru seputar ekspor Indonesia

Mulai perjalanan ekspor Anda sekarang dengan mengakses dashboard.

Jika ada pertanyaan, tim support kami siap membantu di {support_email}

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Akses Dashboard Sekarang',
    ctaLink: '{dashboard_link}',
    tags: ['welcome', 'onboarding', 'new-member'],
    isDefault: true
  },
  {
    name: 'Membership Upgrade Confirmation',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Selamat! Membership Anda Telah Di-upgrade ke {membership_plan} 🚀',
    content: `Halo {name},

Selamat! Membership Anda telah berhasil di-upgrade ke paket {membership_plan}.

Detail Membership Baru:
• Paket: {membership_plan}
• Tanggal Mulai: {start_date}
• Berlaku Hingga: {expiry_date}
• Status: {membership_status}

Dengan membership baru ini, Anda mendapatkan akses ke:
• Semua materi pembelajaran premium
• Mentoring eksklusif dengan expert
• Grup diskusi khusus member premium
• Template dokumen ekspor lengkap
• Webinar dan workshop bulanan

Maksimalkan membership Anda dengan mulai belajar sekarang!

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Mulai Belajar Sekarang',
    ctaLink: '{dashboard_link}/courses',
    tags: ['upgrade', 'membership', 'confirmation'],
    isDefault: true
  },
  {
    name: 'Membership Expiry Reminder - 7 Days',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '⚠️ Membership Anda Akan Berakhir dalam 7 Hari',
    content: `Halo {name},

Ini adalah pengingat bahwa membership {membership_plan} Anda akan berakhir pada {expiry_date}.

Sisa waktu aktif: {days_left} hari

Jangan sampai kehilangan akses ke:
• Semua materi pembelajaran premium
• Komunitas diskusi eksklusif
• Update materi terbaru
• Support prioritas

Perpanjang membership Anda sekarang untuk tetap mendapatkan semua benefit!

Salam,
Tim EksporYuk`,
    ctaText: 'Perpanjang Membership',
    ctaLink: '{site_url}/pricing',
    tags: ['reminder', 'expiry', 'renewal'],
    isDefault: true
  },
  {
    name: 'Membership Expired Notification',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '😢 Membership Anda Telah Berakhir',
    content: `Halo {name},

Membership {membership_plan} Anda telah berakhir pada {expiry_date}.

Akses Anda ke fitur premium sekarang terbatas. Anda tidak dapat lagi mengakses:
• Materi pembelajaran premium
• Grup diskusi khusus member
• Mentoring dengan expert
• Template dokumen premium

Kami tidak ingin Anda melewatkan kesempatan untuk terus belajar dan berkembang!

Reaktivasi membership Anda sekarang dan dapatkan diskon spesial 10% dengan kode: COMEBACK10

Salam,
Tim EksporYuk`,
    ctaText: 'Reaktivasi Sekarang',
    ctaLink: '{site_url}/pricing',
    tags: ['expired', 'membership', 'reactivation'],
    isDefault: false
  },

  // ========== AFFILIATE TEMPLATES ==========
  {
    name: 'Affiliate Commission Notification',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '💰 Komisi Baru Masuk: {commission}!',
    content: `Halo {name},

Selamat! Anda baru saja mendapatkan komisi dari program affiliate EksporYuk.

Detail Komisi:
• Jumlah: {commission}
• Tanggal: {transaction_date}
• Status: Pending (menunggu konfirmasi)

Total Pendapatan Anda: {total_earnings}
Jumlah Referral: {referral_count}

Terus bagikan link referral Anda untuk mendapatkan lebih banyak komisi!
Link Referral: {referral_link}

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Lihat Dashboard Affiliate',
    ctaLink: '{site_url}/affiliate',
    tags: ['commission', 'affiliate', 'earnings'],
    isDefault: true
  },
  {
    name: 'Affiliate Withdrawal Approved',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '✅ Pencairan Komisi Anda Telah Disetujui',
    content: `Halo {name},

Kabar baik! Permintaan pencairan komisi Anda telah disetujui.

Detail Pencairan:
• Jumlah: {amount}
• Tanggal Request: {transaction_date}
• Status: Disetujui

Dana akan ditransfer ke rekening terdaftar dalam 1-3 hari kerja.

Jika ada pertanyaan, silakan hubungi support kami.

Terima kasih telah menjadi affiliate EksporYuk!

Salam,
Tim EksporYuk`,
    ctaText: 'Cek Status Pencairan',
    ctaLink: '{site_url}/affiliate/withdrawals',
    tags: ['withdrawal', 'approved', 'affiliate'],
    isDefault: true
  },
  {
    name: 'New Referral Registration',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🎉 Referral Baru Bergabung Melalui Link Anda!',
    content: `Halo {name},

Ada kabar baik! Seseorang baru saja mendaftar melalui link referral Anda.

Kode Referral: {affiliate_code}
Total Referral Anda: {referral_count}

Ketika referral Anda melakukan pembelian, Anda akan mendapatkan komisi sebesar {commission_rate} dari total transaksi.

Terus bagikan link referral Anda untuk mendapatkan lebih banyak komisi!

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Lihat Statistik Referral',
    ctaLink: '{site_url}/affiliate',
    tags: ['referral', 'new-signup', 'affiliate'],
    isDefault: false
  },
  {
    name: 'Affiliate Tier Upgrade',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🏆 Selamat! Anda Naik ke Tier {tier_name}!',
    content: `Halo {name},

Selamat! Performa affiliate Anda luar biasa!

Anda telah naik ke tier baru:
• Tier Baru: {tier_name}
• Level: {tier_level}
• Komisi Baru: {commission_rate}

Dengan tier baru ini, Anda mendapatkan:
• Persentase komisi lebih tinggi
• Bonus bulanan khusus
• Akses ke program affiliate premium
• Support prioritas

Terus tingkatkan performa Anda untuk mencapai tier yang lebih tinggi!

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Lihat Benefit Tier Baru',
    ctaLink: '{site_url}/affiliate/tiers',
    tags: ['tier', 'upgrade', 'affiliate'],
    isDefault: false
  },

  // ========== PAYMENT TEMPLATES ==========
  {
    name: 'Payment Confirmation',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '✅ Pembayaran Berhasil - Invoice #{invoice_number}',
    content: `Halo {name},

Pembayaran Anda telah berhasil diproses!

Detail Transaksi:
• Invoice: #{invoice_number}
• Produk: {product_name}
• Jumlah: {amount}
• Metode: {payment_method}
• Tanggal: {transaction_date}
• Status: {payment_status}

Terima kasih telah melakukan pembayaran. Akses Anda telah diaktifkan.

Jika ada pertanyaan, silakan hubungi tim support kami.

Salam,
Tim EksporYuk`,
    ctaText: 'Akses Sekarang',
    ctaLink: '{dashboard_link}',
    tags: ['payment', 'confirmation', 'invoice'],
    isDefault: true
  },
  {
    name: 'Payment Pending Reminder',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '⏳ Menunggu Pembayaran - Invoice #{invoice_number}',
    content: `Halo {name},

Pembayaran Anda untuk invoice #{invoice_number} masih menunggu konfirmasi.

Detail Invoice:
• Invoice: #{invoice_number}
• Produk: {product_name}
• Jumlah: {amount}
• Batas Waktu: {due_date}

Segera selesaikan pembayaran untuk mengaktifkan akses Anda.

Jika sudah melakukan pembayaran, mohon tunggu maksimal 1x24 jam untuk konfirmasi otomatis.

Salam,
Tim EksporYuk`,
    ctaText: 'Bayar Sekarang',
    ctaLink: '{payment_link}',
    tags: ['payment', 'pending', 'reminder'],
    isDefault: true
  },
  {
    name: 'Payment Failed Notification',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '❌ Pembayaran Gagal - Invoice #{invoice_number}',
    content: `Halo {name},

Mohon maaf, pembayaran Anda untuk invoice #{invoice_number} tidak berhasil diproses.

Detail Invoice:
• Invoice: #{invoice_number}
• Produk: {product_name}
• Jumlah: {amount}

Silakan coba lagi dengan metode pembayaran yang berbeda atau hubungi bank Anda untuk informasi lebih lanjut.

Jika butuh bantuan, tim support kami siap membantu.

Salam,
Tim EksporYuk`,
    ctaText: 'Coba Lagi',
    ctaLink: '{payment_link}',
    tags: ['payment', 'failed', 'retry'],
    isDefault: false
  },
  {
    name: 'Invoice Expired',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '⚠️ Invoice #{invoice_number} Telah Kadaluarsa',
    content: `Halo {name},

Invoice pembayaran Anda telah melewati batas waktu.

Detail Invoice:
• Invoice: #{invoice_number}
• Produk: {product_name}
• Jumlah: {amount}
• Batas Waktu: {due_date}

Jika masih ingin melanjutkan pembelian, silakan buat order baru.

Salam,
Tim EksporYuk`,
    ctaText: 'Buat Order Baru',
    ctaLink: '{site_url}/pricing',
    tags: ['invoice', 'expired', 'payment'],
    isDefault: false
  },

  // ========== COURSE TEMPLATES ==========
  {
    name: 'Course Enrollment Confirmation',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '📚 Anda Telah Terdaftar di Kursus: {course_name}',
    content: `Halo {name},

Selamat! Anda telah berhasil terdaftar di kursus "{course_name}".

Detail Kursus:
• Nama Kursus: {course_name}
• Mentor: {mentor_name}
• Status: Terdaftar

Anda dapat langsung memulai belajar dengan mengakses dashboard kursus.

Tips untuk memaksimalkan pembelajaran:
• Selesaikan kursus secara berurutan
• Catat poin-poin penting
• Ikuti diskusi di forum
• Terapkan langsung ilmu yang didapat

Selamat belajar!

Salam,
Tim EksporYuk`,
    ctaText: 'Mulai Belajar',
    ctaLink: '{course_link}',
    tags: ['course', 'enrollment', 'learning'],
    isDefault: true
  },
  {
    name: 'Course Completion Certificate',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '🎓 Selamat! Anda Telah Menyelesaikan Kursus {course_name}',
    content: `Halo {name},

Selamat! Anda telah berhasil menyelesaikan kursus "{course_name}"!

Detail Pencapaian:
• Kursus: {course_name}
• Progress: {course_progress}
• Tanggal Selesai: {course_completion_date}
• Mentor: {mentor_name}

Sertifikat Anda telah tersedia dan dapat didownload.

Apa selanjutnya?
• Download sertifikat Anda
• Bagikan pencapaian di LinkedIn
• Lanjutkan ke kursus berikutnya
• Terapkan ilmu dalam bisnis ekspor Anda

Terima kasih telah belajar bersama EksporYuk!

Salam,
Tim EksporYuk`,
    ctaText: 'Download Sertifikat',
    ctaLink: '{certificate_url}',
    tags: ['certificate', 'completion', 'course'],
    isDefault: true
  },
  {
    name: 'Course Progress Reminder',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '📖 Lanjutkan Belajar di {course_name}',
    content: `Halo {name},

Sudah lama tidak melanjutkan kursus "{course_name}". Kami merindukanmu!

Progress Anda: {course_progress}
Materi Selanjutnya: {next_lesson}

Luangkan waktu 15-30 menit untuk melanjutkan pembelajaran Anda.

Konsistensi adalah kunci keberhasilan!

Salam,
Tim EksporYuk`,
    ctaText: 'Lanjutkan Belajar',
    ctaLink: '{course_link}',
    tags: ['progress', 'reminder', 'course'],
    isDefault: false
  },

  // ========== NOTIFICATION TEMPLATES ==========
  {
    name: 'New Message Notification',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '💬 Pesan Baru di EksporYuk',
    content: `Halo {name},

Anda memiliki pesan baru di EksporYuk.

Segera cek inbox Anda untuk melihat pesan tersebut.

Salam,
Tim EksporYuk`,
    ctaText: 'Buka Pesan',
    ctaLink: '{dashboard_link}/messages',
    tags: ['message', 'notification', 'inbox'],
    isDefault: true
  },
  {
    name: 'Group Invitation',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '👥 Anda Diundang ke Grup: {event_name}',
    content: `Halo {name},

Anda telah diundang untuk bergabung ke grup "{event_name}".

Bergabunglah untuk:
• Berdiskusi dengan sesama member
• Berbagi pengalaman ekspor
• Mendapatkan update terbaru
• Networking dengan eksportir lain

Salam,
Tim EksporYuk`,
    ctaText: 'Gabung Grup',
    ctaLink: '{group_link}',
    tags: ['group', 'invitation', 'community'],
    isDefault: false
  },
  {
    name: 'Event Reminder',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '📅 Reminder: {event_name} Besok!',
    content: `Halo {name},

Pengingat bahwa event "{event_name}" akan dimulai besok!

Detail Event:
• Nama: {event_name}
• Tanggal: {event_date}
• Waktu: {event_time}
• Lokasi: {event_location}

Jangan sampai terlewat!

Salam,
Tim EksporYuk`,
    ctaText: 'Lihat Detail Event',
    ctaLink: '{site_url}/events',
    tags: ['event', 'reminder', 'webinar'],
    isDefault: true
  },

  // ========== WHATSAPP TEMPLATES ==========
  {
    name: 'WhatsApp - Welcome Message',
    category: 'MEMBERSHIP',
    type: 'WHATSAPP',
    subject: 'Welcome Message',
    content: `🎉 *Selamat Datang di EksporYuk!*

Halo {name},

Terima kasih telah bergabung! Akun Anda sudah aktif.

📱 Akses dashboard: {dashboard_link}

Butuh bantuan? Balas pesan ini atau hubungi support kami.

Salam sukses! 🚀`,
    ctaText: '',
    ctaLink: '',
    tags: ['whatsapp', 'welcome', 'onboarding'],
    isDefault: true
  },
  {
    name: 'WhatsApp - Payment Reminder',
    category: 'PAYMENT',
    type: 'WHATSAPP',
    subject: 'Payment Reminder',
    content: `⏳ *Menunggu Pembayaran*

Halo {name},

Invoice #{invoice_number} masih menunggu pembayaran.

💰 Total: {amount}
📅 Batas waktu: {due_date}

Klik untuk bayar: {payment_link}

Butuh bantuan? Balas pesan ini.`,
    ctaText: '',
    ctaLink: '',
    tags: ['whatsapp', 'payment', 'reminder'],
    isDefault: true
  },
  {
    name: 'WhatsApp - Order Status Update',
    category: 'NOTIFICATION',
    type: 'WHATSAPP',
    subject: 'Order Update',
    content: `🔔 *UPDATE STATUS*

Halo {name},

Status pesanan Anda telah diupdate:
📦 Invoice: #{invoice_number}
✅ Status: {payment_status}

Cek detail: {dashboard_link}`,
    ctaText: '',
    ctaLink: '',
    tags: ['whatsapp', 'order', 'status'],
    isDefault: true
  },
  {
    name: 'WhatsApp - Commission Notification',
    category: 'AFFILIATE',
    type: 'WHATSAPP',
    subject: 'Commission Alert',
    content: `💰 *KOMISI BARU!*

Halo {name},

Selamat! Anda mendapat komisi:
💵 Jumlah: {commission}
📊 Total Earning: {total_earnings}

Cek dashboard: {site_url}/affiliate`,
    ctaText: '',
    ctaLink: '',
    tags: ['whatsapp', 'commission', 'affiliate'],
    isDefault: true
  },

  // ========== PUSH NOTIFICATION TEMPLATES ==========
  {
    name: 'Push - New Message',
    category: 'NOTIFICATION',
    type: 'PUSH',
    subject: '💬 Pesan Baru',
    content: 'Anda memiliki pesan baru di EksporYuk. Tap untuk membuka.',
    ctaText: 'Buka',
    ctaLink: '{dashboard_link}/messages',
    tags: ['push', 'message', 'notification'],
    isDefault: true
  },
  {
    name: 'Push - Payment Success',
    category: 'PAYMENT',
    type: 'PUSH',
    subject: '✅ Pembayaran Berhasil',
    content: 'Pembayaran {amount} telah dikonfirmasi. Akses Anda sudah aktif!',
    ctaText: 'Akses Sekarang',
    ctaLink: '{dashboard_link}',
    tags: ['push', 'payment', 'success'],
    isDefault: true
  },
  {
    name: 'Push - Commission Received',
    category: 'AFFILIATE',
    type: 'PUSH',
    subject: '💰 Komisi Masuk!',
    content: 'Selamat! Anda mendapat komisi {commission} dari referral.',
    ctaText: 'Lihat',
    ctaLink: '{site_url}/affiliate',
    tags: ['push', 'commission', 'affiliate'],
    isDefault: true
  },
  {
    name: 'Push - Course Reminder',
    category: 'COURSE',
    type: 'PUSH',
    subject: '📚 Lanjutkan Belajar',
    content: 'Masih ada materi yang belum selesai di {course_name}. Yuk lanjut!',
    ctaText: 'Belajar',
    ctaLink: '{course_link}',
    tags: ['push', 'course', 'reminder'],
    isDefault: false
  },
  {
    name: 'Push - Event Starting Soon',
    category: 'NOTIFICATION',
    type: 'PUSH',
    subject: '📅 Event Dimulai 15 Menit Lagi',
    content: '{event_name} akan dimulai dalam 15 menit. Jangan sampai terlewat!',
    ctaText: 'Join',
    ctaLink: '{zoom_link}',
    tags: ['push', 'event', 'reminder'],
    isDefault: true
  },

  // ========== MARKETING TEMPLATES ==========
  {
    name: 'Marketing - Newsletter',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '📬 Newsletter EksporYuk - Edisi {current_month}/{current_year}',
    content: `Halo {name},

Selamat datang di Newsletter bulanan EksporYuk!

Dalam edisi kali ini:
• Update regulasi ekspor terbaru
• Tips sukses ekspor untuk pemula
• Success story dari member kami
• Webinar dan event bulan ini

Terus tingkatkan pengetahuan ekspor Anda bersama EksporYuk!

Salam sukses,
Tim EksporYuk`,
    ctaText: 'Baca Selengkapnya',
    ctaLink: '{site_url}/blog',
    tags: ['newsletter', 'marketing', 'monthly'],
    isDefault: true
  },
  {
    name: 'Marketing - Special Promo',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '🔥 PROMO SPESIAL! Diskon Hingga 50%',
    content: `Halo {name},

Jangan lewatkan promo spesial dari EksporYuk!

🔥 DISKON HINGGA 50% untuk semua paket membership!

Periode promo terbatas. Upgrade membership Anda sekarang dan dapatkan:
• Akses semua materi premium
• Mentoring eksklusif
• Sertifikat keahlian
• Komunitas eksportir

Gunakan kode: PROMO50

Promo berakhir: {due_date}

Salam,
Tim EksporYuk`,
    ctaText: 'Klaim Diskon Sekarang',
    ctaLink: '{site_url}/pricing',
    tags: ['promo', 'discount', 'marketing'],
    isDefault: false
  },
  {
    name: 'Marketing - Re-engagement',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '😢 Kami Merindukanmu, {name}!',
    content: `Halo {name},

Sudah lama tidak bertemu! Kami merindukan aktivitas Anda di EksporYuk.

Banyak hal baru yang mungkin Anda lewatkan:
• Materi pembelajaran baru
• Fitur-fitur terbaru
• Komunitas yang semakin aktif
• Webinar dan workshop menarik

Yuk kembali dan lanjutkan perjalanan ekspor Anda!

Sebagai tanda kami merindukan Anda, gunakan kode COMEBACK10 untuk diskon 10%.

Salam hangat,
Tim EksporYuk`,
    ctaText: 'Kembali ke EksporYuk',
    ctaLink: '{dashboard_link}',
    tags: ['reengagement', 'comeback', 'marketing'],
    isDefault: false
  },

  // ========== SYSTEM TEMPLATES ==========
  {
    name: 'System - Password Reset',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '🔐 Reset Password - EksporYuk',
    content: `Halo {name},

Kami menerima permintaan untuk mereset password akun EksporYuk Anda.

Klik tombol di bawah untuk membuat password baru. Link ini akan kadaluarsa dalam 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini dan password Anda akan tetap sama.

Salam,
Tim EksporYuk`,
    ctaText: 'Reset Password',
    ctaLink: '{site_url}/auth/reset-password',
    tags: ['password', 'reset', 'security'],
    isDefault: true
  },
  {
    name: 'System - Email Verification',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '✉️ Verifikasi Email Anda - EksporYuk',
    content: `Halo {name},

Terima kasih telah mendaftar di EksporYuk!

Untuk menyelesaikan pendaftaran, silakan verifikasi email Anda dengan klik tombol di bawah.

Link verifikasi akan kadaluarsa dalam 24 jam.

Salam,
Tim EksporYuk`,
    ctaText: 'Verifikasi Email',
    ctaLink: '{site_url}/auth/verify-email',
    tags: ['verification', 'email', 'security'],
    isDefault: true
  },
  {
    name: 'System - Account Security Alert',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '⚠️ Aktivitas Login Baru Terdeteksi',
    content: `Halo {name},

Kami mendeteksi login baru ke akun EksporYuk Anda.

Waktu: {current_date} {current_time}

Jika ini adalah Anda, abaikan email ini.

Jika BUKAN Anda, segera:
1. Ubah password akun Anda
2. Hubungi tim support kami

Keamanan akun Anda adalah prioritas kami.

Salam,
Tim EksporYuk`,
    ctaText: 'Amankan Akun',
    ctaLink: '{settings_link}',
    tags: ['security', 'login', 'alert'],
    isDefault: true
  },
  {
    name: 'System - Maintenance Notice',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '🔧 Pemberitahuan Maintenance - {event_date}',
    content: `Halo {name},

Kami akan melakukan maintenance terjadwal untuk meningkatkan layanan EksporYuk.

Jadwal Maintenance:
• Tanggal: {event_date}
• Waktu: {event_time}
• Estimasi Durasi: 2-4 jam

Selama maintenance, beberapa layanan mungkin tidak tersedia.

Mohon maaf atas ketidaknyamanannya. Terima kasih atas pengertian Anda.

Salam,
Tim EksporYuk`,
    ctaText: '',
    ctaLink: '',
    tags: ['maintenance', 'system', 'notice'],
    isDefault: true
  }
]

async function createAllTemplates() {
  console.log('🚀 Creating all branded templates...\n')

  // First, clear existing templates
  console.log('🗑️  Clearing existing templates...')
  await prisma.brandedTemplateUsage.deleteMany({})
  await prisma.brandedTemplate.deleteMany({})
  console.log('✅ Cleared existing templates\n')

  // Get admin user for createdBy
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  let created = 0
  let failed = 0

  for (const template of ALL_TEMPLATES) {
    try {
      const slug = generateSlug(template.name)
      
      await prisma.brandedTemplate.create({
        data: {
          name: template.name,
          slug: slug,
          category: template.category,
          type: template.type,
          subject: template.subject,
          content: template.content,
          ctaText: template.ctaText || null,
          ctaLink: template.ctaLink || null,
          tags: template.tags ? JSON.stringify(template.tags) : null,
          isActive: true,
          isDefault: template.isDefault || false,
          usageCount: Math.floor(Math.random() * 50) + 1,
          createdBy: admin?.id || null,
          lastUsedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      })

      console.log(`✅ ${template.type.padEnd(8)} | ${template.category.padEnd(12)} | ${template.name}`)
      created++
    } catch (error) {
      console.log(`❌ FAILED: ${template.name}`)
      console.error(error.message)
      failed++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 SUMMARY`)
  console.log(`   ✅ Created: ${created} templates`)
  console.log(`   ❌ Failed: ${failed} templates`)
  console.log(`   📝 Total: ${ALL_TEMPLATES.length} templates`)
  console.log('='.repeat(60))

  // Show breakdown by category
  const breakdown = {}
  ALL_TEMPLATES.forEach(t => {
    const key = `${t.category} - ${t.type}`
    breakdown[key] = (breakdown[key] || 0) + 1
  })

  console.log('\n📋 BREAKDOWN BY CATEGORY:')
  Object.entries(breakdown).sort().forEach(([key, count]) => {
    console.log(`   ${key}: ${count}`)
  })
}

createAllTemplates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
