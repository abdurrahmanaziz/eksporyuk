/**
 * Seed Branded Email Templates
 * Simple text format - sistem akan wrap otomatis dengan header/footer
 * Gunakan {{variable}} untuk dynamic content
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Template data - format simple text, no HTML
const templates = [
  // ========== SYSTEM TEMPLATES ==========
  {
    name: 'Selamat Datang - Member Baru',
    slug: 'welcome-new-member',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '🎉 Selamat Datang di {{appName}}!',
    content: `Halo {{userName}},

Selamat datang di Eksporyuk! Kami sangat senang Anda bergabung dengan komunitas eksportir Indonesia.

Akun Anda telah aktif dan siap digunakan. Anda sekarang dapat mengakses:
• Dashboard lengkap untuk kelola bisnis ekspor
• Materi pembelajaran dari mentor berpengalaman
• Networking dengan sesama eksportir
• Tools dan template bisnis ekspor

Langkah selanjutnya:
1. Lengkapi profil Anda
2. Jelajahi kursus yang tersedia
3. Bergabung dengan grup diskusi
4. Mulai perjalanan ekspor Anda!

Jika ada pertanyaan, tim kami siap membantu.

Salam sukses,
Tim Eksporyuk`,
    ctaText: 'Mulai Sekarang',
    ctaLink: '{{dashboardUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      appName: 'Nama aplikasi',
      dashboardUrl: 'URL dashboard'
    },
    tags: ['onboarding', 'registration', 'welcome']
  },

  {
    name: 'Verifikasi Email',
    slug: 'verify-email',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '✅ Verifikasi Email Anda - {{appName}}',
    content: `Halo {{userName}},

Terima kasih telah mendaftar di Eksporyuk!

Untuk mengaktifkan akun Anda, mohon verifikasi alamat email dengan klik tombol di bawah ini:

Link verifikasi akan kadaluarsa dalam 24 jam.

Jika Anda tidak merasa mendaftar, abaikan email ini.

Salam,
Tim Eksporyuk`,
    ctaText: 'Verifikasi Email',
    ctaLink: '{{verificationUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      verificationUrl: 'URL verifikasi email',
      appName: 'Nama aplikasi'
    },
    tags: ['verification', 'email', 'security']
  },

  {
    name: 'Reset Password',
    slug: 'reset-password',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '🔐 Permintaan Reset Password - {{appName}}',
    content: `Halo {{userName}},

Kami menerima permintaan untuk reset password akun Anda.

Jika ini Anda, klik tombol di bawah untuk membuat password baru:

Link reset akan kadaluarsa dalam 1 jam.

Jika Anda tidak merasa meminta reset password, abaikan email ini atau hubungi tim support kami segera untuk keamanan akun Anda.

Salam,
Tim Eksporyuk`,
    ctaText: 'Reset Password',
    ctaLink: '{{resetUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      resetUrl: 'URL reset password',
      appName: 'Nama aplikasi'
    },
    tags: ['security', 'password', 'reset']
  },

  {
    name: 'Password Berhasil Diubah',
    slug: 'password-changed-confirmation',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '✅ Password Anda Telah Diubah',
    content: `Halo {{userName}},

Password akun Anda telah berhasil diubah pada {{changeDate}}.

Jika Anda yang melakukan perubahan ini, tidak ada tindakan lebih lanjut yang diperlukan.

Namun jika Anda TIDAK melakukan perubahan ini, segera hubungi tim support kami:
• Email: {{supportEmail}}
• WhatsApp: {{supportWhatsapp}}

Untuk keamanan akun, kami rekomendasikan:
1. Gunakan password yang kuat dan unik
2. Jangan bagikan password ke siapapun
3. Aktifkan verifikasi 2 langkah jika tersedia

Salam,
Tim Eksporyuk`,
    ctaText: 'Login Sekarang',
    ctaLink: '{{loginUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      changeDate: 'Tanggal perubahan',
      supportEmail: 'Email support',
      supportWhatsapp: 'WhatsApp support',
      loginUrl: 'URL login'
    },
    tags: ['security', 'password', 'confirmation']
  },

  // ========== MEMBERSHIP TEMPLATES ==========
  {
    name: 'Membership Aktif',
    slug: 'membership-activated',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '🎊 Selamat! Membership {{membershipName}} Anda Aktif',
    content: `Halo {{userName}},

Selamat! Pembayaran Anda telah dikonfirmasi dan membership {{membershipName}} Anda sekarang aktif.

Detail Membership:
• Paket: {{membershipName}}
• Status: Aktif
• Berlaku sampai: {{expiryDate}}
• Invoice: {{invoiceNumber}}

Anda sekarang mendapatkan akses ke:
✓ Semua kursus premium
✓ Grup eksklusif member
✓ Konsultasi dengan mentor
✓ Sertifikat digital
✓ Tools dan template bisnis
✓ Update materi terbaru

Mulai perjalanan ekspor Anda sekarang!

Salam sukses,
Tim Eksporyuk`,
    ctaText: 'Akses Dashboard',
    ctaLink: '{{dashboardUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      membershipName: 'Nama paket membership',
      expiryDate: 'Tanggal kadaluarsa',
      invoiceNumber: 'Nomor invoice',
      dashboardUrl: 'URL dashboard'
    },
    tags: ['membership', 'activation', 'payment', 'success']
  },

  {
    name: 'Peringatan Membership Akan Habis',
    slug: 'membership-expiry-warning',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '⚠️ Membership Anda Akan Habis dalam {{daysLeft}} Hari',
    content: `Halo {{userName}},

Membership {{membershipName}} Anda akan berakhir pada {{expiryDate}}.

Jangan sampai kehilangan akses ke:
• Kursus premium lengkap
• Grup eksklusif member
• Update materi terbaru
• Konsultasi mentor
• Tools bisnis ekspor

Perpanjang sekarang dan dapatkan:
🎁 Diskon spesial untuk renewal
🎁 Bonus materi eksklusif
🎁 Prioritas support

Klik tombol di bawah untuk perpanjang membership Anda.

Salam,
Tim Eksporyuk`,
    ctaText: 'Perpanjang Sekarang',
    ctaLink: '{{renewalUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      membershipName: 'Nama paket membership',
      expiryDate: 'Tanggal kadaluarsa',
      daysLeft: 'Sisa hari',
      renewalUrl: 'URL renewal'
    },
    tags: ['membership', 'expiry', 'warning', 'renewal']
  },

  {
    name: 'Membership Telah Berakhir',
    slug: 'membership-expired',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '📌 Membership {{membershipName}} Anda Telah Berakhir',
    content: `Halo {{userName}},

Membership {{membershipName}} Anda telah berakhir pada {{expiryDate}}.

Akun Anda sekarang dalam status Free Member dengan akses terbatas.

Yang bisa Anda lakukan:
✓ Akses materi gratis
✓ Lihat preview kursus premium
✓ Bergabung grup umum

Untuk mendapatkan kembali akses penuh:
🌟 Perpanjang membership Anda sekarang
🌟 Dapatkan diskon comeback member
🌟 Akses semua fitur premium

Kami tunggu kembalinya Anda!

Salam,
Tim Eksporyuk`,
    ctaText: 'Aktifkan Kembali',
    ctaLink: '{{renewalUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      membershipName: 'Nama paket membership',
      expiryDate: 'Tanggal berakhir',
      renewalUrl: 'URL renewal'
    },
    tags: ['membership', 'expired', 'renewal']
  },

  {
    name: 'Perpanjangan Membership Berhasil',
    slug: 'membership-renewal-success',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '✅ Perpanjangan Membership {{membershipName}} Berhasil!',
    content: `Halo {{userName}},

Terima kasih! Perpanjangan membership {{membershipName}} Anda telah berhasil.

Detail Perpanjangan:
• Paket: {{membershipName}}
• Status: Aktif
• Berlaku sampai: {{newExpiryDate}}
• Invoice: {{invoiceNumber}}
• Total Pembayaran: {{amount}}

Akses premium Anda telah diperpanjang dan siap digunakan kembali.

Selamat melanjutkan perjalanan ekspor Anda!

Salam sukses,
Tim Eksporyuk`,
    ctaText: 'Lihat Dashboard',
    ctaLink: '{{dashboardUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      membershipName: 'Nama paket membership',
      newExpiryDate: 'Tanggal kadaluarsa baru',
      invoiceNumber: 'Nomor invoice',
      amount: 'Total pembayaran',
      dashboardUrl: 'URL dashboard'
    },
    tags: ['membership', 'renewal', 'success', 'payment']
  },

  // ========== PAYMENT TEMPLATES ==========
  {
    name: 'Pembayaran Berhasil',
    slug: 'payment-success',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '💳 Pembayaran Berhasil - Invoice {{invoiceNumber}}',
    content: `Halo {{userName}},

Pembayaran Anda telah berhasil dikonfirmasi!

Detail Transaksi:
• Invoice: {{invoiceNumber}}
• Tanggal: {{transactionDate}}
• Metode: {{paymentMethod}}
• Total: {{amount}}
• Status: LUNAS

Untuk: {{itemDescription}}

Terima kasih atas kepercayaan Anda. Kami akan terus memberikan pelayanan terbaik untuk kesuksesan bisnis ekspor Anda.

Salam,
Tim Eksporyuk`,
    ctaText: 'Lihat Invoice',
    ctaLink: '{{invoiceUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      invoiceNumber: 'Nomor invoice',
      transactionDate: 'Tanggal transaksi',
      paymentMethod: 'Metode pembayaran',
      amount: 'Total pembayaran',
      itemDescription: 'Deskripsi item',
      invoiceUrl: 'URL invoice'
    },
    tags: ['payment', 'success', 'transaction', 'invoice']
  },

  {
    name: 'Pembayaran Ditolak',
    slug: 'payment-rejected',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '❌ Pembayaran Ditolak - Invoice {{invoiceNumber}}',
    content: `Halo {{userName}},

Mohon maaf, pembayaran Anda untuk invoice {{invoiceNumber}} tidak dapat diproses.

Alasan: {{rejectionReason}}

Detail Transaksi:
• Invoice: {{invoiceNumber}}
• Tanggal: {{transactionDate}}
• Total: {{amount}}
• Status: DITOLAK

Apa yang bisa dilakukan:
1. Cek kembali metode pembayaran Anda
2. Pastikan saldo mencukupi
3. Hubungi bank Anda jika perlu
4. Coba lagi dengan metode pembayaran lain

Jika masalah berlanjut, silakan hubungi:
• Email: {{supportEmail}}
• WhatsApp: {{supportWhatsapp}}

Tim kami siap membantu Anda.

Salam,
Tim Eksporyuk`,
    ctaText: 'Coba Lagi',
    ctaLink: '{{retryUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      invoiceNumber: 'Nomor invoice',
      rejectionReason: 'Alasan penolakan',
      transactionDate: 'Tanggal transaksi',
      amount: 'Total pembayaran',
      supportEmail: 'Email support',
      supportWhatsapp: 'WhatsApp support',
      retryUrl: 'URL retry payment'
    },
    tags: ['payment', 'rejected', 'failed', 'support']
  },

  // ========== COURSE TEMPLATES ==========
  {
    name: 'Berhasil Terdaftar di Kursus',
    slug: 'course-enrollment-success',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '📚 Selamat! Anda Terdaftar di "{{courseName}}"',
    content: `Halo {{userName}},

Selamat! Anda telah berhasil terdaftar di kursus:

📖 {{courseName}}
👨‍🏫 Instruktur: {{instructorName}}
⏱️ Durasi: {{courseDuration}}
📊 Level: {{courseLevel}}

Apa yang akan Anda pelajari:
{{courseHighlights}}

Kursus ini sudah tersedia dan siap Anda mulai kapan saja. Selesaikan semua materi untuk mendapatkan sertifikat digital.

Tips sukses menyelesaikan kursus:
• Buat jadwal belajar rutin
• Catat poin-poin penting
• Praktikkan langsung ilmunya
• Diskusi di grup jika ada pertanyaan
• Selesaikan semua quiz dan tugas

Mulai belajar sekarang!

Salam sukses,
Tim Eksporyuk`,
    ctaText: 'Mulai Belajar',
    ctaLink: '{{courseUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      courseName: 'Nama kursus',
      instructorName: 'Nama instruktur',
      courseDuration: 'Durasi kursus',
      courseLevel: 'Level kursus',
      courseHighlights: 'Highlight kursus',
      courseUrl: 'URL kursus'
    },
    tags: ['course', 'enrollment', 'success', 'learning']
  },

  {
    name: 'Sertifikat Kursus Siap',
    slug: 'course-certificate-ready',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '🎓 Selamat! Sertifikat "{{courseName}}" Anda Siap',
    content: `Halo {{userName}},

SELAMAT! Anda telah menyelesaikan kursus "{{courseName}}" dengan sukses! 🎉

Sertifikat digital Anda sudah siap dan bisa diunduh sekarang.

Detail Pencapaian:
• Kursus: {{courseName}}
• Skor Akhir: {{finalScore}}
• Tanggal Selesai: {{completionDate}}
• Nomor Sertifikat: {{certificateNumber}}

Sertifikat ini dapat Anda gunakan untuk:
✓ Portofolio profesional
✓ LinkedIn profile
✓ Curriculum Vitae
✓ Validasi kompetensi

Bagikan pencapaian Anda dan inspirasi orang lain!

Terus belajar dan berkembang bersama Eksporyuk.

Salam bangga,
Tim Eksporyuk`,
    ctaText: 'Download Sertifikat',
    ctaLink: '{{certificateUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      courseName: 'Nama kursus',
      finalScore: 'Nilai akhir',
      completionDate: 'Tanggal selesai',
      certificateNumber: 'Nomor sertifikat',
      certificateUrl: 'URL sertifikat'
    },
    tags: ['course', 'certificate', 'completion', 'achievement']
  },

  {
    name: 'Reminder Kursus Belum Selesai',
    slug: 'course-incomplete-reminder',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '⏰ Lanjutkan Kursus "{{courseName}}" Anda',
    content: `Halo {{userName}},

Kami melihat Anda belum menyelesaikan kursus "{{courseName}}".

Progress Anda saat ini:
📊 {{completionPercentage}}% selesai
📚 {{completedLessons}} dari {{totalLessons}} materi
⏱️ Terakhir akses: {{lastAccessDate}}

Jangan biarkan ilmu yang sudah Anda mulai terbuang percuma!

Manfaat menyelesaikan kursus ini:
✓ Sertifikat digital profesional
✓ Skill baru untuk bisnis ekspor
✓ Akses ke materi bonus
✓ Badge achievement

Sisihkan {{estimatedTime}} hari ini untuk lanjutkan belajar.

Anda pasti bisa! 💪

Salam semangat,
Tim Eksporyuk`,
    ctaText: 'Lanjutkan Belajar',
    ctaLink: '{{courseUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      courseName: 'Nama kursus',
      completionPercentage: 'Persentase penyelesaian',
      completedLessons: 'Jumlah materi selesai',
      totalLessons: 'Total materi',
      lastAccessDate: 'Tanggal akses terakhir',
      estimatedTime: 'Estimasi waktu',
      courseUrl: 'URL kursus'
    },
    tags: ['course', 'reminder', 'incomplete', 'motivation']
  },

  // ========== AFFILIATE TEMPLATES ==========
  {
    name: 'Aplikasi Affiliate Disetujui',
    slug: 'affiliate-application-approved',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🎉 Selamat! Aplikasi Affiliate Anda Disetujui',
    content: `Halo {{userName}},

SELAMAT! Aplikasi Anda sebagai Affiliate Eksporyuk telah DISETUJUI! 🎊

Akun affiliate Anda sekarang aktif dengan detail:
• Kode Referral: {{affiliateCode}}
• Komisi: {{commissionRate}}
• Status: AKTIF

Anda sekarang bisa mulai menghasilkan komisi dengan:
1. Bagikan link referral Anda
2. Promosikan produk dan membership
3. Dapatkan komisi dari setiap penjualan
4. Withdraw penghasilan ke rekening Anda

Tools yang tersedia:
✓ Dashboard affiliate lengkap
✓ Link referral otomatis
✓ Banner promosi
✓ Laporan real-time
✓ Marketing kit

Tips sukses sebagai affiliate:
• Share konten value di social media
• Bangun trust dengan audience
• Gunakan marketing kit yang disediakan
• Track performa secara rutin
• Ikuti pelatihan affiliate

Mulai hasilkan passive income sekarang!

Salam sukses,
Tim Eksporyuk`,
    ctaText: 'Akses Affiliate Dashboard',
    ctaLink: '{{affiliateDashboardUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      affiliateCode: 'Kode affiliate',
      commissionRate: 'Rate komisi',
      affiliateDashboardUrl: 'URL dashboard affiliate'
    },
    tags: ['affiliate', 'approval', 'activation', 'commission']
  },

  {
    name: 'Komisi Affiliate Diterima',
    slug: 'affiliate-commission-earned',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '💰 Anda Mendapat Komisi {{amount}}!',
    content: `Halo {{userName}},

Selamat! Anda baru saja mendapatkan komisi baru! 🎉

Detail Komisi:
• Jumlah: {{amount}}
• Dari: {{customerName}}
• Produk: {{productName}}
• Tanggal: {{commissionDate}}
• Kode Transaksi: {{transactionId}}

Total Komisi Anda Bulan Ini: {{monthlyTotal}}
Total Komisi Keseluruhan: {{totalEarnings}}

Saldo komisi bisa Anda withdraw kapan saja setelah mencapai minimum {{minWithdrawal}}.

Saldo saat ini: {{currentBalance}}

Tips tingkatkan komisi:
• Share lebih banyak konten value
• Engage dengan audience
• Gunakan multiple channel promosi
• Manfaatkan banner dan marketing kit
• Follow up leads yang potensial

Keep up the great work! 💪

Salam,
Tim Eksporyuk`,
    ctaText: 'Lihat Detail Komisi',
    ctaLink: '{{commissionDetailsUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      amount: 'Jumlah komisi',
      customerName: 'Nama customer',
      productName: 'Nama produk',
      commissionDate: 'Tanggal komisi',
      transactionId: 'ID transaksi',
      monthlyTotal: 'Total bulan ini',
      totalEarnings: 'Total keseluruhan',
      minWithdrawal: 'Minimum withdraw',
      currentBalance: 'Saldo saat ini',
      commissionDetailsUrl: 'URL detail komisi'
    },
    tags: ['affiliate', 'commission', 'earnings', 'success']
  },

  {
    name: 'Penarikan Dana Disetujui',
    slug: 'withdrawal-approved',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '✅ Penarikan Dana Anda Disetujui',
    content: `Halo {{userName}},

Permintaan penarikan dana Anda telah DISETUJUI dan sedang diproses! ✅

Detail Penarikan:
• Jumlah: {{amount}}
• Bank: {{bankName}}
• No. Rekening: {{accountNumber}}
• Atas Nama: {{accountName}}
• Tanggal Request: {{requestDate}}
• Tanggal Approval: {{approvalDate}}
• Kode Penarikan: {{withdrawalCode}}

Dana akan masuk ke rekening Anda dalam 1-3 hari kerja.

Jika ada pertanyaan, hubungi:
• Email: {{supportEmail}}
• WhatsApp: {{supportWhatsapp}}

Terima kasih telah menjadi bagian dari Eksporyuk!

Salam,
Tim Eksporyuk`,
    ctaText: 'Lihat Riwayat Penarikan',
    ctaLink: '{{withdrawalHistoryUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      amount: 'Jumlah penarikan',
      bankName: 'Nama bank',
      accountNumber: 'Nomor rekening',
      accountName: 'Nama pemilik rekening',
      requestDate: 'Tanggal request',
      approvalDate: 'Tanggal approval',
      withdrawalCode: 'Kode penarikan',
      supportEmail: 'Email support',
      supportWhatsapp: 'WhatsApp support',
      withdrawalHistoryUrl: 'URL riwayat penarikan'
    },
    tags: ['withdrawal', 'approved', 'payment', 'affiliate']
  },

  {
    name: 'Penarikan Dana Ditolak',
    slug: 'withdrawal-rejected',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '❌ Penarikan Dana Ditolak',
    content: `Halo {{userName}},

Mohon maaf, permintaan penarikan dana Anda tidak dapat diproses.

Detail Penarikan:
• Jumlah: {{amount}}
• Tanggal Request: {{requestDate}}
• Kode Penarikan: {{withdrawalCode}}
• Status: DITOLAK

Alasan Penolakan:
{{rejectionReason}}

Saldo Anda telah dikembalikan dan bisa Anda request kembali setelah memperbaiki masalah di atas.

Yang perlu dilakukan:
1. Periksa informasi rekening bank
2. Pastikan data sesuai dengan KTP
3. Cek minimum penarikan: {{minWithdrawal}}
4. Hubungi support jika butuh bantuan

Saldo saat ini: {{currentBalance}}

Hubungi kami:
• Email: {{supportEmail}}
• WhatsApp: {{supportWhatsapp}}

Kami siap membantu Anda.

Salam,
Tim Eksporyuk`,
    ctaText: 'Request Penarikan Lagi',
    ctaLink: '{{withdrawalUrl}}',
    isActive: true,
    isSystem: true,
    variables: {
      userName: 'Nama user',
      amount: 'Jumlah penarikan',
      requestDate: 'Tanggal request',
      withdrawalCode: 'Kode penarikan',
      rejectionReason: 'Alasan penolakan',
      minWithdrawal: 'Minimum penarikan',
      currentBalance: 'Saldo saat ini',
      supportEmail: 'Email support',
      supportWhatsapp: 'WhatsApp support',
      withdrawalUrl: 'URL request penarikan'
    },
    tags: ['withdrawal', 'rejected', 'support', 'affiliate']
  },

  // ========== NOTIFICATION TEMPLATES ==========
  {
    name: 'Notifikasi Umum',
    slug: 'general-notification',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '📢 {{notificationTitle}}',
    content: `Halo {{userName}},

{{notificationMessage}}

{{additionalInfo}}

Untuk informasi lebih lanjut, kunjungi dashboard Anda atau hubungi tim support.

Terima kasih atas perhatiannya.

Salam,
Tim Eksporyuk`,
    ctaText: '{{ctaButtonText}}',
    ctaLink: '{{ctaButtonUrl}}',
    isActive: true,
    isSystem: false,
    variables: {
      userName: 'Nama user',
      notificationTitle: 'Judul notifikasi',
      notificationMessage: 'Isi notifikasi',
      additionalInfo: 'Info tambahan',
      ctaButtonText: 'Teks tombol CTA',
      ctaButtonUrl: 'URL tombol CTA'
    },
    tags: ['notification', 'general', 'announcement']
  },

  {
    name: 'Pengumuman Penting',
    slug: 'important-announcement',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '🔔 PENTING: {{announcementTitle}}',
    content: `Halo {{userName}},

PENGUMUMAN PENTING

{{announcementMessage}}

Hal yang perlu Anda ketahui:
{{keyPoints}}

Tanggal Efektif: {{effectiveDate}}

{{actionRequired}}

Jika ada pertanyaan, silakan hubungi:
• Email: {{supportEmail}}
• WhatsApp: {{supportWhatsapp}}

Terima kasih atas perhatian dan kerjasamanya.

Salam,
Tim Eksporyuk`,
    ctaText: 'Baca Selengkapnya',
    ctaLink: '{{announcementUrl}}',
    isActive: true,
    isSystem: false,
    variables: {
      userName: 'Nama user',
      announcementTitle: 'Judul pengumuman',
      announcementMessage: 'Isi pengumuman',
      keyPoints: 'Poin-poin penting',
      effectiveDate: 'Tanggal efektif',
      actionRequired: 'Tindakan yang diperlukan',
      supportEmail: 'Email support',
      supportWhatsapp: 'WhatsApp support',
      announcementUrl: 'URL pengumuman'
    },
    tags: ['announcement', 'important', 'notification']
  },

  // ========== MARKETING TEMPLATES ==========
  {
    name: 'Promo Special',
    slug: 'special-promotion',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '🎁 {{promoTitle}} - Special untuk Anda!',
    content: `Halo {{userName}},

Ada kabar gembira untuk Anda! 🎉

{{promoHeadline}}

{{promoDescription}}

Benefit yang Anda dapatkan:
{{promoBenefits}}

DISKON: {{discountAmount}}
KODE PROMO: {{promoCode}}

⏰ Promo berlaku sampai: {{promoEndDate}}

Jangan lewatkan kesempatan emas ini!

Syarat & Ketentuan:
{{termsConditions}}

Klaim promo Anda sekarang sebelum terlambat!

Salam,
Tim Eksporyuk`,
    ctaText: 'Klaim Promo',
    ctaLink: '{{promoUrl}}',
    isActive: true,
    isSystem: false,
    variables: {
      userName: 'Nama user',
      promoTitle: 'Judul promo',
      promoHeadline: 'Headline promo',
      promoDescription: 'Deskripsi promo',
      promoBenefits: 'Benefit promo',
      discountAmount: 'Jumlah diskon',
      promoCode: 'Kode promo',
      promoEndDate: 'Tanggal berakhir promo',
      termsConditions: 'Syarat & ketentuan',
      promoUrl: 'URL promo'
    },
    tags: ['marketing', 'promotion', 'discount', 'campaign']
  },

  {
    name: 'Newsletter Bulanan',
    slug: 'monthly-newsletter',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '📰 Newsletter {{monthYear}} - Update Eksporyuk',
    content: `Halo {{userName}},

Selamat datang di Newsletter Eksporyuk edisi {{monthYear}}! 📰

=== HIGHLIGHT BULAN INI ===

{{monthlyHighlights}}

=== KURSUS TERBARU ===

{{newCourses}}

=== TIPS EKSPOR ===

{{exportTips}}

=== SUCCESS STORY ===

{{successStory}}

=== UPCOMING EVENTS ===

{{upcomingEvents}}

=== SPECIAL ANNOUNCEMENT ===

{{specialAnnouncement}}

Terima kasih telah menjadi bagian dari komunitas Eksporyuk!

Salam sukses,
Tim Eksporyuk`,
    ctaText: 'Baca Selengkapnya',
    ctaLink: '{{newsletterUrl}}',
    isActive: true,
    isSystem: false,
    variables: {
      userName: 'Nama user',
      monthYear: 'Bulan tahun',
      monthlyHighlights: 'Highlight bulanan',
      newCourses: 'Kursus baru',
      exportTips: 'Tips ekspor',
      successStory: 'Success story',
      upcomingEvents: 'Event mendatang',
      specialAnnouncement: 'Pengumuman khusus',
      newsletterUrl: 'URL newsletter'
    },
    tags: ['newsletter', 'marketing', 'monthly', 'update']
  }
]

// Helper: Extract variables from template content
function extractVariables(content) {
  const regex = /{{(\w+)}}/g
  const variables = new Set()
  let match
  
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1])
  }
  
  return Array.from(variables)
}

// Main seed function
async function main() {
  console.log('🌱 Starting branded templates seed...\n')

  // Clear existing templates (optional - comment if you want to keep existing)
  console.log('🗑️  Clearing existing templates...')
  await prisma.brandedTemplate.deleteMany({})
  console.log('✅ Existing templates cleared\n')

  let created = 0
  let errors = 0

  for (const template of templates) {
    try {
      const result = await prisma.brandedTemplate.create({
        data: {
          ...template,
          usageCount: 0
        }
      })

      created++
      console.log(`✅ Created: ${template.name}`)
    } catch (error) {
      errors++
      console.error(`❌ Error seeding ${template.name}:`, error.message)
    }
  }

  console.log('\n📊 Seed Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Errors: ${errors}`)
  console.log(`   Total Templates: ${templates.length}`)
  
  // Verify seeded data
  const count = await prisma.brandedTemplate.count()
  console.log(`\n✨ Total templates in database: ${count}`)

  // Group by category
  const byCategory = await prisma.brandedTemplate.groupBy({
    by: ['category'],
    _count: true
  })
  
  console.log('\n📋 Templates by Category:')
  byCategory.forEach(cat => {
    console.log(`   ${cat.category}: ${cat._count} templates`)
  })
}

// Execute
main()
  .catch(e => {
    console.error('💥 Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Seed completed!')
  })
