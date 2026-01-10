const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const COMPLETE_TEMPLATES = [
  // ============================================
  // SYSTEM CATEGORY
  // ============================================
  {
    name: 'Account Activation',
    slug: 'account-activation',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Aktivasi Akun {site_name}',
    content: `Halo {name},

Terima kasih telah mendaftar di {site_name}! 

Untuk mengaktifkan akun Anda, silakan klik tombol di bawah ini:

Kode aktivasi Anda: {activation_code}

Atau gunakan link ini: {activation_link}

Link ini akan berlaku selama 24 jam. Jika Anda tidak membuat akun ini, silakan abaikan email ini.

Jika Anda mengalami masalah, silakan hubungi tim support kami di {support_email}

Salam hangat,
Tim {site_name}`,
    ctaText: 'Aktivasi Akun',
    ctaLink: '{activation_link}',
    tags: ['activation', 'welcome', 'new-user'],
    priority: 'HIGH',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Email Verification',
    slug: 'email-verification',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Verifikasi Email Anda - {site_name}',
    content: `Halo {name},

Kami perlu memverifikasi alamat email Anda. Klik tombol di bawah untuk melanjutkan:

Kode verifikasi: {verification_code}

Link verifikasi: {verification_link}

Kode ini akan berlaku selama 30 menit. 

Jika Anda tidak meminta verifikasi ini, abaikan email ini.

Butuh bantuan? Hubungi {support_email}`,
    ctaText: 'Verifikasi Email',
    ctaLink: '{verification_link}',
    tags: ['verification', 'email', 'security'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Password Reset',
    slug: 'password-reset',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Reset Password {site_name}',
    content: `Halo {name},

Kami menerima permintaan untuk mereset password akun Anda. Klik link di bawah untuk membuat password baru:

Link reset password: {reset_link}

Kode reset: {reset_code}

Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.

Untuk keamanan akun Anda, jangan bagikan link ini kepada siapapun.

Pertanyaan? Hubungi {support_email}`,
    ctaText: 'Reset Password',
    ctaLink: '{reset_link}',
    tags: ['password', 'security', 'reset'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Login Alert',
    slug: 'login-alert',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Login Baru Terdeteksi - {site_name}',
    content: `Halo {name},

Kami mendeteksi login baru ke akun Anda:

Waktu login: {login_time}
Lokasi: {login_location}
Device: {login_device}
IP Address: {login_ip}

Jika ini adalah Anda, tidak perlu tindakan apapun.

Jika Anda tidak mengenali login ini, segera ubah password Anda atau hubungi support.

Perlu bantuan? Hubungi {support_email}`,
    ctaText: 'Verifikasi Login',
    ctaLink: '{verification_link}',
    tags: ['security', 'login', 'alert'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Welcome Email',
    slug: 'welcome-email-system',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Selamat Datang di {site_name}!',
    content: `Halo {name},

Selamat datang di {site_name}! Kami senang memiliki Anda sebagai bagian dari komunitas kami.

Akun Anda telah berhasil dibuat dengan:
- Email: {email}
- Username: {username}
- Role: {user_role}

Langkah selanjutnya:
1. Lengkapi profil Anda
2. Pelajari fitur-fitur yang tersedia
3. Bergabunglah dengan komunitas

Untuk memulai, kunjungi dashboard Anda: {dashboard_link}

Jika ada pertanyaan, kami siap membantu di {support_email}

Terima kasih,
Tim {site_name}`,
    ctaText: 'Buka Dashboard',
    ctaLink: '{dashboard_link}',
    tags: ['welcome', 'onboarding', 'new-user'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Account Deactivation Confirmation',
    slug: 'account-deactivation-confirmation',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Akun {site_name} Dinonaktifkan',
    content: `Halo {name},

Akun Anda di {site_name} telah dinonaktifkan sesuai permintaan.

Detail penghapusan:
- Tanggal: {deactivation_date}
- Alasan: {deactivation_reason}
- Data akan dihapus: {deletion_timeline}

Jika ini adalah kesalahan, Anda dapat mengaktifkan kembali akun dalam 30 hari.

Untuk informasi lebih lanjut, hubungi: {support_email}

Terima kasih telah menjadi bagian dari {site_name}`,
    ctaText: 'Informasi Lebih Lanjut',
    ctaLink: '{support_page}',
    tags: ['deactivation', 'account', 'security'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // MEMBERSHIP CATEGORY
  // ============================================
  {
    name: 'Membership Purchased',
    slug: 'membership-purchased',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Selamat! Membership {membership_plan} Anda Aktif',
    content: `Halo {name},

Terima kasih telah membeli membership {membership_plan}! Akses unlimited Anda sudah dimulai.

Rincian Membership:
- Paket: {membership_plan}
- Tanggal Dibeli: {purchase_date}
- Tanggal Expired: {expiry_date}
- Harga: {amount_formatted}
- Invoice: {invoice_number}

Akses Anda meliputi:
- {benefit_1}
- {benefit_2}
- {benefit_3}
- Support prioritas 24/7

Nikmati akses penuh ke semua fitur premium. Dashboard Anda: {dashboard_link}

Pertanyaan? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Akses Membership',
    ctaLink: '{dashboard_link}',
    tags: ['membership', 'purchase', 'subscription'],
    priority: 'HIGH',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Membership Upgrade',
    slug: 'membership-upgrade',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Upgrade Membership Anda ke {new_plan} - Sukses!',
    content: `Halo {name},

Upgrade membership Anda berhasil! Selamat beralih ke paket {new_plan}.

Detail Upgrade:
- Paket Lama: {old_plan}
- Paket Baru: {new_plan}
- Tanggal Upgrade: {upgrade_date}
- Tanggal Expired Baru: {new_expiry_date}
- Biaya Tambahan: {upgrade_cost}

Fitur baru yang sekarang Anda akses:
- {new_benefit_1}
- {new_benefit_2}
- {new_benefit_3}

Nikmati pengalaman premium yang lebih baik. Login sekarang: {dashboard_link}

Ada pertanyaan? Support team kami di {support_email}

Terima kasih,
Tim {site_name}`,
    ctaText: 'Akses Fitur Baru',
    ctaLink: '{dashboard_link}',
    tags: ['membership', 'upgrade', 'subscription'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Membership Renewal',
    slug: 'membership-renewal',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Membership {membership_plan} Diperpanjang',
    content: `Halo {name},

Selamat! Membership {membership_plan} Anda telah diperpanjang untuk 1 tahun ke depan.

Rincian Perpanjangan:
- Paket: {membership_plan}
- Tanggal Mulai: {start_date}
- Tanggal Berakhir: {expiry_date}
- Biaya: {amount_formatted}
- Invoice: {invoice_number}

Akses penuh Anda berlanjut tanpa gangguan. Terima kasih telah tetap bersama kami!

Lihat dashboard Anda: {dashboard_link}

Pertanyaan tentang renewal? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Lihat Membership Anda',
    ctaLink: '{dashboard_link}',
    tags: ['membership', 'renewal', 'subscription'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Membership Expiring Soon',
    slug: 'membership-expiring-soon-updated',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: '⏰ Membership {membership_plan} Anda akan Berakhir',
    content: `Halo {name},

Membership {membership_plan} Anda akan berakhir dalam {days_left} hari.

Tanggal Berakhir: {expiry_date}
Paket Anda: {membership_plan}

Untuk melanjutkan akses unlimited, perpanjang sekarang:

Pilihan Perpanjangan:
- Perpanjang {membership_plan}: {renewal_price}
- Upgrade ke paket lebih tinggi
- Jika ingin dibatalkan

Perpanjang sekarang: {renewal_link}

Jangan lewatkan! Perpanjang hari ini untuk akses tanpa batas.

Info lebih lanjut: {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Perpanjang Sekarang',
    ctaLink: '{renewal_link}',
    tags: ['membership', 'expiration', 'renewal'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Membership Expired',
    slug: 'membership-expired',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Membership {membership_plan} Anda Telah Berakhir',
    content: `Halo {name},

Membership {membership_plan} Anda telah berakhir pada {expiry_date}.

Akses ke fitur premium saat ini terbatas. Untuk melanjutkan dengan akses penuh, perpanjang membership Anda sekarang.

Manfaat dengan perpanjangan:
- Akses unlimited ke semua materi
- Download resources eksklusif
- Support prioritas 24/7
- Member-only events

Perpanjang membership: {renewal_link}

Atau lihat paket lain yang tersedia: {plans_page}

Kami ingin Anda tetap menjadi bagian dari komunitas kami!

Pertanyaan? Hubungi {support_email}

Terima kasih,
Tim {site_name}`,
    ctaText: 'Perpanjang Sekarang',
    ctaLink: '{renewal_link}',
    tags: ['membership', 'expiration', 'renewal'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // PAYMENT / TRANSACTION CATEGORY
  // ============================================
  {
    name: 'Payment Pending',
    slug: 'payment-pending',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: 'Pembayaran Menunggu Konfirmasi',
    content: `Halo {name},

Pembayaran Anda sedang menunggu konfirmasi. Berikut detailnya:

Rincian Pembayaran:
- Nominal: {amount_formatted}
- Invoice: {invoice_number}
- Metode: {payment_method}
- Waktu Pemesanan: {order_time}
- Batas Pembayaran: {payment_deadline}

Silakan selesaikan pembayaran sebelum {payment_deadline}.

Lanjutkan pembayaran: {payment_link}

Jika pembayaran sudah dilakukan, abaikan email ini.

Ada pertanyaan pembayaran? Hubungi {support_email}

Terima kasih,
Tim {site_name}`,
    ctaText: 'Lanjutkan Pembayaran',
    ctaLink: '{payment_link}',
    tags: ['payment', 'transaction', 'pending'],
    priority: 'HIGH',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Payment Success',
    slug: 'payment-success-updated',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '✅ Pembayaran Berhasil - {site_name}',
    content: `Halo {name},

Terima kasih! Pembayaran Anda telah berhasil diproses.

Rincian Transaksi:
- Invoice: {invoice_number}
- Tanggal: {transaction_date}
- Nominal: {amount_formatted}
- Metode Pembayaran: {payment_method}
- Status: ✅ Lunas

Detail Pembelian:
- Item: {product_name}
- Deskripsi: {product_description}
- Jumlah: {quantity}

Akses ke produk/layanan akan segera aktif.

Lihat order Anda: {order_link}
Download invoice: {invoice_link}

Terima kasih atas kepercayaan Anda. Nikmati produk/layanan Anda!

Pertanyaan? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Lihat Invoice',
    ctaLink: '{invoice_link}',
    tags: ['payment', 'success', 'receipt'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Payment Failed',
    slug: 'payment-failed',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: '❌ Pembayaran Gagal - {site_name}',
    content: `Halo {name},

Pembayaran Anda gagal diproses. Silakan coba lagi atau gunakan metode pembayaran lain.

Detail Pembayaran:
- Invoice: {invoice_number}
- Nominal: {amount_formatted}
- Metode: {payment_method}
- Alasan Gagal: {failure_reason}
- Waktu: {transaction_time}

Silakan coba pembayaran lagi: {payment_link}

Kemungkinan Penyebab:
- Saldo tidak cukup
- Data kartu tidak valid
- Koneksi internet terputus
- Limit transaksi

Jika masalah berlanjut, coba:
1. Gunakan kartu/metode pembayaran lain
2. Periksa koneksi internet Anda
3. Hubungi customer service Anda

Butuh bantuan? Hubungi {support_email}

Terima kasih,
Tim {site_name}`,
    ctaText: 'Coba Lagi',
    ctaLink: '{payment_link}',
    tags: ['payment', 'failed', 'error'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Payment Refund',
    slug: 'payment-refund',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: 'Refund Pembayaran Diproses',
    content: `Halo {name},

Refund pembayaran Anda telah diproses dan dikirim.

Rincian Refund:
- Invoice Original: {original_invoice}
- Jumlah Refund: {refund_amount}
- Alasan: {refund_reason}
- Tanggal Diproses: {refund_date}
- Metode Pengembalian: {refund_method}

Perkiraan uang masuk kembali:
- Kartu kredit: 3-5 hari kerja
- Transfer bank: 1-3 hari kerja
- E-wallet: 1-24 jam

Referensi Refund: {refund_reference}

Jika tidak menerima refund dalam waktu yang ditentukan, hubungi {support_email}

Terima kasih atas kesempatan kami melayani Anda.

Salam,
Tim {site_name}`,
    ctaText: 'Lacak Refund',
    ctaLink: '{refund_tracking_link}',
    tags: ['payment', 'refund', 'transaction'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Invoice',
    slug: 'invoice',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: 'Invoice #{invoice_number} - {site_name}',
    content: `Halo {name},

Berikut adalah invoice untuk pembelian Anda:

RINCIAN INVOICE:
Nomor Invoice: {invoice_number}
Tanggal: {invoice_date}
Jatuh Tempo: {due_date}

DETAIL PEMBELI:
Nama: {name}
Email: {email}
Alamat: {address}

ITEM PEMBELIAN:
{item_1} x {qty_1} = {price_1}
{item_2} x {qty_2} = {price_2}
{item_3} x {qty_3} = {price_3}

Subtotal: {subtotal}
Diskon: {discount}
Pajak: {tax}
TOTAL: {total_amount_formatted}

METODE PEMBAYARAN:
{payment_method}

Terima kasih atas pembelian Anda. Untuk pertanyaan tentang invoice ini, hubungi {support_email}

Download invoice PDF: {invoice_pdf_link}

Salam,
Tim {site_name}`,
    ctaText: 'Download Invoice',
    ctaLink: '{invoice_pdf_link}',
    tags: ['payment', 'invoice', 'receipt'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Receipt',
    slug: 'receipt',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: 'Kuitansi Pembayaran #{receipt_number}',
    content: `Halo {name},

Terima kasih atas pembayaran Anda. Berikut adalah kuitansi resmi:

KUITANSI PEMBAYARAN:
No. Kuitansi: {receipt_number}
Tanggal: {transaction_date}
Waktu: {transaction_time}

DETAIL PEMBAYARAN:
Jumlah: {amount_formatted}
Metode: {payment_method}
Status: {payment_status}

ITEM YANG DIBELI:
{purchased_item}

Referensi Transaksi: {transaction_reference}

Kuitansi ini adalah bukti sah pembayaran. Disimpan untuk keperluan Anda.

Pertanyaan? Hubungi {support_email}

Terima kasih telah berbelanja dengan kami!

Salam,
Tim {site_name}`,
    ctaText: 'Simpan Kuitansi',
    ctaLink: '{receipt_download_link}',
    tags: ['payment', 'receipt', 'transaction'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // COURSE/CLASS CATEGORY
  // ============================================
  {
    name: 'Course Enrollment',
    slug: 'course-enrollment',
    category: 'COURSE',
    type: 'EMAIL',
    subject: 'Selamat! Anda Terdaftar di Kelas {course_name}',
    content: `Halo {name},

Selamat! Anda telah berhasil mendaftar di kelas {course_name}.

Detail Kelas:
- Nama: {course_name}
- Instruktur: {instructor_name}
- Tingkat: {course_level}
- Durasi: {course_duration}
- Mulai: {course_start_date}
- Tanggal Berakhir: {course_end_date}
- Harga: {course_price}

Yang Akan Anda Pelajari:
- {topic_1}
- {topic_2}
- {topic_3}
- {topic_4}

Persiapan Kelas:
1. Siapkan alat yang diperlukan
2. Buat catatan untuk pembelajaran
3. Bersiaplah untuk belajar dengan konsisten
4. Bergabunglah dengan grup belajar kami

Akses kelas sekarang: {course_link}

Instruktur dan tim siap membantu. Hubungi {support_email} untuk pertanyaan.

Selamat belajar!
Tim {site_name}`,
    ctaText: 'Mulai Kelas',
    ctaLink: '{course_link}',
    tags: ['course', 'enrollment', 'education'],
    priority: 'HIGH',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Course Welcome',
    slug: 'course-welcome',
    category: 'COURSE',
    type: 'EMAIL',
    subject: 'Selamat Datang di Kelas {course_name}!',
    content: `Halo {name},

Terima kasih telah menjadi bagian dari kelas {course_name}! Kami excited untuk belajar bersama Anda.

Informasi Penting:
- Instruktur: {instructor_name}
- Jadwal Pembelajaran: {learning_schedule}
- Support Forum: {forum_link}
- Grup Diskusi: {group_link}

Modul Pembelajaran:
- Modul 1: {module_1_title} (Mulai {module_1_date})
- Modul 2: {module_2_title} (Mulai {module_2_date})
- Modul 3: {module_3_title} (Mulai {module_3_date})

Sumber Daya:
- Materi Pembelajaran: {materials_link}
- Jurnal Pembelajaran: {journal_link}
- Forum Diskusi: {forum_link}

Tips Sukses:
1. Belajar konsisten setiap hari
2. Ikuti semua kuis dan tugas
3. Berinteraksi dengan peserta lain
4. Jangan ragu bertanya

Mari kita mulai! Akses dashboard Anda: {dashboard_link}

Sukses,
Tim {site_name}`,
    ctaText: 'Mulai Belajar',
    ctaLink: '{course_link}',
    tags: ['course', 'welcome', 'education'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Course Reminder',
    slug: 'course-reminder',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '📚 Pengingat Kelas {course_name} - Jangan Tertinggal!',
    content: `Halo {name},

Ini adalah pengingat untuk kelas {course_name} Anda.

Status Progress Anda:
- Selesai: {completion_percentage}%
- Modul Tersisa: {modules_remaining}
- Waktu Tersisa: {course_days_left} hari

Modul Berikutnya:
- Judul: {next_module_title}
- Mulai: {next_module_date}
- Durasi: {next_module_duration}
- Topik: {next_module_topics}

Aktivitas Terbaru:
- Kuis Belum Dikerjakan: {pending_quizzes}
- Tugas Belum Dikumpulkan: {pending_assignments}
- Forum Baru: {forum_threads_new}

Jangan tertinggal! Lanjutkan pembelajaran Anda: {course_link}

Butuh bantuan? Hubungi instruktur atau {support_email}

Mari terus belajar!
Tim {site_name}`,
    ctaText: 'Lanjutkan Kelas',
    ctaLink: '{course_link}',
    tags: ['course', 'reminder', 'education'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Course Completion',
    slug: 'course-completion',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '🎉 Selamat! Anda Menyelesaikan {course_name}',
    content: `Halo {name},

Selamat! Anda telah berhasil menyelesaikan kelas {course_name}! 🎉

Pencapaian Anda:
- Kourse: {course_name}
- Instruktur: {instructor_name}
- Skor Akhir: {final_score}%
- Tingkat Penyelesaian: 100%
- Waktu Belajar: {total_hours} jam

Modul yang Diselesaikan:
✓ {module_1} - Skor: {module_1_score}%
✓ {module_2} - Skor: {module_2_score}%
✓ {module_3} - Skor: {module_3_score}%

Sertifikat Anda:
Anda berhak mendapatkan sertifikat resmi. Download di: {certificate_link}

Langkah Selanjutnya:
- Lihat hasil detail: {results_link}
- Ambil kourse lanjutan: {next_courses_link}
- Bagikan pencapaian Anda: {share_link}

Terima kasih telah belajar dengan {site_name}. Investasi pada diri sendiri adalah investasi terbaik!

Terus belajar,
Tim {site_name}`,
    ctaText: 'Download Sertifikat',
    ctaLink: '{certificate_link}',
    tags: ['course', 'completion', 'certificate'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Assignment Due',
    slug: 'assignment-due',
    category: 'COURSE',
    type: 'EMAIL',
    subject: '📝 Pengingat Tugas - {assignment_title} Akan Segera Berakhir',
    content: `Halo {name},

Ini adalah pengingat bahwa tugas Anda segera berakhir!

Detail Tugas:
- Judul: {assignment_title}
- Kourse: {course_name}
- Batas Waktu: {due_date} pukul {due_time}
- Waktu Tersisa: {time_remaining}
- Status: {submission_status}

Deskripsi:
{assignment_description}

Kriteria Penilaian:
- {criteria_1}: {weight_1}%
- {criteria_2}: {weight_2}%
- {criteria_3}: {weight_3}%

Kumpulkan Tugas: {assignment_link}

Tips:
- Baca instruksi dengan cermat
- Kerjakan dengan teliti
- Kumpulkan sebelum batas waktu
- Hubungi instruktur jika ada pertanyaan

Jangan lupa mengumpulkan tugas Anda!

Salam,
Tim {site_name}`,
    ctaText: 'Kumpulkan Tugas',
    ctaLink: '{assignment_link}',
    tags: ['course', 'assignment', 'education'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // EVENT CATEGORY
  // ============================================
  {
    name: 'Event Registration Confirmation',
    slug: 'event-registration-confirmation',
    category: 'EVENT',
    type: 'EMAIL',
    subject: '✅ Registrasi Event {event_name} Dikonfirmasi',
    content: `Halo {name},

Terima kasih! Registrasi Anda untuk event {event_name} telah dikonfirmasi.

Detail Event:
- Nama: {event_name}
- Tanggal: {event_date}
- Waktu: {event_time}
- Lokasi: {event_location}
- Format: {event_format}
- Kapasitas: {event_capacity}

Informasi Pendaftaran:
- Nomor Registrasi: {registration_number}
- Status: ✅ Terkonfirmasi
- Tiket: {ticket_type}
- Harga: {ticket_price}

Yang Perlu Anda Siapkan:
- {preparation_1}
- {preparation_2}
- {preparation_3}

Tautan Penting:
- Agenda Event: {event_agenda_link}
- Peta Lokasi: {event_location_map}
- Update Event: {event_updates_link}

Terima kasih telah mendaftar! Kami tunggu kehadiran Anda.

Pertanyaan? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Lihat Detail Event',
    ctaLink: '{event_link}',
    tags: ['event', 'registration', 'confirmation'],
    priority: 'HIGH',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Event Reminder',
    slug: 'event-reminder',
    category: 'EVENT',
    type: 'EMAIL',
    subject: '⏰ Event {event_name} Dimulai dalam {days_left} Hari!',
    content: `Halo {name},

Event {event_name} akan dimulai dalam {days_left} hari!

Pengingat Penting:
- Tanggal: {event_date}
- Jam: {event_time}
- Lokasi: {event_location}
- Nomor Registrasi: {registration_number}

Persiapan Terakhir:
1. Konfirmasi kehadiran Anda
2. Siapkan peralatan/dokumen yang diperlukan
3. Cek rute ke lokasi
4. Set alarm untuk jangan sampai terlambat

Informasi Tambahan:
- Jadwal Acara: {event_schedule_link}
- Pembicara/Pembimbing: {speakers_link}
- FAQ Event: {faq_link}

Lokasi GPS: {location_gps_link}

Jangan lewatkan kesempatan ini! Kami tunggu Anda!

Pertanyaan? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Lihat Lokasi',
    ctaLink: '{event_location_map}',
    tags: ['event', 'reminder', 'notification'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Event Canceled',
    slug: 'event-canceled',
    category: 'EVENT',
    type: 'EMAIL',
    subject: '⚠️ Event {event_name} Dibatalkan',
    content: `Halo {name},

Kami ingin memberitahu bahwa event {event_name} yang dijadwalkan pada {event_date} telah dibatalkan.

Detail Pembatalan:
- Event: {event_name}
- Tanggal Original: {original_event_date}
- Alasan Pembatalan: {cancellation_reason}
- Pengumuman: {cancellation_announcement}

Pengembalian Dana:
- Jika Anda sudah membayar, uang akan dikembalikan ke rekening asli Anda
- Proses: {refund_process_time}
- Status Refund: {refund_status}

Opsi Alternatif:
- Ikuti event online pengganti: {alternative_event_link}
- Daftar untuk event mendatang: {upcoming_events_link}
- Hubungi kami untuk pertanyaan: {support_email}

Kami mohon maaf atas ketidaknyamanan ini. Terima kasih atas pemahaman Anda.

Salam,
Tim {site_name}`,
    ctaText: 'Lihat Event Lain',
    ctaLink: '{upcoming_events_link}',
    tags: ['event', 'cancellation', 'notification'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Event Feedback Request',
    slug: 'event-feedback-request',
    category: 'EVENT',
    type: 'EMAIL',
    subject: '📋 Bagikan Pengalaman Event {event_name} Anda',
    content: `Halo {name},

Terima kasih telah menghadiri event {event_name}! 

Kami sangat ingin mendengar pengalaman Anda. Feedback Anda membantu kami meningkatkan event di masa depan.

Detail Event:
- Event: {event_name}
- Tanggal: {event_date}
- Pembicara: {speakers_list}

Silakan isi survei singkat ini (hanya 5 menit):

Klik link di bawah untuk mulai feedback:

Pertanyaan yang Kami Tanyakan:
- Apakah event memenuhi ekspektasi Anda?
- Bagaimana menurut Anda tentang pembicara?
- Apa yang paling bermanfaat?
- Apa yang dapat kami tingkatkan?
- Apakah Anda ingin menghadiri event lagi?

Feedback Anda berarti banyak!

Isi Survei: {survey_link}

Terima kasih atas waktu berharga Anda!

Salam,
Tim {site_name}`,
    ctaText: 'Isi Survei Feedback',
    ctaLink: '{survey_link}',
    tags: ['event', 'feedback', 'survey'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // PROMOTION / MARKETING CATEGORY
  // ============================================
  {
    name: 'Promotion Announcement',
    slug: 'promotion-announcement',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '🎉 Penawaran Spesial Hanya untuk Anda! {discount_percentage}% OFF',
    content: `Halo {name},

Penawaran eksklusif telah tiba! Dapatkan diskon {discount_percentage}% untuk {promotion_item}.

Detail Promosi:
- Produk/Layanan: {promotion_item}
- Diskon: {discount_percentage}% atau {discount_amount}
- Harga Normal: {original_price}
- Harga Promosi: {promo_price}
- Tanggal Mulai: {promo_start_date}
- Tanggal Berakhir: {promo_end_date}

Mengapa Anda Harus Mengambil Penawaran Ini:
- {benefit_1}
- {benefit_2}
- {benefit_3}
- {benefit_4}

Kode Diskon: {promo_code}

Atau klik link di bawah untuk diskon otomatis:

Jangan Lewatkan! Penawaran terbatas hanya sampai {promo_end_date}.

Pesan Sekarang: {purchase_link}

Pertanyaan? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Dapatkan Diskon Sekarang',
    ctaLink: '{purchase_link}',
    tags: ['promotion', 'discount', 'marketing'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Newsletter',
    slug: 'newsletter',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '📰 {newsletter_title} - {newsletter_date}',
    content: `Halo {name},

Selamat datang di edisi {newsletter_edition} newsletter kami!

Apa yang ada di edisi ini:

📌 ARTIKEL UTAMA:
{featured_article_title}
{featured_article_summary}
Baca selengkapnya: {featured_article_link}

📚 ARTIKEL POPULER:
1. {article_1_title} - {article_1_summary} [{article_1_link}]
2. {article_2_title} - {article_2_summary} [{article_2_link}]
3. {article_3_title} - {article_3_summary} [{article_3_link}]

💡 TIPS & TRIK:
{tip_of_the_week_title}
{tip_of_the_week_description}

🎯 PENAWARAN KHUSUS:
{special_offer_title}
{special_offer_description}
{special_offer_cta} [{special_offer_link}]

📅 ACARA MENDATANG:
- {upcoming_event_1} - {event_1_date}
- {upcoming_event_2} - {event_2_date}

💬 DARI KOMUNITAS:
{community_highlight}

Terima kasih telah membaca newsletter kami!

Atur Preferensi Langganan: {preferences_link}
Unsubscribe: {unsubscribe_link}

Salam,
Tim {site_name}`,
    ctaText: 'Baca Newsletter Lengkap',
    ctaLink: '{newsletter_link}',
    tags: ['marketing', 'newsletter', 'content'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Flash Sale',
    slug: 'flash-sale',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '⚡ FLASH SALE - Hanya {duration} Jam! Stok Terbatas!',
    content: `Halo {name},

FLASH SALE DIMULAI! ⚡

Kesempatan emas untuk mendapatkan produk impian Anda dengan harga spesial!

PENAWARAN TERBATAS:
- Waktu: {duration} Jam Saja
- Mulai: {sale_start_time}
- Berakhir: {sale_end_time}

PRODUK FLASH SALE:
{flash_sale_item_1} - {item_1_discount}% OFF
{flash_sale_item_2} - {item_2_discount}% OFF
{flash_sale_item_3} - {item_3_discount}% OFF

STOK TERBATAS:
Tersisa {remaining_stock} unit saja! Jangan sampai kehabisan.

CARA DAPATKAN:
1. Klik link pembelian di bawah
2. Stok akan dikurangi secara real-time
3. Pembayaran instant = penawaran langsung dikonfirmasi
4. Pengiriman cepat

HARGA FLASH SALE:
{flash_sale_price} (Diskon {discount_percentage}%)

HURRY UP! Penawaran skrap dalam {time_remaining}!

Beli Sekarang: {purchase_link}

Pertanyaan? Hubungi {support_email}

Salam,
Tim {site_name}`,
    ctaText: 'Beli Sekarang - Stok Terbatas!',
    ctaLink: '{purchase_link}',
    tags: ['marketing', 'sale', 'promotion'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Seasonal Campaign',
    slug: 'seasonal-campaign',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '{season_name} Spesial - Rayakan {season_name} dengan {site_name}!',
    content: `Halo {name},

Rayakan {season_name} bersama kami dengan penawaran istimewa!

KAMPANYE {season_name_upper}:
Diskon hingga {max_discount}% untuk semua produk pilihan!

PENAWARAN UTAMA:
- {offer_1_title} - {offer_1_discount}%
- {offer_2_title} - {offer_2_discount}%
- {offer_3_title} - {offer_3_discount}%

PAKET HEMAT:
{bundle_1_title} - {bundle_1_savings} Hemat
{bundle_2_title} - {bundle_2_savings} Hemat

BONUS:
✓ Gratis ongkos kirim untuk pembelian > {minimum_purchase}
✓ Hadiah menarik untuk pembeli beruntung
✓ Program loyalitas tambahan poin

BERLAKU HINGGA: {campaign_end_date}

Rayakan {season_name} Sekarang: {campaign_link}

Kode Promo: {promo_code} (Otomatis teraplikasi)

Terima kasih telah menjadi bagian dari keluarga {site_name}!

Belanja Sekarang: {purchase_link}

Salam,
Tim {site_name}`,
    ctaText: 'Belanja {season_name} Spesial',
    ctaLink: '{campaign_link}',
    tags: ['marketing', 'seasonal', 'campaign'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },

  // ============================================
  // AFFILIATE CATEGORY
  // ============================================
  {
    name: 'Affiliate Application Approved',
    slug: 'affiliate-application-approved',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🎉 Selamat! Aplikasi Affiliate Anda Diterima',
    content: `Halo {name},

Selamat! Aplikasi Anda untuk menjadi affiliate {site_name} telah diterima dan disetujui!

Anda sekarang dapat mulai mendapatkan komisi dengan merekomendasikan produk/layanan kami.

Detail Affiliate:
- Affiliate ID: {affiliate_id}
- Nama Affiliate: {affiliate_name}
- Komisi: {commission_rate}%
- Status: ✅ Aktif
- Tanggal Approval: {approval_date}

DAPATKAN MULAI:
1. Login ke dashboard affiliate: {affiliate_dashboard_link}
2. Buat affiliate link pertama Anda
3. Bagikan ke audiens Anda
4. Dapatkan komisi setiap kali ada penjualan

SUMBER DAYA YANG TERSEDIA:
- Marketing Materials: {marketing_materials_link}
- Panduan Affiliate: {affiliate_guide_link}
- Template Banner: {banner_templates_link}
- Tips Promosi: {promotion_tips_link}
- FAQ: {faq_link}

CARA MENDAPATKAN KOMISI:
✓ Setiap penjualan dari link Anda = komisi langsung
✓ Tidak ada batasan komisi
✓ Pembayaran setiap bulan
✓ Tracking real-time

BONUS UNTUK AFFILIATE BARU:
- Komisi bonus untuk 10 penjualan pertama
- Akses ke member-only webinar
- Prioritas support

Mari mulai menghasilkan! Dashboard Anda: {affiliate_dashboard_link}

Pertanyaan? Hubungi {support_email}

Selamat bergabung!
Tim {site_name}`,
    ctaText: 'Akses Dashboard Affiliate',
    ctaLink: '{affiliate_dashboard_link}',
    tags: ['affiliate', 'approval', 'onboarding'],
    priority: 'HIGH',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Affiliate Commission Earned',
    slug: 'affiliate-commission-earned-updated',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '💰 Komisi Anda Earned! {commission_amount_formatted}',
    content: `Halo {name},

Selamat! Anda telah mendapatkan komisi baru dari affiliate program kami!

KOMISI YANG DITERIMA:
- Jumlah Komisi: {commission_amount_formatted}
- Komisi ID: {commission_id}
- Tanggal Earning: {earning_date}
- Tingkat Komisi: {commission_rate}%

DETAIL PENJUALAN:
- Produk: {product_name}
- Harga Produk: {product_price}
- Pembeli: {buyer_name}
- Tanggal Transaksi: {transaction_date}
- Status: {transaction_status}

RINGKASAN AFFILIATE BULAN INI:
- Total Komisi: {monthly_total_commission}
- Jumlah Penjualan: {monthly_sales_count}
- Rata-rata Komisi: {average_commission}

SALDO AFFILIATE ANDA:
- Saldo Tersedia: {available_balance}
- Saldo Pending: {pending_balance}
- Saldo Withdrawn: {withdrawn_balance}

WITHDRAW KOMISI:
Anda dapat menarik komisi ketika saldo mencapai {minimum_withdrawal}.
Saldo Anda saat ini: {available_balance}

Jika ingin withdraw sekarang: {withdrawal_request_link}

TERUS PROMOSIKAN:
Semakin banyak yang Anda promosikan, semakin banyak yang Anda hasilkan!
- Buat link baru: {create_link_page}
- Lihat analytics: {analytics_link}
- Dapatkan materi: {materials_link}

Lihat dashboard lengkap: {affiliate_dashboard_link}

Terima kasih atas dedikasi Anda!

Salam,
Tim {site_name}`,
    ctaText: 'Lihat Komisi Detail',
    ctaLink: '{affiliate_dashboard_link}',
    tags: ['affiliate', 'commission', 'earning'],
    priority: 'MEDIUM',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Affiliate Monthly Report',
    slug: 'affiliate-monthly-report',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '📊 Laporan Affiliate Anda - {report_month}',
    content: `Halo {name},

Berikut adalah laporan affiliate Anda untuk bulan {report_month}.

RINGKASAN PERFORMA:
- Total Komisi: {total_commission}
- Jumlah Penjualan: {total_sales}
- Jumlah Klik: {total_clicks}
- Conversion Rate: {conversion_rate}%
- Ranking Affiliate: {affiliate_rank} dari {total_affiliates}

TOP PERFORMING LINKS:
1. {link_1} - {clicks_1} klik, {sales_1} penjualan, {commission_1}
2. {link_2} - {clicks_2} klik, {sales_2} penjualan, {commission_2}
3. {link_3} - {clicks_3} klik, {sales_3} penjualan, {commission_3}

SALDO & PEMBAYARAN:
- Komisi Bulan Ini: {monthly_commission}
- Bonus (jika ada): {monthly_bonus}
- Deduction (jika ada): {monthly_deduction}
- Saldo Pending: {pending_balance}
- Total Tersedia untuk Withdraw: {available_balance}

INSIGHT:
- Metode Promosi Terbaik: {best_promo_method}
- Waktu Penjualan Terbaik: {best_selling_time}
- Produk Paling Laris: {top_product}
- Audiens Terbaik Anda: {best_audience}

REKOMENDASI:
✓ Tingkatkan fokus pada {best_promo_method}
✓ Coba strategi baru: {new_strategy_suggestion}
✓ Join webinar affiliate: {webinar_link}
✓ Update materi promosi: {materials_link}

Lihat laporan lengkap: {detailed_report_link}

Pertanyaan? {support_email}

Terus berkembang!
Tim {site_name}`,
    ctaText: 'Lihat Laporan Lengkap',
    ctaLink: '{detailed_report_link}',
    tags: ['affiliate', 'report', 'analytics'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Affiliate Payout',
    slug: 'affiliate-payout',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '✅ Pembayaran Komisi Anda Telah Diproses',
    content: `Halo {name},

Pembayaran komisi affiliate Anda telah diproses!

DETAIL PEMBAYARAN:
- Jumlah: {payout_amount}
- Periode: {payout_period}
- Tanggal Diproses: {payout_date}
- Metode Transfer: {payout_method}
- Status: ✅ BERHASIL DIPROSES

RINCIAN KOMISI:
- Total Penjualan: {total_sales}
- Komisi: {commission_amount}
- Pajak (jika ada): {tax_amount}
- Biaya Admin (jika ada): {admin_fee}
- NET PAYOUT: {net_payout_amount}

PENERIMA TRANSFER:
- Bank: {bank_name}
- Rekening: {account_number}
- Atas Nama: {account_holder}

ESTIMASI PENERIMAAN:
- Bank Domestik: 1-3 hari kerja
- Transfer Internasional: 3-7 hari kerja
- E-Wallet: 1-24 jam

REFERENSI TRANSAKSI:
{transaction_reference}

CEK STATUS TRANSFER: {transfer_tracking_link}

AFILIASI STATS:
- Total Lifetime Earnings: {lifetime_earnings}
- Total Payouts: {total_payouts}
- Remaining Balance: {remaining_balance}

DAPATKAN LEBIH BANYAK:
Tingkatkan earning Anda dengan:
- Buat lebih banyak promotional links
- Target audiens yang lebih besar
- Ikuti webinar strategi affiliate
- Gunakan marketing materials kami

Dashboard Anda: {affiliate_dashboard_link}

Terima kasih atas kolaborasi Anda!

Salam,
Tim {site_name}`,
    ctaText: 'Cek Status Pembayaran',
    ctaLink: '{transfer_tracking_link}',
    tags: ['affiliate', 'payout', 'payment'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Affiliate Tier Upgrade',
    slug: 'affiliate-tier-upgrade',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: '🚀 Selamat! Anda Naik ke Tier {new_tier} Affiliate',
    content: `Halo {name},

Selamat! Performa Anda luar biasa! Anda telah naik ke tingkat {new_tier} di program affiliate kami!

TIER BARU ANDA: {new_tier}
- Komisi: {new_commission_rate}% (naik dari {old_commission_rate}%)
- Bonus Kinerja: {tier_bonus}
- Akses Khusus: {tier_exclusive_features}
- Priority Support: {priority_support_level}

SYARAT PENCAPAIAN:
✓ Penjualan Bulanan: {sales_requirement} (Anda: {your_sales})
✓ Conversion Rate: {conversion_requirement}% (Anda: {your_conversion}%)
✓ Aktivitas Promosi: {activity_requirement} (Anda: {your_activity})

BENEFIT TIER {new_tier}:
✓ Komisi lebih tinggi: {new_commission_rate}%
✓ Bonus performa khusus: {tier_specific_bonus}
✓ Akses dashboard premium
✓ Materi marketing eksklusif
✓ Konsultasi gratis dengan tim
✓ Invitation ke event khusus
✓ Recognition di leaderboard

APA YANG BERUBAH:
- Komisi baru berlaku untuk semua penjualan di masa depan
- Review tier dilakukan setiap bulan
- Anda bisa naik/turun tier berdasarkan performa

NEXT TIER: {next_tier}
- Untuk naik ke tier selanjutnya, capai:
  • {next_tier_sales_requirement} penjualan/bulan
  • {next_tier_conversion}% conversion rate
  • {next_tier_bonus} aktivitas promosi

Terus berkembang! Kami percaya Anda bisa mencapai tier tertinggi.

Dashboard Anda: {affiliate_dashboard_link}

Pertanyaan? {support_email}

Selamat atas pencapaian Anda!
Tim {site_name}`,
    ctaText: 'Lihat Tier Benefits',
    ctaLink: '{affiliate_dashboard_link}',
    tags: ['affiliate', 'tier', 'achievement'],
    priority: 'MEDIUM',
    isDefault: false,
    isActive: true
  }
]

async function seedTemplates() {
  try {
    console.log('\n🌱 SEEDING TEMPLATE LENGKAP...\n')

    let created = 0
    let skipped = 0
    let errors = 0

    for (const template of COMPLETE_TEMPLATES) {
      try {
        // Check if exists by slug
        const existing = await prisma.brandedTemplate.findFirst({
          where: { slug: template.slug }
        })

        if (existing) {
          console.log(`⏭️  ${template.name} (${template.slug}) - sudah ada`)
          skipped++
          continue
        }

        // Create template with generated ID
        const createdTemplate = await prisma.brandedTemplate.create({
          data: {
            id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...template,
            isSystem: false,
            updatedAt: new Date()
          }
        })

        console.log(`✅ ${template.name} (${template.category}) - dibuat`)
        created++
      } catch (err) {
        console.error(`❌ ERROR: ${template.name} - ${err.message}`)
        errors++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log(`\n📊 SUMMARY SEEDING:`)
    console.log(`✅ Dibuat: ${created} templates`)
    console.log(`⏭️  Sudah ada: ${skipped} templates`)
    console.log(`❌ Error: ${errors}`)
    
    // New audit
    const allTemplates = await prisma.brandedTemplate.findMany({
      select: { category: true }
    })
    
    const byCategory = {}
    allTemplates.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1
    })

    console.log(`\n📈 TOTAL TEMPLATES: ${allTemplates.length}`)
    console.log(`\n📁 BY CATEGORY:`)
    Object.keys(byCategory).sort().forEach(cat => {
      console.log(`   ${cat.padEnd(15)}: ${byCategory[cat]} templates`)
    })

    console.log('\n✅ SEEDING SELESAI!\n')

  } catch (error) {
    console.error('FATAL ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedTemplates()
