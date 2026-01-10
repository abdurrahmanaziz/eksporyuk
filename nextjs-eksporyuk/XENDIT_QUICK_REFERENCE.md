# XENDIT E-WALLET PAYOUT - QUICK REFERENCE & TROUBLESHOOTING

**Date:** 6 Januari 2026  
**Purpose:** Quick lookup untuk implementasi dan debugging Xendit Payout API

---

## CHANNEL CODE CHEAT SHEET

### Format: ID_PROVIDER

```
E-WALLET (Indonesia):
✅ ID_DANA
✅ ID_OVO
✅ ID_GOPAY
✅ ID_LINKAJA
✅ ID_SHOPEEPAY

BANK (Indonesia):
✅ ID_BCA
✅ ID_MANDIRI
✅ ID_BNI
✅ ID_BRI
```

### CRITICAL: Do NOT use these formats:
```
❌ DANA          (missing ID_ prefix)
❌ Dana          (wrong case)
❌ dana          (wrong case)
❌ D             (shortened)
❌ OVO_ID        (wrong order)
```

---

## PHONE NUMBER FORMATS

### Accepted Input Formats
```
From User                  → Send to Xendit
08118748177               → +628118748177
628118748177              → +628118748177
+628118748177             → +628118748177
+08118748177              → +628118748177
8118748177                → +628118748177
```

### Using normalizePhoneNumber()
```typescript
import { normalizePhoneNumber } from '@/lib/xendit-service'

const result = normalizePhoneNumber('08118748177')
// Output: '+628118748177'
```

---

## REQUEST/RESPONSE QUICK LOOKUP

### Account Validation Request
```json
{
  "channel_category": "EWALLET",
  "channel_code": "ID_DANA",
  "account_holder": {
    "phone_number": "+628118748177"
  }
}
```

### Account Validation Success Response
```json
{
  "account_holder_name": "AZIZ RAHMAN",
  "channel_category": "EWALLET",
  "channel_code": "ID_DANA",
  "account_number": "628118748177",
  "phone_number": "+628118748177",
  "is_verified": true
}
```

### Create Payout Request
```json
{
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  },
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal via DANA"
}
```

### Create Payout Success Response
```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "status": "ACCEPTED",
  "amount": 100000,
  "currency": "IDR",
  "estimated_arrival_time": "2026-01-06T10:15:00.000Z"
}
```

---

## STEP-BY-STEP IMPLEMENTATION

### 1️⃣ Set Environment Variables
```bash
# .env.local
XENDIT_SECRET_KEY=xnd_development_your_key_here
XENDIT_WEBHOOK_TOKEN=your_webhook_token
```

### 2️⃣ Import Services
```typescript
import { validateEWalletAccount, createPayout } from '@/lib/xendit-service'
```

### 3️⃣ Validate Account
```typescript
const result = await validateEWalletAccount('DANA', '08118748177')

if (!result.success) {
  // Handle error: result.error
  return { error: result.error }
}

// Success: result.accountName = "AZIZ RAHMAN"
const accountName = result.accountName
```

### 4️⃣ Create Payout
```typescript
const payoutResult = await createPayout(
  'DANA',                              // provider
  '08118748177',                       // phone
  accountName,                         // verified name
  100000,                              // amount in IDR
  `withdrawal_${userId}_${Date.now()}` // reference ID
)

if (!payoutResult.success) {
  // Handle error
  return { error: payoutResult.error }
}

// Success: payoutResult.payout with full response
const { id, status, estimated_arrival_time } = payoutResult.payout
```

---

## COMMON ERRORS & SOLUTIONS

### ❌ "Account holder name could not be found"

**Causes:**
- Wrong phone number
- Non-existent e-wallet account
- Invalid phone format

**Check:**
```typescript
// 1. Verify phone format
const normalized = normalizePhoneNumber('08118748177')
console.log('Normalized:', normalized) // +628118748177

// 2. Verify channel code
const code = 'ID_DANA'
console.log('Channel code:', code) // Should have ID_ prefix

// 3. Test with known account
const test = await validateEWalletAccount('DANA', '08118748177')
```

---

### ❌ "Xendit not configured properly"

**Causes:**
- XENDIT_SECRET_KEY not set in .env
- Empty or invalid API key

**Check:**
```bash
# In terminal
echo $XENDIT_SECRET_KEY
# Should show: xnd_development_...

# In code
if (!process.env.XENDIT_SECRET_KEY) {
  console.error('Missing XENDIT_SECRET_KEY')
}
```

---

### ❌ "Invalid API credentials" (401)

**Causes:**
- API key is wrong/revoked
- API key format incorrect

**Check:**
```typescript
// Verify key format
const key = process.env.XENDIT_SECRET_KEY
console.log('Key starts with:', key?.substring(0, 15))
// Should be: xnd_development_

// Verify encoding
const encoded = Buffer.from(key + ':').toString('base64')
console.log('Encoded header:', encoded)
```

---

### ❌ "Insufficient balance"

**Causes:**
- Account balance too low
- Not enough balance left after fees

**Check:**
```typescript
// Check user wallet balance
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { wallet: true }
})

console.log('Balance:', user.wallet.balance)
console.log('Request amount:', requestAmount)
console.log('Can withdraw:', user.wallet.balance >= requestAmount)
```

---

### ❌ "Duplicate error" (409)

**Causes:**
- Same reference_id used twice
- Same Idempotency-Key used twice

**Check:**
```typescript
// Use unique reference IDs
const referenceId = `withdrawal_${userId}_${Date.now()}_${Math.random()}`
console.log('Reference ID:', referenceId)

// Each request should have unique ID
// Don't reuse IDs from previous requests
```

---

### ❌ "Request timeout"

**Causes:**
- Xendit API slow/unreachable
- Network issue
- 10-second timeout exceeded

**Check:**
```typescript
// Verify Xendit API is reachable
curl https://api.xendit.co/health

// Check network connection
ping api.xendit.co

// Increase timeout if needed (max 30 seconds recommended)
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds
```

---

## TESTING IN POSTMAN

### 1. Set up environment variables
```
Key: xendit_key
Value: xnd_development_your_key

Key: xendit_webhook_token
Value: your_webhook_token
```

### 2. Account Validation Request
```
POST https://api.xendit.co/v1/account_validation

Headers:
- Authorization: Basic {{xendit_key}}:
- Content-Type: application/json

Body:
{
  "channel_category": "EWALLET",
  "channel_code": "ID_DANA",
  "account_holder": {
    "phone_number": "+628118748177"
  }
}
```

### 3. Create Payout Request
```
POST https://api.xendit.co/v2/payouts

Headers:
- Authorization: Basic {{xendit_key}}:
- Content-Type: application/json
- Idempotency-Key: unique-key-{{$timestamp}}

Body:
{
  "reference_id": "test_{{$timestamp}}",
  "channel_code": "ID_DANA",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  },
  "amount": 100000,
  "currency": "IDR",
  "description": "Test withdrawal"
}
```

---

## AMOUNT LIMITS BY CHANNEL

| Channel | Min | Max | Increment |
|---------|-----|-----|-----------|
| ID_DANA | 1,000 | 50,000,000 | Any |
| ID_OVO | 1,000 | 50,000,000 | Any |
| ID_GOPAY | 1,000 | 50,000,000 | Any |
| ID_LINKAJA | 1,000 | 50,000,000 | Any |
| ID_SHOPEEPAY | 1,000 | 50,000,000 | Any |
| ID_BCA | 50,000 | 500,000,000 | Any |
| ID_MANDIRI | 50,000 | 500,000,000 | Any |
| ID_BNI | 50,000 | 500,000,000 | Any |
| ID_BRI | 50,000 | 500,000,000 | Any |

---

## PAYOUT STATUS FLOW

```
User creates payout
    ↓
Status: ACCEPTED (immediate response)
    ↓
Status: PENDING (waiting to process)
    ↓
Status: PROCESSING (actively processing)
    ↓
Status: SUCCEEDED (✅ completed)
   OR
Status: FAILED (❌ rejected)
   OR
Status: REVERSED (❌ payout reversed)
```

### Webhook Events
```
payout.succeeded  → Status changed to SUCCEEDED
payout.failed     → Status changed to FAILED
payout.reversed   → Status changed to REVERSED
```

---

## DATABASE QUERIES

### Store Payout Record
```typescript
await prisma.payout.create({
  data: {
    xenditId: payout.id,
    referenceId: payout.reference_id,
    userId: userId,
    provider: 'DANA',
    phoneNumber: '628118748177',
    accountName: 'AZIZ RAHMAN',
    amount: 100000,
    status: payout.status,
    metadata: payout
  }
})
```

### Update Payout Status (from webhook)
```typescript
await prisma.payout.update({
  where: { xenditId: webhookData.id },
  data: {
    status: webhookData.status,
    metadata: webhookData
  }
})
```

### Query Payout by Reference ID
```typescript
const payout = await prisma.payout.findFirst({
  where: { referenceId: 'withdrawal_user123_1673000000' }
})
```

---

## CODE SNIPPETS

### Validate Account (Quick)
```typescript
import { validateEWalletAccount } from '@/lib/xendit-service'

const { success, accountName, error } = await validateEWalletAccount(
  'DANA',
  '08118748177'
)

if (!success) console.error(error)
else console.log(`✅ ${accountName}`)
```

### Create Payout (Quick)
```typescript
import { createPayout } from '@/lib/xendit-service'

const { success, payout, error } = await createPayout(
  'DANA',
  '08118748177',
  'AZIZ RAHMAN',
  100000,
  `withdrawal_user_${Date.now()}`
)

if (!success) console.error(error)
else console.log(`✅ Payout ID: ${payout.id}`)
```

### Handle Error Response
```typescript
const handleXenditError = (error: any) => {
  const messages: Record<string, string> = {
    'VALIDATION_ERROR': 'Invalid request data',
    'CHANNEL_CODE_NOT_SUPPORTED': 'Channel not supported',
    'INSUFFICIENT_BALANCE': 'Balance too low',
    'RECIPIENT_ACCOUNT_NUMBER_ERROR': 'Invalid account number',
    'DUPLICATE_ERROR': 'Duplicate request',
    'UNAUTHORIZED': 'Invalid API key',
  }
  
  return messages[error.error_code] || 'Unknown error occurred'
}
```

---

## PRODUCTION CHECKLIST

- [ ] Set XENDIT_SECRET_KEY in production environment
- [ ] Set XENDIT_WEBHOOK_TOKEN in production environment
- [ ] Configure webhook URL in Xendit dashboard
- [ ] Test webhook signature verification
- [ ] Implement rate limiting
- [ ] Add monitoring/logging
- [ ] Test all e-wallet providers
- [ ] Test error scenarios
- [ ] Set up alerts for failed payouts
- [ ] Document support process for users
- [ ] Create runbook for operations team

---

## USEFUL LINKS

**Xendit Resources:**
- Dashboard: https://dashboard.xendit.co
- Docs: https://docs.xendit.co
- API Reference: https://docs.xendit.co/api-reference
- Status Page: https://status.xendit.co

**In This Project:**
- Service: `/src/lib/services/xendit-payout.ts`
- API Routes: `/src/app/api/wallet/`
- Tests: `/test-xendit-*.js`

---

## SUPPORT

If you encounter issues:

1. **Check logs:** Browser console or server logs
2. **Verify config:** XENDIT_SECRET_KEY in .env
3. **Test endpoint:** Use curl or Postman
4. **Review docs:** https://docs.xendit.co
5. **Contact support:** Xendit dashboard support

---

**Created:** 6 Januari 2026  
**Status:** PRODUCTION READY  
**Version:** 1.0
