# XENDIT PAYOUT API - VALIDATION & COMPARISON GUIDE

**Date:** 6 Januari 2026  
**Purpose:** Verify correct implementation and compare right vs wrong patterns

---

## ✅ CORRECT vs ❌ WRONG PATTERNS

### Channel Code

#### ✅ CORRECT Format
```typescript
// All correct patterns for DANA
const channelCode = 'ID_DANA'
const mapping = {
  'DANA': 'ID_DANA',
  'OVO': 'ID_OVO',
  'GOPAY': 'ID_GOPAY',
  'LINKAJA': 'ID_LINKAJA',
  'SHOPEEPAY': 'ID_SHOPEEPAY',
}
```

#### ❌ WRONG Format
```typescript
// All INCORRECT patterns
const wrong1 = 'DANA'           // Missing ID_ prefix
const wrong2 = 'Dana'           // Wrong case
const wrong3 = 'dana'           // Wrong case
const wrong4 = 'D'              // Shortened
const wrong5 = 'ID_D'           // Wrong name
const wrong6 = 'OVO_ID'         // Wrong order
const wrong7 = 'dana_id'        // Wrong format
```

### Phone Number Normalization

#### ✅ CORRECT Function
```typescript
function normalizePhoneNumber(input: string): string {
  // Remove all non-digits
  const cleaned = input.replace(/\D/g, '')
  
  // Add +62 prefix
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+62${cleaned.substring(1)}`
  } else {
    return `+62${cleaned}`
  }
}

// Test cases
normalizePhoneNumber('08118748177')    // ✅ +628118748177
normalizePhoneNumber('628118748177')   // ✅ +628118748177
normalizePhoneNumber('+628118748177')  // ✅ +628118748177
normalizePhoneNumber('8118748177')     // ✅ +628118748177
normalizePhoneNumber('+08118748177')   // ✅ +628118748177
normalizePhoneNumber('0-811-8748-177') // ✅ +628118748177
```

#### ❌ WRONG Function
```typescript
// DON'T do this!
const wrong1 = phoneNumber.replace('0', '62')
// 08118748177 → 628118748177 (MISSING leading +)

const wrong2 = phoneNumber
// 08118748177 (NOT normalized, multiple formats possible)

const wrong3 = '0' + phoneNumber
// 008118748177 (Adding extra leading 0)

const wrong4 = phoneNumber.substring(1)
// 8118748177 (Missing country code entirely)

const wrong5 = `+${phoneNumber}`
// +08118748177 (Still has leading 0)
```

### Request Authentication Header

#### ✅ CORRECT Implementation
```typescript
function getAuthHeader(secretKey: string): string {
  // Format: {SECRET_KEY}:
  const credentials = `${secretKey}:`
  // Base64 encode
  const encoded = Buffer.from(credentials).toString('base64')
  // Return with Basic prefix
  return `Basic ${encoded}`
}

// Usage
const header = getAuthHeader('xnd_development_abc123')
// Returns: "Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo="

// In fetch request
const response = await fetch(url, {
  headers: {
    'Authorization': header,
    'Content-Type': 'application/json'
  }
})
```

#### ❌ WRONG Implementation
```typescript
// DON'T do this!

// Wrong 1: Missing colon
const wrong1 = `Basic ${Buffer.from(secretKey).toString('base64')}`

// Wrong 2: Bearer instead of Basic
const wrong2 = `Bearer ${Buffer.from(secretKey).toString('base64')}`

// Wrong 3: Putting key directly in header
const wrong3 = `Authorization: ${secretKey}`

// Wrong 4: Forgetting to encode
const wrong4 = `Basic ${secretKey}:`

// Wrong 5: Multiple encoding
const wrong5 = Buffer.from(
  Buffer.from(secretKey).toString('base64')
).toString('base64')
```

### Request Body Format

#### ✅ CORRECT - Account Validation Request
```typescript
const correctRequest = {
  channel_category: 'EWALLET',           // ✅ Correct value
  channel_code: 'ID_DANA',               // ✅ ID_ prefix
  account_holder: {                      // ✅ Required object
    phone_number: '+628118748177'        // ✅ +62 format
  }
}

// Send with:
fetch('https://api.xendit.co/v1/account_validation', {
  method: 'POST',
  headers: {
    'Authorization': getAuthHeader(secretKey),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(correctRequest)
})
```

#### ❌ WRONG - Account Validation Request
```typescript
// Wrong 1: Snake case instead of camelCase
const wrong1 = {
  channel_category: 'EWALLET',
  channel_code: 'DANA',                  // ❌ Missing ID_
  account_holder: {
    phone_number: '08118748177'          // ❌ Not normalized
  }
}

// Wrong 2: Missing account_holder object
const wrong2 = {
  channel_category: 'EWALLET',
  channel_code: 'ID_DANA',
  phone_number: '+628118748177'          // ❌ Should be nested
}

// Wrong 3: Wrong field names
const wrong3 = {
  channel_category: 'EWALLET',
  channel_code: 'ID_DANA',
  accountHolder: {                       // ❌ Should be snake_case
    phoneNumber: '+628118748177'         // ❌ Should be snake_case
  }
}

// Wrong 4: Missing channel_category
const wrong4 = {
  channel_code: 'ID_DANA',
  account_holder: {
    phone_number: '+628118748177'
  }
}
```

#### ✅ CORRECT - Create Payout Request
```typescript
const correctRequest = {
  reference_id: 'withdrawal_user123_1673000000',  // ✅ Unique
  channel_code: 'ID_DANA',                        // ✅ ID_ prefix
  channel_properties: {                           // ✅ Required
    account_holder_name: 'AZIZ RAHMAN',           // ✅ Name
    account_number: '628118748177'                // ✅ Phone/account
  },
  amount: 100000,                                 // ✅ Integer IDR
  currency: 'IDR',                                // ✅ Only IDR for Indo
  description: 'Withdrawal via DANA'              // ✅ Optional but good
}

// Send with:
fetch('https://api.xendit.co/v2/payouts', {
  method: 'POST',
  headers: {
    'Authorization': getAuthHeader(secretKey),
    'Content-Type': 'application/json',
    'Idempotency-Key': reference_id              // ✅ REQUIRED header
  },
  body: JSON.stringify(correctRequest)
})
```

#### ❌ WRONG - Create Payout Request
```typescript
// Wrong 1: Missing Idempotency-Key header
fetch('https://api.xendit.co/v2/payouts', {
  method: 'POST',
  headers: {
    'Authorization': header,
    'Content-Type': 'application/json'
    // ❌ Missing Idempotency-Key!
  },
  body: JSON.stringify(request)
})

// Wrong 2: Decimal amount instead of integer
const wrong2 = {
  reference_id: 'withdrawal_user123_1673000000',
  channel_code: 'ID_DANA',
  channel_properties: {
    account_holder_name: 'AZIZ RAHMAN',
    account_number: '628118748177'
  },
  amount: 100000.50,                      // ❌ Should be integer
  currency: 'IDR'
}

// Wrong 3: Wrong currency
const wrong3 = {
  reference_id: 'withdrawal_user123_1673000000',
  channel_code: 'ID_DANA',
  channel_properties: {
    account_holder_name: 'AZIZ RAHMAN',
    account_number: '628118748177'
  },
  amount: 100000,
  currency: 'USD'                         // ❌ Only IDR for Indonesia
}

// Wrong 4: Reusing reference_id
const existingRefId = 'withdrawal_user123_1673000000'
// First request
await createPayout(..., existingRefId)
// Second request (same ID)
await createPayout(..., existingRefId)    // ❌ DUPLICATE_ERROR
```

### Error Handling

#### ✅ CORRECT Error Handling
```typescript
async function handlePayout(payoutData: PayoutRequest) {
  try {
    const response = await fetch(url, { ... })
    
    if (!response.ok) {
      const error = await response.json()
      
      // Handle specific error codes
      if (error.error_code === 'INSUFFICIENT_BALANCE') {
        return { error: 'Saldo tidak cukup' }
      }
      if (error.error_code === 'RECIPIENT_ACCOUNT_NUMBER_ERROR') {
        return { error: 'Nomor akun tidak valid' }
      }
      if (error.error_code === 'DUPLICATE_ERROR') {
        return { error: 'Permintaan duplikat' }
      }
      
      // Generic error for others
      return { error: error.message || 'Payout failed' }
    }
    
    const data = await response.json()
    return { success: true, payout: data }
    
  } catch (error: any) {
    console.error('Payout error:', error)
    return { error: 'Service temporarily unavailable' }
  }
}
```

#### ❌ WRONG Error Handling
```typescript
// Wrong 1: No error handling at all
const response = await fetch(url)
const data = await response.json()
return { payout: data }  // ❌ Might have error object!

// Wrong 2: Generic catch-all
catch (error) {
  return { error: 'Something went wrong' }  // ❌ Not helpful
}

// Wrong 3: Throwing without catching
throw new Error(errorData.message)         // ❌ Unhandled promise rejection

// Wrong 4: Continuing after error
if (!response.ok) {
  console.log(error)
  // ❌ Missing return statement!
}
const data = await response.json()          // Still executes!
```

### Database Storage

#### ✅ CORRECT Database Record
```typescript
await prisma.payout.create({
  data: {
    xenditId: 'disb-1705048000000',        // ✅ From Xendit response
    referenceId: 'withdrawal_user123_1673000000',
    userId: 'user123',
    provider: 'DANA',
    phoneNumber: '628118748177',
    accountName: 'AZIZ RAHMAN',
    amount: 100000,
    status: 'ACCEPTED',                    // ✅ From Xendit response
    metadata: {
      xenditResponse: payoutData,          // ✅ Store full response
      createdAt: new Date().toISOString()
    }
  }
})
```

#### ❌ WRONG Database Record
```typescript
// Wrong 1: Storing API key in database
await prisma.payout.create({
  data: {
    xenditApiKey: process.env.XENDIT_SECRET_KEY,  // ❌ SECURITY RISK!
    // ...
  }
})

// Wrong 2: Storing phone number without normalization
await prisma.payout.create({
  data: {
    phoneNumber: '08118748177',  // ❌ Should normalize first
    // ...
  }
})

// Wrong 3: Not storing full Xendit response
await prisma.payout.create({
  data: {
    xenditId: 'disb-...',
    // ❌ Missing metadata with full response
  }
})

// Wrong 4: Using status from request instead of response
await prisma.payout.create({
  data: {
    status: 'SUCCEEDED',  // ❌ Should be from Xendit response (typically ACCEPTED)
    // ...
  }
})
```

### Webhook Verification

#### ✅ CORRECT Webhook Verification
```typescript
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const callbackToken = request.headers.get('x-callback-token')
    
    // Verify signature
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
    if (!webhookToken) {
      return NextResponse.json(
        { error: 'Webhook token not configured' },
        { status: 500 }
      )
    }
    
    const signature = crypto
      .createHmac('sha256', webhookToken)
      .update(JSON.stringify(body))
      .digest('hex')
    
    if (signature !== callbackToken) {
      console.warn('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Process webhook
    await handleWebhook(body)
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

#### ❌ WRONG Webhook Verification
```typescript
// Wrong 1: No signature verification at all
export async function POST(request: NextRequest) {
  const body = await request.json()
  await handleWebhook(body)    // ❌ Anyone can call this!
  return NextResponse.json({ received: true })
}

// Wrong 2: Wrong verification method
if (request.headers.get('x-callback-token') === 'correct-token') {
  // ❌ Comparing string directly, not verifying signature
}

// Wrong 3: Not timing out webhook processing
async function handleWebhook(body) {
  // Long-running operation
  await processPayoutUpdate(body)  // ❌ Might timeout
}

// Wrong 4: Not logging verification failures
if (signature !== callbackToken) {
  // ❌ Silent failure, no logging
  return NextResponse.json({ error: 'Invalid' }, { status: 401 })
}
```

---

## 🔍 VALIDATION CHECKLIST

### Before Sending Request to Xendit

```typescript
function validatePayoutRequest(request: PayoutRequest): boolean {
  // ✅ Checklist
  if (!request.reference_id) {
    console.error('Missing reference_id')
    return false
  }
  
  if (!request.channel_code.startsWith('ID_')) {
    console.error('Channel code must have ID_ prefix')
    return false
  }
  
  if (!request.channel_properties.account_holder_name) {
    console.error('Missing account holder name')
    return false
  }
  
  if (!request.channel_properties.account_number) {
    console.error('Missing account number')
    return false
  }
  
  if (request.amount < 1000) {
    console.error('Amount below minimum (1000)')
    return false
  }
  
  if (request.amount > 50000000) {
    console.error('Amount exceeds maximum (50000000)')
    return false
  }
  
  if (!Number.isInteger(request.amount)) {
    console.error('Amount must be integer')
    return false
  }
  
  if (request.currency !== 'IDR') {
    console.error('Currency must be IDR')
    return false
  }
  
  return true
}
```

### Before Storing in Database

```typescript
function validatePayoutResponse(response: PayoutResponse): boolean {
  // ✅ Checklist
  if (!response.id || !response.id.startsWith('disb-')) {
    console.error('Invalid payout ID from Xendit')
    return false
  }
  
  if (!response.reference_id) {
    console.error('Missing reference ID in response')
    return false
  }
  
  if (!['ACCEPTED', 'PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'].includes(response.status)) {
    console.error('Invalid status:', response.status)
    return false
  }
  
  if (!response.channel_properties?.account_holder_name) {
    console.error('Missing account holder name in response')
    return false
  }
  
  return true
}
```

---

## 📊 RESPONSE COMPARISON

### Success Response Structure

```json
{
  "id": "disb-...",                    // ✅ Always present
  "reference_id": "...",               // ✅ Always present
  "channel_code": "ID_DANA",           // ✅ Always present
  "amount": 100000,                    // ✅ Always present
  "status": "ACCEPTED",                // ✅ Always present
  "created": "2026-01-06T10:00:00Z",  // ✅ Always present
  "estimated_arrival_time": "...",     // ⚠️ May be null
  "failure_code": null,                // ❌ NOT present if successful
  "failure_reason": null               // ❌ NOT present if successful
}
```

### Failure Response Structure

```json
{
  "error_code": "INSUFFICIENT_BALANCE",
  "message": "Your account does not have sufficient balance"
  // ❌ NO id, status, or success fields
}
```

### Key Differences

| Scenario | Field Present | Value |
|----------|---------------|-------|
| **Success** | `id` | Yes (disb-...) |
| **Success** | `status` | ACCEPTED/PENDING/etc. |
| **Success** | `failure_code` | No |
| **Error** | `error_code` | Yes (error code) |
| **Error** | `id` | No |
| **Error** | `status` | No |

---

## 🧪 TESTING PATTERNS

### ✅ CORRECT Test

```typescript
async function testPayoutFlow() {
  // 1. Validate account
  const validation = await xendit.validateAccount('DANA', '08118748177')
  expect(validation.success).toBe(true)
  expect(validation.accountName).toBeDefined()
  
  // 2. Create payout
  const payout = await xendit.createPayout(
    'DANA',
    '08118748177',
    validation.accountName,
    100000,
    `test_${Date.now()}`
  )
  expect(payout.success).toBe(true)
  expect(payout.payout?.id).toBeDefined()
  expect(payout.payout?.status).toBe('ACCEPTED')
  
  // 3. Verify in database
  const stored = await db.payout.findUnique({
    where: { xenditId: payout.payout.id }
  })
  expect(stored).toBeDefined()
}
```

### ❌ WRONG Test

```typescript
// Wrong 1: No assertions
async function testPayoutFlow() {
  const validation = await xendit.validateAccount('DANA', '08118748177')
  const payout = await xendit.createPayout(...)
  // ❌ No expect() or assertions!
}

// Wrong 2: Hardcoded reference IDs (duplicate errors)
async function testPayoutFlow() {
  const payout1 = await xendit.createPayout(..., 'same_id')
  const payout2 = await xendit.createPayout(..., 'same_id')  // ❌ DUPLICATE_ERROR
}

// Wrong 3: No error handling in tests
async function testPayoutFlow() {
  const validation = await xendit.validateAccount(...)
  // ❌ What if validation fails?
  const payout = await xendit.createPayout(
    'DANA',
    '08118748177',
    validation.accountName,  // ❌ Might be undefined!
    ...
  )
}
```

---

## 🚨 COMMON MISTAKES & FIXES

| Mistake | Why Wrong | Fix |
|---------|-----------|-----|
| Using `DANA` instead of `ID_DANA` | Channel code format incorrect | Always use `ID_PROVIDER` |
| Sending `08118748177` to Xendit | Phone format incorrect | Normalize to `+628118748177` |
| Omitting `Idempotency-Key` header | Get duplicate payout errors | Always include this header |
| Using `Bearer` auth instead of `Basic` | Wrong auth scheme | Use Basic Auth with base64 encoded key |
| Storing API key in code/database | Security risk | Always use environment variables |
| Not verifying webhook signature | Security risk | Always verify before processing |
| Ignoring error responses | Silent failures | Always check response.ok |
| Reusing reference IDs | Get DUPLICATE_ERROR | Always generate unique IDs |
| Decimal amounts like `100000.50` | Xendit expects integers | Always use whole numbers |
| Not storing Xendit response | Can't debug later | Store full response in metadata |

---

## 📋 PRODUCTION READINESS CHECKLIST

- [ ] Channel codes ALL have `ID_` prefix
- [ ] Phone numbers ALL normalized to `+62` format
- [ ] Authentication uses Basic Auth with proper encoding
- [ ] Idempotency-Key present on ALL POST requests
- [ ] Error handling covers all error codes
- [ ] Webhook signature verification implemented
- [ ] Database stores full Xendit response
- [ ] API key in environment variables (not in code)
- [ ] Logging doesn't expose sensitive data
- [ ] Timeouts implemented on API calls
- [ ] Rate limiting implemented
- [ ] Retry logic with exponential backoff
- [ ] Monitoring and alerts configured
- [ ] All validation implemented as per checklist

---

**Created:** 6 Januari 2026  
**Status:** PRODUCTION READY
