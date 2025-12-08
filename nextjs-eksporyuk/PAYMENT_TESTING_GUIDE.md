# 💳 Payment Gateway Testing Guide

**Status:** ✅ Ready for Testing  
**Created:** November 25, 2025  
**Priority:** CRITICAL (Required before production launch)

---

## 📋 OVERVIEW

Guide lengkap untuk test payment flow menggunakan Xendit dalam TEST mode dan LIVE mode.

---

## 🎯 TESTING PHASES

### Phase 1: TEST MODE (Development)
**Timeline:** 1-2 hari  
**Goal:** Verify payment logic & webhook integration

### Phase 2: LIVE MODE (Pre-Production)
**Timeline:** 1 hari  
**Goal:** Test dengan real payment (nominal kecil)

### Phase 3: PRODUCTION
**Timeline:** Ongoing  
**Goal:** Monitor & handle real transactions

---

## 🧪 PHASE 1: TEST MODE TESTING

### Prerequisites

1. **Xendit Account (TEST mode)**
   ```
   https://dashboard.xendit.co/
   Login → Switch to TEST mode
   ```

2. **Get TEST API Keys**
   ```
   Settings → Developers → API Keys
   Copy:
   - API Key (xnd_development_xxx)
   - Secret Key
   - Webhook Token
   ```

3. **Configure Environment**
   ```env
   # .env.local (untuk testing)
   XENDIT_API_KEY="xnd_development_xxxx"
   XENDIT_SECRET_KEY="test_secret_xxxx"
   XENDIT_WEBHOOK_TOKEN="test_webhook_token_xxxx"
   ```

### Setup Ngrok (untuk webhook testing)

```bash
# Install ngrok
choco install ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Configure Webhook in Xendit Dashboard

1. Go to: `Settings → Webhooks`
2. Add webhook URL:
   ```
   https://abc123.ngrok.io/api/webhooks/xendit
   ```
3. Select events:
   - ✅ Invoice paid
   - ✅ Virtual account paid
   - ✅ E-wallet payment completed
   - ✅ Payment request succeeded
4. Set verification token (sama dengan XENDIT_WEBHOOK_TOKEN)

---

## 🚀 RUN AUTOMATED TEST

```bash
cd nextjs-eksporyuk

# Method 1: Using test script
node test-xendit-payment.js

# Method 2: Manual testing via app
npm run dev
# Navigate to: http://localhost:3000/checkout
```

### Test Script Features

- ✅ Interactive prompts untuk test setup
- ✅ Simulate transaction creation
- ✅ Generate Virtual Account
- ✅ Simulate payment webhook
- ✅ Verify database changes
- ✅ Check email notifications

---

## 📱 MANUAL TESTING FLOW

### 1. Create Transaction (via App)

```
1. Login ke aplikasi
2. Navigate ke halaman membership/course/product
3. Click "Beli" / "Daftar"
4. Pilih payment method (Virtual Account)
5. Pilih bank (BCA recommended untuk testing)
6. Click "Bayar"
```

**Expected Result:**
- ✅ Transaction created (status: PENDING)
- ✅ VA number generated
- ✅ Payment page displayed
- ✅ Instructions shown

### 2. Simulate Payment (TEST Mode)

**Option A: Via Xendit Dashboard**
```
1. Go to: https://dashboard.xendit.co/transactions
2. Find your transaction (search by external_id)
3. Click "Simulate Payment"
4. Click "Mark as Paid"
```

**Option B: Via API (Advanced)**
```bash
# Simulate VA payment
curl -X POST https://api.xendit.co/callback_virtual_accounts/va_id/simulate_payment \
  -u xnd_development_xxx: \
  -d amount=100000

# Check webhook was sent
# Check your ngrok dashboard: http://127.0.0.1:4040
```

### 3. Verify Webhook Received

**Check Logs:**
```bash
# Server logs should show:
# [Xendit Webhook] Event received: va.payment.complete
# [Xendit Webhook] ✅ Transaction updated to SUCCESS
# [Xendit Webhook] ✅ UserMembership created
```

**Check Ngrok Dashboard:**
```
http://127.0.0.1:4040/inspect/http
# Should see POST request to /api/webhooks/xendit
# Status: 200 OK
```

**Check Xendit Dashboard:**
```
Settings → Webhooks → Event Logs
# Should see successful webhook delivery
```

### 4. Verify Database Changes

```sql
-- Check transaction status
SELECT id, status, paidAt, paymentMethod 
FROM "Transaction" 
WHERE externalId = 'your_external_id';
-- Expected: status = 'SUCCESS', paidAt = timestamp

-- Check membership activation (if membership purchase)
SELECT * FROM "UserMembership" 
WHERE transactionId = 'your_transaction_id';
-- Expected: isActive = true, status = 'ACTIVE'

-- Check group membership (if membership purchase)
SELECT gm.*, g.name 
FROM "GroupMember" gm
JOIN "Group" g ON g.id = gm.groupId
WHERE gm.userId = 'your_user_id';
-- Expected: User joined membership groups

-- Check course enrollment (if membership purchase)
SELECT ce.*, c.title 
FROM "CourseEnrollment" ce
JOIN "Course" c ON c.id = ce.courseId
WHERE ce.userId = 'your_user_id';
-- Expected: User enrolled in membership courses

-- Check revenue distribution (if membership purchase)
SELECT * FROM "PendingRevenue" 
WHERE transactionId = 'your_transaction_id';
-- Expected: Revenue splits created (founder 60%, cofounder 40%, company 15%, affiliate 10%)
```

### 5. Verify User Experience

**Login as customer:**
```
1. Check dashboard → Membership aktif
2. Check access to groups (membership groups visible)
3. Check access to courses (dapat akses)
4. Check email inbox:
   - ✅ Payment success email
   - ✅ Membership activation email (if membership)
5. Check WhatsApp (if configured):
   - ✅ Payment notification
```

---

## 🏦 TEST SCENARIOS

### Scenario 1: Membership Purchase (PRO)

**Steps:**
1. Select "Membership PRO" (Rp 100,000)
2. Pilih VA BCA
3. Get VA number
4. Simulate payment
5. Verify webhook

**Expected:**
- ✅ Transaction SUCCESS
- ✅ UserMembership ACTIVE
- ✅ Joined 2-3 groups
- ✅ Enrolled in 3+ courses
- ✅ Revenue distributed (founder 60K, cofounder 40K, company 15K)
- ✅ Email sent

### Scenario 2: Membership Purchase (LIFETIME)

**Steps:**
1. Select "Membership LIFETIME" (Rp 1,500,000)
2. Pilih VA Mandiri
3. Get VA number
4. Simulate payment

**Expected:**
- ✅ Transaction SUCCESS
- ✅ UserMembership ACTIVE (endDate = 100 years)
- ✅ All groups accessible
- ✅ All courses accessible
- ✅ Revenue distributed

### Scenario 3: Course Purchase

**Steps:**
1. Select course (e.g., "Ekspor 101")
2. Click "Beli Kursus"
3. Pilih VA BNI
4. Simulate payment

**Expected:**
- ✅ Transaction SUCCESS
- ✅ CourseEnrollment created
- ✅ Progress = 0%
- ✅ Can access lessons
- ✅ Affiliate commission (if applicable)

### Scenario 4: Payment with Affiliate Link

**Steps:**
1. Get affiliate link: `/go/affiliate123?ref=membership-pro`
2. Use link to purchase membership
3. Complete payment

**Expected:**
- ✅ Affiliate tracked in transaction metadata
- ✅ Commission 10% created in PendingRevenue
- ✅ Affiliate wallet updated

### Scenario 5: Payment Expired

**Steps:**
1. Create transaction
2. Wait 24 hours (or simulate expiry)
3. Try to pay → should fail

**Expected:**
- ✅ Transaction status = 'FAILED'
- ✅ Webhook: invoice.expired received
- ✅ User can create new transaction

### Scenario 6: Webhook Failure Recovery

**Steps:**
1. Stop server (simulate downtime)
2. Make payment
3. Webhook fails (Xendit retries)
4. Start server
5. Xendit re-sends webhook

**Expected:**
- ✅ Webhook received on retry
- ✅ Transaction updated correctly
- ✅ No duplicate activations

---

## 🔴 PHASE 2: LIVE MODE TESTING

### ⚠️ CRITICAL PREPARATION

**Before switching to LIVE mode:**
- [ ] All TEST mode tests passing
- [ ] Database schema stable
- [ ] Backup database
- [ ] Prepare untuk real payment (gunakan nominal kecil!)
- [ ] Team ready to monitor

### Activate LIVE Mode

1. **Xendit Business Verification**
   ```
   Dashboard → Settings → Business Profile
   Upload:
   - KTP pemilik bisnis
   - NPWP perusahaan
   - Akta pendirian (jika PT/CV)
   - SIUP/NIB (optional)
   
   Submit → Wait 1-3 hari kerja
   ```

2. **Get LIVE API Keys**
   ```
   Settings → Developers → API Keys
   Switch to: LIVE mode
   
   Copy:
   - API Key (xnd_production_xxx)
   - Secret Key
   - Webhook Token
   ```

3. **Update Production Environment**
   ```env
   # .env.production
   XENDIT_API_KEY="xnd_production_xxxx"  # ⚠️ LIVE KEY!
   XENDIT_SECRET_KEY="live_secret_xxxx"
   XENDIT_WEBHOOK_TOKEN="live_webhook_token_xxxx"
   ```

4. **Update Webhook URL (Production)**
   ```
   Settings → Webhooks
   URL: https://eksporyuk.com/api/webhooks/xendit
   ```

### Test with Real Payment (Small Amount)

**⚠️ USE PERSONAL ACCOUNT - SMALL AMOUNT!**

```
1. Create membership transaction (Rp 1.000 - minimum)
2. Get VA number
3. Pay from your personal bank account
4. Wait 1-5 minutes for webhook
5. Verify activation
6. Request refund if needed (Xendit dashboard)
```

**Verification Checklist:**
- [ ] Payment received (check bank notification)
- [ ] Webhook received within 5 minutes
- [ ] Transaction status updated
- [ ] Membership activated
- [ ] Email sent
- [ ] User can access features
- [ ] Revenue distribution correct
- [ ] No errors in logs

---

## 🛡️ SECURITY TESTING

### Test 1: Invalid Webhook Token

```bash
# Send webhook with wrong token
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: WRONG_TOKEN" \
  -d '{"event":"va.payment.complete","external_id":"test_123"}'

# Expected: 401 Unauthorized
```

### Test 2: Replay Attack

```bash
# Send same webhook twice
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: VALID_TOKEN" \
  -d '{"event":"va.payment.complete","external_id":"already_paid_123"}'

# Expected: 200 OK (idempotent - no duplicate activation)
```

### Test 3: Invalid Transaction ID

```bash
# Send webhook for non-existent transaction
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "x-callback-token: VALID_TOKEN" \
  -d '{"event":"va.payment.complete","external_id":"non_existent_id"}'

# Expected: 200 OK (logged, but no action taken)
```

---

## 📊 MONITORING CHECKLIST

**During First 24 Hours of LIVE Mode:**

- [ ] Check every transaction in Xendit dashboard
- [ ] Monitor webhook success rate (target: >99%)
- [ ] Check server logs for errors
- [ ] Verify all activations correct
- [ ] Monitor email delivery rate
- [ ] Check user complaints (jika ada)
- [ ] Verify revenue splits accurate
- [ ] Test refund process (if needed)

**Tools:**
- Xendit Dashboard: https://dashboard.xendit.co/
- Server logs: `tail -f logs/app.log`
- Database queries: Check transaction counts
- Email service: Check delivery rate

---

## 🆘 TROUBLESHOOTING

### Issue: Webhook Not Received

**Symptoms:**
- Payment completed (confirmed in bank)
- Transaction still PENDING
- No webhook in logs

**Solutions:**
1. Check webhook URL in Xendit dashboard
2. Check firewall/security group (allow Xendit IPs)
3. Check server logs for errors
4. Manually trigger webhook from dashboard
5. Check Xendit webhook logs for failures

### Issue: Membership Not Activated

**Symptoms:**
- Transaction status = SUCCESS
- UserMembership not created

**Solutions:**
1. Check webhook handler logs
2. Verify membershipId in transaction metadata
3. Check database constraints (unique indexes)
4. Manually activate via admin panel
5. Check for errors in revenue distribution

### Issue: Double Activation

**Symptoms:**
- Webhook received twice
- Duplicate group memberships
- Duplicate revenue entries

**Solutions:**
1. Add idempotency checks (check if already processed)
2. Use database transactions
3. Check for duplicate webhook sends in Xendit logs
4. Clean up duplicates manually if needed

### Issue: Email Not Sent

**Symptoms:**
- Activation successful
- No email received

**Solutions:**
1. Check Mailketing API key configured
2. Check email queue/logs
3. Check spam folder
4. Verify email template rendering
5. Test email service separately

---

## ✅ SUCCESS CRITERIA

**TEST Mode (Phase 1) PASS if:**
- ✅ All 6 scenarios passing
- ✅ Webhook success rate: 100%
- ✅ No database errors
- ✅ Email notifications working
- ✅ Revenue splits accurate
- ✅ No security vulnerabilities found

**LIVE Mode (Phase 2) PASS if:**
- ✅ Real payment processed correctly
- ✅ Webhook received within 5 minutes
- ✅ Activation immediate
- ✅ User can access features
- ✅ Email delivered
- ✅ Zero errors in logs

**PRODUCTION READY if:**
- ✅ TEST mode passed
- ✅ LIVE mode test passed (at least 1 real transaction)
- ✅ Team trained on monitoring
- ✅ Rollback plan ready
- ✅ Customer support prepared

---

## 📞 SUPPORT

**Xendit Support:**
- Email: support@xendit.co
- Dashboard: https://dashboard.xendit.co/support
- Docs: https://docs.xendit.co

**Internal:**
- Developer: [Your contact]
- DevOps: [Contact]
- Customer Support: [Contact]

---

**Last Updated:** November 25, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing
