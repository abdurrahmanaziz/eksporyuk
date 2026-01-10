# 🚀 Quick Start - IP Allowlist Fix

## The Error
```
User trying to order membership → Payment completes → 
Webhook blocked by Cloudflare → Membership not activated → 
Error: "IP ALLOWLIST" appears
```

## The Fix (3 Steps)

### 1️⃣ Cloudflare Firewall Rules
**Go:** Cloudflare Dashboard → Security → Firewall Rules

**Add these 3 rules:**

| # | Name | Expression | Action |
|---|------|-----------|--------|
| 1 | Bypass Xendit | `(ip.src in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/webhooks/xendit")` | Bypass all |
| 2 | Allow Xendit | `ip.src in {"167.99.0.0/17" "206.189.0.0/16"}` | Allow |
| 3 | Challenge APIs | `(ip.src not in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/")` | Challenge |

**Then:** Clear cache → Caching → Purge Everything

### 2️⃣ Xendit Configuration
**Go:** Xendit Dashboard → Settings → Webhooks

**Verify:**
- ✅ URL: `https://eksporyuk.com/api/webhooks/xendit`
- ✅ Webhook token → Copy it
- ✅ Test webhook → Send test

### 3️⃣ Vercel Environment
**Go:** Vercel → Settings → Environment Variables

**Set:**
```
XENDIT_WEBHOOK_TOKEN = [paste from Xendit]
```

**Then:** Deploy → `vercel deploy --prod`

---

## Test It

```bash
# Should NOT be blocked
curl -I https://eksporyuk.com/api/webhooks/xendit
# Expected: 405 (not 403)

# Send test webhook
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "X-Callback-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event":"invoice.paid","id":"test","external_id":"test","amount":100000}'
# Expected: 200 OK or 401 (not 403)
```

---

## It's Fixed When:

✅ User orders membership  
✅ Redirected to Xendit payment (no errors)  
✅ Payment completes  
✅ Webhook received by your server  
✅ Membership auto-activates  
✅ User sees success message  

---

## Detailed Guides

- 📖 **XENDIT_WEBHOOK_COMPLETE_SETUP.md** ← START HERE
- 📖 **CLOUDFLARE_IP_ALLOWLIST_SETUP.md** ← Full reference
- 📖 **CLOUDFLARE_IP_ALLOWLIST_CHECKLIST.md** ← Step checklist
- 📖 **IP_ALLOWLIST_ERROR_SOLUTION.md** ← Full explanation

---

## Common Issues

### "Still getting IP ALLOWLIST error"
```
1. Verify rules added in Cloudflare
2. Clear cache (Purge Everything)
3. Wait 5 minutes
4. Try again
```

### "Webhook not arriving"
```
1. Check Xendit → Settings → Webhooks → Logs
2. Should show successful delivery (2xx)
3. If not, Cloudflare is still blocking it
```

### "Membership not activating"
```
1. Check Vercel logs (eksporyuk → Logs)
2. Look for "[Xendit Webhook]" messages
3. Check database transaction status
```

---

⏱️ **Time to implement:** 30-40 minutes  
✅ **Status:** Ready now  
🎯 **Result:** Users can order memberships successfully
