# 🔌 Integrasi API External Services - EksporYuk

## 📋 Overview

Sistem ini mengintegrasikan 4 service eksternal untuk komunikasi dan notifikasi:

1. **Mailketing** - Email Service
2. **Starsender** - WhatsApp Service
3. **OneSignal** - Push Notification
4. **Pusher** - Real-time Updates

---

## ⚙️ Setup & Konfigurasi

### 1. Environment Variables

Copy konfigurasi berikut ke `.env.local`:

```env
# Email Service - Mailketing
MAILKETING_API_KEY="your-mailketing-api-key"
MAILKETING_API_URL="https://api.mailketing.co.id/v1"
MAILKETING_FROM_EMAIL="noreply@eksporyuk.com"
MAILKETING_FROM_NAME="EksporYuk"

# WhatsApp Service - Starsender
STARSENDER_API_KEY="your-starsender-api-key"
STARSENDER_API_URL="https://api.starsender.online/api"
STARSENDER_DEVICE_ID="your-device-id"

# Push Notification - OneSignal
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_REST_API_KEY="your-onesignal-rest-api-key"
NEXT_PUBLIC_ONESIGNAL_APP_ID="your-onesignal-app-id"

# Real-time Updates - Pusher
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

### 2. Install Dependencies

Semua dependencies sudah terinstall. Jika perlu re-install:

```bash
npm install pusher pusher-js
```

---

## 🚀 Cara Menggunakan

### Import Service

```typescript
import {
  mailketing,
  starsender,
  onesignal,
  pusher,
  sendUnifiedNotification,
} from '@/lib/integrations'
```

---

## 📧 Mailketing (Email)

### Send Single Email

```typescript
const result = await mailketing.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to EksporYuk',
  html: '<h1>Hello!</h1><p>Welcome message here</p>',
})
```

### Send Bulk Email

```typescript
const result = await mailketing.sendBulkEmail(
  ['user1@example.com', 'user2@example.com'],
  'Newsletter Title',
  '<h1>Newsletter Content</h1>',
)
```

### Helper Functions

```typescript
// Verification Email
import { sendVerificationEmail } from '@/lib/integrations'
await sendVerificationEmail('user@example.com', 'John Doe', verificationUrl)

// Welcome Email
import { sendWelcomeEmail } from '@/lib/integrations'
await sendWelcomeEmail('user@example.com', 'John Doe', 'Paket Premium')

// Payment Confirmation
import { sendPaymentConfirmation } from '@/lib/integrations'
await sendPaymentConfirmation(
  'user@example.com',
  'John Doe',
  'INV-001',
  500000,
  'Paket Lifetime'
)
```

---

## 📱 Starsender (WhatsApp)

### Send Message

```typescript
const result = await starsender.sendMessage({
  phone: '081234567890', // atau '6281234567890'
  message: 'Hello from EksporYuk!',
})
```

### Send Bulk Messages

```typescript
const result = await starsender.sendBulkMessage({
  recipients: [
    {
      phone: '081234567890',
      name: 'John',
      variables: { code: '123456' },
    },
    {
      phone: '081987654321',
      name: 'Jane',
      variables: { code: '789012' },
    },
  ],
  message: 'Hi {{name}}, your code is {{code}}',
  delay: 3, // delay 3 seconds between messages
})
```

### Helper Functions

```typescript
// Verification WhatsApp
import { sendVerificationWhatsApp } from '@/lib/integrations'
await sendVerificationWhatsApp('081234567890', 'John Doe', '123456')

// Welcome WhatsApp
import { sendWelcomeWhatsApp } from '@/lib/integrations'
await sendWelcomeWhatsApp('081234567890', 'John Doe', 'Paket Premium')

// Payment Reminder
import { sendPaymentReminderWhatsApp } from '@/lib/integrations'
await sendPaymentReminderWhatsApp(
  '081234567890',
  'John Doe',
  'INV-001',
  500000,
  paymentUrl
)
```

---

## 🔔 OneSignal (Push Notifications)

### Send to Specific Users

```typescript
const result = await onesignal.sendToUsers(
  ['user-id-1', 'user-id-2'],
  'Notification Title',
  'Notification content here',
  {
    data: { type: 'custom', customKey: 'value' },
    url: 'https://eksporyuk.com/path',
  }
)
```

### Send to All Users

```typescript
const result = await onesignal.sendToAll(
  'Announcement',
  'This is a broadcast message to all users!'
)
```

### Send to Segment

```typescript
const result = await onesignal.sendToSegment(
  'premium-members',
  'New Course Available',
  'Check out our latest course!'
)
```

### Helper Functions

```typescript
// Welcome Notification
import { sendWelcomeNotification } from '@/lib/integrations'
await sendWelcomeNotification('user-id', 'John Doe')

// Payment Success
import { sendPaymentSuccessNotification } from '@/lib/integrations'
await sendPaymentSuccessNotification('user-id', 'Paket Lifetime')

// Expiry Reminder
import { sendExpiryReminderNotification } from '@/lib/integrations'
await sendExpiryReminderNotification('user-id', 7) // 7 days left
```

---

## ⚡ Pusher (Real-time)

### Server-side: Trigger Event

```typescript
import { pusher } from '@/lib/integrations'

const result = await pusher.trigger({
  channel: 'group-123',
  event: 'new-message',
  data: {
    id: 'msg-1',
    userId: 'user-1',
    userName: 'John Doe',
    content: 'Hello everyone!',
    timestamp: new Date().toISOString(),
  },
})
```

### Client-side: Subscribe to Channel

```typescript
import { createPusherClient } from '@/lib/integrations'

const pusherClient = createPusherClient()

if (pusherClient) {
  // Public channel
  const channel = pusherClient.subscribe('public-announcements')
  channel.bind('new-announcement', (data) => {
    console.log('New announcement:', data)
  })

  // Private channel
  const privateChannel = pusherClient.subscribe('private-user-123')
  privateChannel.bind('new-notification', (data) => {
    console.log('New notification:', data)
  })

  // Presence channel
  const presenceChannel = pusherClient.subscribe('presence-users')
  presenceChannel.bind('pusher:subscription_succeeded', (members) => {
    console.log('Online users:', members.count)
  })
}
```

### Helper Functions

```typescript
// New Message
import { triggerNewMessage } from '@/lib/integrations'
await triggerNewMessage('group-id', messageData)

// User Online Status
import { triggerUserOnline } from '@/lib/integrations'
await triggerUserOnline('user-id', true)

// New Notification
import { triggerNotification } from '@/lib/integrations'
await triggerNotification('user-id', notificationData)

// Membership Activated
import { triggerMembershipActivated } from '@/lib/integrations'
await triggerMembershipActivated('user-id', membershipData)
```

---

## 🎯 Unified Notification

Kirim notifikasi via Email, WhatsApp, dan Push sekaligus:

```typescript
import { sendUnifiedNotification } from '@/lib/integrations'

const results = await sendUnifiedNotification({
  userId: 'user-id',
  email: 'user@example.com',
  phone: '081234567890',
  name: 'John Doe',
  notification: {
    subject: 'Payment Successful',
    message: 'Your payment has been confirmed!',
    type: 'payment',
    data: { transactionId: 'TRX-123' },
  },
})

console.log('Email:', results.email)
console.log('WhatsApp:', results.whatsapp)
console.log('Push:', results.push)
```

---

## 🧪 Testing

### 1. Cek Status Konfigurasi

```bash
curl http://localhost:3000/api/test/integrations
```

Atau di browser (harus login sebagai ADMIN):
```
http://localhost:3000/api/test/integrations
```

### 2. Test Mailketing

```bash
curl -X POST http://localhost:3000/api/test/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "service": "mailketing",
    "testType": "send-email",
    "params": {
      "email": "your-email@gmail.com"
    }
  }'
```

### 3. Test Starsender

```bash
curl -X POST http://localhost:3000/api/test/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "service": "starsender",
    "testType": "send-message",
    "params": {
      "phone": "081234567890",
      "name": "Test User"
    }
  }'
```

### 4. Test OneSignal

```bash
curl -X POST http://localhost:3000/api/test/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "service": "onesignal",
    "testType": "send-notification",
    "params": {}
  }'
```

### 5. Test Pusher

```bash
curl -X POST http://localhost:3000/api/test/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "service": "pusher",
    "testType": "trigger-event",
    "params": {
      "channel": "public-test",
      "event": "test-event"
    }
  }'
```

### 6. Test Unified (All Services)

```bash
curl -X POST http://localhost:3000/api/test/integrations \
  -H "Content-Type": "application/json" \
  -d '{
    "service": "unified",
    "testType": "",
    "params": {
      "email": "your-email@gmail.com",
      "phone": "081234567890",
      "name": "Test User"
    }
  }'
```

---

## 🎨 UI Testing Page (Optional)

Buat halaman admin untuk testing visual:

**`src/app/(dashboard)/admin/integrations/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function IntegrationsTestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testService = async (service: string, testType: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/test/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, testType, params: {} }),
      })
      const data = await res.json()
      setResults(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Integrations</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">Mailketing (Email)</h3>
          <Button onClick={() => testService('mailketing', 'send-email')}>
            Test Send Email
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold mb-3">Starsender (WhatsApp)</h3>
          <Button onClick={() => testService('starsender', 'send-message')}>
            Test Send WhatsApp
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold mb-3">OneSignal (Push)</h3>
          <Button onClick={() => testService('onesignal', 'send-notification')}>
            Test Push Notification
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold mb-3">Pusher (Real-time)</h3>
          <Button onClick={() => testService('pusher', 'trigger-event')}>
            Test Trigger Event
          </Button>
        </Card>
      </div>

      {loading && <p>Loading...</p>}
      {results && (
        <Card className="p-4">
          <h3 className="font-bold mb-2">Results:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}
```

---

## 📝 Development Mode

Semua service akan berjalan dalam "dev mode" jika API key tidak dikonfigurasi:

- ✅ **Log to console** - Output ditampilkan di console
- ✅ **No actual API calls** - Tidak ada request ke API eksternal
- ✅ **Returns success** - Selalu return success untuk testing flow

Ini memungkinkan development tanpa perlu setup API key terlebih dahulu.

---

## 🔐 Production Setup

Untuk production, pastikan semua API key valid:

1. Daftar akun di masing-masing service
2. Dapatkan API credentials
3. Update `.env.local` dengan credentials production
4. Test dengan endpoint `/api/test/integrations`
5. Deploy!

---

## 📊 Monitoring & Logs

Semua service akan log ke console:

- ✅ **Success**: Log dengan prefix ✅
- ❌ **Error**: Log dengan prefix ❌
- 📧 **Email**: Log dengan prefix 📧
- 📱 **WhatsApp**: Log dengan prefix 📱
- 🔔 **Push**: Log dengan prefix 🔔
- ⚡ **Real-time**: Log dengan prefix ⚡

---

## 🎉 Ready to Use!

Semua integrasi sudah siap digunakan. Tinggal:

1. ✅ Update `.env.local` dengan API keys
2. ✅ Test dengan `/api/test/integrations`
3. ✅ Implement di webhook & follow-up system
4. ✅ Deploy & monitor!
