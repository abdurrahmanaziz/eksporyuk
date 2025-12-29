# 🔌 Xendit Webhook Configuration - Complete Setup

## Overview

The "IP ALLOWLIST" error occurs because Cloudflare doesn't know Xendit should be allowed to send webhook requests to your server. This guide shows exactly how to configure Xendit and Cloudflare to work together.

---

## Part 1: Xendit Dashboard Setup

### Step 1: Register Webhook URL

1. **Go to Xendit Dashboard**  
   → https://dashboard.xendit.co

2. **Navigate to Settings → Webhooks**  
   ![Screenshot: Settings → Webhooks]

3. **Add Webhook URL**
   ```
   Webhook URL: https://eksporyuk.com/api/webhooks/xendit
   ```

4. **Select Events to Enable**
   - ✅ Invoice paid (`invoice.paid`)
   - ✅ Invoice expired (`invoice.expired`)  
   - ✅ Virtual Account paid (`va.payment.complete`)
   - ✅ Payment request succeeded (`payment_request.succeeded`)
   - ✅ E-Wallet completed (`ewallet.capture.completed`)
   - ⚠️ You can disable: payment failed, disputed, etc. (optional)

5. **Copy Webhook Token**
   - **Click the copy button** next to your URL
   - This is your `XENDIT_WEBHOOK_TOKEN`
   - Save it safely

### Step 2: Verify IP Whitelist (Xendit Side)

Xendit doesn't have a user-facing IP whitelist, but they maintain these outgoing IPs:

**Xendit Webhook Sending IPs:**
- `167.99.0.0/17` (Primary - DigitalOcean Singapore)
- `206.189.0.0/16` (Secondary - DigitalOcean)
- `1.179.0.0/16` (AWS Singapore)

These are the IPs that will hit your Cloudflare firewall.

### Step 3: Test Webhook (In Xendit)

1. **Go to Webhooks Settings**
2. **Find your registered URL**
3. **Click "Send Test Webhook"**
   - This sends a sample payment.completion event
   - Should see response status in logs below

---

## Part 2: Cloudflare Configuration

### Step 1: Access Cloudflare Firewall

1. **Go to Cloudflare Dashboard**  
   → https://dash.cloudflare.com

2. **Select your domain**  
   → `eksporyuk.com`

3. **Navigate to Security → Firewall Rules**  
   (or WAF → Firewall Rules depending on your plan)

### Step 2: Create Firewall Rules

#### Rule 1: Bypass all security for Xendit (HIGHEST PRIORITY)

Click **"+ Create Rule"**

```
Name: Bypass all security for Xendit webhooks

Expression (copy exact):
(ip.src in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/webhooks/xendit")

Action: Bypass
Bypass options (select all):
  ☑ Browser Integrity Check
  ☑ Rate Limiting
  ☑ WAF
  ☑ DDoS Protection
  ☑ All additional services
```

Save this rule. It should have **Priority: 1**

#### Rule 2: Allow all Xendit requests

Click **"+ Create Rule"**

```
Name: Allow all Xendit IP requests

Expression (copy exact):
ip.src in {"167.99.0.0/17" "206.189.0.0/16"}

Action: Allow
```

This should have **Priority: 2**

#### Rule 3: Protect other API routes (OPTIONAL but recommended)

Click **"+ Create Rule"**

```
Name: Challenge other API requests

Expression (copy exact):
(ip.src not in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/")

Action: Challenge
```

This should have **Priority: 3**

### Step 3: Verify Rules Order

Go to **Security → Firewall Rules** and verify order:

```
Priority 1: Bypass all security for Xendit webhooks
Priority 2: Allow all Xendit IP requests  
Priority 3: Challenge other API requests (if created)
```

All should be **Enabled** (toggle on).

### Step 4: Clear Cache

1. **Go to Caching → Purge Cache**
2. **Click "Purge Everything"**
3. **Wait for checkmark to appear** (takes 30 seconds)

This ensures your new rules apply immediately.

---

## Part 3: Vercel Environment Variables

### Step 1: Get Webhook Token

From Xendit Dashboard (Settings → Webhooks):
- Copy your webhook token (the long string)

### Step 2: Add to Vercel

1. **Go to Vercel Dashboard**  
   → https://vercel.com/dashboard

2. **Select project: eksporyuk**

3. **Go to Settings → Environment Variables**

4. **Add/Update variable:**
   ```
   Name:  XENDIT_WEBHOOK_TOKEN
   Value: [paste token from Xendit]
   
   Environments: Production (checkmark only)
   ```

5. **Save**

6. **Redeploy:**
   ```bash
   vercel deploy --prod
   ```
   Or use Vercel UI to redeploy.

### Verify in Code

The webhook token is used in `/src/app/api/webhooks/xendit/route.ts`:

```typescript
const webhookToken = config?.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_WEBHOOK_TOKEN

if (webhookToken) {
  const isValid = xenditService.verifyWebhookSignature(webhookToken, rawBody, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
}
```

---

## Part 4: Testing the Integration

### Test 1: Verify Cloudflare Rules (2 min)

```bash
# This should NOT be blocked (should return 405 Method Not Allowed)
curl -I https://eksporyuk.com/api/webhooks/xendit

# Output should be:
# HTTP/2 405 (POST method required - good!)
# NOT 403, 451, or "Access Denied"
```

### Test 2: Manual Webhook Test (3 min)

```bash
# Send test webhook to your endpoint
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "X-Callback-Token: YOUR_XENDIT_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invoice.paid",
    "id": "test-invoice-123",
    "external_id": "test-ext-123",
    "amount": 100000,
    "payment_channel": "VA",
    "paid_amount": 100000,
    "paid_at": "2024-12-29T00:00:00Z"
  }'

# Expected responses:
# 200 OK - webhook processed successfully
# 401 Unauthorized - token invalid (but that's OK - server was reached)
# 500 Internal Error - server error (check logs, but server was reached)
#
# BAD responses (means Cloudflare blocked it):
# 403 Forbidden
# 451 Unavailable For Legal Reasons  
# "Access Denied"
# Connection timeout/refused
```

### Test 3: Xendit "Send Test Webhook" (3 min)

1. **Xendit Dashboard → Settings → Webhooks**
2. **Find your registered URL**
3. **Click "Send Test Webhook"**
4. **Should see "Webhook sent successfully" with response status**

If you get an error like "Connection refused" or "Unable to reach endpoint":
- Your Cloudflare rules might not be applied yet
- Try clearing browser cache (Ctrl+Shift+Del)
- Try after 5 minutes

### Test 4: Full Payment Flow (10 min)

1. **Go to:** https://eksporyuk.com/checkout/[membership-slug]
2. **Login** with test account
3. **Select membership and duration**
4. **Click "Bayar Sekarang"**
5. **You should see Xendit payment page** (no "IP ALLOWLIST" error)
6. **Go back to Xendit page** (or complete payment)
7. **In Xendit Dashboard:**
   - Create test invoice
   - Mark as "Paid"  
8. **Check webhook logs** in Xendit → Settings → Webhooks → [Your URL] → Logs
   - Should show successful delivery
9. **Check your app** - membership should activate
10. **Check Vercel logs** - should see webhook processing logs

---

## Part 5: Monitoring & Troubleshooting

### Where to Check When Something Goes Wrong

#### Xendit Logs
```
Xendit Dashboard → Settings → Webhooks → [Your URL] → View Logs

Shows:
- Request timestamp
- Response code (2xx = success, 4xx/5xx = error)
- Response body
```

#### Cloudflare Events
```
Cloudflare Dashboard → Security → Events

Filter by:
- URL contains "webhooks/xendit"
- IP contains "167.99" or "206.189"

Shows:
- Blocked/Allowed status
- Which rule matched
- Request details
```

#### Vercel Logs
```
Vercel Dashboard → eksporyuk → Logs

Shows real-time console.log output from your API routes

Look for:
- "[Xendit Webhook] Event received"
- "[Xendit Webhook] Invoice paid"
- Any error messages
```

### Common Issues & Fixes

#### ❌ "Connection refused" in Xendit logs

**Cause:** Cloudflare is blocking Xendit's requests  
**Fix:**
1. Verify rules created in Cloudflare
2. Clear Cloudflare cache
3. Wait 5 minutes for DNS to propagate
4. Try Xendit "Send Test Webhook" again

#### ❌ "401 Unauthorized" in Xendit logs

**Cause:** Webhook token mismatch  
**Fix:**
1. Copy webhook token from Xendit again
2. Update in Vercel environment variables
3. Redeploy: `vercel deploy --prod`
4. Wait 2-3 minutes
5. Try again

#### ❌ "500 Internal Server Error" in Xendit logs

**Cause:** Your API has a bug  
**Fix:**
1. Check Vercel logs for error details
2. Look at `/src/app/api/webhooks/xendit/route.ts`
3. Usually related to database query
4. Fix the bug and redeploy

#### ❌ Webhook received but membership not activated

**Cause:** Logic error in webhook handler  
**Fix:**
1. Check database - is transaction status updated?
2. Check Vercel logs - any errors after webhook received?
3. Check user membership record - was it created?
4. Look at the `handleInvoicePaid()` function in webhook route

#### ✅ Everything works but webhook sometimes doesn't arrive

**Cause:** Network hiccup or Xendit timeout  
**Fix:**
1. This is normal - Xendit retries
2. Check Xendit dashboard for retry attempts
3. Your webhook handler should be idempotent (safe to call multiple times)
4. Current code uses `transactionId` as unique key, so safe

---

## Verification Checklist

After setup, verify everything works:

### Server-Side
- [ ] Cloudflare firewall rules created (3 rules)
- [ ] Cloudflare cache cleared
- [ ] Xendit webhook URL registered: `https://eksporyuk.com/api/webhooks/xendit`
- [ ] Xendit webhook token copied to Vercel env vars
- [ ] Vercel redeploy completed

### Testing
- [ ] Curl test passes (405, not 403)
- [ ] Xendit "Send Test Webhook" succeeds
- [ ] Manual webhook curl succeeds (200 or 401)
- [ ] Xendit logs show successful delivery
- [ ] Vercel logs show webhook received
- [ ] Test payment completes without "IP ALLOWLIST" error

### Production
- [ ] Real user can place order
- [ ] Payment page loads without errors
- [ ] Payment completes successfully
- [ ] Webhook delivers and membership activates
- [ ] User sees "Aktivasi Berhasil" message

---

## Reference: Code Changes

No code changes needed! The webhook handler already supports:
- ✅ Signature verification using token
- ✅ Multiple event types
- ✅ Membership activation
- ✅ Email/WhatsApp notifications
- ✅ Commission distribution

Files involved:
- `/src/app/api/webhooks/xendit/route.ts` - webhook handler (no changes)
- `/src/lib/xendit.ts` - payment creation (no changes)
- `/.env` - needs `XENDIT_WEBHOOK_TOKEN` variable (update only)

---

## Support Contacts

### Xendit
- **Status Page:** https://status.xendit.io
- **Support:** https://xendit.readthedocs.io
- **IP Whitelist Docs:** https://xendit.readme.io/reference/ip-whitelisting

### Cloudflare  
- **Dashboard:** https://dash.cloudflare.com
- **Help:** https://support.cloudflare.com

### Your Team
- **Check Vercel logs** at: https://vercel.com/dashboard
- **Check database** via Prisma Studio: `npm run prisma:studio`

---

**Last Updated:** 29 December 2024  
**Status:** ✅ Ready to implement - Step by step guide
