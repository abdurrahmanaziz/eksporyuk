# ✅ Notification Integration Complete

## Overview

Sistem notifikasi telah diintegrasikan ke semua API affiliate dan admin dengan dukungan 4 channel:
- **Email** (via Mailketing)
- **WhatsApp** (via Starsender)
- **Push Notification** (via OneSignal)
- **Real-time** (via Pusher)

## Notification Services

### 1. NotificationService (`/lib/services/notificationService.ts`)
Service utama yang mengirim notifikasi ke semua channel sekaligus.
```typescript
await notificationService.send({
  userId: string,
  type: 'AFFILIATE' | 'GENERAL' | 'PAYMENT' | etc,
  title: string,
  message: string,
  link?: string,
  channels: ['pusher', 'onesignal', 'email', 'whatsapp'],
  metadata?: object
})
```

### 2. StarsenderService (`/lib/starsender.ts`)
Untuk WhatsApp direct messaging.
```typescript
await starsenderService.sendWhatsApp({
  to: phoneNumber,
  message: string
})
```

### 3. PusherService (`/lib/pusher.ts`)
Untuk real-time notification.
```typescript
await pusherService.notifyUser(userId, 'notification', data)
```

### 4. OneSignalService (`/lib/onesignal.ts`)
Untuk push notification.
```typescript
await onesignalService.sendToUser(userId, title, message)
```

### 5. MailketingService (`/lib/mailketing.ts`)
Untuk email notification.
```typescript
await mailketingService.sendEmail(email, subject, template, data)
```

---

## API Integration

### Affiliate APIs

#### 1. POST `/api/affiliate/apply` ✅
**Triggers:**
- ✅ Auto-approve: Notifies user via all channels + WA + Pusher
- ✅ Pending: Creates notification for admins

#### 2. POST `/api/affiliate/register` ✅
**Triggers:**
- ✅ Auto-approve: Multi-channel notification
- ✅ Pending: Admin notification

#### 3. PUT `/api/admin/affiliates/[id]/approve` ✅
**Triggers:**
- ✅ notificationService → all channels
- ✅ starsenderService → WhatsApp
- ✅ pusherService → Real-time

#### 4. PUT `/api/admin/affiliates/[id]/reject` ✅
**Triggers:**
- ✅ notificationService → all channels
- ✅ starsenderService → WhatsApp (with reason)
- ✅ pusherService → Real-time

### Payout APIs

#### 5. POST `/api/affiliate/payouts` ✅
**Triggers:**
- ✅ notificationService → User confirmation
- ✅ Admin notification for new payout request

#### 6. PUT `/api/admin/payouts/[id]/approve` ✅
**Triggers:**
- ✅ notificationService → all channels
- ✅ starsenderService → WhatsApp with amount details

#### 7. PUT `/api/admin/payouts/[id]/reject` ✅
**Triggers:**
- ✅ notificationService → all channels
- ✅ starsenderService → WhatsApp with rejection reason

### Revenue Split (`/lib/revenue-split.ts`)

#### 8. processRevenueDistribution() ✅
**Triggers:**
- ✅ Affiliate Commission: Multi-channel + WhatsApp notification
- ✅ Mentor Commission: Multi-channel + WhatsApp notification

---

## Notification Types & Templates

### Affiliate Approved
```
📢 Title: 🎉 Selamat! Anda Resmi Menjadi Affiliate!
📝 Message: Akun affiliate Anda telah disetujui. Segera dapatkan komisi 30% dari setiap penjualan!
🔗 Link: /affiliate/dashboard
📱 WA: Includes affiliate code and dashboard link
```

### Affiliate Rejected
```
📢 Title: ❌ Pendaftaran Affiliate Ditolak
📝 Message: Maaf, pendaftaran affiliate Anda ditolak. [Reason]
🔗 Link: /affiliate
📱 WA: Includes reason and support instructions
```

### Payout Approved
```
📢 Title: 💰 Pencairan Dana Disetujui!
📝 Message: Pencairan dana sebesar Rp X telah disetujui.
🔗 Link: /affiliate/payouts
📱 WA: Includes amount and transfer timeline
```

### Payout Rejected
```
📢 Title: ❌ Pencairan Dana Ditolak
📝 Message: Maaf, pencairan dana Anda ditolak. [Reason]
🔗 Link: /affiliate/payouts
📱 WA: Includes reason and next steps
```

### Commission Received
```
📢 Title: 💰 Komisi Baru Diterima!
📝 Message: Selamat! Anda mendapat komisi sebesar Rp X.
🔗 Link: /affiliate/earnings
📱 WA: Includes amount and type
```

---

## User Preferences

Users can control notifications via `NotificationPreference`:
- `enableAllEmail` - Email notifications
- `enableAllWhatsApp` - WhatsApp notifications  
- `enableAllPush` - Push notifications (OneSignal)
- `enableAllInApp` - In-app notifications (Pusher)

NotificationService automatically checks preferences before sending.

---

## Error Handling

All notification calls are wrapped in try/catch:
```typescript
try {
  await notificationService.send({...})
} catch (notifError) {
  console.error('Error sending notification:', notifError)
  // Don't throw - notification failure shouldn't block main operation
}
```

---

## Environment Variables Required

```env
# Pusher
PUSHER_APP_ID=xxx
PUSHER_KEY=xxx
PUSHER_SECRET=xxx
PUSHER_CLUSTER=xxx
NEXT_PUBLIC_PUSHER_KEY=xxx
NEXT_PUBLIC_PUSHER_CLUSTER=xxx

# OneSignal
ONESIGNAL_APP_ID=xxx
ONESIGNAL_REST_API_KEY=xxx

# Starsender (WhatsApp)
STARSENDER_API_KEY=xxx
STARSENDER_DEVICE_ID=xxx

# Mailketing (Email)
MAILKETING_API_KEY=xxx
MAILKETING_BRAND_ID=xxx

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Summary

| Feature | Email | WA | Push | Real-time |
|---------|-------|-----|------|-----------|
| Affiliate Approved | ✅ | ✅ | ✅ | ✅ |
| Affiliate Rejected | ✅ | ✅ | ✅ | ✅ |
| Payout Requested | ✅ | - | ✅ | ✅ |
| Payout Approved | ✅ | ✅ | ✅ | ✅ |
| Payout Rejected | ✅ | ✅ | ✅ | ✅ |
| Commission Received | ✅ | ✅ | ✅ | ✅ |
| Mentor Commission | ✅ | ✅ | ✅ | ✅ |

---

*Last Updated: January 2025*
