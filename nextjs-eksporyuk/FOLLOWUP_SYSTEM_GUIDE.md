# Follow-up System - Production Guide

## Overview
Sistem follow-up otomatis yang powerful untuk admin dan affiliate. Mendukung multiple templates, multi-channel notifications (Email, WhatsApp, Push, Real-time), dan full customization.

## 🎯 Features Implemented

### 1. **Admin Features**
- ✅ Menu sidebar: Payment Settings & Follow-up Settings
- ✅ Multi-template system dengan CRUD lengkap
- ✅ 4 integrasi notifikasi:
  - Mailkiting (Email Marketing - pengganti Mailchimp)
  - Starsender (WhatsApp Business API)
  - OneSignal (Push Notification)
  - Pusher (Real-time Notification)
- ✅ Payment expiry configuration (1-168 jam)
- ✅ Template dengan placeholder: `{name}`, `{amount}`, `{timeLeft}`, `{paymentUrl}`

### 2. **Affiliate Features**
- ✅ Halaman khusus: `/affiliate/settings/followup`
- ✅ **Lihat pending leads** dari transaksi yang mereka referral
- ✅ **Follow-up manual via WhatsApp** dengan 1-click
- ✅ Filter leads: Semua, > 1 jam, > 6 jam, > 24 jam
- ✅ Stats dashboard: Total pending, value, urgency levels
- ✅ Auto-generated WA message dengan payment link
- ❌ **Tidak bisa buat template** (hanya admin yang manage templates)
- ✅ Sidebar menu: "Follow-up Leads" dengan icon Bell

### 3. **Cron Job Enhancement**
- ✅ Support custom templates dari database
- ✅ Filter template berdasarkan owner (admin global / affiliate specific)
- ✅ Multi-channel sending (parallel execution)
- ✅ Duplicate prevention (cek sudah kirim dalam 1 jam terakhir)
- ✅ Auto-cancel expired transactions

## 📋 Database Schema

### Settings Model (Extended)
```prisma
model Settings {
  // Payment Settings
  paymentExpiryHours: Int @default(72)
  
  // Follow-up
  followUpEnabled: Boolean @default(true)
  followUp1HourEnabled: Boolean
  followUp24HourEnabled: Boolean
  followUp48HourEnabled: Boolean
  followUpMessage1Hour: String?
  followUpMessage24Hour: String?
  followUpMessage48Hour: String?
  
  // Integrations
  mailkitingEnabled: Boolean @default(false)
  mailkitingApiKey: String?
  starsenderEnabled: Boolean @default(false)
  starsenderApiKey: String?
  onesignalEnabled: Boolean @default(false)
  onesignalAppId: String?
  onesignalApiKey: String?
  pusherEnabled: Boolean @default(false)
  pusherAppId: String?
  pusherKey: String?
  pusherSecret: String?
  pusherCluster: String? @default("ap1")
}
```

### FollowUpTemplate Model (New)
```prisma
model FollowUpTemplate {
  id: String @id @default(cuid())
  name: String
  triggerHours: Int // 1, 6, 24, 48, etc
  message: String
  channel: String // "email", "whatsapp", "push", "all"
  isActive: Boolean @default(true)
  
  // Ownership
  createdBy: String // userId
  ownerId: String? // null = admin, userId = affiliate
  ownerType: String @default("admin") // "admin" or "affiliate"
  
  // Integrations
  useMailkiting: Boolean @default(false)
  useStarsender: Boolean @default(false)
  useOnesignal: Boolean @default(false)
  usePusher: Boolean @default(false)
  
  createdAt: DateTime @default(now())
  updatedAt: DateTime @updatedAt
  
  @@index([ownerType, ownerId])
  @@index([isActive])
}
```

## 🚀 Setup Instructions

### 1. Database Migration
```bash
cd nextjs-eksporyuk
npx prisma db push
npx prisma generate
```

### 2. Environment Variables
Add to `.env.local`:
```env
# Cron Job Security
CRON_SECRET=your-secure-random-string

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Integration APIs (Optional - configure via admin panel)
# These can also be set in /admin/settings/payment
MAILKITING_API_KEY=
STARSENDER_API_KEY=
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap1
```

### 3. Vercel Cron Job
Already configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/payment-followup",
    "schedule": "0 * * * *"
  }]
}
```

**Schedule:** Every hour at minute 0
**Endpoint:** `/api/cron/payment-followup`

### 4. Cron Security
The cron endpoint requires Bearer token authentication:
```bash
Authorization: Bearer YOUR_CRON_SECRET
```

## 📱 Admin Usage Guide

### Step 1: Configure Payment Settings
1. Go to `/admin/settings/payment`
2. Set payment expiry hours (default: 72 hours)
3. Enable follow-up system
4. Configure legacy templates (1h, 24h, 48h) - optional

### Step 2: Configure Integrations
In same page, scroll to "Integrasi Notifikasi":
1. **Mailkiting** - Toggle ON, enter API Key
2. **Starsender** - Toggle ON, enter API Key
3. **OneSignal** - Toggle ON, enter App ID + API Key
4. **Pusher** - Toggle ON, enter App ID, Key, Secret, Cluster
5. Click "Simpan Pengaturan"

### Step 3: Create Follow-up Templates
1. Go to `/admin/settings/followup`
2. Click "Tambah Template"
3. Fill in:
   - **Name**: "Reminder Cepat 1 Jam"
   - **Trigger**: 1 (jam)
   - **Channel**: Email / WhatsApp / Push / All
   - **Message**: Use placeholders
   - **Integrations**: Check Mailkiting, Starsender, etc
   - **Active**: ON
4. Click "Simpan Template"

### Example Templates:
```
Name: Reminder Urgent 1 Jam
Trigger: 1 hour
Message: Halo {name}! Pembayaran Anda sebesar Rp {amount} masih pending. 
Segera selesaikan sebelum kehabisan slot! {paymentUrl}
Channel: WhatsApp
Integrations: ✓ Starsender

---

Name: Follow-up Hangat 6 Jam
Trigger: 6 hours
Message: Hi {name}, saya dari tim support. Ada kendala dengan pembayaran? 
Sisa waktu {timeLeft} lagi. Kami siap bantu!
Channel: WhatsApp + Email
Integrations: ✓ Starsender, ✓ Mailkiting

---

Name: Last Reminder 24 Jam
Trigger: 24 hours
Message: LAST CHANCE! {name}, pembayaran Anda akan expire dalam {timeLeft}. 
Jangan sampai kehabisan kesempatan ini!
Channel: All
Integrations: ✓ All
```

## 🎯 Affiliate Usage Guide

### Konsep Affiliate Follow-up:
**Affiliate TIDAK buat template sendiri.** Follow-up otomatis tetap menggunakan template dari admin. Namun, affiliate punya **tools untuk follow-up manual** ke lead mereka yang belum bayar.

### For Affiliates:
1. Login sebagai affiliate
2. Go to `/affiliate/settings/followup`
3. **Lihat list pending leads** yang dari referral Anda
4. Click "Follow-up via WA" untuk redirect ke WhatsApp
5. Message sudah auto-generated, tinggal kirim

### Features:
- ✅ **Real-time pending leads list**
- ✅ **Filter by urgency:** > 1 jam, > 6 jam, > 24 jam
- ✅ **Search by name/email**
- ✅ **Stats dashboard:** Total pending, total value, urgency breakdown
- ✅ **1-click WhatsApp follow-up** dengan pre-filled message
- ✅ **Auto payment link** included in message

### Auto-generated WhatsApp Message:
```
Halo {CustomerName}! 👋

Saya dari tim Ekspor Yuk, melihat pembayaran Anda sebesar Rp {Amount} 
masih pending sejak {Hours} jam yang lalu.

Ada kendala dengan pembayaran? Saya siap membantu! 😊

Link pembayaran:
{PaymentURL}

Terima kasih! 🙏
```

### Best Practices for Affiliates:
- ✅ **Check dashboard regularly** (morning & evening)
- ✅ **Priority:** Leads > 1 jam & > 6 jam (highest conversion)
- ✅ **Personal touch:** Edit message jika perlu untuk lebih personal
- ✅ **Be helpful, not pushy:** Offer assistance, not pressure
- ✅ **Track your leads:** Note yang sudah di-follow-up
- ✅ **Timing matters:** Follow-up di jam kerja (9am-9pm)

## 🔄 Cron Job Flow

```
Every Hour:
1. Fetch all pending transactions
2. Get all active ADMIN templates only
3. For each transaction:
   - Calculate hours since created
   - Find applicable admin templates
   - Check if trigger time matches
   - Check if not already sent in last hour
   - Send via enabled integrations
   - Log in transaction metadata (+ affiliateId if exists)
4. Auto-cancel expired transactions

Note: Affiliate follow-up is MANUAL via dashboard, not automated
```

## 🔌 Integration Setup

### Mailkiting (Email)
```javascript
// API Endpoint
POST https://api.mailkiting.com/v1/send

// Headers
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

// Body
{
  "to": "customer@email.com",
  "subject": "Reminder Pembayaran",
  "message": "..."
}
```

### Starsender (WhatsApp)
```javascript
// API Endpoint
POST https://api.starsender.online/api/sendText

// Headers
Authorization: YOUR_API_KEY
Content-Type: application/json

// Body
{
  "phone": "628123456789",
  "message": "..."
}
```

### OneSignal (Push)
```javascript
// API Endpoint
POST https://onesignal.com/api/v1/notifications

// Headers
Authorization: Basic YOUR_API_KEY
Content-Type: application/json

// Body
{
  "app_id": "YOUR_APP_ID",
  "filters": [{"field": "tag", "key": "userId", "value": "user123"}],
  "contents": {"en": "..."}
}
```

### Pusher (Real-time)
```javascript
// Using pusher package
const Pusher = require('pusher')

const pusher = new Pusher({
  appId: 'YOUR_APP_ID',
  key: 'YOUR_KEY',
  secret: 'YOUR_SECRET',
  cluster: 'ap1'
})

await pusher.trigger(`user-${userId}`, 'payment-reminder', {
  message: "..."
})
```

## 📊 Monitoring & Logs

### Check Cron Job Status
```bash
# View Vercel logs
vercel logs YOUR_DEPLOYMENT_URL

# Filter cron logs
vercel logs --follow | grep "payment-followup"
```

### Transaction Metadata
Each transaction stores follow-up history:
```json
{
  "followUps": [
    {
      "templateId": "clx123...",
      "templateName": "Reminder 1 Jam",
      "sentAt": "2024-11-21T10:00:00Z",
      "triggerHours": 1,
      "channel": "whatsapp",
      "message": "Halo John...",
      "integrations": {
        "mailkiting": false,
        "starsender": true,
        "onesignal": false,
        "pusher": false
      }
    }
  ]
}
```

## 🎨 UI Screenshots Location

1. **Admin Sidebar**: Shows "Payment Settings" & "Follow-up Settings"
2. **Payment Settings Page**: `/admin/settings/payment`
   - Payment expiry configuration
   - 4 integration toggles with API key inputs
3. **Follow-up Settings Page**: `/admin/settings/followup`
   - List of templates
   - Add/Edit/Delete modal
   - Integration checkboxes per template
4. **Affiliate Follow-up Page**: `/affiliate/settings/followup`
   - Same UI as admin but affiliate-themed (green colors)
   - Focus on WhatsApp channel

## ⚡ Performance Optimization

- Templates cached per hour
- Parallel sending untuk multi-channel
- Transaction query limited to expiry window
- Index on `ownerType` and `isActive` for fast filtering
- Duplicate prevention untuk avoid spam

## 🔐 Security

- ✅ Cron endpoint protected dengan Bearer token
- ✅ Role-based access (Admin/Affiliate)
- ✅ Ownership validation (affiliate can't edit admin templates)
- ✅ API key stored encrypted in database
- ✅ Rate limiting di cron job

## 📝 TODO (Optional Enhancements)

- [ ] SMS integration (Twilio)
- [ ] Telegram Bot integration
- [ ] A/B testing untuk templates
- [ ] Analytics dashboard per template
- [ ] Automatic template optimization based on conversion
- [ ] Multi-language support
- [ ] Template preview before save
- [ ] Bulk import templates from CSV

## 🐛 Troubleshooting

### Cron not running
- Check Vercel cron logs
- Verify `CRON_SECRET` env variable
- Test endpoint manually: `curl -H "Authorization: Bearer SECRET" https://your-domain.com/api/cron/payment-followup`

### Templates not sending
- Check template `isActive` = true
- Verify integration enabled in settings
- Check API keys configured
- View transaction metadata for errors

### Duplicate notifications
- System has 1-hour window check
- If still happening, check cron schedule

## 📞 Support

For issues or questions:
1. Check this documentation
2. View Vercel logs
3. Inspect transaction metadata
4. Test integrations individually

---

**Last Updated**: November 21, 2024
**Version**: 2.0.0
**Status**: ✅ Production Ready
