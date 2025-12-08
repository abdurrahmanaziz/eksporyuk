# 📅 Event dengan Notifikasi & Reminder Lengkap

## Event yang Dibuat

### Workshop Ekspor Produk UKM ke Pasar Internasional

**Detail Event:**
- **ID:** `cmir97sdf00015tt8n96nyzt3`
- **Tanggal:** Sabtu, 3 Januari 2026
- **Waktu:** 09:00 - 17:00 WIB
- **Lokasi:** Hotel Grand Mercure Jakarta Kemayoran
- **Harga:** Rp 750.000
- **Kapasitas:** 200 peserta

---

## 📬 Reminder Sequence (10 Steps)

| No | Nama | Trigger | Timing | Channels |
|----|------|---------|--------|----------|
| 1 | Konfirmasi Tiket | AFTER_PURCHASE | Immediately | Email, WhatsApp, Push, In-App |
| 2 | Pengingat H-14 | BEFORE_EXPIRY | 14 hari | Email, Push, In-App |
| 3 | Pengingat H-7 | BEFORE_EXPIRY | 7 hari | Email, WhatsApp, Push, In-App |
| 4 | Pengingat H-3 | BEFORE_EXPIRY | 3 hari | Email, Push, In-App |
| 5 | Pengingat H-1 | BEFORE_EXPIRY | 1 hari | Email, WhatsApp, Push, In-App |
| 6 | Hari H - Pagi | ON_SPECIFIC_DATE | Jam 06:30 | WhatsApp, Push, In-App |
| 7 | Terima Kasih & Feedback | AFTER_PURCHASE | +31 hari | Email, WhatsApp, Push, In-App |
| 8 | Rekaman Ready | AFTER_PURCHASE | +35 hari | Email, Push, In-App |
| 9 | Follow Up Implementasi | AFTER_PURCHASE | +44 hari | Email, Push |
| 10 | Upsell Next Event | AFTER_PURCHASE | +51 hari | Email, Push, In-App |

---

## 🔗 Links

### Admin
- **Event Reminders:** `/admin/events/cmir97sdf00015tt8n96nyzt3/reminders`

### Cron Jobs
- **Event Reminders V2:** `/api/cron/event-reminders-v2`
- **Schedule:** Setiap 15 menit (tambahkan ke vercel.json)

---

## 📝 Template Variables

Gunakan variabel ini di dalam template reminder:

| Variable | Deskripsi |
|----------|-----------|
| `{customer_name}` | Nama peserta |
| `{customer_email}` | Email peserta |
| `{ticket_number}` | Nomor tiket (e.g., EVT-ABC12345) |
| `{event_name}` | Nama event |
| `{event_title}` | Judul event |
| `{event_date}` | Tanggal event (formatted) |
| `{event_time}` | Waktu event |
| `{event_location}` | Lokasi event |
| `{meeting_url}` | Link Zoom/meet |
| `{meeting_id}` | Meeting ID |
| `{meeting_password}` | Meeting password |
| `{dashboard_link}` | Link ke dashboard user |
| `{feedback_link}` | Link form feedback |

---

## ⚙️ Setup Cron Job

Tambahkan ke `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/event-reminders-v2",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Atau jalankan manual untuk testing:
```bash
curl -X POST http://localhost:3000/api/cron/event-reminders-v2
```

---

## 📊 Trigger Types Explained

### 1. AFTER_PURCHASE
Dikirim X hari/jam **setelah user mendaftar** event.
- Cocok untuk: konfirmasi tiket, welcome email, follow-up

### 2. BEFORE_EXPIRY
Dikirim X hari/jam **sebelum event dimulai**.
- Cocok untuk: H-14, H-7, H-3, H-1 reminders

### 3. ON_SPECIFIC_DATE
Dikirim pada **tanggal/waktu tertentu**.
- Cocok untuk: morning reminder di hari H

### 4. ON_INACTIVE (Coming Soon)
Dikirim ketika user tidak aktif selama X hari.

### 5. CONDITIONAL (Coming Soon)
Dikirim berdasarkan kondisi tertentu (misal: belum download materi).

---

## 📧 Contoh Email Templates

### 1. Konfirmasi Tiket

**Subject:** 🎫 Tiket Workshop Ekspor UKM Berhasil Dibeli!

**Body:**
```
Halo {customer_name}!

Selamat! Tiket Anda untuk **Workshop Ekspor Produk UKM ke Pasar Internasional** sudah berhasil dibeli. 🎉

## Detail Event:
- 📅 **Tanggal:** {event_date}
- ⏰ **Waktu:** 09:00 - 17:00 WIB
- 📍 **Lokasi:** {event_location}
- 🎫 **Nomor Tiket:** {ticket_number}

Kami tunggu kehadiran Anda!
```

### 2. Pengingat H-1

**Subject:** 🎉 BESOK! Workshop Ekspor - Final Reminder

**Body:**
```
Halo {customer_name}!

**BESOK adalah hari yang ditunggu-tunggu!** 🎊

## Quick Info:
- 📅 **Tanggal:** {event_date}
- ⏰ **Registrasi:** 08:00 - 09:00 WIB
- 📍 **Lokasi:** {event_location}

### Bawa Ini!
✅ E-Ticket (screenshot/print)
✅ KTP
✅ Kartu nama
✅ Notebook & pulpen

## See You Tomorrow! 🚀
```

### 3. WhatsApp Template (H-1)

```
🎉 *BESOK! Workshop Ekspor*

Halo {customer_name}!

REMINDER PENTING! 📢

🗓️ BESOK - {event_date}
⏰ Registrasi: 08:00 WIB
📍 {event_location}

JANGAN LUPA BAWA:
✅ E-Ticket
✅ KTP
✅ Kartu nama
✅ Notebook

See you tomorrow! 🚀
```

---

## 🛠️ Script Files

1. **Seed Event + Reminders:** `seed-example-event-with-reminders.js`
2. **Add Reminders Only:** `seed-event-reminders-fixed.js`

Jalankan dengan:
```bash
node seed-event-reminders-fixed.js
```

---

## ✅ Checklist Implementasi

- [x] Model Event dengan EventReminder relation
- [x] Admin page `/admin/events/[id]/reminders`
- [x] Cron job `/api/cron/event-reminders-v2`
- [x] Multi-channel support (Email, WhatsApp, Push, In-App)
- [x] Template variable substitution
- [x] ReminderLog untuk tracking
- [x] Contoh event dengan 10 reminder sequences
- [ ] Testing dengan real users
- [ ] Setup Vercel cron job
