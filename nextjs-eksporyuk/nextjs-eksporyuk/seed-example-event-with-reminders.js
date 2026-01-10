/**
 * Script untuk membuat contoh Event lengkap dengan semua Reminder/Notifikasi
 * Run: node seed-example-event-with-reminders.js
 * 
 * Catatan: Ada 2 model Event di sistem ini:
 * 1. Model `Event` - untuk group events dengan EventReminder
 * 2. Model `Product` dengan productType='EVENT' - untuk event berbayar
 * 
 * Script ini membuat ke model Event yang memiliki relasi EventReminder
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Creating Example Event with Full Reminders...\n')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!admin) {
    console.error('❌ No admin user found!')
    return
  }

  console.log(`✅ Using admin: ${admin.email}`)

  // Set event date 30 days from now
  const eventDate = new Date()
  eventDate.setDate(eventDate.getDate() + 30)
  eventDate.setHours(9, 0, 0, 0)

  const eventEndDate = new Date(eventDate)
  eventEndDate.setHours(17, 0, 0, 0)

  // Create event using Event model (not Product)
  const event = await prisma.event.create({
    data: {
      creatorId: admin.id,
      title: 'Workshop Ekspor Produk UKM ke Pasar Internasional',
      type: 'WEBINAR',
      startDate: eventDate,
      endDate: eventEndDate,
      description: `
## Workshop Ekspor Produk UKM ke Pasar Internasional 🌍

### Apa yang Akan Anda Pelajari?

**Modul 1: Fundamental Ekspor**
- Memahami regulasi ekspor Indonesia
- Dokumen-dokumen wajib ekspor
- Prosedur bea cukai

**Modul 2: Market Research**
- Cara menemukan buyer potensial
- Analisis pasar internasional
- Strategi pricing untuk ekspor

**Modul 3: Hands-On Practice**
- Simulasi pengisian dokumen ekspor
- Mock negotiation dengan buyer
- Studi kasus nyata

### Speaker:
- **Budi Santoso** - Founder EksporYuk, 15+ tahun pengalaman ekspor
- **Sarah Wijaya** - Export Consultant, mantan diplomat dagang
- **Ahmad Rizki** - UKM Exporter sukses ke 20+ negara

### Yang Anda Dapatkan:
✅ Sertifikat Kehadiran
✅ Materi Presentasi (PDF)
✅ Template Dokumen Ekspor
✅ Akses Rekaman 30 Hari
✅ Networking dengan 200+ Peserta
✅ Coffee Break & Lunch
✅ Doorprize Menarik!

### Lokasi:
📍 Hotel Grand Mercure Jakarta Kemayoran
📅 Event Date: 30 hari dari sekarang
⏰ 09:00 - 17:00 WIB

**KUOTA TERBATAS: Hanya 200 Peserta!**
`,
      location: 'Hotel Grand Mercure Jakarta Kemayoran',
      meetingUrl: 'https://zoom.us/j/1234567890',
      meetingId: '123-456-7890',
      meetingPassword: 'ekspor2025',
      maxAttendees: 200,
      price: 750000,
      isPublished: true,
      isFeatured: true,
    }
  })

  console.log(`\n✅ Event created: ${event.title}`)
  console.log(`   ID: ${event.id}`)
  console.log(`   Date: ${eventDate.toLocaleDateString('id-ID')}`)

  // Create reminders
  const reminders = [
    // 1. Konfirmasi Tiket - Immediately after purchase
    {
      eventId: event.id,
      title: 'Konfirmasi Tiket Workshop',
      description: 'Email konfirmasi setelah pembelian tiket',
      triggerType: 'AFTER_PURCHASE',
      delayAmount: 0,
      delayUnit: 'hours',
      channels: ['EMAIL', 'PUSH', 'IN_APP'],
      emailEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🎫 Tiket Workshop Ekspor UKM Berhasil Dibeli!',
      emailBody: `Halo {customer_name}!

Selamat! Tiket Anda untuk **Workshop Ekspor Produk UKM ke Pasar Internasional** sudah berhasil dibeli. 🎉

## Detail Event:
- 📅 **Tanggal:** ${eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- ⏰ **Waktu:** 09:00 - 17:00 WIB
- 📍 **Lokasi:** Hotel Grand Mercure Jakarta Kemayoran
- 🎫 **Nomor Tiket:** {ticket_number}

## Persiapan Sebelum Hari H:
1. Simpan email ini sebagai bukti pembelian
2. Unduh e-ticket di dashboard Anda
3. Tandai tanggal di kalender
4. Join grup WhatsApp peserta (link di dashboard)

## Yang Perlu Dibawa:
- KTP/Identitas
- Kartu nama (jika ada)
- Laptop (opsional, untuk praktik)
- Notebook & pulpen

Kami tunggu kehadiran Anda!

---
**Tim EksporYuk**
support@eksporyuk.com`,
      emailCTA: 'Download E-Ticket',
      emailCTALink: '{dashboard_link}/my-events',
      whatsappMessage: `🎫 *Tiket Workshop Berhasil Dibeli!*

Halo {customer_name}!

Selamat bergabung di Workshop Ekspor UKM! 

📅 ${eventDate.toLocaleDateString('id-ID')}
⏰ 09:00-17:00 WIB
📍 Hotel Grand Mercure Jakarta

Tiket: {ticket_number}

Cek email untuk detail lengkap ya!`,
      whatsappCTA: 'Lihat Detail',
      whatsappCTALink: '{dashboard_link}/my-events',
      pushTitle: 'Tiket Berhasil Dibeli! 🎫',
      pushBody: 'Tiket Workshop Ekspor UKM sudah di tangan Anda. Cek email untuk detail!',
      inAppTitle: 'Pembelian Berhasil!',
      inAppBody: 'Tiket Workshop Ekspor UKM sudah aktif. Cek halaman My Events untuk e-ticket Anda.',
      inAppLink: '/my-events',
      preferredTime: '09:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 1,
      isActive: true,
    },
    
    // 2. Reminder H-14 (2 minggu sebelum)
    {
      eventId: event.id,
      title: 'Pengingat H-14',
      description: 'Reminder 2 minggu sebelum event',
      triggerType: 'BEFORE_EVENT',
      delayAmount: 14,
      delayUnit: 'days',
      channels: ['EMAIL', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '📅 2 Minggu Lagi! Workshop Ekspor UKM',
      emailBody: `Halo {customer_name}!

Dua minggu lagi kita akan bertemu di **Workshop Ekspor Produk UKM ke Pasar Internasional**! 🗓️

## Persiapan 2 Minggu Sebelum:

### 1. Baca Pre-Reading Material
Kami sudah menyiapkan materi persiapan yang bisa Anda baca:
- [Panduan Dasar Ekspor Indonesia (PDF)](#)
- [Checklist Dokumen Ekspor](#)
- [Video Intro dari Speaker](#)

### 2. Join Grup Peserta
Bergabung di grup WhatsApp untuk networking awal:
[Join Grup WhatsApp]({whatsapp_group_link})

### 3. Siapkan Pertanyaan
Buat daftar pertanyaan yang ingin Anda tanyakan ke speaker.

### 4. Atur Jadwal
- Pastikan tanggal tersebut kosong
- Booking transportasi/akomodasi jika dari luar kota

## Detail Event:
- 📅 ${eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- ⏰ 09:00 - 17:00 WIB
- 📍 Hotel Grand Mercure Jakarta Kemayoran

Sampai jumpa 2 minggu lagi!

---
**Tim EksporYuk**`,
      pushTitle: '📅 H-14 Workshop Ekspor!',
      pushBody: '2 minggu lagi! Sudah baca pre-reading material?',
      inAppTitle: '2 Minggu Menuju Workshop',
      inAppBody: 'Persiapkan diri Anda! Baca materi persiapan di dashboard.',
      inAppLink: '/my-events',
      preferredTime: '09:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 2,
      isActive: true,
    },
    
    // 3. Reminder H-7 (seminggu sebelum)
    {
      eventId: event.id,
      title: 'Pengingat H-7',
      description: 'Reminder seminggu sebelum event',
      triggerType: 'BEFORE_EVENT',
      delayAmount: 7,
      delayUnit: 'days',
      channels: ['EMAIL', 'WHATSAPP', 'PUSH', 'IN_APP'],
      emailEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '⏰ Seminggu Lagi! Persiapan Workshop Ekspor',
      emailBody: `Halo {customer_name}!

**Tinggal 1 minggu lagi!** Workshop Ekspor UKM akan segera dimulai. 🎯

## Checklist Persiapan Minggu Ini:

### ✅ Administrasi
- [ ] Download e-ticket dari dashboard
- [ ] Screenshot/print e-ticket
- [ ] Siapkan KTP/identitas

### ✅ Materi
- [ ] Baca pre-reading material
- [ ] Siapkan daftar pertanyaan
- [ ] Review profil speaker

### ✅ Logistik
- [ ] Booking transportasi
- [ ] Booking hotel (jika dari luar kota)
- [ ] Cek rute ke lokasi

### ✅ Perlengkapan
- [ ] Kartu nama
- [ ] Notebook & pulpen
- [ ] Laptop (opsional)
- [ ] Charger HP/laptop

## Info Lokasi:
📍 **Hotel Grand Mercure Jakarta Kemayoran**
Jl. Benyamin Suaeb, Kemayoran, Jakarta Pusat

🚗 **Akses:**
- Dari Tol: Exit Kemayoran
- Parkir: Tersedia di basement (gratis untuk peserta)
- Ojol: Drop-off di lobby utama

## Rundown Singkat:
- 08:00 - 09:00: Registrasi & Coffee Morning
- 09:00 - 12:00: Sesi 1 (Fundamental + Market Research)
- 12:00 - 13:00: Lunch & Networking
- 13:00 - 16:00: Sesi 2 (Hands-On Practice)
- 16:00 - 17:00: Q&A & Closing

See you next week! 🙌

---
**Tim EksporYuk**`,
      whatsappMessage: `⏰ *REMINDER: Workshop Ekspor H-7!*

Halo {customer_name}!

Seminggu lagi ketemu! 🎯

Checklist minggu ini:
☑️ Download e-ticket
☑️ Siapkan KTP
☑️ Booking transportasi
☑️ Baca pre-reading

Lokasi: Hotel Grand Mercure Jakarta Kemayoran
Tanggal: ${eventDate.toLocaleDateString('id-ID')}

Ada pertanyaan? Reply chat ini ya!`,
      pushTitle: '⏰ H-7 Workshop Ekspor!',
      pushBody: 'Seminggu lagi! Sudah download e-ticket?',
      inAppTitle: 'Seminggu Menuju Workshop',
      inAppBody: 'Pastikan e-ticket sudah didownload dan persiapan logistik sudah oke!',
      inAppLink: '/my-events',
      preferredTime: '09:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 3,
      isActive: true,
    },
    
    // 4. Reminder H-3 (3 hari sebelum)
    {
      eventId: event.id,
      title: 'Pengingat H-3',
      description: 'Reminder 3 hari sebelum event',
      triggerType: 'BEFORE_EVENT',
      delayAmount: 3,
      delayUnit: 'days',
      channels: ['EMAIL', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🚀 3 Hari Lagi! Final Preparation Workshop',
      emailBody: `Halo {customer_name}!

**Tiga hari lagi!** Saatnya final check persiapan Anda. ✨

## Final Checklist:

### 🎫 E-Ticket
- Download dari: [Dashboard]({dashboard_link}/my-events)
- Nomor tiket: {ticket_number}
- Simpan di HP atau print

### 📍 Lokasi
Hotel Grand Mercure Jakarta Kemayoran
[Buka di Google Maps](https://maps.google.com/?q=Grand+Mercure+Jakarta+Kemayoran)

### 👔 Dress Code
Smart Casual - Nyaman tapi profesional

### 📱 Follow Media Sosial
Follow @eksporyuk untuk update terbaru!

## Info Tambahan:
- Registrasi dibuka: 08:00 WIB
- Event mulai: 09:00 WIB sharp
- Parkir gratis untuk peserta

## Grup WhatsApp Peserta
Sudah join? Pastikan Anda aktif di grup untuk info realtime!
[Join Grup]({whatsapp_group_link})

Sampai jumpa! 🎯

---
**Tim EksporYuk**`,
      pushTitle: '🚀 H-3 Workshop!',
      pushBody: '3 hari lagi! Final check persiapan Anda.',
      inAppTitle: '3 Hari Lagi!',
      inAppBody: 'Final check: e-ticket, lokasi, dan perlengkapan.',
      inAppLink: '/my-events',
      preferredTime: '09:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 4,
      isActive: true,
    },
    
    // 5. Reminder H-1 (sehari sebelum)
    {
      eventId: event.id,
      title: 'Pengingat H-1',
      description: 'Reminder sehari sebelum event',
      triggerType: 'BEFORE_EVENT',
      delayAmount: 1,
      delayUnit: 'days',
      channels: ['EMAIL', 'WHATSAPP', 'PUSH', 'IN_APP'],
      emailEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🎉 BESOK! Workshop Ekspor - Final Reminder',
      emailBody: `Halo {customer_name}!

**BESOK adalah hari yang ditunggu-tunggu!** 🎊

## ⚡ Quick Info:

### Waktu & Tempat
- 📅 **Tanggal:** ${eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- ⏰ **Registrasi:** 08:00 - 09:00 WIB
- 📍 **Lokasi:** Hotel Grand Mercure Jakarta Kemayoran
- 🎫 **Tiket:** {ticket_number}

### Bawa Ini!
- ✅ E-Ticket (screenshot/print)
- ✅ KTP
- ✅ Kartu nama
- ✅ Notebook & pulpen
- ✅ Charger HP

### Tips Besok:
1. **Datang lebih awal** - Registrasi buka jam 8
2. **Sarapan dulu** - Coffee break baru jam 10
3. **Charge gadget** - Akan banyak foto & notes
4. **Bawa kartu nama** - Networking opportunity!
5. **Siapkan pertanyaan** - Q&A session ada di akhir

### Weather Alert 🌤️
Cek cuaca besok dan bawa payung/jacket jika perlu.

### Emergency Contact
Jika ada kendala besok, hubungi:
📞 0812-xxxx-xxxx (Panitia)
📧 event@eksporyuk.com

## See You Tomorrow! 🚀

Kami tidak sabar untuk bertemu Anda!

---
**Tim EksporYuk**`,
      whatsappMessage: `🎉 *BESOK! Workshop Ekspor*

Halo {customer_name}!

REMINDER PENTING! 📢

🗓️ BESOK - ${eventDate.toLocaleDateString('id-ID')}
⏰ Registrasi: 08:00 WIB
📍 Grand Mercure Jakarta

JANGAN LUPA BAWA:
✅ E-Ticket
✅ KTP
✅ Kartu nama
✅ Notebook

Tips: Datang jam 8 biar dapat spot depan! 😉

See you tomorrow! 🚀`,
      pushTitle: '🎉 BESOK! Workshop Ekspor',
      pushBody: 'Jangan lupa bawa e-ticket & KTP! Registrasi mulai jam 8.',
      inAppTitle: 'Event Besok!',
      inAppBody: 'H-1! Pastikan e-ticket sudah di HP dan siap berangkat besok!',
      inAppLink: '/my-events',
      preferredTime: '18:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 5,
      isActive: true,
    },
    
    // 6. Morning of Event (Hari H pagi)
    {
      eventId: event.id,
      title: 'Hari H - Pagi',
      description: 'Notifikasi di pagi hari event',
      triggerType: 'ON_EVENT_DAY',
      delayAmount: 0,
      delayUnit: 'hours',
      channels: ['WHATSAPP', 'PUSH'],
      emailEnabled: false,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      whatsappMessage: `☀️ *HARI INI! Workshop Ekspor*

Selamat pagi {customer_name}!

Today is the day! 🎯

⏰ Registrasi: 08:00-09:00
📍 Grand Mercure Jakarta

🎫 Tiket: {ticket_number}

Parkir di basement, masuk via lobby utama.

See you soon! 🚗`,
      pushTitle: '☀️ Hari Ini Workshop!',
      pushBody: 'Good morning! Jangan terlambat, registrasi tutup jam 9!',
      inAppTitle: 'Workshop Hari Ini!',
      inAppBody: 'Selamat datang di hari Workshop Ekspor! Tunjukkan e-ticket saat check-in.',
      inAppLink: '/my-events',
      preferredTime: '06:30',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 6,
      isActive: true,
    },
    
    // 7. Thank You + Feedback (H+1)
    {
      eventId: event.id,
      title: 'Terima Kasih & Feedback',
      description: 'Email terima kasih sehari setelah event',
      triggerType: 'AFTER_EVENT',
      delayAmount: 1,
      delayUnit: 'days',
      channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🙏 Terima Kasih! + Bonus Material Workshop',
      emailBody: `Halo {customer_name}!

**Terima kasih sudah hadir di Workshop Ekspor Produk UKM kemarin!** 🙏

Kami berharap Anda mendapatkan banyak insight dan koneksi baru yang bermanfaat.

## 📚 Materi Workshop
Download semua materi di sini:
[Download Materi Workshop]({dashboard_link}/my-events/{event_id}/materials)

### Yang Tersedia:
- ✅ Slide presentasi semua speaker
- ✅ Checklist dokumen ekspor
- ✅ Template kontrak ekspor
- ✅ Daftar marketplace internasional
- ✅ Kontak kedutaan & attaché perdagangan

## 🎥 Video Rekaman
Rekaman full session akan tersedia dalam 3-5 hari kerja.
Kami akan kirim email notifikasi begitu ready!

## 💭 Feedback Anda Sangat Berharga!
Bantu kami membuat event lebih baik:
[Isi Survey (2 menit)]({feedback_link})

**Hadiah:** 3 responden akan dapat voucher workshop berikutnya!

## 🎁 Special Offer untuk Anda!
Sebagai apresiasi, dapatkan **DISKON 25%** untuk:
- Workshop Advanced Ekspor
- Konsultasi 1-on-1 dengan Expert
- Membership Premium EksporYuk

Kode: **ALUMNI25**
Berlaku sampai: {offer_expiry_date}

## 📸 Foto Event
Foto-foto event akan di-share di:
- Grup WhatsApp peserta
- Instagram @eksporyuk
- Album di dashboard Anda

## 🤝 Stay Connected!
- Grup Alumni Workshop: [Join Discord](#)
- LinkedIn: Koneksikan dengan speaker
- Follow: @eksporyuk di semua platform

Sampai jumpa di event berikutnya! 🚀

---
**Tim EksporYuk**
support@eksporyuk.com`,
      whatsappMessage: `🙏 *Terima Kasih, {customer_name}!*

Workshop kemarin luar biasa berkat Anda! 🎉

📚 Download materi:
{dashboard_link}/my-events

🎥 Rekaman akan ready dalam 3-5 hari.

💬 Feedback yuk (2 menit):
{feedback_link}

🎁 Bonus: Diskon 25% event berikutnya!
Kode: ALUMNI25

Thanks for being awesome! 🚀`,
      pushTitle: '🙏 Thanks for Coming!',
      pushBody: 'Materi workshop sudah ready di dashboard. Download sekarang!',
      inAppTitle: 'Terima Kasih!',
      inAppBody: 'Materi workshop sudah tersedia. Jangan lupa isi feedback!',
      inAppLink: '/my-events',
      preferredTime: '10:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 7,
      isActive: true,
    },
    
    // 8. Rekaman Ready (H+5)
    {
      eventId: event.id,
      title: 'Rekaman Event Ready',
      description: 'Notifikasi rekaman event tersedia',
      triggerType: 'AFTER_EVENT',
      delayAmount: 5,
      delayUnit: 'days',
      channels: ['EMAIL', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🎥 Rekaman Workshop Ekspor Sudah Ready!',
      emailBody: `Halo {customer_name}!

Great news! **Rekaman lengkap Workshop Ekspor UKM sudah tersedia!** 🎬

## Akses Rekaman
[Tonton Sekarang]({dashboard_link}/my-events/{event_id}/recordings)

### Daftar Video:
1. **Opening & Keynote** (45 menit)
   - Sambutan & overview ekspor Indonesia
   
2. **Modul 1: Fundamental Ekspor** (90 menit)
   - Regulasi, dokumen, prosedur
   
3. **Modul 2: Market Research** (75 menit)
   - Finding buyers, pricing strategy
   
4. **Modul 3: Hands-On Practice** (120 menit)
   - Simulasi & case studies
   
5. **Q&A Session** (60 menit)
   - Jawaban semua pertanyaan peserta

### Tips Menonton:
- Tonton di kecepatan 1.25x untuk efisiensi
- Pause & praktekkan langsung
- Buat notes di setiap modul
- Re-watch bagian yang kompleks

### Akses Tersedia:
⏰ 30 hari dari sekarang
📱 Desktop & Mobile friendly

## Belum Isi Feedback?
[Isi Survey]({feedback_link}) - Hanya 2 menit!

Happy learning! 📚

---
**Tim EksporYuk**`,
      pushTitle: '🎥 Rekaman Ready!',
      pushBody: 'Video lengkap Workshop Ekspor sudah bisa ditonton!',
      inAppTitle: 'Rekaman Tersedia',
      inAppBody: 'Full recording Workshop Ekspor sudah ready. Akses 30 hari!',
      inAppLink: '/my-events',
      preferredTime: '09:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 8,
      isActive: true,
    },
    
    // 9. Follow Up Implementation (H+14)
    {
      eventId: event.id,
      title: 'Follow Up Implementasi',
      description: 'Check implementasi 2 minggu setelah event',
      triggerType: 'AFTER_EVENT',
      delayAmount: 14,
      delayUnit: 'days',
      channels: ['EMAIL'],
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      inAppEnabled: false,
      emailSubject: '📊 Sudah Action? Check-in 2 Minggu Workshop',
      emailBody: `Halo {customer_name}!

Sudah 2 minggu sejak Workshop Ekspor. Bagaimana progress Anda? 🎯

## Quick Check-in:

### Sudah Done?
- [ ] Review semua materi
- [ ] Tonton rekaman lengkap
- [ ] Pilih produk untuk diekspor
- [ ] Research target market
- [ ] Siapkan dokumen awal

### Stuck di Mana?
Kalau masih bingung mulai dari mana, ini step-by-step nya:

**Minggu 1-2:** ✅ (Sekarang)
- Review materi & rekaman
- Pilih 1 produk unggulan
- Tentukan 1 target negara

**Minggu 3-4:**
- Research buyer potensial
- Siapkan company profile
- Mulai buat pricing sheet

**Minggu 5-8:**
- Approach buyer via email/LinkedIn
- Follow up konsisten
- Negosiasi & deal!

## 🆘 Butuh Bantuan?

### Konsultasi 1-on-1
30 menit dengan expert kami.
[Book Konsultasi]({consultation_link})
*Diskon 25% dengan kode ALUMNI25*

### Komunitas Alumni
Diskusi & tanya jawab dengan sesama alumni.
[Join Discord Community](#)

### Office Hours
Setiap Jumat 14:00-15:00 WIB.
Free Q&A session via Zoom.
[Daftar Office Hours](#)

## 📈 Success Story
Beberapa alumni sudah dapat buyer pertama!
[Baca Success Stories](#)

Keep going, Anda pasti bisa! 💪

---
**Tim EksporYuk**`,
      pushTitle: '📊 2 Minggu Check-in',
      pushBody: 'Bagaimana progress ekspor Anda? Butuh bantuan?',
      preferredTime: '10:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 9,
      isActive: true,
    },
    
    // 10. Upsell Next Event (H+21)
    {
      eventId: event.id,
      title: 'Upsell Event Berikutnya',
      description: 'Promosi event lanjutan',
      triggerType: 'AFTER_EVENT',
      delayAmount: 21,
      delayUnit: 'days',
      channels: ['EMAIL', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🚀 Level Up! Workshop Advanced Ekspor untuk Alumni',
      emailBody: `Halo {customer_name}!

Sudah siap naik level? 🚀

## Workshop Advanced Ekspor

Khusus untuk alumni seperti Anda yang sudah paham fundamental, saatnya deep dive ke:

### Apa yang Dipelajari?
- 📦 **Shipping & Logistics** - Incoterms, freight, insurance
- 💰 **Trade Finance** - LC, DP, TT, trade insurance
- 📜 **Legal & Compliance** - Kontrak internasional, dispute resolution
- 🌐 **Digital Export** - E-commerce cross-border, dropship global
- 🤝 **Negotiation Mastery** - Teknik closing deal internasional

### Jadwal
📅 [Tanggal Event Advanced]
⏰ 09:00 - 17:00 WIB
📍 [Lokasi]

### Harga
~~Rp 2.500.000~~
**Rp 1.875.000** (ALUMNI PRICE!)

Kode diskon sudah otomatis ter-apply untuk Anda.

### Bonus Alumni:
- ✅ Seat prioritas
- ✅ Networking dinner with speaker
- ✅ 1x konsultasi gratis
- ✅ Akses lifetime ke materi

[Daftar Workshop Advanced]({next_event_link})

### Testimoni Alumni Basic → Advanced
> "Setelah ikut advanced workshop, saya berhasil close deal pertama senilai $50,000!" - Andi, Furniture Exporter

Kuota terbatas. Book seat Anda sekarang!

---
**Tim EksporYuk**`,
      pushTitle: '🚀 Workshop Advanced!',
      pushBody: 'Eksklusif untuk alumni! Diskon 25% Workshop Advanced Ekspor.',
      inAppTitle: 'Upgrade Skill Anda',
      inAppBody: 'Workshop Advanced Ekspor khusus alumni. Seat terbatas!',
      inAppLink: '/events',
      preferredTime: '10:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 10,
      isActive: true,
    },
  ]

  console.log('\n📧 Creating reminders...')
  
  for (const reminderData of reminders) {
    const reminder = await prisma.eventReminder.create({
      data: reminderData
    })
    console.log(`   ✅ ${reminderData.title} (${reminderData.triggerType})`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 EVENT CREATED SUCCESSFULLY!')
  console.log('='.repeat(60))
  console.log(`
📋 SUMMARY:
- Event ID: ${event.id}
- Event Title: ${event.title}
- Event Date: ${eventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Price: Rp ${Number(event.price).toLocaleString('id-ID')}
- Reminders: ${reminders.length} reminder sequences

🔗 LINKS:
- Admin Event: /admin/events (cari di list)
- Admin Reminders: /admin/events/${event.id}/reminders

📬 REMINDER SEQUENCE:
1. Konfirmasi Tiket (immediately after purchase)
2. H-14 Preparation reminder
3. H-7 Final preparation
4. H-3 Last check
5. H-1 Final reminder
6. Hari H - Morning notification
7. H+1 Thank you & feedback request
8. H+5 Recording available
9. H+14 Implementation check-in
10. H+21 Upsell next event
`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
