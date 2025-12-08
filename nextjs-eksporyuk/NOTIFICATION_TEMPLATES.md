# 📧 Sistem Notifikasi & Template

Dokumentasi lengkap untuk sistem notifikasi email dan WhatsApp menggunakan Mailketing dan StarSender.

## 📋 Daftar Isi

1. [Overview Sistem](#overview-sistem)
2. [Integrasi Mailketing (Email)](#integrasi-mailketing)
3. [Integrasi StarSender (WhatsApp)](#integrasi-starsender)
4. [Template Notifikasi](#template-notifikasi)
5. [Variabel Template](#variabel-template)
6. [Trigger & Automation](#trigger--automation)
7. [Follow-up System](#follow-up-system)
8. [Testing & Monitoring](#testing--monitoring)

---

## 🎯 Overview Sistem

Sistem notifikasi Ekspor Yuk menggunakan:
- **Mailketing**: Email marketing & transactional emails
- **StarSender**: WhatsApp & SMS gateway
- **OneSignal**: Push notifications (browser & mobile)

### Channel Prioritas
1. **Email** - Untuk komunikasi formal, invoice, receipt
2. **WhatsApp** - Untuk follow-up cepat, reminder pembayaran
3. **Push Notification** - Untuk real-time updates

---

## 📧 Integrasi Mailketing

### Setup Mailketing

1. **Daftar Account**
   - Kunjungi: https://mailketing.co.id
   - Buat akun baru atau login
   - Upgrade ke paket yang sesuai kebutuhan

2. **Dapatkan API Key**
   - Login ke dashboard Mailketing
   - Pergi ke Settings → API Keys
   - Generate new API Key
   - Copy API Key untuk konfigurasi

3. **Konfigurasi di Admin Panel**
   ```
   Path: /admin/integrations
   Service: Mailketing
   
   Required Fields:
   - MAILKETING_API_KEY: Your API Key
   - MAILKETING_SENDER_EMAIL: verified@yourdomain.com
   - MAILKETING_SENDER_NAME: Ekspor Yuk Team
   ```

4. **Verify Sender Email**
   - Sender email harus diverifikasi di Mailketing
   - Gunakan domain bisnis Anda (bukan Gmail/Yahoo)
   - Contoh: support@eksporyuk.com

### Mailketing API Usage

```typescript
// lib/services/mailketing.ts
import { prisma } from '@/lib/prisma'

interface MailketingConfig {
  apiKey: string
  senderEmail: string
  senderName: string
}

async function getMailketingConfig(): Promise<MailketingConfig | null> {
  const config = await prisma.integrationConfig.findUnique({
    where: { service: 'mailketing' }
  })
  
  if (!config?.isActive) return null
  
  return {
    apiKey: config.config.MAILKETING_API_KEY,
    senderEmail: config.config.MAILKETING_SENDER_EMAIL,
    senderName: config.config.MAILKETING_SENDER_NAME
  }
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
  replyTo?: string
}) {
  const config = await getMailketingConfig()
  if (!config) {
    console.log('Mailketing not configured, skipping email')
    return { success: false, reason: 'not_configured' }
  }

  try {
    const response = await fetch('https://api.mailketing.co.id/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from_email: config.senderEmail,
        from_name: config.senderName,
        to: params.to,
        subject: params.subject,
        html: params.html,
        reply_to: params.replyTo || config.senderEmail
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      return { success: true, messageId: data.message_id }
    } else {
      console.error('Mailketing send error:', data)
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('Mailketing API error:', error)
    return { success: false, error: 'Network error' }
  }
}
```

---

## 📱 Integrasi StarSender

### Setup StarSender

1. **Daftar Account**
   - Kunjungi: https://starsender.com atau https://starsender.id
   - Buat akun dan top-up saldo

2. **Connect WhatsApp Device**
   - Download StarSender app atau gunakan web version
   - Scan QR code dengan WhatsApp yang akan digunakan
   - Device ID akan muncul setelah connected

3. **Dapatkan API Key**
   - Login ke dashboard
   - Pergi ke Settings → API
   - Copy API Key dan Device ID

4. **Konfigurasi di Admin Panel**
   ```
   Path: /admin/integrations
   Service: StarSender
   
   Required Fields:
   - STARSENDER_API_KEY: Your API Key
   - STARSENDER_DEVICE_ID: Your Device ID
   ```

### StarSender API Usage

```typescript
// lib/services/starsender.ts
import { prisma } from '@/lib/prisma'

interface StarSenderConfig {
  apiKey: string
  deviceId: string
}

async function getStarSenderConfig(): Promise<StarSenderConfig | null> {
  const config = await prisma.integrationConfig.findUnique({
    where: { service: 'starsender' }
  })
  
  if (!config?.isActive) return null
  
  return {
    apiKey: config.config.STARSENDER_API_KEY,
    deviceId: config.config.STARSENDER_DEVICE_ID
  }
}

export async function sendWhatsApp(params: {
  to: string // Format: 628123456789 (tanpa +)
  message: string
  imageUrl?: string // Optional image attachment
}) {
  const config = await getStarSenderConfig()
  if (!config) {
    console.log('StarSender not configured, skipping WhatsApp')
    return { success: false, reason: 'not_configured' }
  }

  // Format nomor: hapus +, 0, spasi
  const phone = params.to.replace(/[\+\s\-]/g, '')
  const formattedPhone = phone.startsWith('62') ? phone : `62${phone.replace(/^0/, '')}`

  try {
    const endpoint = params.imageUrl 
      ? 'https://api.starsender.online/api/sendFileURL'
      : 'https://api.starsender.online/api/sendText'

    const body = params.imageUrl ? {
      api_key: config.apiKey,
      device_id: config.deviceId,
      phone: formattedPhone,
      caption: params.message,
      url: params.imageUrl
    } : {
      api_key: config.apiKey,
      device_id: config.deviceId,
      phone: formattedPhone,
      message: params.message
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (response.ok && data.status === 'success') {
      return { success: true, messageId: data.message_id }
    } else {
      console.error('StarSender send error:', data)
      return { success: false, error: data.message }
    }
  } catch (error) {
    console.error('StarSender API error:', error)
    return { success: false, error: 'Network error' }
  }
}
```

---

## 📝 Template Notifikasi

### Database Schema

```prisma
model EmailTemplate {
  id              String   @id @default(cuid())
  name            String   // Template identifier (e.g., "welcome_email")
  subject         String   // Email subject dengan variabel
  body            String   // HTML template body
  
  variables       Json?    // Available variables: {name, email, amount, etc}
  
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model WhatsAppTemplate {
  id              String   @id @default(cuid())
  name            String   // Template identifier (e.g., "payment_reminder")
  message         String   // WhatsApp message dengan variabel
  
  variables       Json?    // Available variables
  
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Template Types

#### 1. **Transactional Templates**
- Welcome email (setelah registrasi)
- Email verification
- Password reset
- Payment invoice
- Payment confirmation
- Receipt/bukti pembayaran

#### 2. **Marketing Templates**
- Newsletter
- Product announcement
- Membership upgrade offer
- Course recommendation
- Event invitation

#### 3. **Follow-up Templates**
- Payment reminder (1 jam setelah checkout)
- Payment reminder (24 jam)
- Payment reminder (48 jam - last chance)
- Abandoned cart
- Course completion congratulation

---

## 🔤 Variabel Template

### User Variables
```
{name}          - Nama lengkap user
{email}         - Email user
{username}      - Username
{phone}         - Nomor telepon
{whatsapp}      - Nomor WhatsApp
```

### Transaction Variables
```
{amount}        - Total pembayaran (Rp 500,000)
{originalAmount} - Harga sebelum diskon
{discountAmount} - Jumlah diskon
{paymentUrl}    - Link pembayaran Xendit
{invoiceId}     - ID Invoice
{expiryDate}    - Tanggal kadaluarsa
{timeLeft}      - Waktu tersisa (24 jam 30 menit)
```

### Product/Course/Membership Variables
```
{productName}   - Nama produk
{courseName}    - Nama kelas
{membershipName} - Nama paket membership
{duration}      - Durasi membership (3 Bulan)
{features}      - List fitur
{description}   - Deskripsi
```

### Affiliate Variables
```
{affiliateName} - Nama affiliate
{affiliateCode} - Kode affiliate
{commission}    - Komisi yang didapat
{referralLink}  - Link referral
```

### System Variables
```
{siteName}      - Ekspor Yuk
{siteUrl}       - https://eksporyuk.com
{supportEmail}  - support@eksporyuk.com
{supportWhatsApp} - 6281234567890
{currentYear}   - 2024
```

---

## 🎬 Trigger & Automation

### Trigger Events

```typescript
// lib/notifications/triggers.ts

export enum NotificationTrigger {
  // User Events
  USER_REGISTERED = 'user_registered',
  USER_EMAIL_VERIFIED = 'user_email_verified',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  
  // Transaction Events
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_PENDING = 'transaction_pending',
  TRANSACTION_SUCCESS = 'transaction_success',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_EXPIRED = 'transaction_expired',
  
  // Payment Follow-ups
  PAYMENT_REMINDER_1H = 'payment_reminder_1h',
  PAYMENT_REMINDER_24H = 'payment_reminder_24h',
  PAYMENT_REMINDER_48H = 'payment_reminder_48h',
  
  // Course Events
  COURSE_ENROLLED = 'course_enrolled',
  COURSE_COMPLETED = 'course_completed',
  COURSE_CERTIFICATE_ISSUED = 'course_certificate_issued',
  
  // Membership Events
  MEMBERSHIP_ACTIVATED = 'membership_activated',
  MEMBERSHIP_EXPIRING_SOON = 'membership_expiring_soon',
  MEMBERSHIP_EXPIRED = 'membership_expired',
  MEMBERSHIP_RENEWED = 'membership_renewed',
  
  // Affiliate Events
  AFFILIATE_APPROVED = 'affiliate_approved',
  AFFILIATE_COMMISSION_EARNED = 'affiliate_commission_earned',
  AFFILIATE_PAYOUT_PROCESSED = 'affiliate_payout_processed',
}
```

### Auto-Send Logic

```typescript
// lib/notifications/auto-send.ts
import { sendEmail } from '@/lib/services/mailketing'
import { sendWhatsApp } from '@/lib/services/starsender'
import { NotificationTrigger } from './triggers'

interface NotificationParams {
  trigger: NotificationTrigger
  userId: string
  data: Record<string, any>
  channels: ('email' | 'whatsapp' | 'push')[]
}

export async function sendNotification(params: NotificationParams) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId }
  })
  
  if (!user) return

  // Get templates based on trigger
  const templates = await getTemplatesForTrigger(params.trigger)
  
  // Prepare variables
  const variables = {
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    siteName: 'Ekspor Yuk',
    ...params.data
  }

  // Send via channels
  for (const channel of params.channels) {
    switch (channel) {
      case 'email':
        if (templates.email && user.emailNotifications) {
          const html = replaceVariables(templates.email.body, variables)
          const subject = replaceVariables(templates.email.subject, variables)
          await sendEmail({
            to: user.email,
            subject,
            html
          })
        }
        break
        
      case 'whatsapp':
        if (templates.whatsapp && user.whatsappNotifications && user.whatsapp) {
          const message = replaceVariables(templates.whatsapp.message, variables)
          await sendWhatsApp({
            to: user.whatsapp,
            message
          })
        }
        break
        
      case 'push':
        // OneSignal integration
        if (templates.push) {
          // await sendPushNotification(...)
        }
        break
    }
  }
}

function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{${key}}`, 'g')
    result = result.replace(regex, String(value || ''))
  }
  
  return result
}
```

---

## ⏰ Follow-up System

### Follow-up Configuration

Database model untuk follow-up templates:

```prisma
model FollowUpTemplate {
  id              String   @id @default(cuid())
  name            String   // "Reminder 1 Jam", "Follow-up 24 Jam"
  triggerHours    Int      // 1, 24, 48 - trigger setelah X jam
  message         String   // Template message
  channel         String   // "email", "whatsapp", "push", "all"
  isActive        Boolean  @default(true)
  
  // Ownership
  createdBy       String   // "admin" or userId
  ownerType       String   @default("admin") // "admin" or "affiliate"
  
  // Integration flags
  useMailketing   Boolean  @default(false)
  useStarsender   Boolean  @default(false)
  useOnesignal    Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([ownerType, isActive])
}
```

### Follow-up Schedule

```typescript
// lib/cron/payment-followup.ts
import { CronJob } from 'cron'
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications/auto-send'
import { NotificationTrigger } from '@/lib/notifications/triggers'

// Run setiap 30 menit
export const paymentFollowupJob = new CronJob('*/30 * * * *', async () => {
  console.log('🔄 Running payment follow-up check...')
  
  const now = new Date()
  
  // Get pending transactions
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
      expiredAt: {
        gt: now // Belum expired
      }
    },
    include: {
      user: true
    }
  })

  for (const transaction of pendingTransactions) {
    const createdAt = new Date(transaction.createdAt)
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    
    // Check if follow-up sudah dikirim
    const followupSent = await prisma.notificationLog.findFirst({
      where: {
        transactionId: transaction.id,
        type: `FOLLOWUP_${Math.floor(hoursSinceCreated)}H`
      }
    })
    
    if (followupSent) continue

    // 1 Hour Reminder
    if (hoursSinceCreated >= 1 && hoursSinceCreated < 1.5) {
      await sendFollowup(transaction, NotificationTrigger.PAYMENT_REMINDER_1H)
    }
    
    // 24 Hour Reminder
    if (hoursSinceCreated >= 24 && hoursSinceCreated < 24.5) {
      await sendFollowup(transaction, NotificationTrigger.PAYMENT_REMINDER_24H)
    }
    
    // 48 Hour Reminder (Last Chance)
    if (hoursSinceCreated >= 48 && hoursSinceCreated < 48.5) {
      await sendFollowup(transaction, NotificationTrigger.PAYMENT_REMINDER_48H)
    }
  }
})

async function sendFollowup(transaction: any, trigger: NotificationTrigger) {
  const timeLeft = getTimeLeft(transaction.expiredAt)
  
  await sendNotification({
    trigger,
    userId: transaction.userId,
    data: {
      amount: formatCurrency(transaction.amount),
      paymentUrl: transaction.paymentUrl,
      timeLeft,
      invoiceId: transaction.id
    },
    channels: ['email', 'whatsapp']
  })
  
  // Log followup sent
  await prisma.notificationLog.create({
    data: {
      userId: transaction.userId,
      transactionId: transaction.id,
      type: `FOLLOWUP_${trigger}`,
      channel: 'multi',
      status: 'sent',
      sentAt: new Date()
    }
  })
}

function getTimeLeft(expiryDate: Date): string {
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours} jam ${minutes} menit`
  }
  return `${minutes} menit`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}
```

---

## 🧪 Testing & Monitoring

### Testing Templates

```typescript
// Test email template
POST /api/admin/notifications/test-email
{
  "templateId": "welcome_email",
  "recipientEmail": "test@example.com",
  "variables": {
    "name": "John Doe",
    "amount": "Rp 500,000"
  }
}

// Test WhatsApp template
POST /api/admin/notifications/test-whatsapp
{
  "templateId": "payment_reminder",
  "recipientPhone": "628123456789",
  "variables": {
    "name": "John Doe",
    "amount": "Rp 500,000",
    "timeLeft": "24 jam"
  }
}
```

### Monitoring Dashboard

Buat halaman monitoring di `/admin/notifications/logs`:

```typescript
// Show notification logs
- Total sent (today, this week, this month)
- Success rate per channel
- Failed notifications (retry queue)
- Most used templates
- Channel performance (email vs WhatsApp)
```

---

## 📊 Best Practices

### Email Best Practices
1. ✅ Gunakan subject line yang jelas (max 50 karakter)
2. ✅ Personalisasi dengan nama user
3. ✅ Include clear CTA button
4. ✅ Add unsubscribe link
5. ✅ Mobile-responsive HTML
6. ✅ Test di berbagai email client

### WhatsApp Best Practices
1. ✅ Keep message short (max 1000 karakter)
2. ✅ Gunakan emoji untuk highlight info penting
3. ✅ Sertakan link pendek (gunakan bit.ly atau custom shortener)
4. ✅ Hindari spam - max 1 follow-up per 24 jam
5. ✅ Respect user notification preferences
6. ✅ Format nomor dengan benar (+62)

### Follow-up Strategy
1. **1 Hour**: Friendly reminder dengan info lengkap
2. **24 Hours**: Urgent reminder + benefit highlight
3. **48 Hours**: Last chance + FOMO (Fear of Missing Out)

---

## 🔗 Referensi

- [Mailketing API Docs](https://docs.mailketing.co.id)
- [StarSender API Docs](https://docs.starsender.online)
- [OneSignal Documentation](https://documentation.onesignal.com)
- [Follow-up System Guide](./FOLLOWUP_SYSTEM_GUIDE.md)

---

**Update Terakhir**: 2024-11-21  
**Maintainer**: Ekspor Yuk Dev Team
