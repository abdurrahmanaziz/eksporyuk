/**
 * Default Reminder Templates untuk Membership
 * Template ini bisa digunakan sebagai starting point untuk setiap membership plan
 */

export interface ReminderTemplate {
  id: string
  name: string
  description: string
  category: 'welcome' | 'onboarding' | 'engagement' | 'expiry' | 'renewal' | 'upsell'
  triggerType: 'AFTER_PURCHASE' | 'BEFORE_EXPIRY' | 'ON_SPECIFIC_DATE' | 'CONDITIONAL'
  delayAmount: number
  delayUnit: 'hours' | 'days' | 'weeks'
  
  // Channel defaults
  emailEnabled: boolean
  whatsappEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  
  // Email content
  emailSubject: string
  emailBody: string
  emailCTA: string
  emailCTALink: string
  
  // WhatsApp content (untuk broadcast WA jika ada integrasi)
  whatsappMessage: string
  
  // Push notification
  pushTitle: string
  pushBody: string
  
  // In-app notification
  inAppTitle: string
  inAppBody: string
  inAppLink: string
  
  // Settings
  preferredTime: string
  avoidWeekends: boolean
  sequenceOrder: number
}

// =====================================================
// WELCOME SERIES - Setelah Pembelian
// =====================================================

export const welcomeTemplates: ReminderTemplate[] = [
  {
    id: 'welcome-instant',
    name: 'Welcome Email - Langsung',
    description: 'Email selamat datang yang dikirim langsung setelah pembayaran berhasil',
    category: 'welcome',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 0,
    delayUnit: 'hours',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '🎉 Selamat Bergabung di {plan_name}!',
    emailBody: `Halo {name}! 👋

Selamat! Pembayaran Anda telah berhasil dan sekarang Anda resmi menjadi member {plan_name}.

🎯 **Yang Bisa Anda Akses Sekarang:**
- ✅ Semua kursus eksklusif
- ✅ Grup komunitas member
- ✅ Materi & resources premium
- ✅ Diskusi dengan sesama member

📅 **Masa Aktif Membership:**
Berlaku hingga {expiry_date}

🚀 **Langkah Selanjutnya:**
1. Lengkapi profil Anda
2. Bergabung ke grup komunitas
3. Mulai belajar kursus pertama

Klik tombol di bawah untuk mulai perjalanan Anda!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Akses Dashboard Sekarang',
    emailCTALink: '{dashboard_link}',
    
    whatsappMessage: `🎉 Halo {name}!

Selamat bergabung di *{plan_name}*! 

Pembayaran Anda sudah berhasil. Sekarang Anda bisa:
✅ Akses semua kursus
✅ Gabung grup komunitas
✅ Download resources premium

Akses dashboard: {dashboard_link}

Ada pertanyaan? Balas pesan ini ya!`,
    
    pushTitle: '🎉 Welcome to {plan_name}!',
    pushBody: 'Pembayaran berhasil! Klik untuk mulai belajar.',
    
    inAppTitle: 'Selamat Bergabung!',
    inAppBody: 'Membership {plan_name} Anda sudah aktif. Mulai perjalanan Anda sekarang!',
    inAppLink: '/dashboard',
    
    preferredTime: '09:00',
    avoidWeekends: false,
    sequenceOrder: 1,
  },
  {
    id: 'welcome-day1-community',
    name: 'Ajakan Gabung Komunitas - H+1',
    description: 'Reminder untuk bergabung ke grup komunitas setelah 1 hari',
    category: 'welcome',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 1,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '👥 {name}, Sudah Gabung Komunitas?',
    emailBody: `Halo {name}!

Sudah sehari sejak Anda bergabung di {plan_name}. Gimana, sudah explore dashboard-nya?

🤝 **Jangan Lupa Gabung Komunitas!**

Salah satu keuntungan terbesar jadi member adalah akses ke komunitas eksklusif. Di sana Anda bisa:

- 💬 Diskusi dengan sesama member
- ❓ Tanya jawab langsung dengan mentor
- 🤝 Networking & kolaborasi bisnis
- 📢 Info update & promo eksklusif

Komunitas kami sangat aktif dan supportive. Banyak member yang sudah merasakan manfaatnya!

Yuk, langsung gabung sekarang!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Gabung Komunitas',
    emailCTALink: '/community/groups',
    
    whatsappMessage: `👥 Halo {name}!

Sudah gabung komunitas member belum?

Di grup komunitas, Anda bisa:
💬 Diskusi sesama member
❓ Tanya jawab dengan mentor
🤝 Networking bisnis

Banyak member yang sudah merasakan manfaatnya!

Gabung sekarang: {dashboard_link}/community/groups`,
    
    pushTitle: '👥 Gabung Komunitas Yuk!',
    pushBody: 'Diskusi bareng sesama member. Klik untuk gabung!',
    
    inAppTitle: 'Sudah Gabung Komunitas?',
    inAppBody: 'Jangan lewatkan diskusi seru di grup komunitas member!',
    inAppLink: '/community/groups',
    
    preferredTime: '10:00',
    avoidWeekends: false,
    sequenceOrder: 2,
  },
  {
    id: 'welcome-day3-course',
    name: 'Mulai Belajar Kursus - H+3',
    description: 'Reminder untuk memulai kursus pertama setelah 3 hari',
    category: 'onboarding',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 3,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '📚 {name}, Waktunya Mulai Belajar!',
    emailBody: `Halo {name}!

Sudah 3 hari sejak Anda bergabung di {plan_name}. Apakah sudah mulai belajar?

📚 **Rekomendasi Kursus untuk Anda:**

Sebagai member baru, kami sarankan untuk memulai dari kursus dasar terlebih dahulu. Ini akan membantu Anda memahami fondasi yang kuat sebelum lanjut ke materi advanced.

💡 **Tips Belajar Efektif:**
1. Jadwalkan waktu belajar rutin (30-60 menit/hari)
2. Catat poin-poin penting
3. Praktekkan langsung apa yang dipelajari
4. Diskusikan di komunitas jika ada pertanyaan

Ingat, konsistensi adalah kunci! Lebih baik belajar sedikit setiap hari daripada maraton sekali seminggu.

Yuk, mulai belajar sekarang!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Mulai Belajar',
    emailCTALink: '/dashboard/my-membership/courses',
    
    whatsappMessage: `📚 Halo {name}!

Sudah mulai belajar di {plan_name}?

Tips belajar efektif:
✅ Jadwalkan 30-60 menit/hari
✅ Catat poin penting
✅ Langsung praktek
✅ Diskusi di komunitas

Akses kursus: {dashboard_link}/my-membership/courses`,
    
    pushTitle: '📚 Waktunya Belajar!',
    pushBody: 'Kursus eksklusif menunggu Anda. Mulai sekarang!',
    
    inAppTitle: 'Mulai Belajar Yuk!',
    inAppBody: 'Akses kursus eksklusif Anda dan mulai perjalanan belajar.',
    inAppLink: '/dashboard/my-membership/courses',
    
    preferredTime: '09:00',
    avoidWeekends: true,
    sequenceOrder: 3,
  },
  {
    id: 'welcome-day7-checkin',
    name: 'Check-in Minggu Pertama - H+7',
    description: 'Check-in progress setelah 1 minggu',
    category: 'engagement',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 7,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: false,
    inAppEnabled: true,
    
    emailSubject: '🌟 Sudah Seminggu, {name}! Gimana Progressnya?',
    emailBody: `Halo {name}!

Tidak terasa sudah seminggu Anda bergabung di {plan_name}! 🎉

⏱️ **Quick Check:**
- Sudah lengkapi profil? ✅
- Sudah gabung komunitas? ✅
- Sudah mulai belajar? ✅

Kalau ada yang belum, jangan khawatir! Masih ada waktu untuk catch up.

📊 **Apa yang Member Lain Capai di Minggu Pertama:**
- Menyelesaikan 2-3 modul kursus
- Aktif diskusi di komunitas
- Mulai networking dengan member lain

🤔 **Ada Kendala?**
Jika Anda mengalami kesulitan atau ada pertanyaan, jangan ragu untuk:
1. Tanya di grup komunitas
2. Hubungi tim support kami
3. Cek FAQ di dashboard

Kami di sini untuk membantu Anda sukses!

Semangat terus ya!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Lanjutkan Belajar',
    emailCTALink: '{dashboard_link}',
    
    whatsappMessage: `🌟 Halo {name}!

Sudah seminggu di {plan_name}! Gimana progressnya?

Quick check:
✅ Profil lengkap?
✅ Gabung komunitas?
✅ Mulai belajar?

Ada kendala? Langsung tanya di komunitas ya!

Dashboard: {dashboard_link}`,
    
    pushTitle: '🌟 Sudah Seminggu!',
    pushBody: 'Check progress Anda dan lanjutkan belajar.',
    
    inAppTitle: 'Sudah Seminggu!',
    inAppBody: 'Gimana progress minggu pertama? Yuk lanjutkan perjalanan Anda!',
    inAppLink: '/dashboard',
    
    preferredTime: '10:00',
    avoidWeekends: true,
    sequenceOrder: 4,
  },
]

// =====================================================
// ENGAGEMENT - Meningkatkan Aktivitas Member
// =====================================================

export const engagementTemplates: ReminderTemplate[] = [
  {
    id: 'engagement-inactive-7days',
    name: 'Re-engagement - Tidak Aktif 7 Hari',
    description: 'Reminder untuk member yang tidak aktif selama 7 hari',
    category: 'engagement',
    triggerType: 'CONDITIONAL',
    delayAmount: 7,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: false,
    
    emailSubject: '😢 Kami Kangen {name}!',
    emailBody: `Halo {name}!

Kami perhatikan sudah seminggu Anda tidak login ke dashboard. Semoga semuanya baik-baik saja!

🎯 **Yang Mungkin Anda Lewatkan:**
- Diskusi seru di komunitas
- Update materi terbaru
- Tips & tricks dari member lain

💡 **Butuh Bantuan?**
Jika ada kendala teknis atau kesulitan lainnya, tim kami siap membantu. Jangan ragu untuk menghubungi kami!

📅 **Reminder:**
Membership {plan_name} Anda masih aktif hingga {expiry_date}. Manfaatkan waktu yang ada untuk belajar dan berkembang!

Kami tunggu kehadirannya kembali ya!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Kembali Belajar',
    emailCTALink: '{dashboard_link}',
    
    whatsappMessage: `😢 Halo {name}!

Sudah seminggu tidak keliatan di dashboard nih. Semoga semuanya baik-baik saja!

Membership Anda masih aktif sampai {expiry_date}. Yuk manfaatkan! 

Ada kendala? Langsung balas pesan ini ya.

Dashboard: {dashboard_link}`,
    
    pushTitle: '😢 Kami Kangen!',
    pushBody: 'Sudah seminggu tidak belajar. Yuk kembali!',
    
    inAppTitle: 'Selamat Datang Kembali!',
    inAppBody: 'Senang melihat Anda kembali. Yuk lanjutkan belajar!',
    inAppLink: '/dashboard',
    
    preferredTime: '11:00',
    avoidWeekends: true,
    sequenceOrder: 10,
  },
  {
    id: 'engagement-monthly-recap',
    name: 'Monthly Progress Recap',
    description: 'Rekap progress bulanan untuk member',
    category: 'engagement',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 30,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: false,
    inAppEnabled: true,
    
    emailSubject: '📊 Recap Bulan Ini, {name}!',
    emailBody: `Halo {name}!

Sudah sebulan Anda menjadi member {plan_name}! Mari kita lihat perjalanan Anda:

📊 **Progress Anda Bulan Ini:**
- Waktu belajar: [tracking data]
- Kursus diselesaikan: [tracking data]
- Diskusi di komunitas: [tracking data]

🏆 **Pencapaian:**
Selamat! Anda sudah menyelesaikan beberapa milestone penting dalam perjalanan Anda.

🎯 **Target Bulan Depan:**
1. Selesaikan 1 kursus lagi
2. Aktif diskusi minimal 3x seminggu
3. Praktekkan ilmu yang didapat

💪 **Motivasi:**
"Sukses adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan."

Terus semangat dan konsisten ya!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Lihat Dashboard',
    emailCTALink: '{dashboard_link}',
    
    whatsappMessage: `📊 Halo {name}!

Sudah sebulan jadi member {plan_name}! 🎉

Yuk terus konsisten belajar dan praktek. Progress kecil setiap hari akan menghasilkan perubahan besar!

Lihat progress: {dashboard_link}`,
    
    pushTitle: '📊 Monthly Recap!',
    pushBody: 'Lihat progress bulan ini.',
    
    inAppTitle: 'Rekap Bulan Ini',
    inAppBody: 'Sudah sebulan! Lihat progress dan pencapaian Anda.',
    inAppLink: '/dashboard',
    
    preferredTime: '10:00',
    avoidWeekends: true,
    sequenceOrder: 11,
  },
]

// =====================================================
// EXPIRY & RENEWAL - Sebelum Expired
// =====================================================

export const expiryTemplates: ReminderTemplate[] = [
  {
    id: 'expiry-30days',
    name: 'Reminder Expiry - 30 Hari',
    description: 'Reminder 30 hari sebelum membership expired',
    category: 'expiry',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 30,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: false,
    inAppEnabled: true,
    
    emailSubject: '📅 Info: Membership Anda Akan Berakhir',
    emailBody: `Halo {name}!

Ini adalah reminder bahwa membership {plan_name} Anda akan berakhir dalam 30 hari ({expiry_date}).

📊 **Rekap Membership Anda:**
- Tanggal mulai: [start_date]
- Tanggal berakhir: {expiry_date}
- Sisa waktu: {days_left} hari

🎁 **Perpanjang Sekarang, Dapat Benefit:**
- ✅ Tidak perlu registrasi ulang
- ✅ Progress belajar tetap tersimpan
- ✅ Akses komunitas tidak terputus
- ✅ [Bonus khusus perpanjangan]

Jangan sampai akses Anda terputus ya!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Perpanjang Membership',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `📅 Halo {name}!

Membership {plan_name} akan berakhir dalam 30 hari ({expiry_date}).

Perpanjang sekarang agar akses tidak terputus!

Link: {payment_link}`,
    
    pushTitle: '📅 30 Hari Lagi',
    pushBody: 'Membership akan berakhir. Perpanjang sekarang!',
    
    inAppTitle: 'Membership Akan Berakhir',
    inAppBody: 'Sisa 30 hari lagi. Perpanjang untuk akses tanpa gangguan.',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '10:00',
    avoidWeekends: true,
    sequenceOrder: 20,
  },
  {
    id: 'expiry-14days',
    name: 'Reminder Expiry - 14 Hari',
    description: 'Reminder 14 hari sebelum membership expired',
    category: 'expiry',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 14,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '⏰ 2 Minggu Lagi! Perpanjang Membership Anda',
    emailBody: `Halo {name}!

Membership {plan_name} Anda akan berakhir dalam 14 hari ({expiry_date}).

⚠️ **Setelah Expired, Anda Akan Kehilangan:**
- ❌ Akses ke semua kursus
- ❌ Akses grup komunitas
- ❌ Resources & materi premium
- ❌ Diskusi dengan member lain

💡 **Solusinya Mudah:**
Perpanjang membership sekarang dan nikmati akses tanpa gangguan!

🎁 **Khusus Perpanjangan:**
- Diskon 10% dengan kode: RENEW10
- Bonus [sebutkan bonus]

Jangan tunggu sampai expired ya!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Perpanjang Sekarang',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `⏰ Halo {name}!

2 minggu lagi membership Anda berakhir!

Perpanjang sekarang agar akses tidak terputus. Gunakan kode RENEW10 untuk diskon 10%!

Link: {payment_link}`,
    
    pushTitle: '⏰ 14 Hari Lagi!',
    pushBody: 'Perpanjang membership sebelum expired!',
    
    inAppTitle: '2 Minggu Lagi!',
    inAppBody: 'Membership akan berakhir. Perpanjang sekarang dengan diskon!',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '09:00',
    avoidWeekends: true,
    sequenceOrder: 21,
  },
  {
    id: 'expiry-7days',
    name: 'Reminder Expiry - 7 Hari',
    description: 'Reminder 7 hari sebelum membership expired',
    category: 'expiry',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 7,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '🔔 Seminggu Lagi! Jangan Sampai Kehilangan Akses',
    emailBody: `Halo {name}!

PENGINGAT PENTING: Membership {plan_name} Anda akan berakhir dalam 7 HARI ({expiry_date})!

⏰ **Waktu Tersisa:** {days_left} hari

🚨 **Yang Akan Terjadi Jika Tidak Diperpanjang:**
1. Akses kursus akan terkunci
2. Tidak bisa masuk grup komunitas
3. Progress belajar tidak bisa dilanjutkan
4. Kehilangan koneksi dengan member lain

💪 **Jangan Biarkan Ini Terjadi!**
Anda sudah invest waktu dan usaha untuk belajar. Jangan sia-siakan progress yang sudah dicapai!

🎁 **PROMO KHUSUS MINGGU INI:**
Perpanjang sekarang dan dapatkan [benefit khusus]!

Klik tombol di bawah untuk perpanjang:

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Perpanjang Sekarang',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `🔔 URGENT {name}!

Membership berakhir dalam 7 hari!

Jangan sampai akses Anda terputus. Perpanjang sekarang!

Link: {payment_link}`,
    
    pushTitle: '🔔 7 Hari Lagi!',
    pushBody: 'Membership hampir expired. Perpanjang sekarang!',
    
    inAppTitle: 'Seminggu Lagi!',
    inAppBody: 'Segera perpanjang membership agar akses tidak terputus.',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '09:00',
    avoidWeekends: false,
    sequenceOrder: 22,
  },
  {
    id: 'expiry-3days',
    name: 'Reminder Expiry - 3 Hari',
    description: 'Reminder 3 hari sebelum membership expired',
    category: 'expiry',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 3,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '🚨 3 HARI LAGI! {name}, Jangan Sampai Terlambat',
    emailBody: `Halo {name}!

⚠️ URGENT: Membership Anda akan EXPIRED dalam 3 HARI!

📅 Tanggal Berakhir: {expiry_date}
⏰ Sisa Waktu: {days_left} hari

Ini adalah kesempatan terakhir untuk perpanjang sebelum akses Anda terputus!

❌ **Jika Tidak Perpanjang:**
- Semua kursus akan terkunci
- Keluar otomatis dari komunitas
- Progress tidak bisa dilanjutkan

✅ **Jika Perpanjang Sekarang:**
- Akses tetap lancar
- Progress tersimpan
- Bonus perpanjangan

🎁 **PENAWARAN TERAKHIR:**
Gunakan kode LAST3DAYS untuk extra diskon!

Jangan tunda lagi!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'PERPANJANG SEKARANG',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `🚨 URGENT {name}!

3 HARI LAGI membership expired!

Ini kesempatan terakhir perpanjang sebelum akses terputus.

Kode diskon: LAST3DAYS

Link: {payment_link}`,
    
    pushTitle: '🚨 3 Hari Lagi!',
    pushBody: 'URGENT! Perpanjang sebelum akses terputus.',
    
    inAppTitle: '3 Hari Lagi!',
    inAppBody: 'Kesempatan terakhir perpanjang membership!',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '09:00',
    avoidWeekends: false,
    sequenceOrder: 23,
  },
  {
    id: 'expiry-1day',
    name: 'Reminder Expiry - 1 Hari (Terakhir)',
    description: 'Reminder terakhir 1 hari sebelum membership expired',
    category: 'expiry',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 1,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '⛔ TERAKHIR! Membership Anda Berakhir BESOK',
    emailBody: `Halo {name}!

⛔ PERINGATAN TERAKHIR ⛔

Membership {plan_name} Anda akan BERAKHIR BESOK ({expiry_date})!

Ini adalah email terakhir sebelum akses Anda terputus.

😢 **Kami Tidak Ingin Anda Pergi...**
Anda sudah menjadi bagian dari komunitas kami. Jangan biarkan perjalanan ini berhenti di sini!

⏰ **WAKTU TERSISA: KURANG DARI 24 JAM**

🎁 **PENAWARAN FINAL:**
Perpanjang SEKARANG dan dapatkan:
- Diskon 15% (kode: FINALDAY)
- Bonus 1 bulan gratis
- Akses ke [fitur eksklusif]

Ini adalah kesempatan terakhir. Setelah ini, kami tidak bisa menawarkan deal yang sama.

Klik tombol di bawah sebelum terlambat!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: '⚡ PERPANJANG SEKARANG',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `⛔ TERAKHIR {name}!

Membership berakhir BESOK!

Perpanjang SEKARANG sebelum akses terputus.

Diskon 15% kode: FINALDAY

Link: {payment_link}`,
    
    pushTitle: '⛔ BESOK EXPIRED!',
    pushBody: 'Kesempatan terakhir perpanjang membership!',
    
    inAppTitle: 'BESOK EXPIRED!',
    inAppBody: 'Ini reminder terakhir. Perpanjang sekarang!',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '09:00',
    avoidWeekends: false,
    sequenceOrder: 24,
  },
  {
    id: 'expiry-today',
    name: 'Membership Expired Today',
    description: 'Notifikasi saat membership expired',
    category: 'expiry',
    triggerType: 'BEFORE_EXPIRY',
    delayAmount: 0,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    
    emailSubject: '😢 Membership Anda Sudah Berakhir',
    emailBody: `Halo {name},

Dengan berat hati kami informasikan bahwa membership {plan_name} Anda sudah berakhir hari ini.

❌ **Akses yang Sudah Tidak Tersedia:**
- Kursus eksklusif
- Grup komunitas
- Resources premium

😊 **Tapi Jangan Khawatir!**
Anda masih bisa kembali kapan saja. Semua progress belajar Anda tetap tersimpan.

🎁 **Penawaran Comeback:**
Reaktivasi membership dalam 7 hari dan dapatkan diskon 20%!
Gunakan kode: COMEBACK20

Kami sangat berharap bisa melihat Anda kembali!

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Reaktivasi Membership',
    emailCTALink: '{payment_link}',
    
    whatsappMessage: `😢 Halo {name},

Membership {plan_name} Anda sudah berakhir.

Tapi jangan khawatir! Progress Anda tersimpan. Reaktivasi dalam 7 hari dan dapatkan diskon 20%!

Kode: COMEBACK20
Link: {payment_link}`,
    
    pushTitle: '😢 Membership Berakhir',
    pushBody: 'Reaktivasi sekarang dengan diskon 20%!',
    
    inAppTitle: 'Membership Berakhir',
    inAppBody: 'Reaktivasi dalam 7 hari untuk diskon 20%.',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '10:00',
    avoidWeekends: false,
    sequenceOrder: 25,
  },
]

// =====================================================
// UPSELL - Upgrade ke Paket Lebih Tinggi
// =====================================================

export const upsellTemplates: ReminderTemplate[] = [
  {
    id: 'upsell-day14',
    name: 'Upsell Upgrade - H+14',
    description: 'Tawarkan upgrade ke paket lebih tinggi setelah 2 minggu',
    category: 'upsell',
    triggerType: 'AFTER_PURCHASE',
    delayAmount: 14,
    delayUnit: 'days',
    
    emailEnabled: true,
    whatsappEnabled: false,
    pushEnabled: false,
    inAppEnabled: true,
    
    emailSubject: '🚀 {name}, Siap Naik Level?',
    emailBody: `Halo {name}!

Sudah 2 minggu Anda belajar di {plan_name}. Gimana progressnya?

🎯 **Siap untuk Level Selanjutnya?**

Kami punya kabar baik! Anda bisa upgrade ke paket yang lebih tinggi dengan benefit:

✨ **Benefit Upgrade:**
- Akses ke SEMUA kursus (termasuk advanced)
- Mentoring eksklusif 1-on-1
- Resources tambahan
- Prioritas support
- Dan masih banyak lagi!

💰 **Penawaran Khusus Member:**
Upgrade sekarang dan dapatkan potongan harga karena Anda sudah menjadi member!

Klik tombol di bawah untuk lihat opsi upgrade:

Salam sukses,
Tim Ekspor Yuk`,
    emailCTA: 'Lihat Opsi Upgrade',
    emailCTALink: '/dashboard/upgrade',
    
    whatsappMessage: `🚀 Halo {name}!

Sudah 2 minggu di {plan_name}. Siap naik level?

Upgrade sekarang untuk:
✨ Akses SEMUA kursus
✨ Mentoring 1-on-1
✨ Priority support

Lihat opsi: {dashboard_link}/upgrade`,
    
    pushTitle: '🚀 Siap Naik Level?',
    pushBody: 'Lihat benefit upgrade membership.',
    
    inAppTitle: 'Upgrade Tersedia!',
    inAppBody: 'Tingkatkan membership untuk akses lebih banyak fitur.',
    inAppLink: '/dashboard/upgrade',
    
    preferredTime: '10:00',
    avoidWeekends: true,
    sequenceOrder: 30,
  },
]

// =====================================================
// ALL TEMPLATES
// =====================================================

export const allReminderTemplates: ReminderTemplate[] = [
  ...welcomeTemplates,
  ...engagementTemplates,
  ...expiryTemplates,
  ...upsellTemplates,
]

export const templateCategories = [
  { id: 'welcome', name: 'Welcome Series', description: 'Email selamat datang & onboarding awal', icon: '👋' },
  { id: 'onboarding', name: 'Onboarding', description: 'Panduan memulai untuk member baru', icon: '🎯' },
  { id: 'engagement', name: 'Engagement', description: 'Meningkatkan aktivitas & retensi member', icon: '💪' },
  { id: 'expiry', name: 'Expiry Reminder', description: 'Pengingat sebelum membership berakhir', icon: '⏰' },
  { id: 'renewal', name: 'Renewal', description: 'Ajakan perpanjang membership', icon: '🔄' },
  { id: 'upsell', name: 'Upsell', description: 'Penawaran upgrade ke paket lebih tinggi', icon: '🚀' },
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): ReminderTemplate[] {
  return allReminderTemplates.filter(t => t.category === category)
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): ReminderTemplate | undefined {
  return allReminderTemplates.find(t => t.id === id)
}

/**
 * Convert template to reminder data for API
 */
export function templateToReminderData(template: ReminderTemplate, membershipId: string) {
  return {
    membershipId,
    title: template.name,
    description: template.description,
    triggerType: template.triggerType,
    delayAmount: template.delayAmount,
    delayUnit: template.delayUnit,
    
    emailEnabled: template.emailEnabled,
    whatsappEnabled: template.whatsappEnabled,
    pushEnabled: template.pushEnabled,
    inAppEnabled: template.inAppEnabled,
    
    emailSubject: template.emailSubject,
    emailBody: template.emailBody,
    emailCTA: template.emailCTA,
    emailCTALink: template.emailCTALink,
    
    whatsappMessage: template.whatsappMessage,
    whatsappCTA: '',
    whatsappCTALink: '',
    
    pushTitle: template.pushTitle,
    pushBody: template.pushBody,
    pushIcon: '',
    pushClickAction: '',
    
    inAppTitle: template.inAppTitle,
    inAppBody: template.inAppBody,
    inAppLink: template.inAppLink,
    
    preferredTime: template.preferredTime,
    timezone: 'Asia/Jakarta',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    avoidWeekends: template.avoidWeekends,
    conditions: {},
    stopIfCondition: {},
    stopOnAction: false,
    sequenceOrder: template.sequenceOrder,
    
    isActive: true,
  }
}
