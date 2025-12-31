# Commission Notification System - Complete Implementation

**Status: ✅ FULLY IMPLEMENTED**
**Date: December 31, 2025**

---

## 📋 Overview

Sistem notifikasi komisi yang **comprehensive** sudah diimplementasikan untuk **semua pihak** yang terlibat dalam transaksi dan revenue sharing Eksporyuk:

```
├── 💰 AFFILIATE (Commission Earned)
├── 💼 MENTOR (Commission Earned)
├── 🎤 EVENT CREATOR (Commission Earned)
├── 👨‍💼 ADMIN (Fee Received)
├── 👔 FOUNDER (Revenue Share)
├── 🤝 CO-FOUNDER (Revenue Share)
└── 🔔 ALL ADMINS (Commission Settings Change)
```

---

## 🎯 Notification Types

### 1. **Commission Received** (Affiliate, Mentor, Event Creator)

**When:** Setiap kali ada transaksi yang berhasil

**Triggers:**
- Penjualan Membership dengan affiliate code
- Penjualan Product dengan affiliate
- Penjualan Course/Event dengan mentor

**Channels:**
- ✅ In-App Notification (Pusher real-time)
- ✅ Push Notification (OneSignal)
- ✅ Email Notification
- ✅ WhatsApp Notification

**Example:**
```
Title: 💰 Komisi Affiliate Baru Diterima!
Message: Selamat! Anda mendapat komisi sebesar Rp 400,000 dari penjualan Paket Lifetime.
Link: /affiliate/earnings
```

---

### 2. **Pending Revenue Created** (Admin, Founder, Co-Founder)

**When:** Otomatis ketika komisi diterima

**What Happens:**
- Admin Fee (15% dari sisa revenue) → `balancePending`
- Founder Share (60% dari sisa revenue) → `balancePending`
- Co-Founder Share (40% dari sisa revenue) → `balancePending`

**Notification:**
- Notifikasi bahwa ada pending revenue yang menunggu approval

**Example:**
```
Title: 📋 Admin Fee Pending
Message: Admin Fee sebesar Rp 240,000 menunggu approval. Cek di pending revenue untuk detail.
Link: /admin/pending-revenue
```

---

### 3. **Pending Revenue Approved** (Admin, Founder, Co-Founder)

**When:** Admin approve pending revenue

**What Changes:**
- Balance pindah dari `balancePending` → `balance`
- Sekarang ready untuk di-withdraw

**Channels:**
- ✅ In-App Notification (Pusher)
- ✅ Push Notification (OneSignal)
- ✅ Email
- ✅ WhatsApp

**Example:**
```
Title: ✅ Admin Fee Disetujui
Message: Admin Fee sebesar Rp 240,000 telah disetujui dan ditransfer ke saldo Anda.
Link: /admin/wallets
```

---

### 4. **Pending Revenue Rejected** (Admin, Founder, Co-Founder)

**When:** Admin reject pending revenue

**What Changes:**
- Revenue dihapus dari `balancePending`
- Tidak ada perubahan di `balance`

**Channels:**
- ✅ In-App Notification
- ✅ Push Notification
- ✅ Email
- ✅ WhatsApp

**Example:**
```
Title: ❌ Admin Fee Ditolak
Message: Admin Fee sebesar Rp 240,000 telah ditolak. Alasan: Transaksi mencurigakan
Link: /admin/pending-revenue
```

---

### 5. **Commission Settings Changed** (All Admins)

**When:** Admin mengubah commission type atau rate

**Notification Sent To:** Semua admin users

**What's Included:**
- Membership/Product name
- Previous commission (type & rate)
- New commission (type & rate)
- Who changed it
- Equivalent percentage

**Channels:**
- ✅ In-App Notification
- ✅ Push Notification
- ✅ Email
- ✅ WhatsApp

**Example:**
```
Title: ⚙️ Commission Settings Updated - Paket Lifetime
Message: Membership "Paket Lifetime" commission settings telah berubah:
  Dari: FLAT Rp 325,000 (16.25%)
  Ke: PERCENTAGE 20%
  Diubah oleh: Admin Name
Link: /admin/commission-settings
```

---

## 🔄 Complete Flow Example

### Scenario: Penjualan Membership dengan Affiliate

```
1️⃣  Customer membeli Paket Lifetime (Rp 2,000,000) via affiliate code
    ↓
2️⃣  Sistem menghitung komisi:
    - Affiliate Commission: Rp 325,000 (FLAT) → langsung ke balance
    - Sisa: Rp 1,675,000
      ├─ Admin Fee (15%): Rp 251,250 → pending
      ├─ Founder (60%): Rp 853,500 → pending
      └─ Co-Founder (40%): Rp 569,250 → pending
    ↓
3️⃣  NOTIFICATIONS SENT:
    
    📧 AFFILIATE:
    "💰 Komisi Affiliate Baru Diterima!"
    Channels: Email, Push, WhatsApp, In-App
    Status: Immediately withdrawable ✅
    
    📧 ADMIN:
    "📋 Admin Fee Pending"
    Channels: Email, Push, WhatsApp, In-App
    Status: Awaiting approval ⏳
    
    📧 FOUNDER:
    "📋 Revenue Share Founder"
    Channels: Email, Push, WhatsApp, In-App
    Status: Awaiting approval ⏳
    
    📧 CO-FOUNDER:
    "📋 Revenue Share Co-Founder"
    Channels: Email, Push, WhatsApp, In-App
    Status: Awaiting approval ⏳
    ↓
4️⃣  Admin approves pending revenue:
    
    📧 ADMIN:
    "✅ Admin Fee Disetujui"
    - Amount moved to balance
    - Ready to withdraw ✅
    
    📧 FOUNDER:
    "✅ Revenue Share Founder Disetujui"
    - Amount moved to balance
    - Ready to withdraw ✅
    
    📧 CO-FOUNDER:
    "✅ Revenue Share Co-Founder Disetujui"
    - Amount moved to balance
    - Ready to withdraw ✅
```

---

## 📁 Files Structure

### New Service
```
src/lib/
└── commission-notification-service.ts
    ├── sendCommissionNotification()
    ├── sendPendingRevenueNotification()
    └── sendCommissionSettingsChangeNotification()
```

### Updated Files
```
src/lib/
└── commission-helper.ts
    ├── approvePendingRevenue() [+ notifications]
    └── rejectPendingRevenue() [+ notifications]

src/app/api/admin/commission/
└── update/route.ts
    ├── POST [+ notifications for single update]
    └── PUT [+ notifications for bulk update]
```

---

## 🚀 How It Works

### 1. Commission Notification (Automatic)
```typescript
// From revenue-split.ts atau checkout/success
await sendCommissionNotification({
  type: 'AFFILIATE',
  userId: affiliateId,
  commissionAmount: 325000,
  commissionType: 'FLAT',
  commissionRate: 325000,
  productName: 'Paket Lifetime',
  transactionId: txId
})
```

### 2. Pending Revenue Notification (Automatic)
```typescript
// From commission-helper.ts
// Otomatis ketika pending revenue created
await sendPendingRevenueNotification({
  type: 'PENDING_CREATED',
  userId: adminId,
  amount: 251250,
  revenueType: 'ADMIN_FEE',
  status: 'PENDING'
})
```

### 3. Approval Notification (From Admin Action)
```typescript
// When admin clicks "Approve" on pending revenue
await approvePendingRevenue(pendingRevenueId, adminId)
// ↓ Automatically sends approval notification
```

### 4. Settings Change Notification (From Admin Action)
```typescript
// When admin changes commission settings
await PUT /api/admin/commission/update
// ↓ Automatically sends change notification to all admins
```

---

## 📧 Email Templates Required

Pastikan email templates berikut tersedia di database:

| Template Name | Used For |
|---|---|
| `affiliate-commission-received` | Affiliate gets commission |
| `mentor-commission-received` | Mentor gets commission |
| `event-commission-received` | Event creator gets commission |
| `admin-fee-pending` | Admin fee pending approval |
| `founder-share-pending` | Founder share pending |
| `cofounder-share-pending` | Co-founder share pending |
| `revenue-approved` | Pending revenue approved |
| `revenue-rejected` | Pending revenue rejected |
| `commission-settings-changed` | Commission settings changed |

---

## 🔔 Notification Preferences

Users dapat mengatur preferences di settings:

**Admin/Founder/Co-Founder Settings:**
```
☑️ Enable commission notifications
☑️ Email
☑️ Push notifications
☑️ In-app notifications
☑️ WhatsApp
```

**Affiliate Settings:**
```
☑️ Enable commission notifications
☑️ Email
☑️ Push notifications
☑️ In-app notifications
☑️ WhatsApp
```

---

## 🧪 Testing

### Test Commission Notification
```bash
node test-commission-notifications.js
```

Akan test:
1. Affiliate commission notification
2. Pending revenue creation
3. Approval notification
4. Rejection notification
5. Settings change notification

---

## ⚠️ Error Handling

Semua notifikasi memiliki error handling yang proper:

```typescript
try {
  await sendCommissionNotification(params)
} catch (error) {
  console.error('Error sending notification:', error)
  // Notification failure doesn't block the transaction
}
```

**Philosophy:** Notifikasi gagal tidak boleh memblokir transaksi bisnis utama. Sistem akan log error tapi tetap lanjutkan proses.

---

## 📊 Current Implementation Status

| Feature | Status | Implementation |
|---------|--------|---|
| Affiliate Commission Notification | ✅ | `sendCommissionNotification(type='AFFILIATE')` |
| Mentor Commission Notification | ✅ | `sendCommissionNotification(type='MENTOR')` |
| Event Creator Notification | ✅ | `sendCommissionNotification(type='EVENT_CREATOR')` |
| Admin Fee Notification | ✅ | `sendPendingRevenueNotification()` |
| Founder Share Notification | ✅ | `sendPendingRevenueNotification()` |
| Co-Founder Share Notification | ✅ | `sendPendingRevenueNotification()` |
| Approval Notification | ✅ | `approvePendingRevenue()` updated |
| Rejection Notification | ✅ | `rejectPendingRevenue()` updated |
| Settings Change Notification | ✅ | API endpoint updated |
| Email Channel | ✅ | Via NotificationService |
| Push Notification | ✅ | Via OneSignal |
| WhatsApp Channel | ✅ | Via Starsender |
| In-App Real-time | ✅ | Via Pusher |

---

## 🔐 Security & Privacy

- ✅ Only relevant admins receive admin notifications
- ✅ Users only see their own commissions
- ✅ No sensitive data in WhatsApp messages
- ✅ Email template validation
- ✅ Phone number normalization
- ✅ Proper error logging without exposing data

---

## 💡 Best Practices

1. **Check Preferences First**
   - Notifikasi respects user preferences
   - Email can be disabled per user

2. **Multi-Channel**
   - Setiap notifikasi dikirim via multiple channels
   - User bisa pilih channel mana yang preferred

3. **Graceful Degradation**
   - Jika email gagal, sistem lanjut
   - Jika WhatsApp gagal, tetap ada email
   - Jika push gagal, tetap ada in-app

4. **User-Centric**
   - Mensional nama user di notifikasi
   - Format rupiah dengan proper locale
   - Link langsung ke relevant page

---

## 📞 Troubleshooting

### Notifikasi tidak terkirim?

1. **Check Email Templates:**
   ```bash
   # Via Prisma Studio
   npm run prisma:studio
   # → Navigate ke EmailTemplate
   # Pastikan templates active dan content ada
   ```

2. **Check WhatsApp Config:**
   ```typescript
   // Check if Starsender is configured
   if (starsenderService.isConfigured()) {
     // WhatsApp will be sent
   }
   ```

3. **Check Notification Logs:**
   ```bash
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.notificationLog.findMany({
     take: 10,
     orderBy: { sentAt: 'desc' }
   }).then(logs => {
     console.log(logs);
     process.exit(0);
   });
   "
   ```

---

## 📝 Summary

✅ **Comprehensive notification system**
- Semua pihak (affiliate, admin, founder, co-founder) menerima notifikasi
- Multiple channels (email, SMS, push, in-app)
- Otomatis triggerkan on relevant events
- Smart error handling tanpa block transactions
- Settings change transparency untuk semua admin

**System siap untuk production use!** 🚀

---

**Last Updated:** December 31, 2025
**Version:** 1.0 - Complete Implementation