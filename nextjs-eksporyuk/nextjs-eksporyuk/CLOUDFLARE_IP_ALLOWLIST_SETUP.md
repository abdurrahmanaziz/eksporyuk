# 🔒 Cloudflare IP Allowlist Setup Guide

## Problem
User gets "IP ALLOWLIST" error when trying to order membership on `https://eksporyuk.com`. This happens because Cloudflare's security rules are blocking requests.

## Solution
Configure Cloudflare to allow:
1. **Xendit webhook IPs** - for payment callbacks
2. **Xendit API IPs** - for creating invoices
3. **User's ISP IP** - for direct user access (optional, based on your security policy)

---

## Step 1: Get Xendit's IP Ranges

Xendit publishes their IP ranges. You need to whitelist these:

### Xendit API & Webhook IPs (as of 2024)
```
Xendit's IP ranges typically include:
- 167.99.* (DigitalOcean - Primary)
- 159.65.* (DigitalOcean - Secondary)
- 206.189.* (DigitalOcean - Tertiary)
- 1.179.* (AWS/Alternative)
- 52.*.*.* (AWS IP ranges)
```

**Current Xendit IPs (as of Dec 2024):**
- **167.99.0.0/17** (DigitalOcean SG)
- **206.189.0.0/16** (DigitalOcean)

**Note:** For the most current list, contact Xendit support or check their documentation:
https://xendit.readme.io/reference/ip-whitelisting

---

## Step 2: Configure Cloudflare Firewall Rules

### Method A: Using Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Navigate to: **Security → WAF → Firewall rules**

2. **Create Allow Rules for Xendit**
   ```
   Rule 1: Allow Xendit Webhooks
   - Expression: (ip.src in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/webhooks/xendit")
   - Action: Allow
   
   Rule 2: Allow All Xendit IPs (Alternative - less restrictive)
   - Expression: ip.src in {"167.99.0.0/17" "206.189.0.0/16"}
   - Action: Allow
   ```

3. **Create Bypass Rules (Higher Priority)**
   ```
   Rule: Bypass all WAF/Rate limiting for Xendit
   - Expression: ip.src in {"167.99.0.0/17" "206.189.0.0/16"}
   - Action: Bypass (select all security features)
   ```

### Method B: Using Cloudflare API

```bash
# Add Firewall Rule via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/firewall/rules" \
  -H "X-Auth-Email: {EMAIL}" \
  -H "X-Auth-Key: {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "expression": "(ip.src in {\"167.99.0.0/17\" \"206.189.0.0/16\"}) and (http.request.uri.path contains \"/api/webhooks/xendit\")"
    },
    "action": "allow",
    "priority": 1,
    "description": "Allow Xendit webhook requests"
  }'
```

---

## Step 3: Test Configuration

### Test 1: Verify Xendit Can Reach Your Webhook
```bash
# Simulate Xendit webhook from allowed IP
curl -X POST https://eksporyuk.com/api/webhooks/xendit \
  -H "X-Callback-Token: YOUR_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "invoice.paid",
    "id": "test-invoice-123",
    "external_id": "test-ext-123",
    "amount": 100000,
    "payment_channel": "VA"
  }'

# Expected: 200 OK or 401 (if signature invalid, but that's OK - server reached)
```

### Test 2: Create Test Payment in Xendit Dashboard
1. Go to **Xendit Dashboard → Test Invoices**
2. Create a test invoice
3. Mark as paid manually
4. Check Cloudflare logs to verify webhook reached your server

### Test 3: Check Cloudflare Logs
1. **Security → Events**
2. Look for requests from `167.99.*` or `206.189.*`
3. Verify they show "Allowed" not "Blocked"

---

## Step 4: Configure Additional Security Rules

### Protect Other Routes (NOT Xendit)
```
Rule: Rate limit non-Xendit requests
- Expression: (ip.src not in {"167.99.0.0/17" "206.189.0.0/16"}) and (http.request.uri.path contains "/api/")
- Action: Challenge or Rate limit
```

### Allow User Access
```
Rule: Allow specific IPs (if needed)
- Expression: ip.src in {"YOUR_ISP_IP/32"} or cf.country ne "ID"
- Action: Allow (or Challenge based on your policy)
```

---

## Step 5: Update Environment Variables (if needed)

Ensure your webhook token is set in Vercel:

```bash
# Via Vercel Dashboard
Settings → Environment Variables

Add/Update:
XENDIT_WEBHOOK_TOKEN=your_webhook_token_from_xendit_dashboard
```

---

## Troubleshooting

### Error: "IP ALLOWLIST" or "Access Denied"
**Cause:** Cloudflare blocking the request  
**Solution:**
1. Check Cloudflare **Security → Events** logs
2. Add the blocked IP range to allowlist
3. Clear Cloudflare cache: **Caching → Purge Cache → Purge Everything**

### Webhook Not Received
**Cause:** Multiple reasons:
1. Cloudflare is blocking it (see above)
2. Webhook URL not registered in Xendit
3. Webhook token mismatch
4. Webhook disabled in Xendit settings

**Fix:**
```
In Xendit Dashboard:
1. Settings → Webhooks
2. Register URL: https://eksporyuk.com/api/webhooks/xendit
3. Copy webhook token and add to environment
4. Test webhook with "Send Test Webhook"
```

### Getting "Too many requests" after allowlisting
**Cause:** Rate limiting still active  
**Solution:** 
```
Add Cloudflare Rate Limiting Rule EXCEPTION for Xendit:
- Expression: ip.src in {"167.99.0.0/17" "206.189.0.0/16"}
- Action: Bypass Rate Limiting
```

---

## Security Best Practices

✅ **DO:**
- Allow only Xendit's documented IP ranges
- Use specific path matching: `/api/webhooks/xendit`
- Verify webhook signature in code (already implemented)
- Monitor Cloudflare events regularly
- Keep allowlist updated as Xendit changes IPs

❌ **DON'T:**
- Allow `*` (any IP) to `/api/webhooks/xendit`
- Disable all security for entire domain
- Trust webhook without signature verification
- Hardcode user IPs in firewall rules

---

## Verify Integration

After setup, test the full flow:

1. **User clicks "Beli Membership"** on website
2. **API creates Xendit invoice** (should succeed)
3. **Xendit sends webhook** when payment made (should be received)
4. **Webhook activates membership** (should complete)

Check Cloudflare logs at each step:
```
Security → Events → Filter by URL/IP
```

---

## Complete Firewall Rules Configuration

Save this JSON for reference or to restore quickly:

```json
{
  "rules": [
    {
      "priority": 1,
      "name": "Bypass Security for Xendit Webhooks",
      "expression": "(ip.src in {\"167.99.0.0/17\" \"206.189.0.0/16\"}) and (http.request.uri.path contains \"/api/webhooks/xendit\")",
      "action": "bypass",
      "bypass": ["all"]
    },
    {
      "priority": 2,
      "name": "Allow Xendit IP Ranges",
      "expression": "ip.src in {\"167.99.0.0/17\" \"206.189.0.0/16\"}",
      "action": "allow"
    },
    {
      "priority": 3,
      "name": "Protect API Routes (Rate Limit + WAF)",
      "expression": "(ip.src not in {\"167.99.0.0/17\" \"206.189.0.0/16\"}) and (http.request.uri.path contains \"/api/\")",
      "action": "challenge"
    }
  ]
}
```

---

## Support & Contact

**If webhook still not working:**
1. Check Xendit status: https://status.xendit.io
2. Contact Xendit support with your merchant ID
3. Ask them to verify their current IP whitelist for your account
4. Provide Cloudflare logs from `/api/webhooks/xendit`

**Xendit Documentation:**
- IP Whitelisting: https://xendit.readme.io/reference/ip-whitelisting
- Webhooks: https://xendit.readme.io/reference/webhooks
- Status Page: https://status.xendit.io

---

**Last Updated:** 29 December 2024  
**Status:** ✅ Ready to implement
