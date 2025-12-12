# Quick Start: Email Template System

## Overview

Email Template System memungkinkan admin mengelola semua email templates dari admin panel tanpa perlu edit code. System ini sudah include 10 templates siap pakai.

## Quick Access

- **Admin Panel**: https://app.eksporyuk.com/admin/branded-templates
- **API Endpoint**: https://app.eksporyuk.com/api/admin/templates
- **Helper Functions**: `/src/lib/email-template-helper.ts`

## ⚡ Quick Start (5 menit)

### 1. Test Template List API
```bash
curl https://app.eksporyuk.com/api/admin/templates?action=list \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

Response:
```json
{
  "success": true,
  "count": 10,
  "templates": [
    {
      "slug": "welcome-email",
      "name": "Welcome Email",
      "subject": "Selamat Datang di EksporYuk!",
      "variables": ["userName", "dashboardUrl"]
    }
  ]
}
```

### 2. Preview Template dengan Variables
```bash
curl "https://app.eksporyuk.com/api/admin/templates?action=preview&slug=welcome-email&userName=John&dashboardUrl=https://app.eksporyuk.com/dashboard" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### 3. Send Test Email
```bash
curl -X POST https://app.eksporyuk.com/api/admin/templates \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "action": "send-test",
    "slug": "welcome-email",
    "to": "test@example.com",
    "variables": {
      "userName": "John Doe",
      "dashboardUrl": "https://app.eksporyuk.com/dashboard"
    }
  }'
```

## 📝 Available Templates

### Authentication
1. **email-verification** - Verifikasi email baru
2. **welcome-email** - Welcome setelah register

### Transactions
3. **payment-success** - Konfirmasi pembayaran berhasil
4. **credit-topup-success** - Top up credit berhasil

### Membership
5. **membership-active** - Membership diaktifkan
6. **membership-expiring** - Reminder membership akan expired
7. **membership-upgrade-prompt** - Promosi upgrade ke premium

### Events
8. **event-ticket-confirmed** - Konfirmasi tiket event
9. **event-reminder** - Reminder event akan dimulai

### Payouts
10. **payout-approved** - Pencairan dana disetujui

## 💻 Usage dalam Code

### Basic Usage
```typescript
import { sendBrandedEmail } from '@/lib/email-template-helper'

// Send welcome email
await sendBrandedEmail(
  'user@example.com',
  'welcome-email',
  {
    userName: 'John Doe',
    dashboardUrl: 'https://app.eksporyuk.com/dashboard'
  }
)
```

### With Fallback (untuk migration)
```typescript
import { sendEmailWithFallback } from '@/lib/email-template-helper'

await sendEmailWithFallback(
  'user@example.com',
  'welcome-email',
  { userName: 'John' },
  'Selamat Datang!', // Fallback subject
  '<p>Welcome John!</p>' // Fallback HTML
)
```

### Preview Template
```typescript
import { previewTemplate } from '@/lib/email-template-helper'

const preview = await previewTemplate('welcome-email', {
  userName: 'John Doe',
  dashboardUrl: 'https://app.eksporyuk.com/dashboard'
})

console.log(preview.subject) // "Selamat Datang di EksporYuk!"
console.log(preview.content) // Full HTML dengan variables replaced
```

## 🔄 Migration Guide

### Step 1: Identify Hardcoded Email
Cari di code:
```typescript
// OLD WAY
await mailketing.sendEmail({
  to: user.email,
  subject: 'Selamat Datang!',
  html: `<p>Halo ${user.name}, welcome!</p>`
})
```

### Step 2: Check Template Availability
```bash
curl https://app.eksporyuk.com/api/admin/templates?action=list
```

### Step 3: Replace dengan Template System
```typescript
// NEW WAY
await sendBrandedEmail(
  user.email,
  'welcome-email',
  {
    userName: user.name,
    dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`
  }
)
```

### Step 4: Test
```bash
# Test sending
curl -X POST https://app.eksporyuk.com/api/admin/templates \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send-test",
    "slug": "welcome-email",
    "to": "your-email@example.com",
    "variables": {
      "userName": "Test User",
      "dashboardUrl": "https://app.eksporyuk.com/dashboard"
    }
  }'
```

## 📊 Files yang Perlu Diupdate

### Priority 1 (High Traffic)
- [x] `/src/lib/email-template-helper.ts` - Helper functions ✅ CREATED
- [ ] `/src/app/api/auth/register/route.ts` - Registration welcome email
- [ ] `/src/app/api/webhooks/xendit/route.ts` - Payment success email
- [ ] `/src/lib/auth-options.ts` - Google OAuth welcome email

### Priority 2 (Important Features)
- [ ] `/src/app/api/cron/check-membership-expiry/route.ts` - Expiry reminder
- [ ] `/src/app/api/admin/users/[userId]/transactions/[id]/[action]/route.ts` - Payment confirmation
- [ ] `/src/app/api/admin/credit/topup/route.ts` - Credit top up success

### Priority 3 (Additional Features)
- [ ] Event reminder emails
- [ ] Payout notification emails
- [ ] Upgrade prompts

## 🎯 Example: Update Registration Email

### Before (Hardcoded)
```typescript
// /src/app/api/auth/register/route.ts
await mailketing.sendEmail({
  to: email,
  subject: 'Selamat Datang di EksporYuk!',
  html: `
    <div>
      <h1>Halo ${name}!</h1>
      <p>Selamat datang di EksporYuk...</p>
    </div>
  `
})
```

### After (Template System)
```typescript
// /src/app/api/auth/register/route.ts
import { sendBrandedEmail } from '@/lib/email-template-helper'

await sendBrandedEmail(
  email,
  'welcome-email',
  {
    userName: name,
    dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`
  }
)
```

### Benefits
✅ Admin bisa edit email tanpa deploy code
✅ Consistent branding across all emails
✅ Easy A/B testing dengan buat versi baru
✅ Variables validation built-in
✅ Email logging untuk analytics

## 🧪 Testing Checklist

- [ ] List all templates via API
- [ ] Preview template dengan sample variables
- [ ] Send test email ke email sendiri
- [ ] Check received email formatting
- [ ] Verify all variables replaced correctly
- [ ] Test dengan missing variables (should handle gracefully)
- [ ] Test inactive template (should fail)
- [ ] Test non-existent template (should fail)

## 📈 Next Steps

1. **Week 1**: Update high-traffic emails (register, payment)
2. **Week 2**: Update membership-related emails
3. **Week 3**: Update event and reminder emails
4. **Week 4**: Add analytics and tracking

## 🔍 Debugging

### Check Template Exists
```bash
curl "https://app.eksporyuk.com/api/admin/templates?action=get&slug=welcome-email"
```

### Check Variables Required
```bash
curl "https://app.eksporyuk.com/api/admin/templates?action=get&slug=welcome-email" | grep variables
```

### Test Email Sending
```bash
# Check Mailketing config
curl https://app.eksporyuk.com/api/test-email

# Send test template
curl -X POST https://app.eksporyuk.com/api/admin/templates \
  -H "Content-Type: application/json" \
  -d '{"action": "send-test", "slug": "welcome-email", "to": "test@example.com", "variables": {"userName": "Test"}}'
```

## 📚 Documentation

- **Full Report**: `EMAIL_TEMPLATES_REPORT.md` - Audit semua email di system
- **Seeded Templates**: `EMAIL_TEMPLATES_SEEDED.md` - Detail 10 templates yang sudah dibuat
- **Helper Functions**: `/src/lib/email-template-helper.ts` - API documentation

## 🆘 Support

Jika ada issue:
1. Check Mailketing API status via `/api/test-email`
2. Verify template exists dan active
3. Check variables ada semua
4. Review logs di terminal/console
5. Test dengan curl command dulu sebelum integrate

---

**Status**: ✅ System ready - 10 templates created and tested
**Last Updated**: 12 Desember 2025
