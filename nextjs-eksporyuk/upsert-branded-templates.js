/**
 * Upsert Branded Email Templates (SAFE)
 * - Adds/updates 60+ templates across categories
 * - Plain text only content (no HTML) for admin editing
 * - Does NOT delete existing templates
 *
 * Usage:
 *   node upsert-branded-templates.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function t(strings, ...values) {
  // simple trim helper to keep content tidy
  const full = strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '')
  return full
    .split('\n')
    .map(l => l.replace(/\s+$/g, ''))
    .join('\n')
    .trim()
}

function template({ name, category, subject, content, ctaText, ctaLink, roleTarget, isDefault = false, isSystem = false, tags = [], slug, type = 'EMAIL' }) {
  return {
    name,
    slug: slug || slugify(name),
    category,
    type,
    roleTarget: roleTarget || null,
    subject,
    content,
    ctaText: ctaText || null,
    ctaLink: ctaLink || null,
    isDefault,
    isSystem,
    isActive: true,
    tags,
  }
}

function buildTemplates() {
  const SITE = '{site.name}'
  const DASH = '{links.dashboard}'

  const SYSTEM = [
    template({
      name: 'System • Welcome New User',
      category: 'SYSTEM',
      subject: `Selamat Datang di ${SITE}!`,
      content: t`Halo {name},

Selamat datang di ${SITE}! Akun Anda telah aktif.

Anda sekarang bisa:
• Akses dashboard pribadi
• Menjelajah materi pembelajaran
• Bergabung komunitas
• Mengatur profil dan keamanan akun

Jika butuh bantuan, hubungi support kami di {site.support_email}.`,
      ctaText: 'Buka Dashboard',
      ctaLink: DASH,
      isSystem: true,
      isDefault: true,
      tags: ['welcome','system','onboarding']
    }),
    template({
      name: 'System • Email Verification',
      category: 'SYSTEM',
      subject: 'Verifikasi Email Anda - {site.name}',
      content: t`Halo {name},

Untuk mengaktifkan akun, silakan verifikasi email Anda.
Link verifikasi berlaku selama 24 jam.`,
      ctaText: 'Verifikasi Email',
      ctaLink: '{verification.link}',
      isSystem: true,
      isDefault: true,
      tags: ['verification','security']
    }),
    template({
      name: 'System • Password Reset Request',
      category: 'SYSTEM',
      subject: 'Permintaan Reset Password - {site.name}',
      content: t`Halo {name},

Kami menerima permintaan reset password akun Anda.
Jika ini Anda, gunakan tombol berikut untuk membuat password baru.
Link berlaku 1 jam. Abaikan jika Anda tidak meminta.`,
      ctaText: 'Reset Password',
      ctaLink: '{reset.link}',
      isSystem: true,
      tags: ['password','reset','security']
    }),
    template({
      name: 'System • Password Changed',
      category: 'SYSTEM',
      subject: 'Password Berhasil Diubah',
      content: t`Halo {name},

Password akun Anda telah berhasil diubah pada {security.changed_at}.
Jika ini bukan Anda, segera amankan akun dan hubungi support.`,
      ctaText: 'Kelola Keamanan',
      ctaLink: '{links.security}',
      isSystem: true,
      tags: ['password','security']
    }),
    template({
      name: 'System • 2FA Code',
      category: 'SYSTEM',
      subject: 'Kode Verifikasi (2FA): {security.code}',
      content: t`Halo {name},

Berikut kode verifikasi Anda: {security.code}
Kode berlaku 10 menit. Jangan bagikan kepada siapa pun.`,
      isSystem: true,
      tags: ['2fa','security']
    }),
    template({
      name: 'System • 2FA Enabled',
      category: 'SYSTEM',
      subject: 'Keamanan Ditingkatkan: 2FA Aktif',
      content: t`Halo {name},

Anda telah mengaktifkan Two-Factor Authentication (2FA).
Mulai sekarang, login memerlukan kode tambahan untuk keamanan.`,
      ctaText: 'Lihat Pengaturan 2FA',
      ctaLink: '{links.security}',
      isSystem: true,
      tags: ['2fa','security']
    }),
    template({
      name: 'System • Email Changed',
      category: 'SYSTEM',
      subject: 'Perubahan Email Akun',
      content: t`Halo {name},

Email akun Anda telah diperbarui menjadi {email}.
Jika bukan Anda, segera amankan akun.`,
      isSystem: true,
      tags: ['account','security']
    }),
    template({
      name: 'System • Account Locked',
      category: 'SYSTEM',
      subject: 'Akun Dikunci Sementara',
      content: t`Halo {name},

Akun Anda dikunci sementara setelah beberapa percobaan login gagal.
Silakan reset password atau tunggu 15 menit untuk mencoba kembali.`,
      ctaText: 'Reset Password',
      ctaLink: '{reset.link}',
      isSystem: true,
      tags: ['account','lock']
    }),
    template({
      name: 'System • Account Unlocked',
      category: 'SYSTEM',
      subject: 'Akun Telah Dibuka Kunci',
      content: t`Halo {name},

Akun Anda telah dibuka kunci dan dapat digunakan kembali.`,
      isSystem: true,
      tags: ['account','unlock']
    }),
    template({
      name: 'System • New Device Login',
      category: 'SYSTEM',
      subject: 'Login dari Perangkat Baru Terdeteksi',
      content: t`Halo {name},

Kami mendeteksi login dari perangkat/ lokasi baru pada {security.login_time}.
Perangkat: {security.device}
Lokasi: {security.location}
Jika bukan Anda, segera amankan akun.`,
      ctaText: 'Amankan Akun',
      ctaLink: '{links.security}',
      isSystem: true,
      tags: ['security','device']
    }),
    template({
      name: 'System • Maintenance Notice',
      category: 'SYSTEM',
      subject: 'Pemberitahuan Maintenance Sistem',
      content: t`Halo {name},

Kami akan melakukan maintenance sistem pada {system.maintenance_window}.
Beberapa layanan mungkin tidak tersedia sementara waktu.`,
      isSystem: true,
      tags: ['maintenance','system']
    }),
    template({
      name: 'System • Policy Update',
      category: 'SYSTEM',
      subject: 'Pembaruan Syarat & Kebijakan',
      content: t`Halo {name},

Kami telah memperbarui Syarat Layanan dan Kebijakan Privasi.
Mohon tinjau perubahan untuk tetap menggunakan layanan.`,
      ctaText: 'Tinjau Kebijakan',
      ctaLink: '{site.policy_url}',
      isSystem: true,
      tags: ['policy','update']
    }),
    template({
      name: 'System • Data Export Ready',
      category: 'SYSTEM',
      subject: 'Data Siap Diunduh',
      content: t`Halo {name},

Permintaan ekspor data Anda telah selesai diproses.
Anda dapat mengunduh data melalui tombol berikut.`,
      ctaText: 'Download Data',
      ctaLink: '{links.data_export}',
      isSystem: true,
      tags: ['data','export']
    }),
    template({
      name: 'System • Support Ticket Reply',
      category: 'SYSTEM',
      subject: 'Balasan Tiket #{ticket.number}',
      content: t`Halo {name},

Kami telah membalas tiket Anda: #{ticket.number}.
Silakan buka dashboard untuk melihat balasan lengkap.`,
      ctaText: 'Lihat Tiket',
      ctaLink: '{ticket.link}',
      isSystem: true,
      tags: ['support','ticket']
    }),
  ]

  const MEMBERSHIP = [
    template({
      name: 'Membership • Activation Success',
      category: 'MEMBERSHIP',
      subject: 'Membership {membership.plan} Aktif ✅',
      content: t`Halo {name},

Membership {membership.plan} Anda telah aktif.
Masa berlaku hingga {expiry.date}.`,
      ctaText: 'Akses Fitur Premium',
      ctaLink: '{links.membership}',
      isDefault: true,
      tags: ['membership','activation']
    }),
    template({
      name: 'Membership • Upgrade Success',
      category: 'MEMBERSHIP',
      subject: 'Upgrade ke {membership.newPlan} Berhasil 🎉',
      content: t`Halo {name},

Membership Anda berhasil diupgrade dari {membership.oldPlan} ke {membership.newPlan}.`,
      ctaText: 'Lihat Benefit Baru',
      ctaLink: '{links.membership}',
      tags: ['membership','upgrade']
    }),
    template({
      name: 'Membership • Downgrade Processed',
      category: 'MEMBERSHIP',
      subject: 'Perubahan Paket Membership Diproses',
      content: t`Halo {name},

Permintaan downgrade membership Anda telah diproses.
Paket baru akan aktif pada siklus berikutnya.`,
      tags: ['membership','downgrade']
    }),
    ...[14,7,3,1].map(days => template({
      name: `Membership • Expiry Reminder ${days}d`,
      category: 'MEMBERSHIP',
      subject: `Membership Berakhir dalam ${days} Hari`,
      content: t`Halo {name},

Membership {membership.plan} Anda akan berakhir pada {expiry.date}.
Sisa hari: ${days}. Perpanjang untuk menjaga akses premium.`,
      ctaText: 'Perpanjang Sekarang',
      ctaLink: '{links.renew}',
      isDefault: true,
      tags: ['membership','reminder']
    })),
    template({
      name: 'Membership • Expired',
      category: 'MEMBERSHIP',
      subject: 'Membership Anda Telah Berakhir',
      content: t`Halo {name},

Membership Anda telah berakhir. Aktifkan kembali untuk melanjutkan akses premium.`,
      ctaText: 'Aktifkan Kembali',
      ctaLink: '{links.renew}',
      tags: ['membership','expired']
    }),
    template({
      name: 'Membership • Renewal Success',
      category: 'MEMBERSHIP',
      subject: 'Perpanjangan Berhasil ✅',
      content: t`Halo {name},

Membership Anda berhasil diperpanjang hingga {expiry.date}.`,
      ctaText: 'Lihat Tagihan',
      ctaLink: '{links.billing}',
      tags: ['membership','renewal']
    }),
    template({
      name: 'Membership • Renewal Failed',
      category: 'MEMBERSHIP',
      subject: 'Perpanjangan Gagal ⚠️',
      content: t`Halo {name},

Perpanjangan membership gagal diproses.
Silakan perbarui metode pembayaran Anda.`,
      ctaText: 'Perbarui Pembayaran',
      ctaLink: '{links.billing}',
      tags: ['membership','renewal','failed']
    }),
    template({
      name: 'Membership • Trial Started',
      category: 'MEMBERSHIP',
      subject: 'Trial Dimulai 🎯',
      content: t`Halo {name},

Masa trial Anda telah dimulai. Nikmati akses premium hingga {expiry.date}.`,
      tags: ['membership','trial']
    }),
    template({
      name: 'Membership • Trial Ending Soon',
      category: 'MEMBERSHIP',
      subject: 'Trial Akan Berakhir',
      content: t`Halo {name},

Trial Anda akan berakhir pada {expiry.date}. Lanjutkan ke paket premium untuk menjaga akses.`,
      ctaText: 'Pilih Paket',
      ctaLink: '{site_url}/pricing',
      tags: ['membership','trial']
    }),
    template({
      name: 'Membership • Trial Ended',
      category: 'MEMBERSHIP',
      subject: 'Trial Berakhir',
      content: t`Halo {name},

Masa trial Anda telah berakhir. Upgrade untuk akses penuh.`,
      ctaText: 'Upgrade Sekarang',
      ctaLink: '{site_url}/pricing',
      tags: ['membership','trial']
    }),
  ]

  const AFFILIATE = [
    template({
      name: 'Affiliate • Registration Received',
      category: 'AFFILIATE',
      subject: 'Pendaftaran Affiliate Diterima',
      content: t`Halo {name},

Kami telah menerima pendaftaran Anda sebagai Affiliate. Proses verifikasi memakan waktu 1-2 hari kerja.`,
      ctaText: 'Lihat Status',
      ctaLink: '{links.affiliate}',
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','registration']
    }),
    template({
      name: 'Affiliate • Approved',
      category: 'AFFILIATE',
      subject: 'Selamat! Anda Disetujui Menjadi Affiliate 🎉',
      content: t`Halo {name},

Pendaftaran affiliate Anda disetujui.
• Kode: {affiliate.code}
• Komisi: {affiliate.commissionRate}%
• Link: {affiliate.referralLink}`,
      ctaText: 'Mulai Promosi',
      ctaLink: '{links.affiliate}',
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','approval']
    }),
    template({
      name: 'Affiliate • Rejected',
      category: 'AFFILIATE',
      subject: 'Pendaftaran Affiliate Ditolak',
      content: t`Halo {name},

Mohon maaf, pendaftaran affiliate Anda belum memenuhi kriteria.
Anda dapat mengajukan kembali setelah melakukan perbaikan.`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','rejected']
    }),
    template({
      name: 'Affiliate • Commission Earned',
      category: 'AFFILIATE',
      subject: 'Komisi Baru Masuk: {commission.amount}',
      content: t`Halo {name},

Selamat! Anda mendapatkan komisi dari transaksi {commission.source}.
Jumlah: {commission.amount}
Status: Pending verifikasi.`,
      ctaText: 'Lihat Komisi',
      ctaLink: '{links.affiliate}',
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','commission']
    }),
    template({
      name: 'Affiliate • Commission Reversed',
      category: 'AFFILIATE',
      subject: 'Penyesuaian Komisi (Refund/Cancel)',
      content: t`Halo {name},

Komisi pada transaksi {commission.source} dibatalkan karena refund/ pembatalan.`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','commission','reversal']
    }),
    template({
      name: 'Affiliate • Withdrawal Requested',
      category: 'AFFILIATE',
      subject: 'Permintaan Pencairan Diterima',
      content: t`Halo {name},

Permintaan pencairan sebesar {withdrawal.amount} telah diterima.
Estimasi waktu proses 1-3 hari kerja.`,
      ctaText: 'Cek Status',
      ctaLink: '{links.wallet}',
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','withdrawal']
    }),
    template({
      name: 'Affiliate • Withdrawal Approved',
      category: 'AFFILIATE',
      subject: 'Pencairan Disetujui ✅',
      content: t`Halo {name},

Pencairan komisi Anda disetujui dan sedang diproses ke rekening terdaftar.`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','withdrawal','approved']
    }),
    template({
      name: 'Affiliate • Withdrawal Failed',
      category: 'AFFILIATE',
      subject: 'Pencairan Gagal Diproses',
      content: t`Halo {name},

Pencairan gagal diproses. Mohon cek data rekening dan ajukan kembali.`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','withdrawal','failed']
    }),
    template({
      name: 'Affiliate • New Referral Registered',
      category: 'AFFILIATE',
      subject: 'Referral Baru Bergabung',
      content: t`Halo {name},

Seorang pengguna mendaftar melalui link Anda.
Total referral: {affiliate.referralCount}.`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','referral']
    }),
    template({
      name: 'Affiliate • Leaderboard Update',
      category: 'AFFILIATE',
      subject: 'Update Peringkat Affiliate Mingguan',
      content: t`Halo {name},

Berikut posisi Anda di leaderboard affiliate minggu ini: {affiliate.rank}.`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','leaderboard']
    }),
    template({
      name: 'Affiliate • Short Link Created',
      category: 'AFFILIATE',
      subject: 'Short Link Affiliate Dibuat',
      content: t`Halo {name},

Short link baru berhasil dibuat: {shortlink.url}
Domain: {shortlink.domain}
Klik: {shortlink.clicks}`,
      roleTarget: 'AFFILIATE',
      tags: ['affiliate','shortlink']
    }),
  ]

  const COURSE = [
    template({
      name: 'Course • Enrolled',
      category: 'COURSE',
      subject: 'Anda Terdaftar di Kursus: {course.title}',
      content: t`Halo {name},

Selamat! Anda terdaftar di kursus "{course.title}".`,
      ctaText: 'Mulai Belajar',
      ctaLink: '{course.link}',
      tags: ['course','enrollment']
    }),
    template({
      name: 'Course • Lesson Unlocked',
      category: 'COURSE',
      subject: 'Materi Baru Terbuka: {course.lessonTitle}',
      content: t`Halo {name},

Materi baru tersedia di kursus {course.title}: {course.lessonTitle}.`,
      ctaText: 'Lihat Materi',
      ctaLink: '{course.lessonLink}',
      tags: ['course','lesson']
    }),
    template({
      name: 'Course • Updated',
      category: 'COURSE',
      subject: 'Kursus Diperbarui: {course.title}',
      content: t`Halo {name},

Kursus {course.title} mendapat pembaruan konten.`,
      tags: ['course','update']
    }),
    template({
      name: 'Course • Assignment Graded',
      category: 'COURSE',
      subject: 'Nilai Tugas Anda: {course.assignmentTitle}',
      content: t`Halo {name},

Tugas Anda telah dinilai oleh mentor.
Nilai: {course.grade}.`,
      ctaText: 'Lihat Nilai',
      ctaLink: '{course.assignmentLink}',
      tags: ['course','assignment']
    }),
    template({
      name: 'Course • Certificate Ready',
      category: 'COURSE',
      subject: 'Sertifikat Siap Diunduh',
      content: t`Halo {name},

Sertifikat penyelesaian kursus {course.title} telah tersedia.`,
      ctaText: 'Download Sertifikat',
      ctaLink: '{certificate.link}',
      tags: ['course','certificate']
    }),
    template({
      name: 'Course • Completed',
      category: 'COURSE',
      subject: 'Selamat! Kursus Selesai 🎉',
      content: t`Halo {name},

Anda telah menyelesaikan kursus {course.title}. Lanjutkan ke kursus berikutnya!`,
      ctaText: 'Pilih Kursus Lain',
      ctaLink: '{links.courses}',
      tags: ['course','completed']
    }),
    template({
      name: 'Course • Webinar Reminder',
      category: 'COURSE',
      subject: 'Pengingat Webinar: {eventName}',
      content: t`Halo {name},

Webinar akan berlangsung pada {eventDate} {eventTime}.
Topik: {eventName}.`,
      ctaText: 'Buka Link Zoom',
      ctaLink: '{zoomLink}',
      tags: ['webinar','reminder']
    }),
    template({
      name: 'Course • Webinar Starting Now',
      category: 'COURSE',
      subject: 'Webinar Dimulai Sekarang',
      content: t`Halo {name},

Webinar segera dimulai. Silakan bergabung sekarang.`,
      ctaText: 'Gabung Webinar',
      ctaLink: '{zoomLink}',
      tags: ['webinar','now']
    }),
    template({
      name: 'Course • Replay Available',
      category: 'COURSE',
      subject: 'Replay Webinar Tersedia',
      content: t`Halo {name},

Replay webinar {eventName} telah tersedia untuk ditonton kembali.`,
      ctaText: 'Tonton Replay',
      ctaLink: '{event.replayLink}',
      tags: ['webinar','replay']
    }),
  ]

  const PAYMENT = [
    template({
      name: 'Payment • Invoice Created',
      category: 'PAYMENT',
      subject: 'Invoice #{invoice.number} Dibuat',
      content: t`Halo {name},

Kami telah membuat invoice untuk transaksi Anda.
Nomor: {invoice.number}
Jumlah: {invoice.total}
Metode: {invoice.paymentMethod}`,
      ctaText: 'Bayar Sekarang',
      ctaLink: '{invoice.paymentLink}',
      tags: ['payment','invoice']
    }),
    template({
      name: 'Payment • Pending',
      category: 'PAYMENT',
      subject: 'Menunggu Pembayaran',
      content: t`Halo {name},

Pembayaran Anda sedang menunggu konfirmasi.`,
      tags: ['payment','pending']
    }),
    template({
      name: 'Payment • Succeeded',
      category: 'PAYMENT',
      subject: 'Pembayaran Berhasil ✅',
      content: t`Halo {name},

Pembayaran Anda telah berhasil dikonfirmasi.`,
      ctaText: 'Lihat Invoice',
      ctaLink: '{invoice.downloadLink}',
      tags: ['payment','success']
    }),
    template({
      name: 'Payment • Failed',
      category: 'PAYMENT',
      subject: 'Pembayaran Gagal ⚠️',
      content: t`Halo {name},

Pembayaran gagal diproses: {payment.failureReason}.
Silakan coba metode lain.`,
      ctaText: 'Coba Lagi',
      ctaLink: '{payment.retryLink}',
      tags: ['payment','failed']
    }),
    template({
      name: 'Payment • Refund Processed',
      category: 'PAYMENT',
      subject: 'Refund Diproses',
      content: t`Halo {name},

Refund untuk transaksi {invoice.number} telah diproses.`,
      tags: ['payment','refund']
    }),
    template({
      name: 'Payment • Dispute Opened',
      category: 'PAYMENT',
      subject: 'Sengketa Transaksi Dibuka',
      content: t`Halo {name},

Sengketa pada transaksi {invoice.number} telah dibuka.
Tim kami akan menindaklanjuti.`,
      tags: ['payment','dispute']
    }),
    template({
      name: 'Payment • Dispute Resolved',
      category: 'PAYMENT',
      subject: 'Sengketa Diselesaikan',
      content: t`Halo {name},

Sengketa pada transaksi {invoice.number} telah diselesaikan.`,
      tags: ['payment','dispute']
    }),
    template({
      name: 'Payment • Receipt',
      category: 'PAYMENT',
      subject: 'Tanda Terima Pembayaran',
      content: t`Halo {name},

Terima kasih atas pembayaran Anda untuk {invoice.number}.`,
      tags: ['payment','receipt']
    }),
  ]

  const TRANSACTION = [
    template({
      name: 'Transaction • Created',
      category: 'TRANSACTION',
      subject: 'Transaksi Dibuat • Invoice #{invoice_number}',
      content: t`Halo {name},

Kami telah membuat transaksi baru untuk Anda.

Detail Transaksi:
• Invoice: #{invoice_number}
• Produk: {product_name}
• Jumlah: {amount}
• Metode: {payment_method}
• Status: {payment_status}
• Tanggal: {transaction_date}

Silakan lanjutkan pembayaran untuk menyelesaikan transaksi.`,
      ctaText: 'Bayar Sekarang',
      ctaLink: '{payment_link}',
      tags: ['transaction','created','invoice']
    }),
    template({
      name: 'Transaction • Payment Pending',
      category: 'TRANSACTION',
      subject: 'Menunggu Pembayaran • Invoice #{invoice_number}',
      content: t`Halo {name},

Pembayaran untuk invoice #{invoice_number} sedang menunggu konfirmasi.
Jika sudah membayar, abaikan email ini.`,
      ctaText: 'Lihat Status',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','pending']
    }),
    template({
      name: 'Transaction • Payment Confirmed',
      category: 'TRANSACTION',
      subject: 'Pembayaran Berhasil ✅ • Invoice #{invoice_number}',
      content: t`Halo {name},

Pembayaran untuk invoice #{invoice_number} telah dikonfirmasi.

Detail:
• Produk: {product_name}
• Jumlah: {amount}
• Metode: {payment_method}
• Tanggal: {transaction_date}

Akses ke konten/produk Anda telah diaktifkan.`,
      ctaText: 'Buka Dashboard',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','success']
    }),
    template({
      name: 'Transaction • Payment Failed',
      category: 'TRANSACTION',
      subject: 'Pembayaran Gagal ⚠️ • Invoice #{invoice_number}',
      content: t`Halo {name},

Pembayaran untuk invoice #{invoice_number} gagal diproses.
Silakan coba kembali atau gunakan metode pembayaran lain.`,
      ctaText: 'Coba Lagi',
      ctaLink: '{payment_link}',
      tags: ['transaction','failed']
    }),
    template({
      name: 'Transaction • Refund Requested',
      category: 'TRANSACTION',
      subject: 'Permintaan Refund Diterima • Invoice #{invoice_number}',
      content: t`Halo {name},

Kami telah menerima permintaan refund Anda untuk invoice #{invoice_number}.
Proses verifikasi memerlukan 1-3 hari kerja.`,
      ctaText: 'Lihat Detail',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','refund','requested']
    }),
    template({
      name: 'Transaction • Refund Processed',
      category: 'TRANSACTION',
      subject: 'Refund Diproses • Invoice #{invoice_number}',
      content: t`Halo {name},

Refund untuk invoice #{invoice_number} telah diproses.
Dana akan masuk sesuai ketentuan bank Anda.`,
      ctaText: 'Lihat Riwayat',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','refund','processed']
    }),
    template({
      name: 'Transaction • Access Granted',
      category: 'TRANSACTION',
      subject: 'Akses Diaktifkan • {product_name}',
      content: t`Halo {name},

Akses Anda untuk {product_name} telah diaktifkan.
Selamat belajar dan gunakan fitur premium sebaik mungkin.`,
      ctaText: 'Akses Sekarang',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','access','granted']
    }),
    template({
      name: 'Transaction • Access Revoked',
      category: 'TRANSACTION',
      subject: 'Akses Dibatalkan • {product_name}',
      content: t`Halo {name},

Akses Anda untuk {product_name} telah dibatalkan.
Jika ini kesalahan, silakan hubungi support kami.`,
      ctaText: 'Hubungi Support',
      ctaLink: '{support_email}',
      tags: ['transaction','access','revoked']
    }),
    template({
      name: 'Transaction • Invoice Overdue',
      category: 'TRANSACTION',
      subject: 'Invoice Jatuh Tempo • #{invoice_number}',
      content: t`Halo {name},

Invoice #{invoice_number} telah melewati tanggal jatuh tempo ({due_date}).
Segera selesaikan pembayaran Anda.`,
      ctaText: 'Bayar Sekarang',
      ctaLink: '{payment_link}',
      tags: ['transaction','overdue']
    }),
    template({
      name: 'Transaction • Dispute Opened',
      category: 'TRANSACTION',
      subject: 'Sengketa Dibuka • Invoice #{invoice_number}',
      content: t`Halo {name},

Sengketa untuk invoice #{invoice_number} telah dibuka.
Tim kami akan menindaklanjuti dan memberi update.`,
      ctaText: 'Lihat Status',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','dispute','opened']
    }),
    template({
      name: 'Transaction • Dispute Resolved',
      category: 'TRANSACTION',
      subject: 'Sengketa Diselesaikan • Invoice #{invoice_number}',
      content: t`Halo {name},

Sengketa untuk invoice #{invoice_number} telah diselesaikan.
Silakan cek detail hasil penyelesaian.`,
      ctaText: 'Lihat Detail',
      ctaLink: '{dashboard_link}',
      tags: ['transaction','dispute','resolved']
    }),
  ]

  // WHATSAPP variants (short, action-first, concise)
  const WHATSAPP = [
    // SYSTEM
    template({ type: 'WHATSAPP', name: 'WA • Verify Email', category: 'SYSTEM', subject: 'Verifikasi Email', content: t`Halo {name}, verifikasi email Anda agar akun aktif. Link: {verification.link}` , tags: ['wa','system','verify'] }),
    template({ type: 'WHATSAPP', name: 'WA • Reset Password', category: 'SYSTEM', subject: 'Reset Password', content: t`Halo {name}, reset password akun Anda di sini (berlaku 1 jam): {reset.link}`, tags: ['wa','system','password'] }),
    template({ type: 'WHATSAPP', name: 'WA • Login Perangkat Baru', category: 'SYSTEM', subject: 'Login Perangkat Baru', content: t`{name}, login baru terdeteksi: {security.device} - {security.location}. Jika bukan Anda, amankan akun: {links.security}`, tags: ['wa','security'] }),

    // MEMBERSHIP
    template({ type: 'WHATSAPP', name: 'WA • Membership Aktif', category: 'MEMBERSHIP', subject: 'Membership Aktif', content: t`{name}, membership {membership.plan} aktif s.d {expiry.date}. Akses: {links.membership}`, tags: ['wa','membership'] }),
    template({ type: 'WHATSAPP', name: 'WA • Reminder Expiry', category: 'MEMBERSHIP', subject: 'Membership Akan Berakhir', content: t`{name}, membership berakhir {expiry.date} (sisa {days_left} hari). Perpanjang: {links.renew}`, tags: ['wa','membership','reminder'] }),

    // AFFILIATE
    template({ type: 'WHATSAPP', name: 'WA • Komisi Masuk', category: 'AFFILIATE', subject: 'Komisi Baru', content: t`{name}, komisi baru: {commission} dari {commission.source}. Cek: {links.affiliate}`, tags: ['wa','affiliate','commission'] }),
    template({ type: 'WHATSAPP', name: 'WA • Withdrawal Disetujui', category: 'AFFILIATE', subject: 'Withdrawal Disetujui', content: t`{name}, withdrawal {withdrawal.amount} disetujui. Dana diproses 1-3 hari. Riwayat: {links.wallet}`, tags: ['wa','affiliate','withdrawal'] }),

    // TRANSACTION/PAYMENT
    template({ type: 'WHATSAPP', name: 'WA • Invoice Dibuat', category: 'TRANSACTION', subject: 'Invoice Dibuat', content: t`{name}, invoice #{invoice_number} dibuat. Total {amount}. Bayar: {payment_link}`, tags: ['wa','transaction','invoice'] }),
    template({ type: 'WHATSAPP', name: 'WA • Pembayaran Berhasil', category: 'TRANSACTION', subject: 'Payment Sukses', content: t`{name}, pembayaran untuk #{invoice_number} berhasil. Akses: {dashboard_link}`, tags: ['wa','transaction','success'] }),
    template({ type: 'WHATSAPP', name: 'WA • Pembayaran Gagal', category: 'TRANSACTION', subject: 'Payment Gagal', content: t`{name}, pembayaran untuk #{invoice_number} gagal. Coba lagi: {payment_link}`, tags: ['wa','transaction','failed'] }),
    template({ type: 'WHATSAPP', name: 'WA • Refund Diproses', category: 'TRANSACTION', subject: 'Refund Diproses', content: t`{name}, refund untuk #{invoice_number} diproses. Status: {dashboard_link}`, tags: ['wa','transaction','refund'] }),

    // COURSE / EVENT
    template({ type: 'WHATSAPP', name: 'WA • Terdaftar Kursus', category: 'COURSE', subject: 'Enrol Kursus', content: t`{name}, Anda terdaftar di "{course.title}". Mulai: {course.link}`, tags: ['wa','course'] }),
    template({ type: 'WHATSAPP', name: 'WA • Webinar Reminder', category: 'COURSE', subject: 'Webinar Reminder', content: t`Webinar: {eventName}, {eventDate} {eventTime}. Link: {zoomLink}`, tags: ['wa','webinar','reminder'] }),

    // NOTIFICATION
    template({ type: 'WHATSAPP', name: 'WA • Pengumuman', category: 'NOTIFICATION', subject: 'Pengumuman', content: t`{name}, ada pengumuman penting. Detail: {links.dashboard}`, tags: ['wa','announcement'] }),
  ]

  // PUSH variants (title in subject, short message in content)
  const PUSH = [
    // SYSTEM
    template({ type: 'PUSH', name: 'PUSH • Verify Email', category: 'SYSTEM', subject: 'Verifikasi Email Akun Anda', content: t`Aktifkan akun Anda sekarang.`, ctaLink: '{verification.link}', tags: ['push','system','verify'] }),
    template({ type: 'PUSH', name: 'PUSH • Password Diubah', category: 'SYSTEM', subject: 'Password Berhasil Diubah', content: t`Jika bukan Anda, amankan akun segera.`, ctaLink: '{links.security}', tags: ['push','security'] }),

    // MEMBERSHIP
    template({ type: 'PUSH', name: 'PUSH • Membership Aktif', category: 'MEMBERSHIP', subject: 'Membership Aktif ✅', content: t`{membership.plan} aktif sampai {expiry.date}.`, ctaLink: '{links.membership}', tags: ['push','membership'] }),
    template({ type: 'PUSH', name: 'PUSH • Membership Akan Berakhir', category: 'MEMBERSHIP', subject: 'Membership Akan Berakhir', content: t`Sisa {days_left} hari. Perpanjang sekarang.`, ctaLink: '{links.renew}', tags: ['push','membership','reminder'] }),

    // AFFILIATE
    template({ type: 'PUSH', name: 'PUSH • Bio Page Dibuat', category: 'AFFILIATE', subject: '🎉 Bio Page Siap!', content: t`{bio_name} telah dibuat. {details}`, ctaLink: '/affiliate/bio', tags: ['push','affiliate','bio','created'] }),
    template({ type: 'PUSH', name: 'PUSH • Bio Page Diupdate', category: 'AFFILIATE', subject: '📄 Bio Page Diupdate', content: t`{bio_name} berhasil disimpan. {details}`, ctaLink: '/affiliate/bio', tags: ['push','affiliate','bio','updated'] }),
    template({ type: 'PUSH', name: 'PUSH • Challenge Joined', category: 'AFFILIATE', subject: '🏆 Challenge {challenge_name} Dimulai!', content: t`Target: {target}. Reward: {reward}`, ctaLink: '/affiliate/challenges', tags: ['push','affiliate','challenge','joined'] }),
    template({ type: 'PUSH', name: 'PUSH • Challenge Milestone', category: 'AFFILIATE', subject: '🎯 Milestone Tercapai!', content: t`{progress} dari {target}. {details}`, ctaLink: '/affiliate/challenges/{challenge_id}', tags: ['push','affiliate','challenge','milestone'] }),
    template({ type: 'PUSH', name: 'PUSH • Challenge Completed', category: 'AFFILIATE', subject: '🎉 Challenge Selesai!', content: t`{challenge_name} selesai! Reward Anda: {reward}`, ctaLink: '/affiliate/challenges', tags: ['push','affiliate','challenge','completed'] }),
    template({ type: 'PUSH', name: 'PUSH • Automation Created', category: 'AFFILIATE', subject: '🤖 Automation {automation_name} Dibuat!', content: t`Trigger: {trigger}. {setup_guidance}`, ctaLink: '/affiliate/automation', tags: ['push','affiliate','automation','created'] }),
    template({ type: 'PUSH', name: 'PUSH • Automation Activated', category: 'AFFILIATE', subject: '✅ Automation Aktif', content: t`{automation_name} mulai berjalan. {performance_link}`, ctaLink: '/affiliate/automation/{automation_id}', tags: ['push','affiliate','automation','activated'] }),
    template({ type: 'PUSH', name: 'PUSH • Automation Paused', category: 'AFFILIATE', subject: '⏸️ Automation Dijeda', content: t`{automation_name} dihentikan sementara. {reason}`, ctaLink: '/affiliate/automation/{automation_id}', tags: ['push','affiliate','automation','paused'] }),
    template({ type: 'PUSH', name: 'PUSH • Lead Captured', category: 'AFFILIATE', subject: '📝 Lead Baru Masuk!', content: t`{lead_name} tertarik dengan {source}`, ctaLink: '/affiliate/leads', tags: ['push','affiliate','lead','captured'] }),
    template({ type: 'PUSH', name: 'PUSH • Komisi Masuk', category: 'AFFILIATE', subject: '💰 Komisi Diterima!', content: t`{commission} dari {source}. Total: {total_balance}`, ctaLink: '/affiliate/wallet', tags: ['push','affiliate','commission'] }),
    template({ type: 'PUSH', name: 'PUSH • Withdrawal Disetujui', category: 'AFFILIATE', subject: '✅ Withdrawal Disetujui', content: t`{amount} sedang diproses 1-3 hari kerja`, ctaLink: '/affiliate/wallet', tags: ['push','affiliate','withdrawal','approved'] }),
    template({ type: 'PUSH', name: 'PUSH • Training Update', category: 'AFFILIATE', subject: '📚 Materi Training Baru', content: t`{training_title} tersedia. Tingkatkan skill Anda!`, ctaLink: '/affiliate/training', tags: ['push','affiliate','training','update'] }),
    template({ type: 'PUSH', name: 'PUSH • Performance Alert', category: 'AFFILIATE', subject: '📈 Performa Minggu Ini', content: t`{metrics}. {action_suggestion}`, ctaLink: '/affiliate/analytics', tags: ['push','affiliate','performance','weekly'] }),
    template({ type: 'PUSH', name: 'PUSH • System Update', category: 'AFFILIATE', subject: '🔔 Update Sistem', content: t`{feature_name} tersedia. {description}`, ctaLink: '/affiliate/announcements', tags: ['push','affiliate','system','update'] }),
    template({ type: 'PUSH', name: 'PUSH • Feedback Request', category: 'AFFILIATE', subject: '⭐ Beri Rating & Feedback', content: t`Bagaimana pengalaman dengan {feature}?`, ctaLink: '/affiliate/feedback', tags: ['push','affiliate','feedback','request'] }),

    // TRANSACTION/PAYMENT
    template({ type: 'PUSH', name: 'PUSH • Invoice Dibuat', category: 'TRANSACTION', subject: 'Invoice #{invoice_number} Dibuat', content: t`Total {amount}.`, ctaLink: '{payment_link}', tags: ['push','transaction','invoice'] }),
    template({ type: 'PUSH', name: 'PUSH • Pembayaran Berhasil', category: 'TRANSACTION', subject: 'Pembayaran Berhasil', content: t`Akses Anda telah aktif.`, ctaLink: '{dashboard_link}', tags: ['push','transaction','success'] }),
    template({ type: 'PUSH', name: 'PUSH • Pembayaran Gagal', category: 'TRANSACTION', subject: 'Pembayaran Gagal', content: t`Silakan coba lagi.`, ctaLink: '{payment_link}', tags: ['push','transaction','failed'] }),
    template({ type: 'PUSH', name: 'PUSH • Refund Diproses', category: 'TRANSACTION', subject: 'Refund Diproses', content: t`Dalam proses verifikasi.`, ctaLink: '{dashboard_link}', tags: ['push','transaction','refund'] }),

    // COURSE / EVENT
    template({ type: 'PUSH', name: 'PUSH • Kursus Baru', category: 'COURSE', subject: 'Anda Terdaftar di Kursus', content: t`Mulai belajar sekarang.`, ctaLink: '{course.link}', tags: ['push','course'] }),
    template({ type: 'PUSH', name: 'PUSH • Webinar Mulai', category: 'COURSE', subject: 'Webinar Dimulai', content: t`Bergabung sekarang.`, ctaLink: '{zoomLink}', tags: ['push','webinar'] }),

    // NOTIFICATION
    template({ type: 'PUSH', name: 'PUSH • Pengumuman', category: 'NOTIFICATION', subject: 'Pengumuman Penting', content: t`Buka untuk detail.`, ctaLink: '{links.dashboard}', tags: ['push','announcement'] }),
  ]

  const ROLES = [
    template({
      name: 'Role • Admin Onboarding',
      category: 'NOTIFICATION',
      subject: 'Panduan Singkat Admin',
      content: t`Halo {name},

Selamat datang sebagai ADMIN. Mulai dengan:
1) Atur branding & email
2) Buat membership
3) Undang mentor & affiliate`,
      roleTarget: 'ADMIN',
      tags: ['role','admin']
    }),
    template({
      name: 'Role • Founder Revenue Summary',
      category: 'NOTIFICATION',
      subject: 'Ringkasan Pendapatan Hari Ini',
      content: t`Halo {name},

Ringkasan pendapatan hari ini:
• Affiliate: {revenue.affiliate}
• Founder: {revenue.founder}
• Co-Founder: {revenue.coFounder}
• Admin Fee: {revenue.adminFee}`,
      roleTarget: 'FOUNDER',
      tags: ['role','founder']
    }),
    template({
      name: 'Role • Co-Founder Revenue Summary',
      category: 'NOTIFICATION',
      subject: 'Ringkasan Pendapatan Hari Ini',
      content: t`Halo {name},

Ringkasan pendapatan hari ini:
• Affiliate: {revenue.affiliate}
• Founder: {revenue.founder}
• Co-Founder: {revenue.coFounder}
• Admin Fee: {revenue.adminFee}`,
      roleTarget: 'CO_FOUNDER',
      tags: ['role','cofounder']
    }),
    template({
      name: 'Role • Mentor New Student',
      category: 'NOTIFICATION',
      subject: 'Murid Baru Bergabung',
      content: t`Halo {name},

Seorang murid baru bergabung ke kelas Anda: {student.name}.`,
      roleTarget: 'MENTOR',
      tags: ['role','mentor']
    }),
    template({
      name: 'Role • Affiliate Program Tips',
      category: 'NOTIFICATION',
      subject: 'Tips Meningkatkan Komisi',
      content: t`Halo {name},

Berikut tips untuk meningkatkan komisi affiliate mingguan Anda.`,
      roleTarget: 'AFFILIATE',
      tags: ['role','affiliate']
    }),
    template({
      name: 'Role • Member Premium Perks',
      category: 'NOTIFICATION',
      subject: 'Fitur Premium untuk Anda',
      content: t`Halo {name},

Nikmati fitur premium:
• Kursus lengkap
• Grup khusus
• Konsultasi mentor`,
      roleTarget: 'MEMBER_PREMIUM',
      tags: ['role','member','premium']
    }),
    template({
      name: 'Role • Member Free Upgrade Prompt',
      category: 'NOTIFICATION',
      subject: 'Upgrade untuk Akses Penuh',
      content: t`Halo {name},

Tingkatkan akun Anda untuk akses penuh semua materi premium.`,
      roleTarget: 'MEMBER_FREE',
      tags: ['role','member','free']
    }),
  ]

  const NOTIFICATIONS = [
    template({
      name: 'Notification • General Announcement',
      category: 'NOTIFICATION',
      subject: 'Pengumuman Penting',
      content: t`Halo {name},

Kami memiliki pengumuman penting untuk Anda.
Detail lengkap tersedia di dashboard.`,
      ctaText: 'Buka Dashboard',
      ctaLink: DASH,
      tags: ['announcement']
    }),
    template({
      name: 'Notification • Monthly Newsletter',
      category: 'MARKETING',
      subject: 'Newsletter Bulan {date.monthYear}',
      content: t`Halo {name},

Berikut rangkuman update dan tips ekspor terbaik bulan ini.`,
      ctaText: 'Baca Selengkapnya',
      ctaLink: '{newsletter.url}',
      tags: ['newsletter','marketing']
    }),
    template({
      name: 'Notification • Event Invitation',
      category: 'NOTIFICATION',
      subject: 'Undangan Event: {eventName}',
      content: t`Halo {name},

Anda diundang ke event {eventName} pada {eventDate} {eventTime}.`,
      ctaText: 'Daftar Event',
      ctaLink: '{event.registrationLink}',
      tags: ['event','invite']
    }),
    template({
      name: 'Notification • Event Reminder',
      category: 'NOTIFICATION',
      subject: 'Pengingat Event: {eventName}',
      content: t`Halo {name},

Pengingat event: {eventName} akan berlangsung pada {eventDate} {eventTime}.`,
      ctaText: 'Lihat Detail',
      ctaLink: '{event.detailLink}',
      tags: ['event','reminder']
    }),
    template({
      name: 'Notification • Event Starting',
      category: 'NOTIFICATION',
      subject: 'Event Dimulai Sekarang',
      content: t`Halo {name},

Event {eventName} dimulai. Silakan bergabung sekarang.`,
      ctaText: 'Gabung Sekarang',
      ctaLink: '{event.joinLink}',
      tags: ['event','start']
    }),
    template({
      name: 'Notification • Survey Request',
      category: 'NOTIFICATION',
      subject: 'Bantu Kami dengan Feedback Anda',
      content: t`Halo {name},

Mohon luangkan 2 menit untuk mengisi survei pengalaman Anda.`,
      ctaText: 'Isi Survei',
      ctaLink: '{survey.link}',
      tags: ['survey','feedback']
    }),
  ]

  // Templates referenced directly by code (exact slugs required)
  const CODE_REFERENCED = [
    template({
      name: 'Support Ticket • Created',
      slug: 'support-ticket-created',
      category: 'SUPPORT',
      subject: 'Tiket Support #{ticketNumber} Telah Dibuat',
      content: t`Halo {name},

Tiket support Anda telah dibuat.

Judul: {ticketTitle}
Nomor: #{ticketNumber}
Pesan: {ticketMessage}
Dibuat: {createdAt}

Gunakan tombol di bawah untuk melihat detail dan membalas.`,
      ctaText: 'Lihat Tiket',
      ctaLink: '{ticketUrl}',
      tags: ['support','ticket']
    }),
    template({
      name: 'Support Ticket • Admin Reply',
      slug: 'support-ticket-admin-reply',
      category: 'SUPPORT',
      subject: 'Balasan Admin untuk Tiket #{ticketNumber}',
      content: t`Halo {name},

Anda menerima balasan dari Admin.

Tiket: #{ticketNumber} — {ticketTitle}
Pengirim: {senderName}
Balasan:
{replyMessage}

Dijawab pada: {repliedAt}
`,
      ctaText: 'Buka Tiket',
      ctaLink: '{ticketUrl}',
      tags: ['support','reply']
    }),
    template({
      name: 'Support Ticket • User Reply',
      slug: 'support-ticket-user-reply',
      category: 'SUPPORT',
      subject: 'Balasan Baru pada Tiket #{ticketNumber}',
      content: t`Halo {name},

Ada balasan baru pada tiket Anda.

Tiket: #{ticketNumber} — {ticketTitle}
Pengirim: {senderName}
Balasan:
{replyMessage}

Dijawab pada: {repliedAt}
`,
      ctaText: 'Buka Tiket',
      ctaLink: '{ticketUrl}',
      tags: ['support','reply']
    }),
    template({
      name: 'Support Ticket • Status Change',
      slug: 'support-ticket-status-change',
      category: 'SUPPORT',
      subject: 'Status Tiket #{ticketNumber}: {oldStatus} → {newStatus}',
      content: t`Halo {name},

Status tiket Anda berubah.

Tiket: #{ticketNumber} — {ticketTitle}
Dari: {oldStatus}
Menjadi: {newStatus}
Waktu: {changedAt}
`,
      ctaText: 'Lihat Perubahan',
      ctaLink: '{ticketUrl}',
      tags: ['support','status']
    }),
    template({
      name: 'Support Ticket • Resolved',
      slug: 'support-ticket-resolved',
      category: 'SUPPORT',
      subject: 'Tiket #{ticketNumber} Telah Diselesaikan ✅',
      content: t`Halo {name},

Tiket Anda telah ditandai selesai.

Tiket: #{ticketNumber} — {ticketTitle}
Waktu: {resolvedAt}

Jika masih ada kendala, silakan balas tiket tersebut.`,
      ctaText: 'Lihat Tiket',
      ctaLink: '{ticketUrl}',
      tags: ['support','resolved']
    }),
    template({
      name: 'Welcome • New Member (Code Ref)',
      slug: 'welcome-email-new-member',
      category: 'SYSTEM',
      subject: 'Selamat Datang di {site.name}!',
      content: t`Halo {name},

Selamat datang! Akun Anda telah aktif.
Mulailah dengan mengeksplor dashboard dan materi pembelajaran.`,
      ctaText: 'Buka Dashboard',
      ctaLink: '{links.dashboard}',
      isSystem: true,
      isDefault: true,
      tags: ['welcome','onboarding']
    }),
    template({
      name: 'System • Verify Email (Code Ref)',
      slug: 'verify-email',
      category: 'SYSTEM',
      subject: 'Verifikasi Email Anda - {site.name}',
      content: t`Halo {name},

Verifikasi email Anda untuk mengaktifkan akun.
Link berlaku 24 jam.`,
      ctaText: 'Verifikasi Email',
      ctaLink: '{verification.link}',
      isSystem: true,
      tags: ['verification','security']
    }),
    template({
      name: 'System • Reset Password (Code Ref)',
      slug: 'reset-password',
      category: 'SYSTEM',
      subject: 'Permintaan Reset Password - {site.name}',
      content: t`Halo {name},

Gunakan tombol di bawah untuk mengatur ulang password Anda.
Link berlaku 1 jam. Abaikan jika tidak meminta.`,
      ctaText: 'Reset Password',
      ctaLink: '{reset.link}',
      isSystem: true,
      tags: ['password','reset']
    }),
    template({
      name: 'System • Welcome New Member (Alt Slug)',
      slug: 'welcome-new-member',
      category: 'SYSTEM',
      subject: 'Selamat Datang di {site.name}!',
      content: t`Halo {name},

Selamat datang di {site.name}! Kami siap mendampingi perjalanan Anda.`,
      ctaText: 'Buka Dashboard',
      ctaLink: '{links.dashboard}',
      isSystem: true,
      tags: ['welcome']
    }),
    template({
      name: 'Affiliate • Commission Notification (Code Ref)',
      slug: 'affiliate-commission-notification',
      category: 'AFFILIATE',
      subject: 'Komisi Baru Masuk 💰',
      content: t`Halo {name},

Anda mendapatkan komisi dari transaksi.
Jumlah: {transaction.amount}
Tanggal: {transaction.date}
Status: {transaction.status}
Total Pendapatan: {user.totalEarnings}
Kode Affiliate: {user.affiliateCode}`,
      ctaText: 'Lihat Dashboard Affiliate',
      ctaLink: '{links.affiliate}',
      tags: ['affiliate','commission']
    }),
    template({
      name: 'Payment • Confirmation (Code Ref)',
      slug: 'payment-confirmation',
      category: 'PAYMENT',
      subject: 'Pembayaran Berhasil ✅',
      content: t`Halo {name},

Pembayaran Anda telah dikonfirmasi.
ID: {transaction.id}
Tipe: {transaction.type}
Jumlah: {transaction.amount}
Tanggal: {transaction.date}`,
      ctaText: 'Buka Dashboard',
      ctaLink: '{links.dashboard}',
      tags: ['payment','success']
    }),
  ]

  // Flatten all
  return [
    ...SYSTEM,
    ...MEMBERSHIP,
    ...AFFILIATE,
    ...COURSE,
    ...PAYMENT,
    ...TRANSACTION,
    ...WHATSAPP,
    ...PUSH,
    ...ROLES,
    ...NOTIFICATIONS,
    ...CODE_REFERENCED,
  ]
}

async function upsertTemplates() {
  console.log('🔄 Upserting branded templates (safe)...')
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  const items = buildTemplates()
  let created = 0
  let updated = 0
  let skipped = 0

  for (const t of items) {
    try {
      const existing = await prisma.brandedTemplate.findFirst({ where: { slug: t.slug, type: t.type } })
      if (!existing) {
        await prisma.brandedTemplate.create({
          data: {
            id: `${t.slug}-${Date.now()}`,
            ...t,
            usageCount: 0,
            createdBy: admin?.id || null,
            updatedAt: new Date(),
          }
        })
        created++
        console.log(`✅ Created: ${t.name}`)
      } else {
        await prisma.brandedTemplate.update({
          where: { id: existing.id },
          data: {
            name: t.name,
            category: t.category,
            type: t.type,
            roleTarget: t.roleTarget,
            subject: t.subject,
            content: t.content,
            ctaText: t.ctaText,
            ctaLink: t.ctaLink,
            isDefault: t.isDefault,
            isSystem: t.isSystem,
            isActive: true,
            tags: t.tags,
            updatedAt: new Date(),
          }
        })
        updated++
        console.log(`♻️  Updated: ${t.name}`)
      }
    } catch (e) {
      skipped++
      console.warn(`⚠️  Skip ${t.name}:`, e.message)
    }
  }

  const total = await prisma.brandedTemplate.count()
  console.log('\n📊 Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total in DB: ${total}`)

  // breakdown by category
  const byCat = await prisma.brandedTemplate.groupBy({ by: ['category'], _count: true })
  console.log('\n📋 By Category:')
  for (const row of byCat) console.log(`   ${row.category}: ${row._count}`)
}

upsertTemplates()
  .catch(err => {
    console.error('💥 Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n✅ Done.')
  })
