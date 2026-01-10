/**
 * Script untuk menambahkan Reminder ke Event yang sudah dibuat
 * Run: node seed-event-reminders-fixed.js
 * 
 * Trigger Types yang valid:
 * - AFTER_PURCHASE: X hari setelah pembelian
 * - BEFORE_EXPIRY: X hari sebelum event date (expiry)
 * - ON_SPECIFIC_DATE: Pada tanggal tertentu
 * - ON_INACTIVE: Ketika user tidak aktif
 * - CONDITIONAL: Berdasarkan kondisi tertentu
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Adding Reminders to Event...\n')

  // Find the event we just created
  const event = await prisma.event.findFirst({
    where: { title: 'Workshop Ekspor Produk UKM ke Pasar Internasional' },
    orderBy: { createdAt: 'desc' }
  })

  if (!event) {
    console.error('❌ Event not found!')
    return
  }

  console.log(`✅ Found event: ${event.title}`)
  console.log(`   ID: ${event.id}`)
  console.log(`   Date: ${event.startDate}`)

  // Delete existing reminders for this event
  await prisma.eventReminder.deleteMany({
    where: { eventId: event.id }
  })
  console.log('🗑️ Cleared existing reminders')

  const eventDateStr = event.startDate.toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  })

  // Create reminders array with valid trigger types
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
- 📅 **Tanggal:** ${eventDateStr}
- ⏰ **Waktu:** 09:00 - 17:00 WIB
- 📍 **Lokasi:** ${event.location || 'TBA'}
- 🎫 **Nomor Tiket:** {ticket_number}

## Persiapan Sebelum Hari H:
1. Simpan email ini sebagai bukti pembelian
2. Unduh e-ticket di dashboard Anda
3. Tandai tanggal di kalender
4. Join grup WhatsApp peserta (link di dashboard)

## Yang Perlu Dibawa:
- KTP/Identitas
- Kartu nama (jika ada)
- Laptop (opsional)
- Notebook & pulpen

Kami tunggu kehadiran Anda!

---
**Tim EksporYuk**`,
      pushTitle: 'Tiket Berhasil Dibeli! 🎫',
      pushBody: 'Tiket Workshop Ekspor UKM sudah di tangan Anda!',
      inAppTitle: 'Pembelian Berhasil!',
      inAppBody: 'Tiket Workshop Ekspor UKM sudah aktif.',
      inAppLink: '/my-events',
      preferredTime: '09:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 1,
      isActive: true,
    },
    
    // 2. Reminder H-14 (2 minggu sebelum) - menggunakan BEFORE_EXPIRY
    {
      eventId: event.id,
      title: 'Pengingat H-14',
      description: 'Reminder 2 minggu sebelum event',
      triggerType: 'BEFORE_EXPIRY',
      delayAmount: 14,
      delayUnit: 'days',
      channels: ['EMAIL', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '📅 2 Minggu Lagi! Workshop Ekspor UKM',
      emailBody: `Halo {customer_name}!

Dua minggu lagi kita akan bertemu di **Workshop Ekspor Produk UKM**! 🗓️

## Persiapan 2 Minggu Sebelum:

### 1. Baca Pre-Reading Material
- Panduan Dasar Ekspor Indonesia
- Checklist Dokumen Ekspor
- Video Intro dari Speaker

### 2. Join Grup Peserta
Bergabung di grup WhatsApp untuk networking awal!

### 3. Siapkan Pertanyaan
Buat daftar pertanyaan yang ingin Anda tanyakan ke speaker.

### 4. Atur Jadwal
- Pastikan tanggal tersebut kosong
- Booking transportasi jika dari luar kota

## Detail Event:
- 📅 ${eventDateStr}
- ⏰ 09:00 - 17:00 WIB
- 📍 ${event.location || 'TBA'}

Sampai jumpa 2 minggu lagi!

---
**Tim EksporYuk**`,
      pushTitle: '📅 H-14 Workshop Ekspor!',
      pushBody: '2 minggu lagi! Sudah baca pre-reading material?',
      inAppTitle: '2 Minggu Menuju Workshop',
      inAppBody: 'Persiapkan diri Anda!',
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
      triggerType: 'BEFORE_EXPIRY',
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
- Download e-ticket dari dashboard
- Siapkan KTP/identitas

### ✅ Materi
- Baca pre-reading material
- Siapkan daftar pertanyaan

### ✅ Logistik
- Booking transportasi
- Cek rute ke lokasi

### ✅ Perlengkapan
- Kartu nama
- Notebook & pulpen
- Charger HP

## Info Lokasi:
📍 **${event.location || 'TBA'}**

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
☑️ Baca pre-reading

Lokasi: ${event.location || 'TBA'}
Tanggal: ${eventDateStr}

Ada pertanyaan? Reply chat ini!`,
      pushTitle: '⏰ H-7 Workshop Ekspor!',
      pushBody: 'Seminggu lagi! Sudah download e-ticket?',
      inAppTitle: 'Seminggu Menuju Workshop',
      inAppBody: 'Pastikan e-ticket sudah didownload!',
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
      triggerType: 'BEFORE_EXPIRY',
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
- Download dari dashboard
- Simpan di HP atau print

### 📍 Lokasi
${event.location || 'TBA'}

### 👔 Dress Code
Smart Casual - Nyaman tapi profesional

## Info Tambahan:
- Registrasi dibuka: 08:00 WIB
- Event mulai: 09:00 WIB sharp
- Parkir gratis untuk peserta

Sampai jumpa! 🎯

---
**Tim EksporYuk**`,
      pushTitle: '🚀 H-3 Workshop!',
      pushBody: '3 hari lagi! Final check persiapan Anda.',
      inAppTitle: '3 Hari Lagi!',
      inAppBody: 'Final check: e-ticket dan perlengkapan.',
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
      triggerType: 'BEFORE_EXPIRY',
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
- 📅 **Tanggal:** ${eventDateStr}
- ⏰ **Registrasi:** 08:00 - 09:00 WIB
- 📍 **Lokasi:** ${event.location || 'TBA'}
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

## See You Tomorrow! 🚀

---
**Tim EksporYuk**`,
      whatsappMessage: `🎉 *BESOK! Workshop Ekspor*

Halo {customer_name}!

REMINDER PENTING! 📢

🗓️ BESOK - ${eventDateStr}
⏰ Registrasi: 08:00 WIB
📍 ${event.location || 'TBA'}

JANGAN LUPA BAWA:
✅ E-Ticket
✅ KTP
✅ Kartu nama
✅ Notebook

Tips: Datang jam 8 biar dapat spot depan! 😉

See you tomorrow! 🚀`,
      pushTitle: '🎉 BESOK! Workshop Ekspor',
      pushBody: 'Jangan lupa bawa e-ticket & KTP!',
      inAppTitle: 'Event Besok!',
      inAppBody: 'H-1! Siap berangkat besok!',
      inAppLink: '/my-events',
      preferredTime: '18:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 5,
      isActive: true,
    },
    
    // 6. Hari H pagi - menggunakan ON_SPECIFIC_DATE
    {
      eventId: event.id,
      title: 'Hari H - Pagi',
      description: 'Notifikasi di pagi hari event',
      triggerType: 'ON_SPECIFIC_DATE',
      delayAmount: 0,
      delayUnit: 'hours',
      specificDate: event.startDate,
      channels: ['WHATSAPP', 'PUSH'],
      emailEnabled: false,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      whatsappMessage: `☀️ *HARI INI! Workshop Ekspor*

Selamat pagi {customer_name}!

Today is the day! 🎯

⏰ Registrasi: 08:00-09:00
📍 ${event.location || 'TBA'}

🎫 Tiket: {ticket_number}

See you soon! 🚗`,
      pushTitle: '☀️ Hari Ini Workshop!',
      pushBody: 'Good morning! Jangan terlambat!',
      inAppTitle: 'Workshop Hari Ini!',
      inAppBody: 'Selamat datang di hari Workshop Ekspor!',
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
      triggerType: 'AFTER_PURCHASE',
      delayAmount: 31, // 30 hari event + 1 hari setelah
      delayUnit: 'days',
      channels: ['EMAIL', 'WHATSAPP', 'PUSH'],
      emailEnabled: true,
      whatsappEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      emailSubject: '🙏 Terima Kasih! + Bonus Material Workshop',
      emailBody: `Halo {customer_name}!

**Terima kasih sudah hadir di Workshop Ekspor Produk UKM kemarin!** 🙏

Kami berharap Anda mendapatkan banyak insight dan koneksi baru.

## 📚 Materi Workshop
Download semua materi di dashboard Anda:
- ✅ Slide presentasi semua speaker
- ✅ Checklist dokumen ekspor
- ✅ Template kontrak ekspor
- ✅ Daftar marketplace internasional

## 🎥 Video Rekaman
Rekaman full session akan tersedia dalam 3-5 hari kerja.

## 💭 Feedback Anda Sangat Berharga!
Bantu kami membuat event lebih baik dengan mengisi survey!

## 🎁 Special Offer
Diskon **25%** untuk event berikutnya!
Kode: **ALUMNI25**

Sampai jumpa di event berikutnya! 🚀

---
**Tim EksporYuk**`,
      whatsappMessage: `🙏 *Terima Kasih, {customer_name}!*

Workshop kemarin luar biasa! 🎉

📚 Download materi di dashboard
🎥 Rekaman ready dalam 3-5 hari

💬 Feedback yuk (2 menit)!

🎁 Bonus: Diskon 25% event berikutnya!
Kode: ALUMNI25

Thanks for being awesome! 🚀`,
      pushTitle: '🙏 Thanks for Coming!',
      pushBody: 'Materi workshop sudah ready di dashboard!',
      inAppTitle: 'Terima Kasih!',
      inAppBody: 'Materi workshop tersedia. Jangan lupa feedback!',
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
      triggerType: 'AFTER_PURCHASE',
      delayAmount: 35, // 30 hari + 5 hari
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
Tonton di dashboard Anda!

### Daftar Video:
1. **Opening & Keynote** (45 menit)
2. **Modul 1: Fundamental Ekspor** (90 menit)
3. **Modul 2: Market Research** (75 menit)
4. **Modul 3: Hands-On Practice** (120 menit)
5. **Q&A Session** (60 menit)

### Tips Menonton:
- Tonton di kecepatan 1.25x untuk efisiensi
- Pause & praktekkan langsung
- Buat notes di setiap modul

### Akses Tersedia:
⏰ 30 hari dari sekarang
📱 Desktop & Mobile friendly

Happy learning! 📚

---
**Tim EksporYuk**`,
      pushTitle: '🎥 Rekaman Ready!',
      pushBody: 'Video Workshop Ekspor sudah bisa ditonton!',
      inAppTitle: 'Rekaman Tersedia',
      inAppBody: 'Full recording Workshop Ekspor ready!',
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
      triggerType: 'AFTER_PURCHASE',
      delayAmount: 44, // 30 + 14 hari
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
- Review semua materi
- Tonton rekaman lengkap
- Pilih produk untuk diekspor
- Research target market

### Step-by-Step:

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
*Diskon 25% dengan kode ALUMNI25*

### Komunitas Alumni
Diskusi dengan sesama alumni!

Keep going, Anda pasti bisa! 💪

---
**Tim EksporYuk**`,
      pushTitle: '📊 2 Minggu Check-in',
      pushBody: 'Bagaimana progress ekspor Anda?',
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
      triggerType: 'AFTER_PURCHASE',
      delayAmount: 51, // 30 + 21 hari
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

Khusus untuk alumni yang sudah paham fundamental!

### Apa yang Dipelajari?
- 📦 **Shipping & Logistics** - Incoterms, freight, insurance
- 💰 **Trade Finance** - LC, DP, TT, trade insurance
- 📜 **Legal & Compliance** - Kontrak internasional
- 🌐 **Digital Export** - E-commerce cross-border
- 🤝 **Negotiation Mastery** - Teknik closing deal

### Harga Alumni
~~Rp 2.500.000~~
**Rp 1.875.000** (ALUMNI PRICE!)

### Bonus Alumni:
- ✅ Seat prioritas
- ✅ Networking dinner with speaker
- ✅ 1x konsultasi gratis
- ✅ Akses lifetime ke materi

Kuota terbatas. Book seat Anda sekarang!

---
**Tim EksporYuk**`,
      pushTitle: '🚀 Workshop Advanced!',
      pushBody: 'Eksklusif alumni! Diskon 25%',
      inAppTitle: 'Upgrade Skill Anda',
      inAppBody: 'Workshop Advanced Ekspor khusus alumni!',
      inAppLink: '/events',
      preferredTime: '10:00',
      timezone: 'Asia/Jakarta',
      sequenceOrder: 10,
      isActive: true,
    },
  ]

  console.log('\n📧 Creating reminders...')
  
  for (const reminderData of reminders) {
    try {
      const reminder = await prisma.eventReminder.create({
        data: reminderData
      })
      console.log(`   ✅ ${reminderData.title} (${reminderData.triggerType}, ${reminderData.delayAmount} ${reminderData.delayUnit})`)
    } catch (error) {
      console.error(`   ❌ Failed to create ${reminderData.title}:`, error.message)
    }
  }

  // Count created reminders
  const createdReminders = await prisma.eventReminder.count({
    where: { eventId: event.id }
  })

  console.log('\n' + '='.repeat(60))
  console.log('🎉 EVENT REMINDERS CREATED SUCCESSFULLY!')
  console.log('='.repeat(60))
  console.log(`
📋 SUMMARY:
- Event ID: ${event.id}
- Event Title: ${event.title}
- Event Date: ${eventDateStr}
- Price: Rp ${Number(event.price || 0).toLocaleString('id-ID')}
- Reminders Created: ${createdReminders}

🔗 LINKS:
- Admin Reminders: /admin/events/${event.id}/reminders

📬 REMINDER SEQUENCE:
1. ✉️ Konfirmasi Tiket (immediately after purchase)
2. 📅 H-14 Preparation reminder (BEFORE_EXPIRY 14 days)
3. ⏰ H-7 Final preparation (BEFORE_EXPIRY 7 days)
4. 🚀 H-3 Last check (BEFORE_EXPIRY 3 days)
5. 🎉 H-1 Final reminder (BEFORE_EXPIRY 1 day)
6. ☀️ Hari H - Morning notification (ON_SPECIFIC_DATE)
7. 🙏 H+1 Thank you & feedback (AFTER_PURCHASE 31 days)
8. 🎥 H+5 Recording available (AFTER_PURCHASE 35 days)
9. 📊 H+14 Implementation check-in (AFTER_PURCHASE 44 days)
10. 🚀 H+21 Upsell next event (AFTER_PURCHASE 51 days)

📌 AVAILABLE VARIABLES IN TEMPLATES:
- {customer_name} - Nama pembeli
- {customer_email} - Email pembeli
- {ticket_number} - Nomor tiket
- {event_name} - Nama event
- {event_date} - Tanggal event
- {event_time} - Waktu event
- {event_location} - Lokasi event
- {dashboard_link} - Link ke dashboard
- {feedback_link} - Link survey feedback
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
