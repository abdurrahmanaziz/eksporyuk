# BRANDED TEMPLATE SYSTEM - QUICK REFERENCE

## API Endpoints Summary

### 📥 Public API
```
GET /api/branded-templates
  → List active templates for user's role
  → No auth required (but respects user role)
```

### 🔐 Admin APIs (All require ADMIN role)

```
GET /api/admin/branded-templates
  → List all templates with pagination
  Query: page, limit, sortBy, order, category, type, isActive, search
  
POST /api/admin/branded-templates
  → Create new template
  Body: name, category, type, subject, content, description, priority, roleTarget
  
GET /api/admin/branded-templates/[id]
  → Get single template
  
PUT /api/admin/branded-templates/[id]
  → Update template
  
DELETE /api/admin/branded-templates/[id]
  → Soft-delete (mark inactive)
  
POST /api/admin/branded-templates/test
  → Test template: render + send email
  Body: templateId|slug, testData (optional), recipientEmail (optional)
  
POST /api/admin/branded-templates/render
  → Preview template HTML only (no email)
  Body: templateId|slug, variables (optional)
  
GET /api/admin/branded-templates/categories
  → Get all metadata (categories, types, roles, shortcodes, priorities)
  
POST /api/admin/branded-templates/migrate
  → Initialize default templates
  Body: {} (empty)
```

---

## Categories (8)

| Code | Name | Icon | Uses | Default Count |
|------|------|------|------|--------|
| SYSTEM | System Templates | ⚙️ | Verification, password reset, welcome | 3 |
| MEMBERSHIP | Membership | 👤 | Activation, renewal reminders | 2 |
| AFFILIATE | Affiliate | 💼 | Registration, commissions | 2 |
| COURSE | Course | 📚 | Enrollment, completion, certificates | 0 |
| PAYMENT | Payment | 💳 | Invoices, receipts | 2 |
| MARKETING | Marketing | 📢 | Promotions, announcements | 1 |
| NOTIFICATION | Notification | 🔔 | System alerts, maintenance | 1 |
| TRANSACTION | Transaction | 💰 | Withdrawals, wallet updates | 0 |

---

## Types (4)

```
EMAIL       - Email messages (unlimited length)
WHATSAPP    - WhatsApp messages (4096 chars)
SMS         - SMS messages (160 chars)
PUSH        - Push notifications (240 chars)
```

---

## Key Variables by Category

### SYSTEM
```
{code}           - Verification/reset code
{url}            - Action URL
{name}           - User name
{email}          - User email
{date}           - Current date
```

### MEMBERSHIP
```
{membershipType} - Premium/Standard/Basic
{startDate}      - Activation date
{endDate}        - Expiration date
{benefits}       - Formatted benefits list
{daysRemaining}  - Days until expiry
```

### AFFILIATE
```
{affiliateStatus}    - Active/pending/rejected
{totalCommission}    - Total earned (formatted)
{commissionRate}     - Rate percentage
{renewalUrl}         - Renew link
{totalReferrals}     - Number of referrals
```

### PAYMENT
```
{amount}         - Transaction amount
{invoiceNumber}  - Invoice reference
{dueDate}        - Payment due date
{paymentUrl}     - Payment link
{currency}       - IDR/USD/etc
```

### MARKETING
```
{productName}    - Product being promoted
{discountPercent}- Discount percentage
{offerUrl}       - Promotion URL
{expiryDate}     - Offer expiration
```

---

## Default Templates (11)

1. **email-verification** (SYSTEM, EMAIL)
   - Variables: {code}, {url}, {name}
   - Subject: "Verifikasi Email Anda - EksporYuk"

2. **password-reset** (SYSTEM, EMAIL)
   - Variables: {url}, {name}
   - Subject: "Reset Password - EksporYuk"

3. **welcome-new-user** (SYSTEM, EMAIL)
   - Variables: {name}, {url}
   - Subject: "Selamat Datang di EksporYuk!"

4. **membership-activated** (MEMBERSHIP, EMAIL)
   - Variables: {name}, {membershipType}, {startDate}, {endDate}, {benefits}, {url}
   - Subject: "Selamat! Member {membershipType} Anda Aktif"

5. **membership-renewal-reminder** (MEMBERSHIP, EMAIL)
   - Variables: {name}, {endDate}, {daysUntilExpiry}, {renewalUrl}
   - Subject: "Perpanjangan Membership - {daysUntilExpiry} Hari Lagi"

6. **affiliate-registered** (AFFILIATE, EMAIL)
   - Variables: {name}, {dashboardUrl}
   - Subject: "Pendaftaran Affiliate Berhasil"

7. **commission-received** (AFFILIATE, EMAIL)
   - Variables: {name}, {commissionAmount}, {date}, {totalEarnings}, {dashboardUrl}, {withdrawalUrl}
   - Subject: "Komisi Anda Telah Masuk - Rp {commissionAmount}"

8. **invoice-created** (PAYMENT, EMAIL)
   - Variables: {name}, {invoiceNumber}, {amount}, {dueDate}, {itemDescription}, {paymentUrl}
   - Subject: "Invoice #{invoiceNumber} - Rp {amount}"

9. **payment-success** (PAYMENT, EMAIL)
   - Variables: {name}, {invoiceNumber}, {amount}, {date}, {url}
   - Subject: "Pembayaran Berhasil - Invoice #{invoiceNumber}"

10. **flash-sale-announcement** (MARKETING, EMAIL)
    - Variables: {name}, {productName}, {discountPercent}, {expiryDate}, {offerUrl}
    - Subject: "⚡ FLASH SALE - Diskon {discountPercent}%"

11. **system-maintenance** (NOTIFICATION, EMAIL)
    - Variables: {name}, {maintenanceTime}, {estimatedDuration}, {affectedFeatures}
    - Subject: "🔧 Maintenance Terjadwal"

---

## Common Tasks

### Create a new template
```bash
curl -X POST https://eksporyuk.com/api/admin/branded-templates \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Template",
    "category": "MEMBERSHIP",
    "type": "EMAIL",
    "subject": "Hello {name}!",
    "content": "This is template with {variable}",
    "description": "Template description",
    "priority": "HIGH",
    "roleTarget": ["MEMBER_PREMIUM", "MEMBER_FREE"]
  }'
```

### Test a template
```bash
curl -X POST https://eksporyuk.com/api/admin/branded-templates/test \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "welcome-new-user",
    "testData": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "recipientEmail": "admin@eksporyuk.com"
  }'
```

### Preview template HTML
```bash
curl -X POST https://eksporyuk.com/api/admin/branded-templates/render \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "welcome-new-user",
    "variables": {
      "name": "John Doe"
    }
  }'
```

### Get metadata for UI
```bash
curl -X GET https://eksporyuk.com/api/admin/branded-templates/categories \
  -H "Authorization: Bearer TOKEN"
```

### List templates
```bash
curl -X GET "https://eksporyuk.com/api/admin/branded-templates?category=MEMBERSHIP&type=EMAIL" \
  -H "Authorization: Bearer TOKEN"
```

### Initialize default templates
```bash
curl -X POST https://eksporyuk.com/api/admin/branded-templates/migrate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Integration Points

### When sending emails elsewhere in code
```typescript
import { sendBrandedEmail } from '@/lib/branded-template-helpers'

// Send using template
await sendBrandedEmail({
  templateSlug: 'welcome-new-user',
  recipient: {
    email: 'user@example.com',
    name: 'John Doe'
  },
  variables: {
    url: 'https://example.com/dashboard'
  }
})
```

### When sending WhatsApp elsewhere in code
```typescript
import { sendBrandedWhatsApp } from '@/lib/branded-template-helpers'

// Send using template
await sendBrandedWhatsApp({
  templateSlug: 'commission-received',
  recipientPhone: '+62812345678',
  variables: {
    name: 'John Doe',
    commissionAmount: '1000000'
  }
})
```

---

## Database Schema

### BrandedTemplate
```
id              TEXT PRIMARY KEY
createdAt       DATETIME
updatedAt       DATETIME
name            TEXT (required)
slug            TEXT UNIQUE
category        ENUM (8 types)
type            ENUM (4 types)
subject         TEXT
content         TEXT
description     TEXT
priority        ENUM (LOW, NORMAL, HIGH, URGENT)
isDefault       BOOLEAN
isSystem        BOOLEAN
isActive        BOOLEAN
sendCount       INT (default 0)
lastSentAt      DATETIME
variables       JSON (optional)
roleTarget      ARRAY (roles)
createdBy       TEXT (User FK)
```

### EmailNotificationLog
```
id              TEXT PRIMARY KEY
createdAt       DATETIME
templateId      TEXT (FK)
recipientId     TEXT (FK User)
recipientEmail  TEXT
status          ENUM (sent, failed, bounced)
sentAt          DATETIME
error           TEXT (optional)
```

### BrandedTemplateUsage
```
id              TEXT PRIMARY KEY
templateId      TEXT UNIQUE (FK)
usageCount      INT
lastUsed        DATETIME
context         JSON (metadata)
```

---

## Production Status

✅ **All Endpoints Live**: https://eksporyuk.com  
✅ **Default Templates**: 11 templates seeded  
✅ **Admin UI**: Fully functional  
✅ **Integrations**: Mailketing, Starsender, Pusher, OneSignal  
✅ **Documentation**: Complete (50+ variables documented)

---

## Troubleshooting

**"Template not found"**: Check slug is correct (case-sensitive)  
**"Unauthorized"**: Verify user is ADMIN role  
**"Email not sending"**: Check MAILKETING_API_KEY in env vars  
**"Variable not replaced"**: Ensure variable name matches exactly, in {curlyBraces}  

---

**Last Updated**: January 2025  
**System Status**: ✅ Production Ready
