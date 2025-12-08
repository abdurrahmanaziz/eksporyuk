# 📧 Notification Integration Plan - Complete System

## 🎯 Tujuan
Memastikan **SEMUA user mendapat notifikasi** di setiap fitur website melalui:
- ✅ Email (via Mailketing API)
- ✅ WhatsApp (via StarSender API)

---

## 📋 **Daftar Fitur & Notifikasi yang Diperlukan**

### **1. AUTHENTICATION & USER MANAGEMENT** 👤

#### **A. Registration/Sign Up**
**Trigger:** User berhasil daftar akun baru

**Notifikasi ke User:**
- ✅ **Email:** `welcome_email` 
  - Subject: "Selamat Datang di Ekspor Yuk! 🎉"
  - Isi: Welcome message, fitur yang bisa diakses, link dashboard
  - Variables: `{name}`, `{email}`, `{siteName}`, `{dashboardUrl}`

- ✅ **WhatsApp:** `wa_welcome`
  - Isi: Ucapan welcome, link dashboard, nomor support
  - Variables: `{name}`, `{dashboardUrl}`, `{whatsapp}`

**Notifikasi ke Admin:**
- ✅ **WhatsApp:** `wa_admin_new_member`
  - Isi: "User baru: {name} - {email}"
  - Untuk: Admin utama

**File yang Harus Dimodifikasi:**
- `src/app/api/auth/[...nextauth]/route.ts` (callback saat sign up)
- Atau `src/app/api/register/route.ts` (jika ada)

---

#### **B. Email Verification**
**Trigger:** User klik link verifikasi email

**Notifikasi ke User:**
- ✅ **Email:** `email_verification`
  - Subject: "Verifikasi Email Anda"
  - Isi: Link verifikasi, expire time
  - Variables: `{name}`, `{verificationUrl}`, `{expiryTime}`

**File yang Harus Dimodifikasi:**
- `src/app/api/auth/verify-email/route.ts`

---

#### **C. Password Reset**
**Trigger:** User request reset password

**Notifikasi ke User:**
- ✅ **Email:** `password_reset`
  - Subject: "Reset Password Anda"
  - Isi: Link reset, expire time, security warning
  - Variables: `{name}`, `{resetUrl}`, `{expiryTime}`

**File yang Harus Dimodifikasi:**
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

---

### **2. MEMBERSHIP SYSTEM** 💎

#### **A. Membership Purchase/Activation**
**Trigger:** User beli membership atau membership diaktifkan

**Notifikasi ke User:**
- ✅ **Email:** `membership_welcome`
  - Subject: "Selamat! Membership Anda Aktif 🎊"
  - Isi: Benefit membership, periode aktif, cara akses
  - Variables: `{name}`, `{membershipName}`, `{startDate}`, `{endDate}`, `{benefits}`

- ✅ **WhatsApp:** `wa_membership_welcome`
  - Isi: Ucapan selamat, benefit, link dashboard
  - Variables: `{name}`, `{membershipName}`, `{endDate}`, `{dashboardUrl}`

**Notifikasi ke Admin:**
- ✅ **WhatsApp:** `wa_admin_new_member`
  - Isi: "Member baru: {name} - {membershipName}"

**File yang Harus Dimodifikasi:**
- `src/app/api/checkout/route.ts` (saat payment success)
- `src/app/api/admin/memberships/activate/route.ts` (manual activation)

---

#### **B. Membership Expiring Soon (30 days, 7 days, 1 day)**
**Trigger:** Cron job check membership expiry

**Notifikasi ke User:**
- ✅ **Email:** `membership_expiring`
  - Subject: "Membership Anda Akan Berakhir dalam {daysLeft} Hari ⏰"
  - Isi: Reminder expiry, benefit yang akan hilang, link renewal
  - Variables: `{name}`, `{membershipName}`, `{expiryDate}`, `{daysLeft}`, `{renewUrl}`

- ✅ **WhatsApp:** `wa_membership_expiring`
  - Isi: Reminder expiry, link renewal
  - Variables: `{name}`, `{membershipName}`, `{daysLeft}`, `{renewUrl}`

**File yang Harus Dibuat:**
- `src/cron/check-membership-expiry.ts`
- Setup cron job di Vercel atau menggunakan Next.js API route dengan cron trigger

---

#### **C. Membership Expired**
**Trigger:** Membership sudah expired

**Notifikasi ke User:**
- ✅ **Email:** `membership_expired`
  - Subject: "Membership Anda Telah Berakhir"
  - Isi: Info expiry, benefit yang hilang, penawaran renewal
  - Variables: `{name}`, `{membershipName}`, `{expiryDate}`, `{renewUrl}`

**File yang Harus Dibuat:**
- `src/cron/check-membership-expiry.ts` (sama dengan expiring check)

---

#### **D. Membership Upgrade**
**Trigger:** User upgrade membership ke tier lebih tinggi

**Notifikasi ke User:**
- ✅ **Email:** `membership_upgrade`
  - Subject: "Upgrade Membership Berhasil! 🚀"
  - Isi: Benefit baru, periode aktif, perbedaan tier
  - Variables: `{name}`, `{oldMembership}`, `{newMembership}`, `{benefits}`, `{endDate}`

**File yang Harus Dimodifikasi:**
- `src/app/api/membership/upgrade/route.ts`

---

### **3. PAYMENT & TRANSACTIONS** 💰

#### **A. Invoice Created (Pending Payment)**
**Trigger:** User create order, invoice dibuat

**Notifikasi ke User:**
- ✅ **Email:** `payment_invoice`
  - Subject: "Invoice #{invoiceId} - Menunggu Pembayaran"
  - Isi: Detail invoice, cara bayar, payment link, expiry time
  - Variables: `{name}`, `{invoiceId}`, `{amount}`, `{productName}`, `{paymentUrl}`, `{expiryTime}`, `{paymentMethod}`

- ✅ **WhatsApp:** `wa_payment_invoice`
  - Isi: Invoice number, amount, payment link, expiry
  - Variables: `{name}`, `{invoiceId}`, `{amount}`, `{paymentUrl}`, `{expiryTime}`

**File yang Harus Dimodifikasi:**
- `src/app/api/checkout/route.ts` (saat create transaction)

---

#### **B. Payment Reminder (Follow-up System)**
**Trigger:** Cron job check unpaid transactions

**Level 1 - 1 Hour After Invoice:**
- ✅ **Email:** Follow-up message dari setting
- ✅ **WhatsApp:** Follow-up message dari setting
- Variables: `{name}`, `{amount}`, `{timeLeft}`, `{paymentUrl}`, `{invoiceId}`

**Level 2 - 24 Hours After Invoice:**
- ✅ **Email:** Follow-up message dari setting
- ✅ **WhatsApp:** Follow-up message dari setting

**Level 3 - 48 Hours After Invoice (Last Reminder):**
- ✅ **Email:** Follow-up message dari setting
- ✅ **WhatsApp:** Follow-up message dari setting

**File yang Harus Dibuat:**
- `src/cron/check-payment-reminders.ts`
- Menggunakan setting dari `/admin/settings/follow-up`

---

#### **C. Payment Success**
**Trigger:** Payment confirmed (webhook dari Xendit/Midtrans)

**Notifikasi ke User:**
- ✅ **Email:** `payment_success`
  - Subject: "Pembayaran Berhasil! ✅"
  - Isi: Konfirmasi payment, receipt, invoice details, next steps
  - Variables: `{name}`, `{invoiceId}`, `{amount}`, `{productName}`, `{receiptUrl}`, `{date}`

- ✅ **WhatsApp:** `wa_payment_success`
  - Isi: Konfirmasi payment, invoice number, receipt link
  - Variables: `{name}`, `{invoiceId}`, `{amount}`, `{receiptUrl}`

**Notifikasi ke Admin:**
- ✅ **WhatsApp:** `wa_admin_new_order`
  - Isi: "Order baru: {name} - {productName} - Rp {amount}"

**File yang Harus Dimodifikasi:**
- `src/app/api/webhooks/xendit/route.ts`
- `src/app/api/webhooks/midtrans/route.ts`
- `src/app/api/checkout/callback/route.ts`

---

#### **D. Payment Failed**
**Trigger:** Payment ditolak atau expired

**Notifikasi ke User:**
- ✅ **Email:** `payment_failed`
  - Subject: "Pembayaran Gagal atau Expired ❌"
  - Isi: Info kegagalan, alasan, cara retry, link create new order
  - Variables: `{name}`, `{invoiceId}`, `{amount}`, `{reason}`, `{retryUrl}`

**File yang Harus Dimodifikasi:**
- `src/app/api/webhooks/xendit/route.ts`
- `src/cron/check-expired-transactions.ts`

---

### **4. COURSE & PRODUCT ACCESS** 📚

#### **A. Course Enrollment**
**Trigger:** User dapat akses course (setelah payment success)

**Notifikasi ke User:**
- ✅ **Email:** `course_enrollment`
  - Subject: "Selamat! Anda Sudah Terdaftar di {courseName} 🎓"
  - Isi: Welcome to course, cara akses, link course, support info
  - Variables: `{name}`, `{courseName}`, `{courseUrl}`, `{supportEmail}`

- ✅ **WhatsApp:** `wa_course_enrollment`
  - Isi: Welcome, link course, support contact
  - Variables: `{name}`, `{courseName}`, `{courseUrl}`, `{whatsapp}`

**File yang Harus Dimodifikasi:**
- `src/app/api/checkout/route.ts` (saat payment success untuk course)
- `src/app/api/courses/enroll/route.ts`

---

#### **B. Product Download Ready**
**Trigger:** Digital product siap didownload

**Notifikasi ke User:**
- ✅ **Email:** `product_download_ready`
  - Subject: "Produk Anda Siap Didownload 📦"
  - Isi: Link download, expiry link, cara download, support
  - Variables: `{name}`, `{productName}`, `{downloadUrl}`, `{expiryTime}`

**File yang Harus Dimodifikasi:**
- `src/app/api/checkout/route.ts` (untuk digital product)
- `src/app/api/products/generate-download-link/route.ts`

---

#### **C. Course Reminder (Ongoing Course)**
**Trigger:** Cron job untuk remind user melanjutkan course

**Notifikasi ke User:**
- ✅ **WhatsApp:** `wa_course_reminder`
  - Isi: "Jangan lupa lanjutkan course {courseName}! Progress: {progress}%"
  - Variables: `{name}`, `{courseName}`, `{progress}`, `{courseUrl}`

**File yang Harus Dibuat:**
- `src/cron/send-course-reminders.ts`

---

### **5. AFFILIATE SYSTEM** 🤝

#### **A. Affiliate Registration Approved**
**Trigger:** Admin approve affiliate application

**Notifikasi ke User:**
- ✅ **Email:** `affiliate_welcome`
  - Subject: "Selamat! Anda Resmi Jadi Affiliate Ekspor Yuk 🤝"
  - Isi: Welcome, cara kerja affiliate, link generator, commission rate
  - Variables: `{name}`, `{affiliateCode}`, `{commissionRate}`, `{dashboardUrl}`

- ✅ **WhatsApp:** `wa_affiliate_welcome`
  - Isi: Welcome, affiliate code, link dashboard
  - Variables: `{name}`, `{affiliateCode}`, `{dashboardUrl}`

**File yang Harus Dimodifikasi:**
- `src/app/api/admin/affiliates/approve/route.ts`

---

#### **B. Commission Earned**
**Trigger:** Ada transaksi dari affiliate link

**Notifikasi ke Affiliate:**
- ✅ **Email:** `affiliate_commission_earned`
  - Subject: "Selamat! Anda Dapat Komisi Rp {amount} 💰"
  - Isi: Detail transaksi, komisi earned, total komisi, cara withdraw
  - Variables: `{name}`, `{amount}`, `{totalCommission}`, `{productName}`, `{buyer}`

- ✅ **WhatsApp:** `wa_affiliate_commission`
  - Isi: Komisi earned notification
  - Variables: `{name}`, `{amount}`, `{totalCommission}`

**File yang Harus Dimodifikasi:**
- `src/app/api/webhooks/xendit/route.ts` (saat payment success dengan affiliate)
- `src/app/api/checkout/route.ts`

---

### **6. ADMIN NOTIFICATIONS** 👨‍💼

#### **A. New Order**
**Trigger:** Ada order baru

**Notifikasi ke Admin:**
- ✅ **WhatsApp:** `wa_admin_new_order`
  - Isi: "Order baru dari {name}: {productName} - Rp {amount}"
  - Variables: `{name}`, `{email}`, `{productName}`, `{amount}`, `{invoiceId}`

---

#### **B. New Member**
**Trigger:** User baru atau membership baru

**Notifikasi ke Admin:**
- ✅ **WhatsApp:** `wa_admin_new_member`
  - Isi: "Member baru: {name} - {membershipName}"
  - Variables: `{name}`, `{email}`, `{membershipName}`, `{phone}`

---

### **7. COMMUNITY & ENGAGEMENT** 👥

#### **A. Event Reminder**
**Trigger:** Cron job untuk upcoming events

**Notifikasi ke Members:**
- ✅ **WhatsApp:** `wa_event_reminder`
  - Isi: "Event {eventName} akan dimulai {time}! Link: {eventUrl}"
  - Variables: `{name}`, `{eventName}`, `{time}`, `{eventUrl}`

**File yang Harus Dibuat:**
- `src/cron/send-event-reminders.ts`

---

#### **B. Feedback Request**
**Trigger:** 7 hari setelah course completion atau product purchase

**Notifikasi ke User:**
- ✅ **WhatsApp:** `wa_feedback_request`
  - Isi: "Bagaimana pengalaman Anda dengan {productName}? Berikan feedback"
  - Variables: `{name}`, `{productName}`, `{feedbackUrl}`

**File yang Harus Dibuat:**
- `src/cron/send-feedback-requests.ts`

---

## 🔧 **Implementation Steps**

### **Phase 1: Setup Notification Helper (PRIORITY)**
✅ **File:** `src/lib/notifications.ts`

```typescript
import { EmailTemplate, WhatsAppTemplate } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Mailketing API integration
export async function sendEmail({
  templateId,
  to,
  variables,
}: {
  templateId: string
  to: string
  variables: Record<string, string>
}) {
  // Get template from database
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId }
  })
  
  if (!template || !template.isActive) {
    console.error(`Email template ${templateId} not found or inactive`)
    return false
  }

  // Replace variables in template
  let subject = template.subject
  let body = template.body
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  })

  // Send via Mailketing API
  try {
    const response = await fetch('https://api.mailketing.com/v1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAILKETING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to,
        subject,
        html: body,
      }),
    })

    if (!response.ok) {
      throw new Error(`Mailketing API error: ${response.statusText}`)
    }

    console.log(`✅ Email sent: ${templateId} to ${to}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    return false
  }
}

// StarSender WhatsApp API integration
export async function sendWhatsApp({
  templateId,
  to,
  variables,
}: {
  templateId: string
  to: string
  variables: Record<string, string>
}) {
  // Get template from database
  const template = await prisma.whatsAppTemplate.findUnique({
    where: { id: templateId }
  })
  
  if (!template || !template.isActive) {
    console.error(`WhatsApp template ${templateId} not found or inactive`)
    return false
  }

  // Replace variables in template
  let message = template.message
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    message = message.replace(regex, value)
  })

  // Send via StarSender API
  try {
    const response = await fetch('https://api.starsender.online/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STARSENDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: process.env.STARSENDER_DEVICE_ID,
        number: to,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error(`StarSender API error: ${response.statusText}`)
    }

    console.log(`✅ WhatsApp sent: ${templateId} to ${to}`)
    return true
  } catch (error) {
    console.error('❌ Failed to send WhatsApp:', error)
    return false
  }
}

// Send both email and WhatsApp
export async function sendNotification({
  email,
  whatsapp,
  to,
  toPhone,
  variables,
}: {
  email?: string
  whatsapp?: string
  to: string
  toPhone?: string
  variables: Record<string, string>
}) {
  const results = []

  if (email) {
    results.push(await sendEmail({ templateId: email, to, variables }))
  }

  if (whatsapp && toPhone) {
    results.push(await sendWhatsApp({ templateId: whatsapp, to: toPhone, variables }))
  }

  return results.every(r => r === true)
}
```

### **Phase 2: Integrate ke Semua API Routes**

Contoh di **Checkout API** (`src/app/api/checkout/route.ts`):

```typescript
import { sendNotification } from '@/lib/notifications'

// Setelah create transaction
await sendNotification({
  email: 'payment_invoice',
  whatsapp: 'wa_payment_invoice',
  to: user.email,
  toPhone: user.phone,
  variables: {
    name: user.name,
    invoiceId: transaction.id,
    amount: `Rp ${transaction.amount.toLocaleString('id-ID')}`,
    productName: product.name,
    paymentUrl: `${process.env.NEXT_PUBLIC_URL}/payment/${transaction.id}`,
    expiryTime: format(transaction.expiryAt, 'dd MMMM yyyy HH:mm', { locale: id }),
  },
})

// Notif ke admin
await sendWhatsApp({
  templateId: 'wa_admin_new_order',
  to: process.env.ADMIN_PHONE,
  variables: {
    name: user.name,
    email: user.email,
    productName: product.name,
    amount: `Rp ${transaction.amount.toLocaleString('id-ID')}`,
    invoiceId: transaction.id,
  },
})
```

### **Phase 3: Setup Cron Jobs**

**File:** `src/cron/check-payment-reminders.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { sendNotification } from '@/lib/notifications'
import { subHours, isAfter, isBefore } from 'date-fns'

export async function checkPaymentReminders() {
  const settings = await prisma.settings.findUnique({
    where: { id: 1 }
  })

  if (!settings?.followUpEnabled) {
    console.log('Follow-up disabled')
    return
  }

  const now = new Date()

  // Get unpaid transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
      expiryAt: { gt: now },
    },
    include: {
      user: true,
      product: true,
    },
  })

  for (const tx of transactions) {
    const createdAt = new Date(tx.createdAt)
    const timeElapsed = now.getTime() - createdAt.getTime()
    const hoursElapsed = timeElapsed / (1000 * 60 * 60)

    // Check if reminder already sent
    const reminderSent = await prisma.notificationLog.findFirst({
      where: {
        transactionId: tx.id,
        type: 'PAYMENT_REMINDER',
        // Add logic to track which level
      },
    })

    // Level 1: 1 hour
    if (settings.followUp1HourEnabled && hoursElapsed >= 1 && hoursElapsed < 2 && !reminderSent) {
      await sendNotification({
        email: 'payment_reminder_1h', // Use setting message
        whatsapp: 'wa_payment_reminder_1h',
        to: tx.user.email,
        toPhone: tx.user.phone,
        variables: {
          name: tx.user.name,
          amount: `Rp ${tx.amount.toLocaleString('id-ID')}`,
          timeLeft: calculateTimeLeft(tx.expiryAt),
          paymentUrl: `${process.env.NEXT_PUBLIC_URL}/payment/${tx.id}`,
          invoiceId: tx.id,
        },
      })

      // Log notification
      await prisma.notificationLog.create({
        data: {
          transactionId: tx.id,
          userId: tx.userId,
          type: 'PAYMENT_REMINDER',
          level: 1,
        },
      })
    }

    // Level 2: 24 hours
    if (settings.followUp24HourEnabled && hoursElapsed >= 24 && hoursElapsed < 25) {
      // Send reminder level 2
    }

    // Level 3: 48 hours
    if (settings.followUp48HourEnabled && hoursElapsed >= 48 && hoursElapsed < 49) {
      // Send reminder level 3
    }
  }
}

function calculateTimeLeft(expiryAt: Date): string {
  const now = new Date()
  const diff = expiryAt.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  return `${hours} jam`
}
```

**Setup Cron di Vercel** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/payment-reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/membership-expiry",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 📊 **Tracking & Logging**

Buat model **NotificationLog** di Prisma:

```prisma
model NotificationLog {
  id            String   @id @default(cuid())
  userId        String?
  transactionId String?
  type          String   // WELCOME, PAYMENT_INVOICE, PAYMENT_REMINDER, etc
  channel       String   // EMAIL, WHATSAPP
  templateId    String
  status        String   // SENT, FAILED
  sentAt        DateTime @default(now())
  
  user          User?        @relation(fields: [userId], references: [id])
  transaction   Transaction? @relation(fields: [transactionId], references: [id])
}
```

---

## ✅ **Checklist Implementation**

### **API Routes to Modify:**
- [ ] `src/app/api/auth/register/route.ts` - Welcome email/WA
- [ ] `src/app/api/auth/verify-email/route.ts` - Verification email
- [ ] `src/app/api/auth/forgot-password/route.ts` - Reset password email
- [ ] `src/app/api/checkout/route.ts` - Invoice & payment success
- [ ] `src/app/api/webhooks/xendit/route.ts` - Payment webhook
- [ ] `src/app/api/membership/activate/route.ts` - Membership welcome
- [ ] `src/app/api/courses/enroll/route.ts` - Course enrollment
- [ ] `src/app/api/admin/affiliates/approve/route.ts` - Affiliate welcome

### **Cron Jobs to Create:**
- [ ] `src/cron/check-payment-reminders.ts` - Payment follow-up
- [ ] `src/cron/check-membership-expiry.ts` - Membership expiring/expired
- [ ] `src/cron/send-course-reminders.ts` - Course progress reminder
- [ ] `src/cron/send-event-reminders.ts` - Event reminder
- [ ] `src/cron/send-feedback-requests.ts` - Feedback request

### **Environment Variables:**
```env
# Mailketing
MAILKETING_API_KEY=your_api_key
MAIL_FROM=noreply@eksporyuk.com
MAIL_FROM_NAME=Ekspor Yuk

# StarSender
STARSENDER_API_KEY=your_api_key
STARSENDER_DEVICE_ID=your_device_id

# Admin
ADMIN_PHONE=628xxxxx
ADMIN_EMAIL=admin@eksporyuk.com
```

---

## 🎯 **Priority Order:**

### **Phase 1 (URGENT - Week 1):**
1. ✅ Setup `notifications.ts` helper
2. ✅ Integrate ke Checkout (payment_invoice, payment_success)
3. ✅ Integrate ke Registration (welcome_email)
4. ✅ Setup payment reminders cron

### **Phase 2 (HIGH - Week 2):**
5. ✅ Integrate membership notifications
6. ✅ Setup membership expiry cron
7. ✅ Integrate course enrollment

### **Phase 3 (MEDIUM - Week 3):**
8. ✅ Integrate affiliate system
9. ✅ Setup admin notifications
10. ✅ Add notification logging

### **Phase 4 (LOW - Week 4):**
11. ✅ Setup event reminders
12. ✅ Setup feedback requests
13. ✅ Analytics & reporting

---

## 📝 **Testing Checklist:**

- [ ] Test email sending via Mailketing
- [ ] Test WhatsApp sending via StarSender
- [ ] Test all templates with real data
- [ ] Test cron jobs locally
- [ ] Test payment flow end-to-end
- [ ] Test membership flow end-to-end
- [ ] Test error handling (API down, invalid phone, etc)
- [ ] Test notification logging
- [ ] Monitor delivery rates
- [ ] Setup alert for failed notifications

---

**🎉 Dengan implementasi ini, SEMUA user akan mendapat notifikasi di SETIAP FITUR website!**
