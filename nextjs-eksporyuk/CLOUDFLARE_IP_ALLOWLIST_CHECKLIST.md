# ✅ Cloudflare IP Allowlist - Implementation Checklist

## Issue Summary
❌ **Problem:** Users get "IP ALLOWLIST" error when ordering membership  
📍 **Location:** https://eksporyuk.com/payment/va/[transactionId]  
🔧 **Root Cause:** Cloudflare security rules blocking Xendit webhook requests

---

## Quick Implementation Steps

### Phase 1: Access Cloudflare Dashboard (5 min)
- [ ] Go to https://dash.cloudflare.com
- [ ] Select **eksporyuk.com** domain
- [ ] Navigate to **Security → WAF** (or **Security Firewall**)
- [ ] Click **Firewall Rules**

### Phase 2: Create Allow Rules for Xendit (10 min)

**Rule 1: Bypass all security for Xendit webhooks**
```
Priority: 1 (highest)
Name: "Bypass all for Xendit webhooks"
Expression: (ip.src in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/webhooks/xendit")
Action: Bypass
Bypass: [All security features]
```
- [ ] Click **+ Create Rule**
- [ ] Copy expression above
- [ ] Set action to **Bypass (All)**
- [ ] Save

**Rule 2: Allow Xendit IP ranges (general)**
```
Priority: 2
Name: "Allow Xendit IPs"
Expression: ip.src in {"167.99.0.0/17" "206.189.0.0/16"}
Action: Allow
```
- [ ] Click **+ Create Rule**
- [ ] Copy expression above
- [ ] Set action to **Allow**
- [ ] Save

**Rule 3: Protect other APIs with challenge (optional)**
```
Priority: 3
Name: "Challenge non-Xendit API requests"
Expression: (ip.src not in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/")
Action: Challenge
```
- [ ] Click **+ Create Rule**
- [ ] Copy expression above  
- [ ] Set action to **Challenge**
- [ ] Save

### Phase 3: Verify Rules Order (2 min)
- [ ] Rules should be in this order:
  1. Bypass all for Xendit webhooks (Priority 1)
  2. Allow Xendit IPs (Priority 2)
  3. Challenge non-Xendit APIs (Priority 3)

### Phase 4: Clear Cache (2 min)
- [ ] Go to **Caching → Purge Cache**
- [ ] Click **Purge Everything**
- [ ] Wait for purge to complete (shows checkmark)

### Phase 5: Verify Xendit Webhook Settings (5 min)

In **Xendit Dashboard:**
- [ ] Go to **Settings → Webhooks**
- [ ] Verify webhook URL: `https://eksporyuk.com/api/webhooks/xendit`
- [ ] Verify token is set and matches `XENDIT_WEBHOOK_TOKEN` in Vercel env vars
- [ ] Click **"Send Test Webhook"** to verify connectivity

### Phase 6: Check Vercel Environment Variables (3 min)
- [ ] Go to **Vercel → eksporyuk → Settings → Environment Variables**
- [ ] Verify `XENDIT_WEBHOOK_TOKEN` is set
- [ ] If missing, copy from Xendit → Settings → Webhooks
- [ ] Redeploy if changed: `vercel deploy --prod`

---

## Testing Phase

### Test 1: Check Cloudflare Logs (2 min)
```
Cloudflare Dashboard:
1. Security → Events (or WAF → Analytics)
2. Filter by: URL contains "/api/webhooks/xendit"
3. Look for requests from IP starting with "167.99" or "206.189"
4. Status should be "Allowed" not "Blocked"
```
- [ ] Found Xendit requests in logs
- [ ] Status shows "Allowed"

### Test 2: Create Test Payment (5 min)
```
In Xendit Dashboard:
1. Create test invoice
2. Mark as "Paid" manually  
3. Check your app logs to see webhook received
```
- [ ] Invoice created in Xendit
- [ ] Manually mark as paid
- [ ] Check for webhook in logs

### Test 3: End-to-End User Flow (10 min)
```
1. Go to https://eksporyuk.com/checkout/[membership-slug]
2. Login as test user
3. Select membership and price
4. Click "Bayar Sekarang"
5. Complete payment on Xendit page
6. Wait for webhook callback
7. Should see "Aktivasi Berhasil" message
```
- [ ] Checkout page loads without errors
- [ ] Payment redirect works
- [ ] User membership activates after payment
- [ ] No "IP ALLOWLIST" error appears

---

## Verification Commands

Run these in terminal to verify:

### Check DNS & SSL
```bash
curl -I https://eksporyuk.com/api/webhooks/xendit

# Should return 405 (Method Not Allowed - POST required)
# NOT 403 (Forbidden), 451, or "access denied"
```

### Test Webhook with curl (simulating Xendit)
```bash
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "X-Callback-Token: YOUR_XENDIT_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event": "invoice.paid", "id": "test", "external_id": "test123", "amount": 100000}'

# Expected: 
# - 200 OK (if signature valid)
# - 401 Unauthorized (if signature invalid - but route WAS reached)
# - NOT 403 Forbidden or "access denied"
```

---

## Rollback Plan

If something breaks, quickly revert:

1. **Go to Cloudflare → Security → Firewall Rules**
2. **Delete the 3 rules you just created**
3. **Clear cache again** (Caching → Purge Everything)
4. **Test** - should revert to previous behavior

---

## Troubleshooting

### Still Getting "IP ALLOWLIST" Error?

**Step 1: Check Cloudflare Events**
```
Cloudflare Dashboard:
Security → Events → Filter "eksporyuk.com"
Look for blocked requests from user IP or Xendit IP
```

**Step 2: Check if Rules Applied**
```
Security → Firewall Rules → Should show 3 rules
All rules should have Status: "Enabled"
```

**Step 3: Clear Cache Completely**
```
Caching → Purge Cache → Purge Everything
Wait 30 seconds before testing again
```

**Step 4: Check Vercel Logs**
```
Vercel Dashboard → eksporyuk → Logs
Watch for any webhook requests
Should see incoming requests from Xendit IPs
```

### Webhook Not Triggering After Allowlist Fix?

**Check Xendit Side:**
1. **Settings → Webhooks** - verify URL correct
2. **Send Test Webhook** - manually test
3. Contact Xendit support if test fails

**Check Your App:**
1. **Vercel logs** - any errors processing webhook?
2. **Database** - is transaction being created?
3. Check `/src/app/api/webhooks/xendit/route.ts` for errors

---

## After Setup Complete

✅ **Verification Checklist:**
- [ ] Cloudflare rules created and enabled
- [ ] Cache cleared
- [ ] Xendit webhook URL registered
- [ ] Xendit webhook token in Vercel env
- [ ] Test user successfully orders membership
- [ ] Membership auto-activates after payment
- [ ] No "IP ALLOWLIST" errors in logs

---

## Documentation

📖 **Full Setup Guide:**  
See `CLOUDFLARE_IP_ALLOWLIST_SETUP.md` for detailed explanations

📖 **Related Files:**
- `/nextjs-eksporyuk/src/app/api/webhooks/xendit/route.ts` - webhook handler
- `/nextjs-eksporyuk/src/lib/xendit.ts` - payment creation
- `.env.example` - environment variables reference

---

## Timeline

⏱️ **Total Implementation Time:** ~30-40 minutes

- Setup Cloudflare rules: 10 min
- Clear cache: 2 min  
- Verify Xendit settings: 5 min
- Check Vercel env vars: 3 min
- Test full flow: 10 min

---

**Last Updated:** 29 December 2024  
**Status:** Ready to implement - No code changes needed! ✨
