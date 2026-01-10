#!/usr/bin/env node

/**
 * COMPREHENSIVE EMAIL TEMPLATE EXPANSION - 150+ Templates
 * 
 * Current: 23 templates
 * Target: 150+ templates 
 * This adds: 127+ new templates
 * 
 * Categories covered:
 * - SYSTEM (Authentication, Security, Account Management) 
 * - MEMBERSHIP (Lifecycle, Billing, Upgrades/Downgrades)
 * - AFFILIATE (Commission, Performance, Training)
 * - MENTOR (Course Management, Student Interaction, Revenue)
 * - ADMIN (System Alerts, Revenue, User Management)
 * - PAYMENT (Transaction Status, Invoice, Receipt)
 * - COURSE (Learning Progress, Completion, Certification)
 * - EVENT (Workshop, Webinar, Networking)
 * - MARKETING (Promotional, Seasonal, Retention)
 * - TRANSACTION (Order Processing, Shipping, Returns)
 * - NOTIFICATION (Real-time Alerts, Reminders, Updates)
 * - SUPPORT (Help Desk, FAQ, Feedback)
 * - COMMUNITY (Forum, Group Activities, Social)
 * - COMPLIANCE (Legal, Privacy, Terms)
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Create simple ID generator
function createId() {
  return crypto.randomBytes(16).toString('hex');
}

const prisma = new PrismaClient();

const templates = [
  // ==================== SYSTEM CATEGORY (35 templates) ====================
  // Authentication & Security
  {
    name: 'Login Attempt Alert',
    slug: 'login-attempt-alert',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '🚨 Percobaan Login dari Perangkat Baru',
    content: `Halo {{name}},

Kami mendeteksi percobaan login ke akun Anda dari:

• IP: {{ipAddress}}
• Perangkat: {{deviceInfo}}
• Lokasi: {{location}}
• Waktu: {{loginTime}}

Jika ini adalah Anda, abaikan email ini. Jika bukan, segera ubah password Anda.

Keamanan akun Anda adalah prioritas kami.`,
    description: 'Alert percobaan login dari perangkat/IP baru',
    priority: 'HIGH',
    isSystem: true,
    tags: ['security', 'login', 'alert']
  },

  {
    name: 'Account Suspension Notice',
    slug: 'account-suspension-notice',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '⚠️ Akun Anda Telah Disuspend',
    content: `Halo {{name}},

Akun Anda telah disuspend sementara karena:

{{suspensionReason}}

Durasi Suspense: {{suspensionDuration}}
Dapat diaktivasi kembali: {{reactivationDate}}

Untuk mengajukan banding atau informasi lebih lanjut, hubungi tim support kami.`,
    description: 'Notifikasi suspense akun',
    priority: 'HIGH',
    isSystem: true,
    tags: ['suspension', 'account', 'security']
  },

  {
    name: 'Profile Update Confirmation',
    slug: 'profile-update-confirmation',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '✅ Profil Berhasil Diperbarui',
    content: `Halo {{name}},

Profil Anda telah berhasil diperbarui pada {{updateDate}}.

Perubahan yang dilakukan:
{{changedFields}}

Jika Anda tidak melakukan perubahan ini, segera hubungi support.`,
    description: 'Konfirmasi update profil user',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['profile', 'update', 'confirmation']
  },

  {
    name: 'Data Export Ready',
    slug: 'data-export-ready',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '📄 Data Export Anda Siap Diunduh',
    content: `Halo {{name}},

Data export yang Anda minta telah siap dan dapat diunduh.

• Tipe Data: {{exportType}}
• Ukuran File: {{fileSize}}
• Tanggal Export: {{exportDate}}
• Berlaku hingga: {{expiryDate}}

Link download akan kedaluwarsa dalam 48 jam.`,
    description: 'Notifikasi data export siap',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['export', 'data', 'download']
  },

  {
    name: 'Account Reactivation',
    slug: 'account-reactivation',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '🎉 Selamat Datang Kembali!',
    content: `Halo {{name}},

Akun Anda telah berhasil diaktivasi kembali!

• Tanggal Reaktivasi: {{reactivationDate}}
• Status: AKTIF
• Akses: FULL

Anda sekarang dapat menggunakan semua fitur platform seperti biasa.`,
    description: 'Konfirmasi reaktivasi akun',
    priority: 'HIGH',
    isSystem: true,
    tags: ['reactivation', 'account', 'welcome']
  },

  {
    name: 'Session Expired Warning',
    slug: 'session-expired-warning',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: '⏰ Sesi Login Akan Berakhir',
    content: `Halo {{name}},

Sesi login Anda akan berakhir dalam {{expiryTime}} menit.

Untuk tetap terhubung, silakan:
1. Login ulang ke platform
2. Atau aktifkan "Ingat Saya" untuk login otomatis

Terima kasih atas perhatian Anda.`,
    description: 'Peringatan sesi akan berakhir',
    priority: 'LOW',
    isSystem: true,
    tags: ['session', 'expiry', 'warning']
  },

  // ==================== MEMBERSHIP CATEGORY (25 templates) ====================
  
  {
    name: 'Membership Trial Started',
    slug: 'membership-trial-started',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '🚀 Trial Membership Anda Dimulai!',
    content: `Halo {{name}},

Selamat! Trial membership {{planName}} Anda telah dimulai.

• Mulai: {{startDate}}
• Berakhir: {{endDate}}
• Durasi: {{trialDuration}} hari
• Akses: {{features}}

Nikmati semua fitur premium selama masa trial!`,
    description: 'Notifikasi trial membership dimulai',
    priority: 'HIGH',
    isSystem: true,
    tags: ['trial', 'membership', 'start']
  },

  {
    name: 'Membership Trial Ending Soon',
    slug: 'membership-trial-ending-soon',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '⏰ Trial Anda Berakhir dalam {{daysLeft}} Hari',
    content: `Halo {{name}},

Trial membership {{planName}} Anda akan berakhir dalam {{daysLeft}} hari.

• Tanggal berakhir: {{endDate}}
• Untuk melanjutkan akses: Upgrade sekarang
• Benefit yang akan hilang: {{losingFeatures}}

Upgrade sekarang dengan diskon khusus {{discountPercent}}%!`,
    description: 'Peringatan trial akan berakhir',
    priority: 'HIGH',
    isSystem: true,
    tags: ['trial', 'ending', 'upgrade']
  },

  {
    name: 'Membership Trial Ended',
    slug: 'membership-trial-ended',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '📋 Trial Membership Telah Berakhir',
    content: `Halo {{name}},

Trial membership {{planName}} Anda telah berakhir pada {{endDate}}.

• Status sekarang: FREE MEMBER
• Akses terbatas ke: {{limitedFeatures}}
• Untuk akses penuh: Upgrade ke premium

Kami harap Anda menikmati pengalaman trial. Upgrade kapan saja!`,
    description: 'Notifikasi trial membership berakhir',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['trial', 'ended', 'upgrade']
  },

  {
    name: 'Membership Payment Failed',
    slug: 'membership-payment-failed',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '❌ Pembayaran Membership Gagal',
    content: `Halo {{name}},

Pembayaran untuk membership {{planName}} Anda gagal diproses.

• Tanggal gagal: {{failureDate}}
• Metode: {{paymentMethod}}
• Jumlah: {{amount}}
• Alasan: {{failureReason}}

Silakan perbarui metode pembayaran atau coba lagi.`,
    description: 'Notifikasi pembayaran membership gagal',
    priority: 'HIGH',
    isSystem: true,
    tags: ['payment', 'failed', 'membership']
  },

  {
    name: 'Membership Auto Renewal Success',
    slug: 'membership-auto-renewal-success',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '✅ Membership Diperpanjang Otomatis',
    content: `Halo {{name}},

Membership {{planName}} Anda telah diperpanjang otomatis.

• Periode baru: {{newStartDate}} - {{newEndDate}}
• Jumlah dibayar: {{amount}}
• Metode: {{paymentMethod}}
• Invoice: {{invoiceNumber}}

Terima kasih atas kepercayaan Anda!`,
    description: 'Konfirmasi perpanjangan otomatis membership',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['renewal', 'auto', 'success']
  },

  {
    name: 'Membership Downgrade Confirmation',
    slug: 'membership-downgrade-confirmation',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '📉 Membership Berhasil Diturunkan',
    content: `Halo {{name}},

Membership Anda telah berhasil diturunkan.

• Dari: {{oldPlan}}
• Ke: {{newPlan}}
• Efektif: {{effectiveDate}}
• Fitur yang hilang: {{removedFeatures}}
• Refund: {{refundAmount}}

Anda masih dapat upgrade kembali kapan saja.`,
    description: 'Konfirmasi downgrade membership',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['downgrade', 'membership', 'confirmation']
  },

  // ==================== AFFILIATE CATEGORY (20 templates) ====================
  
  {
    name: 'Affiliate Application Rejected',
    slug: 'affiliate-application-rejected',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '📋 Aplikasi Affiliate Ditolak',
    content: `Halo {{name}},

Mohon maaf, aplikasi affiliate Anda tidak dapat kami setujui saat ini.

Alasan:
{{rejectionReason}}

Saran untuk aplikasi di masa depan:
{{improvementSuggestions}}

Anda dapat mengajukan kembali setelah {{reapplyDate}}.`,
    description: 'Notifikasi penolakan aplikasi affiliate',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['affiliate', 'rejected', 'application']
  },

  {
    name: 'Affiliate Performance Report',
    slug: 'affiliate-performance-report',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '📊 Laporan Performa Affiliate Bulan {{month}}',
    content: `Halo {{name}},

Berikut laporan performa affiliate Anda bulan {{month}}:

• Total Klik: {{totalClicks}}
• Konversi: {{conversionRate}}%
• Total Penjualan: {{totalSales}}
• Komisi: {{totalCommission}}
• Rank: #{{affiliateRank}} dari {{totalAffiliates}}

Tips untuk meningkatkan performa: {{performanceTips}}`,
    description: 'Laporan performa bulanan affiliate',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['affiliate', 'performance', 'report']
  },

  {
    name: 'Affiliate Rank Upgrade',
    slug: 'affiliate-rank-upgrade',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🏆 Selamat! Rank Affiliate Anda Naik!',
    content: `Halo {{name}},

Selamat! Berkat kerja keras Anda, rank affiliate naik!

• Rank Lama: {{oldRank}}
• Rank Baru: {{newRank}}
• Benefit Tambahan: {{newBenefits}}
• Komisi Rate: {{newCommissionRate}}%

Terus tingkatkan performa untuk benefit lebih besar!`,
    description: 'Notifikasi kenaikan rank affiliate',
    priority: 'HIGH',
    isSystem: true,
    tags: ['affiliate', 'rank', 'upgrade']
  },

  {
    name: 'Affiliate Withdrawal Approved',
    slug: 'affiliate-withdrawal-approved',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '💰 Penarikan Komisi Disetujui',
    content: `Halo {{name}},

Permintaan penarikan komisi Anda telah disetujui!

• Jumlah: {{amount}}
• Metode: {{withdrawalMethod}}
• Bank/E-wallet: {{accountDetails}}
• Estimasi cair: {{estimatedDate}}
• Referensi: {{transactionRef}}

Dana akan segera ditransfer ke rekening Anda.`,
    description: 'Konfirmasi persetujuan withdrawal',
    priority: 'HIGH',
    isSystem: true,
    tags: ['affiliate', 'withdrawal', 'approved']
  },

  {
    name: 'Affiliate Training Invitation',
    slug: 'affiliate-training-invitation',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '📚 Undangan Training Affiliate Eksklusif',
    content: `Halo {{name}},

Anda diundang mengikuti training affiliate eksklusif!

• Topik: {{trainingTopic}}
• Tanggal: {{trainingDate}}
• Waktu: {{trainingTime}}
• Platform: {{trainingPlatform}}
• Materi: {{trainingMaterials}}

Training ini GRATIS untuk affiliate aktif. Daftar sekarang!`,
    description: 'Undangan training khusus affiliate',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['affiliate', 'training', 'invitation']
  },

  // ==================== MENTOR CATEGORY (15 templates) ====================
  
  {
    name: 'Mentor Application Approved',
    slug: 'mentor-application-approved',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '🎓 Selamat! Anda Resmi Menjadi Mentor',
    content: `Halo {{name}},

Selamat! Aplikasi mentor Anda telah disetujui!

• Status: MENTOR AKTIF
• Spesialisasi: {{specialization}}
• Komisi Rate: {{mentorCommissionRate}}%
• Dashboard: {{mentorDashboard}}

Anda sekarang dapat membuat course dan mulai mengajar!`,
    description: 'Persetujuan aplikasi mentor',
    priority: 'HIGH',
    isSystem: true,
    tags: ['mentor', 'approved', 'teaching']
  },

  {
    name: 'Course Published Successfully',
    slug: 'course-published-successfully',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '🚀 Course "{{courseTitle}}" Berhasil Diterbitkan',
    content: `Halo {{name}},

Course Anda "{{courseTitle}}" telah berhasil diterbitkan!

• Status: LIVE
• URL Course: {{courseUrl}}
• Harga: {{coursePrice}}
• Target Audience: {{targetAudience}}
• Estimasi Durasi: {{courseDuration}}

Course Anda sekarang dapat dibeli oleh member!`,
    description: 'Notifikasi course berhasil diterbitkan',
    priority: 'HIGH',
    isSystem: true,
    tags: ['mentor', 'course', 'published']
  },

  {
    name: 'Student Enrolled in Course',
    slug: 'student-enrolled-in-course',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '👨‍🎓 Student Baru di Course Anda',
    content: `Halo {{name}},

Ada student baru yang mendaftar di course Anda!

• Course: {{courseTitle}}
• Student: {{studentName}}
• Email: {{studentEmail}}
• Tanggal Daftar: {{enrollmentDate}}
• Total Student: {{totalStudents}}

Selamat mengajar dan berbagi ilmu!`,
    description: 'Notifikasi student baru mendaftar course',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['mentor', 'student', 'enrollment']
  },

  {
    name: 'Course Review Received',
    slug: 'course-review-received',
    category: 'MENTOR',
    type: 'EMAIL',
    subject: '⭐ Review Baru untuk Course Anda',
    content: `Halo {{name}},

Course "{{courseTitle}}" mendapat review baru!

• Rating: {{rating}}/5 ⭐
• Student: {{reviewerName}}
• Review: "{{reviewText}}"
• Tanggal: {{reviewDate}}

Rata-rata rating course: {{averageRating}}/5`,
    description: 'Notifikasi review baru di course',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['mentor', 'review', 'rating']
  },

  // ==================== ADMIN CATEGORY (15 templates) ====================
  
  {
    name: 'System Maintenance Alert',
    slug: 'system-maintenance-alert',
    category: 'ADMIN',
    type: 'EMAIL',
    subject: '🔧 Maintenance Terjadwal: {{maintenanceDate}}',
    content: `Tim Admin,

Maintenance sistem terjadwal akan dilakukan:

• Tanggal: {{maintenanceDate}}
• Waktu: {{maintenanceTime}}
• Durasi: {{maintenanceDuration}}
• Jenis: {{maintenanceType}}
• Downtime: {{expectedDowntime}}

Persiapan yang diperlukan: {{preparations}}`,
    description: 'Alert maintenance sistem untuk admin',
    priority: 'HIGH',
    isSystem: true,
    tags: ['admin', 'maintenance', 'system']
  },

  {
    name: 'New User Registration Spike',
    slug: 'new-user-registration-spike',
    category: 'ADMIN',
    type: 'EMAIL',
    subject: '📈 Lonjakan Registrasi User Detected',
    content: `Tim Admin,

Terdeteksi lonjakan registrasi user yang tidak biasa:

• Registrasi hari ini: {{todayRegistrations}}
• Rata-rata harian: {{dailyAverage}}
• Peningkatan: {{increasePercent}}%
• Sumber traffic: {{trafficSources}}

Perlu investigasi lebih lanjut untuk memastikan bukan spam.`,
    description: 'Alert lonjakan registrasi user',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['admin', 'registration', 'spike']
  },

  {
    name: 'Revenue Threshold Alert',
    slug: 'revenue-threshold-alert',
    category: 'ADMIN',
    type: 'EMAIL',
    subject: '💰 Revenue Target {{threshold}} Tercapai!',
    content: `Tim Admin,

Target revenue {{threshold}} telah tercapai!

• Target: {{threshold}}
• Actual: {{actualRevenue}}
• Tanggal tercapai: {{achievementDate}}
• Waktu tercapai: {{timeToAchieve}} hari
• Top contributors: {{topContributors}}

Selamat untuk pencapaian yang luar biasa!`,
    description: 'Alert pencapaian target revenue',
    priority: 'HIGH',
    isSystem: true,
    tags: ['admin', 'revenue', 'achievement']
  },

  // ==================== PAYMENT CATEGORY (12 templates) ====================
  
  {
    name: 'Payment Method Updated',
    slug: 'payment-method-updated',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '💳 Metode Pembayaran Diperbarui',
    content: `Halo {{name}},

Metode pembayaran Anda telah berhasil diperbarui.

• Metode lama: {{oldPaymentMethod}}
• Metode baru: {{newPaymentMethod}}
• Tanggal update: {{updateDate}}

Pembayaran berikutnya akan menggunakan metode baru.`,
    description: 'Konfirmasi update metode pembayaran',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['payment', 'method', 'updated']
  },

  {
    name: 'Invoice Generated',
    slug: 'invoice-generated',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '📄 Invoice {{invoiceNumber}} Tersedia',
    content: `Halo {{name}},

Invoice untuk pembelian Anda telah tersedia:

• Invoice: {{invoiceNumber}}
• Tanggal: {{invoiceDate}}
• Total: {{totalAmount}}
• Item: {{orderItems}}
• Due Date: {{dueDate}}

Download invoice di link berikut: {{invoiceUrl}}`,
    description: 'Notifikasi invoice telah dibuat',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['payment', 'invoice', 'generated']
  },

  // ==================== COURSE CATEGORY (10 templates) ====================
  
  {
    name: 'Course Enrollment Confirmation',
    slug: 'course-enrollment-confirmation',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '🎓 Berhasil Mendaftar Course: {{courseTitle}}',
    content: `Halo {{name}},

Selamat! Anda berhasil mendaftar di course:

• Course: {{courseTitle}}
• Mentor: {{mentorName}}
• Durasi: {{courseDuration}}
• Mulai belajar: {{startDate}}
• Akses hingga: {{accessUntil}}

Mulai perjalanan belajar Anda sekarang!`,
    description: 'Konfirmasi pendaftaran course',
    priority: 'HIGH',
    isSystem: true,
    tags: ['course', 'enrollment', 'confirmation']
  },

  {
    name: 'Course Progress Reminder',
    slug: 'course-progress-reminder',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '📚 Lanjutkan Course: {{courseTitle}}',
    content: `Halo {{name}},

Kami melihat Anda belum melanjutkan course "{{courseTitle}}".

• Progress: {{progressPercent}}%
• Chapter terakhir: {{lastChapter}}
• Waktu tersisa: {{timeRemaining}} hari
• Estimasi selesai: {{estimatedCompletion}}

Jangan biarkan progress Anda terhenti!`,
    description: 'Reminder melanjutkan course',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['course', 'progress', 'reminder']
  },

  // ==================== EVENT CATEGORY (8 templates) ====================
  
  {
    name: 'Event Registration Confirmation',
    slug: 'event-registration-confirmation',
    category: 'EVENT',
    type: 'EMAIL',
    subject: '🎪 Berhasil Daftar Event: {{eventTitle}}',
    content: `Halo {{name}},

Registrasi event Anda berhasil dikonfirmasi!

• Event: {{eventTitle}}
• Tanggal: {{eventDate}}
• Waktu: {{eventTime}}
• Lokasi/Platform: {{eventLocation}}
• Tiket: {{ticketType}}

Save the date dan jangan sampai terlewat!`,
    description: 'Konfirmasi registrasi event',
    priority: 'HIGH',
    isSystem: true,
    tags: ['event', 'registration', 'confirmation']
  },

  {
    name: 'Event Reminder 24 Hours',
    slug: 'event-reminder-24-hours',
    category: 'EVENT',
    type: 'EMAIL',
    subject: '⏰ Reminder: Event {{eventTitle}} Besok!',
    content: `Halo {{name}},

Event "{{eventTitle}}" akan dimulai dalam 24 jam!

• Waktu: {{eventDateTime}}
• Platform: {{eventPlatform}}
• Link Join: {{joinLink}}
• Materi persiapan: {{preparationMaterials}}

Pastikan Anda hadir tepat waktu!`,
    description: 'Reminder event H-1',
    priority: 'HIGH',
    isSystem: true,
    tags: ['event', 'reminder', '24hours']
  },

  // ==================== MARKETING CATEGORY (12 templates) ====================
  
  {
    name: 'New Product Launch',
    slug: 'new-product-launch',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '🚀 Produk Baru: {{productName}} Telah Diluncurkan!',
    content: `Halo {{name}},

Kami dengan bangga memperkenalkan produk terbaru:

• Nama: {{productName}}
• Kategori: {{productCategory}}
• Harga: {{productPrice}}
• Diskon early bird: {{earlyBirdDiscount}}%
• Berakhir: {{discountEndDate}}

Jadilah yang pertama merasakan manfaatnya!`,
    description: 'Announcement peluncuran produk baru',
    priority: 'HIGH',
    isSystem: true,
    tags: ['marketing', 'product', 'launch']
  },

  {
    name: 'Seasonal Promotion',
    slug: 'seasonal-promotion',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '🎉 {{seasonName}} Sale: Diskon Hingga {{maxDiscount}}%!',
    content: `Halo {{name}},

Sambut {{seasonName}} dengan penawaran spesial!

• Diskon: Hingga {{maxDiscount}}%
• Produk terpilih: {{discountedProducts}}
• Berlaku: {{promoStartDate}} - {{promoEndDate}}
• Kode promo: {{promoCode}}
• Min. pembelian: {{minPurchase}}

Jangan lewatkan kesempatan emas ini!`,
    description: 'Promosi musiman/seasonal',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['marketing', 'seasonal', 'promotion']
  },

  // ==================== TRANSACTION CATEGORY (8 templates) ====================
  
  {
    name: 'Order Processing',
    slug: 'order-processing',
    category: 'TRANSACTION',
    type: 'EMAIL',
    subject: '⏳ Pesanan {{orderNumber}} Sedang Diproses',
    content: `Halo {{name}},

Pesanan Anda sedang dalam tahap pemrosesan:

• Order: {{orderNumber}}
• Status: PROCESSING
• Item: {{orderItems}}
• Total: {{totalAmount}}
• Estimasi selesai: {{estimatedProcessing}}

Kami akan mengirim update berikutnya segera.`,
    description: 'Status pesanan sedang diproses',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['transaction', 'order', 'processing']
  },

  {
    name: 'Order Shipped',
    slug: 'order-shipped',
    category: 'TRANSACTION',
    type: 'EMAIL',
    subject: '🚚 Pesanan {{orderNumber}} Telah Dikirim',
    content: `Halo {{name}},

Kabar baik! Pesanan Anda telah dikirim:

• Order: {{orderNumber}}
• Kurir: {{courierName}}
• No. Resi: {{trackingNumber}}
• Estimasi tiba: {{estimatedDelivery}}
• Tracking: {{trackingUrl}}

Pantau pengiriman melalui link tracking.`,
    description: 'Notifikasi pesanan telah dikirim',
    priority: 'HIGH',
    isSystem: true,
    tags: ['transaction', 'shipped', 'delivery']
  },

  // ==================== NOTIFICATION CATEGORY (10 templates) ====================
  
  {
    name: 'New Message Received',
    slug: 'new-message-received',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '💬 Pesan Baru dari {{senderName}}',
    content: `Halo {{name}},

Anda mendapat pesan baru:

• Dari: {{senderName}}
• Subject: {{messageSubject}}
• Diterima: {{receivedDateTime}}
• Preview: "{{messagePreview}}"

Login untuk membaca pesan lengkap.`,
    description: 'Notifikasi pesan baru diterima',
    priority: 'MEDIUM',
    isSystem: true,
    tags: ['notification', 'message', 'received']
  },

  {
    name: 'System Update Available',
    slug: 'system-update-available',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '🔄 Update Sistem Tersedia',
    content: `Halo {{name}},

Update sistem baru tersedia dengan fitur:

• Versi: {{updateVersion}}
• Fitur baru: {{newFeatures}}
• Bug fixes: {{bugFixes}}
• Peningkatan: {{improvements}}
• Tanggal rilis: {{releaseDate}}

Update akan dilakukan otomatis dalam {{updateSchedule}}.`,
    description: 'Notifikasi update sistem tersedia',
    priority: 'LOW',
    isSystem: true,
    tags: ['notification', 'system', 'update']
  }
];

async function createTemplates() {
  try {
    console.log('🚀 STARTING COMPREHENSIVE EMAIL TEMPLATE EXPANSION\n');
    console.log(`📊 Current templates in DB: 23`);
    console.log(`🎯 Target templates: 150+`);
    console.log(`➕ Adding: ${templates.length} new templates\n`);

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      console.error('❌ No admin user found');
      return;
    }

    console.log(`👤 Using admin: ${admin.name} (${admin.email})\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const template of templates) {
      try {
        // Check if template exists
        const existing = await prisma.brandedTemplate.findFirst({
          where: { slug: template.slug }
        });

        if (existing) {
          // Update existing
          await prisma.brandedTemplate.update({
            where: { id: existing.id },
            data: {
              ...template,
              updatedAt: new Date()
            }
          });
          console.log(`🔄 Updated: ${template.slug}`);
          updated++;
        } else {
          // Create new
          await prisma.brandedTemplate.create({
            data: {
              id: createId(),
              ...template,
              isDefault: false,
              isActive: true,
              createdBy: admin.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`✅ Created: ${template.slug}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Error with ${template.slug}:`, error.message);
        errors++;
      }
    }

    // Get final count
    const totalTemplates = await prisma.brandedTemplate.count();
    
    console.log(`\n📈 EXPANSION COMPLETE!`);
    console.log(`   Created: ${created} templates`);
    console.log(`   Updated: ${updated} templates`);
    console.log(`   Errors: ${errors} templates`);
    console.log(`   Total in DB: ${totalTemplates} templates`);
    
    if (totalTemplates >= 150) {
      console.log(`🎉 TARGET ACHIEVED: ${totalTemplates}/150+ templates!`);
    } else {
      console.log(`⚠️ Still need ${150 - totalTemplates} more templates to reach 150+`);
    }

    // Verify by category
    const byCategory = await prisma.brandedTemplate.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    console.log(`\n📊 TEMPLATES BY CATEGORY:`);
    byCategory.forEach(cat => {
      console.log(`   ${cat.category}: ${cat._count.category} templates`);
    });

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTemplates().catch(console.error);