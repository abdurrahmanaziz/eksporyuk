# 🚀 Production Checklist - Ekspor Yuk Sales System

## Status: Ready for Development → Production

---

## ✅ SUDAH SELESAI

### 1. Core Sales System
- ✅ Sales Page (`/sales/[slug]`) dengan design responsif
- ✅ Checkout API terintegrasi dengan database
- ✅ Payment Page dengan multiple methods
- ✅ Success Page dengan onboarding flow
- ✅ Member Dashboard lengkap

### 2. Xendit Integration
- ✅ Xendit SDK installed (`xendit-node`)
- ✅ Xendit Service Library (`/lib/xendit.ts`)
- ✅ Invoice API integration
- ✅ Virtual Account API
- ✅ E-Wallet API
- ✅ Webhook handler untuk payment confirmation

### 3. Dependencies
- ✅ `xendit-node` installed
- ✅ `sonner` untuk toast notifications
- ✅ UI Components (Separator, Progress)

---

## ⚠️ HARUS DISELESAIKAN SEBELUM PRODUCTION

### 1. **DATABASE MIGRATION** 🔴 CRITICAL

#### A. Update Prisma Schema
File: `prisma/schema.prisma`

Tambahkan fields berikut ke model `Transaction`:
```prisma
model Transaction {
  // ... existing fields ...
  
  // Customer information
  customerName      String?
  customerEmail     String?
  customerPhone     String?
  customerWhatsapp  String?
  
  // Payment details
  description       String?
  reference         String?           // Xendit invoice/payment ID
  originalAmount    Decimal?          // Before discount
  notes             String?
  
  // ... rest of fields ...
}
```

Tambahkan fields ke model `UserMembership`:
```prisma
model UserMembership {
  // ... existing fields ...
  
  status            String    @default("PENDING") // PENDING, ACTIVE, EXPIRED
  activatedAt       DateTime?
  price             Decimal?
  
  // ... rest of fields ...
}
```

Tambahkan field ke model `Coupon`:
```prisma
model Coupon {
  // ... existing fields ...
  
  expiresAt         DateTime?    // Coupon expiry date
  
  // ... rest of fields ...
}
```

#### B. Run Migration
```bash
cd nextjs-eksporyuk
npx prisma migrate dev --name add_sales_fields
npx prisma generate
```

#### C. Alternative: Run SQL Migration
Jika tidak bisa run Prisma migrate, jalankan manual SQL:
```bash
# File sudah tersedia di: prisma/migrations/add_sales_fields.sql
# Execute in your SQLite database
```

---

### 2. **ENVIRONMENT VARIABLES** 🔴 CRITICAL

Update `.env.local` dengan credentials real:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="generate-random-secret-here-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Xendit Configuration (DEVELOPMENT)
XENDIT_SECRET_KEY="xnd_development_YOUR_ACTUAL_KEY"
XENDIT_WEBHOOK_TOKEN="YOUR_WEBHOOK_TOKEN"
XENDIT_ENVIRONMENT="development"

# Application
APP_URL="http://localhost:3000"
APP_NAME="Ekspor Yuk"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Get Xendit Credentials:**
1. Daftar di https://dashboard.xendit.co/register
2. Verifikasi akun
3. Ambil API Keys dari Settings > API Keys
4. Generate Webhook Token dari Settings > Webhooks

---

### 3. **FIX TYPE ERRORS** 🟡 IMPORTANT

#### A. Fix authOptions Export
File: `src/app/api/auth/[...nextauth]/route.ts`

Pastikan `authOptions` di-export:
```typescript
export const authOptions = {
  // ... configuration ...
}
```

#### B. Fix Role Type Issues
Ubah semua `role: 'CUSTOMER'` menjadi salah satu dari:
- `MEMBER_FREE`
- `MEMBER_PREMIUM`

Atau tambahkan `CUSTOMER` ke enum Role di Prisma schema.

#### C. Remove Affiliate/AffiliateCommission References
Karena schema menggunakan `AffiliateProfile` bukan `Affiliate`, perlu update:
- Di `src/app/api/checkout/route.ts`
- Ganti `prisma.affiliate` dengan `prisma.affiliateProfile`
- Hapus/comment reference ke `AffiliateCommission` atau buat modelnya

---

### 4. **XENDIT SETUP** 🟡 IMPORTANT

#### Development Testing
1. Daftar Xendit Account (Free)
2. Gunakan test mode credentials
3. Setup webhook URL dengan ngrok/localtunnel:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3000
   
   # Use ngrok URL in Xendit webhook settings
   # Example: https://abc123.ngrok.io/api/webhooks/xendit
   ```

#### Production Setup
1. Lengkapi verifikasi business documents
2. Switch to production API keys
3. Setup production webhook URL:
   ```
   https://yourdomain.com/api/webhooks/xendit
   ```
4. Configure webhook events:
   - ✅ invoice.paid
   - ✅ invoice.expired  
   - ✅ virtual_account.payment
   - ✅ ewallet.capture.completed

---

### 5. **CODE FIXES** 🟡 IMPORTANT

#### A. Fix Payment Page JSX Syntax
File: `src/app/checkout/payment/[transactionId]/page.tsx`

Lines 365-396 ada syntax error. Perlu fix conditional rendering.

#### B. Remove Unused Imports
Clean up imports yang tidak digunakan untuk menghindari warnings.

---

### 6. **TESTING REQUIREMENTS** 🟢 RECOMMENDED

#### A. Unit Tests
- [ ] Test checkout API dengan berbagai scenarios
- [ ] Test webhook handler
- [ ] Test payment methods
- [ ] Test membership activation

#### B. Integration Tests  
- [ ] End-to-end checkout flow
- [ ] Payment confirmation flow
- [ ] Webhook processing

#### C. Manual Testing Checklist
- [ ] Buka sales page `/sales/membership-lifetime`
- [ ] Isi form checkout
- [ ] Submit dan verify transaction created
- [ ] Redirect ke payment page
- [ ] Test Xendit invoice redirect (if enabled)
- [ ] Test webhook dengan Xendit test payment
- [ ] Verify membership activated
- [ ] Check member dashboard access

---

### 7. **SECURITY** 🟢 RECOMMENDED

- [ ] Validate all user inputs
- [ ] Sanitize customer data
- [ ] Implement rate limiting on APIs
- [ ] Add CORS protection
- [ ] Implement transaction idempotency
- [ ] Add webhook signature verification (already done)
- [ ] Encrypt sensitive data in metadata
- [ ] Add SQL injection protection (Prisma handles this)

---

### 8. **PERFORMANCE** 🟢 RECOMMENDED

- [ ] Add database indexes (partially done)
- [ ] Implement caching for sales pages
- [ ] Optimize images (use Next.js Image component)
- [ ] Add loading states everywhere
- [ ] Implement error boundaries
- [ ] Add request timeouts

---

### 9. **MONITORING** 🟢 RECOMMENDED

- [ ] Setup error tracking (Sentry)
- [ ] Setup analytics (Google Analytics/Mixpanel)
- [ ] Log all payment transactions
- [ ] Monitor webhook failures
- [ ] Setup alerting for failed payments
- [ ] Track conversion rates

---

### 10. **DOCUMENTATION** 🟢 RECOMMENDED

- [x] Xendit setup guide (`XENDIT_SETUP.md`)
- [ ] API documentation
- [ ] User guide untuk admin
- [ ] Troubleshooting guide
- [ ] Deployment guide

---

## 🎯 QUICK START GUIDE

### For Development
```bash
# 1. Install dependencies
cd nextjs-eksporyuk
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local dengan credentials Anda

# 3. Run database migration
npx prisma migrate dev
npx prisma generate

# 4. Start development server
npm run dev

# 5. Test sales page
# Open: http://localhost:3000/sales/membership-lifetime
```

### For Production
```bash
# 1. Update .env.local dengan production credentials

# 2. Run production build
npm run build

# 3. Test build locally
npm run start

# 4. Deploy ke hosting
# (Vercel, Netlify, atau custom server)
```

---

## ❌ KNOWN ISSUES

### Critical Issues (Must Fix)
1. **Database schema mismatch** - Need migration
2. **Type errors in checkout API** - Field mismatches
3. **JSX syntax error in payment page** - Conditional rendering

### Non-Critical Issues  
1. SalesFilterDialog prop type error (doesn't affect sales system)
2. Some unused imports warnings
3. Node version warning (still works)

---

## 📝 PRODUCTION DEPLOYMENT STEPS

1. **Pre-deployment**
   - [ ] Run all tests
   - [ ] Fix all critical errors
   - [ ] Update environment variables
   - [ ] Run database migration
   - [ ] Build locally and test

2. **Deployment**
   - [ ] Deploy to staging first
   - [ ] Test all payment flows
   - [ ] Verify webhook handling
   - [ ] Load testing (optional)
   - [ ] Deploy to production

3. **Post-deployment**
   - [ ] Monitor error logs
   - [ ] Test production checkout
   - [ ] Verify Xendit webhook
   - [ ] Check database connections
   - [ ] Monitor first transactions

---

## 🆘 SUPPORT & RESOURCES

### Documentation
- Xendit Docs: https://docs.xendit.co
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

### Get Help
- Xendit Support: support@xendit.co
- Prisma Discord: https://pris.ly/discord

---

## 📊 ESTIMATED TIME TO PRODUCTION

- **Database Migration**: 30 minutes
- **Fix Type Errors**: 1-2 hours
- **Xendit Setup**: 1 hour
- **Testing**: 2-3 hours
- **Deployment**: 1 hour

**Total**: ~6-8 hours of focused work

---

**Last Updated**: November 19, 2025
**Status**: Development → Ready for Production (after fixes)
**Priority**: Database Migration > Type Fixes > Xendit Setup > Testing