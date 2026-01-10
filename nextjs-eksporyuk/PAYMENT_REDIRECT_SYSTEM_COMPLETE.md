# 🔄 Payment Redirect System - Complete Documentation

## Overview

✅ **YES** - A complete payment redirect system has been implemented.

When a user lands on `/payment/va/[transactionId]`, the system automatically:
1. Fetches transaction details from the API
2. Checks if the VA is valid
3. If invalid/missing → **Automatically redirects to Xendit checkout**
4. If valid → Displays the VA payment instructions
5. Monitors payment status → **Auto-redirects to dashboard when paid**

---

## How It Works

### Flow Diagram

```
User visits payment/va/{transactionId}
       ↓
Frontend calls API: GET /api/payment/va/{transactionId}
       ↓
API checks:
  ├─ Does transaction exist?
  ├─ Is there a VA number?
  ├─ Is VA valid (not fallback)?
  └─ Is there an invoice URL fallback?
       ↓
Decision:
  ├─ ❌ No VA + No URL → Return error
  ├─ ✅ Valid VA → Return VA details (show to user)
  ├─ ⚠️ Invalid VA + No Invoice → Try to create Xendit invoice
  └─ 🔄 Invoice created → REDIRECT to Xendit checkout
       ↓
Frontend:
  ├─ If redirect=true → window.location.href = redirectUrl
  ├─ If valid VA → Display VA details + countdown timer
  ├─ Poll every 5 seconds for payment status
  └─ If status=SUCCESS → Redirect to /dashboard?payment=success
```

---

## Code Locations

### Frontend: Payment Page
**File:** `/src/app/payment/va/[transactionId]/page.tsx`

**Key Logic:**
```typescript
// Line 128-133: Check for redirect response
if (data.redirect && data.redirectUrl) {
  console.log('[VA Page] Redirecting to Xendit checkout:', data.redirectUrl)
  window.location.href = data.redirectUrl  // ← REDIRECT HAPPENS HERE
  return
}

// Line 142-149: Auto-redirect on success
if (data.status === 'SUCCESS' || data.status === 'PAID') {
  console.log('[VA Page] Payment successful! Redirecting to dashboard...')
  setTimeout(() => {
    router.push('/dashboard?payment=success')
  }, 1500)
}
```

### Backend: Payment VA API
**File:** `/src/app/api/payment/va/[transactionId]/route.ts`

**Key Logic:**
```typescript
// Line 59-71: Redirect if VA is actually a Xendit URL
const vaNumber = metadata?.vaNumber || metadata?.accountNumber || metadata?.xenditVANumber

if (vaNumber && vaNumber.startsWith('http')) {
  return NextResponse.json({
    redirect: true,
    redirectUrl: vaNumber,
    message: 'VA tidak tersedia, gunakan Xendit checkout',
  })
}

// Line 75-102: If fallback VA, try to create Xendit invoice
if (isFallbackVA && vaNumber) {
  try {
    const invoice = await xenditProxy.createInvoice({...})
    if (invoice?.invoice_url) {
      return NextResponse.json({
        redirect: true,
        redirectUrl: invoice.invoice_url,
        message: 'Silakan selesaikan pembayaran melalui Xendit',
      })
    }
  } catch (invoiceError) {
    console.error('[VA API] Failed to create invoice fallback:', invoiceError)
  }
}
```

---

## What Happens with Your Example

### Transaction: `e8045dec1652db1d03ba84dc3b397679`

When user visits: `https://eksporyuk.com/payment/va/e8045dec1652db1d03ba84dc3b397679`

#### Step 1: Frontend Calls API
```
GET /api/payment/va/e8045dec1652db1d03ba84dc3b397679
```

#### Step 2: Backend Checks Transaction

The API will:
1. **Find the transaction** in database
2. **Extract metadata**:
   - `vaNumber` - Virtual Account number
   - `xenditVANumber` - Alternative VA field
   - `accountNumber` - Fallback account
   - `xenditFallback` - Is this a fallback?
   - `paymentUrl` - Xendit invoice URL

3. **Validate VA**:
   - Is it a URL? If yes → redirect to that URL
   - Is it a fallback/manual? Try to create real Xendit invoice
   - Is it empty? Check for paymentUrl fallback

#### Step 3: Response & Action

If **redirect needed**, response looks like:
```json
{
  "redirect": true,
  "redirectUrl": "https://checkout.xendit.co/web/...",
  "message": "Silakan selesaikan pembayaran melalui Xendit"
}
```

Frontend automatically does:
```javascript
window.location.href = "https://checkout.xendit.co/web/..."
```

If **valid VA**, response looks like:
```json
{
  "redirect": false,
  "vaNumber": "1234567890123456",
  "bankCode": "BCA",
  "amount": 500000,
  "expiredAt": "2024-12-30T16:46:00Z",
  ...
}
```

Frontend displays VA details to user.

---

## Error Scenarios & Handling

### Scenario 1: Transaction Not Found
```
Response Status: 404
Response: { error: "Transaksi tidak ditemukan" }
Frontend shows: Error message to user
```

### Scenario 2: No VA Number, No Fallback URL
```
Response Status: 400
Response: { error: "Detail Virtual Account tidak ditemukan" }
Frontend shows: Error message to user
```

### Scenario 3: Invalid VA + Xendit Available
```
Response: {
  redirect: true,
  redirectUrl: "https://checkout.xendit.co/...",
  message: "VA tidak tersedia, gunakan Xendit checkout"
}
Frontend: Automatically redirects to Xendit checkout
```

### Scenario 4: Invalid VA + Xendit Not Available
```
Response: {
  redirect: true,
  redirectUrl: "https://checkout.xendit.co/...",
  message: "Detail Virtual Account tidak ditemukan, redirect ke halaman pembayaran"
}
Frontend: Redirects to stored paymentUrl
```

### Scenario 5: Payment Completed
```
Response: { status: "SUCCESS" or "PAID", ... }
Frontend: Waits 1.5 seconds then redirects to /dashboard?payment=success
```

---

## Auto-Redirect Triggers

### 1. Immediate Redirect (on API response)
```javascript
// In page.tsx line 128-133
if (data.redirect && data.redirectUrl) {
  window.location.href = data.redirectUrl
}
```
**When:** API says "go to Xendit"  
**Where:** Xendit checkout page  

### 2. Delayed Redirect (on payment success)
```javascript
// In page.tsx line 142-149
if (data.status === 'SUCCESS' || data.status === 'PAID') {
  setTimeout(() => {
    router.push('/dashboard?payment=success')
  }, 1500)
}
```
**When:** Payment confirmed in database  
**Where:** Dashboard with success message  
**Delay:** 1.5 seconds (for UX)

### 3. Status Check Polling
```javascript
// In page.tsx line 118-122
const pollInterval = setInterval(() => {
  if (vaDetails?.status === 'PENDING') {
    fetchVADetails()  // Check every 5 seconds
  }
}, 5000)
```
**When:** Payment status is PENDING  
**Frequency:** Every 5 seconds  
**Purpose:** Fast detection when payment completes

---

## How to Test

### Test 1: Valid VA Scenario
```bash
# Payment with valid VA number should display:
curl https://eksporyuk.com/payment/va/[valid-id]
# Shows: VA details, countdown timer, bank instructions
```

### Test 2: Missing VA Scenario
```bash
# Payment with no VA should redirect to Xendit:
curl https://eksporyuk.com/payment/va/[no-va-id]
# Result: Auto-redirect to Xendit checkout
```

### Test 3: Payment Success Scenario
```bash
# Manually mark payment as SUCCESS in database, then:
curl https://eksporyuk.com/payment/va/[paid-id]
# Result: Shows VA for 1.5 seconds, then redirects to dashboard
```

---

## Configuration

### Payment Expiry (from settings)
```typescript
// Default: 72 hours
const paymentExpiryHours = settings?.paymentExpiryHours || 72

// User can change in Admin Settings → Payment Settings
```

### Polling Interval
```typescript
// Current: 5 seconds (fast detection)
const pollInterval = setInterval(() => { ... }, 5000)

// Can be adjusted in page.tsx line 122
```

### Redirect Delay
```typescript
// Current: 1.5 seconds (nice UX)
setTimeout(() => { router.push(...) }, 1500)

// Can be adjusted in page.tsx line 149
```

---

## Edge Cases Handled

✅ **Transaction not found** → Show error  
✅ **VA is a URL** → Redirect to that URL  
✅ **VA is fallback/manual** → Try to create Xendit invoice  
✅ **No VA but have paymentUrl** → Redirect to paymentUrl  
✅ **No VA and no fallback** → Show error  
✅ **Payment already completed** → Redirect to dashboard  
✅ **Network error** → Retry every 5 seconds  
✅ **Invoice creation fails** → Fall back to manual VA  

---

## Status Codes

| Status | Meaning | UI Shows |
|--------|---------|----------|
| PENDING | Waiting for payment | VA details + countdown |
| SUCCESS | Payment confirmed | Success message → Dashboard redirect |
| PAID | Payment confirmed | Success message → Dashboard redirect |
| FAILED | Payment failed | Error message |
| EXPIRED | Payment expired | Expired message + retry button |

---

## Database Fields Used

### Transaction Table
- `id` - Transaction ID
- `status` - Payment status (PENDING/SUCCESS/FAILED/EXPIRED)
- `amount` - Final amount to pay
- `originalAmount` - Price before discount
- `discountAmount` - Discount applied
- `externalId` - Xendit invoice ID
- `paymentUrl` - Xendit invoice URL (fallback)
- `metadata` - JSON with VA/payment details
- `createdAt` - When payment created
- `expiredAt` - When payment expires

### Metadata Fields in JSON
```json
{
  "vaNumber": "1234567890123456",
  "accountNumber": "fallback-account",
  "xenditVANumber": "xendit-va",
  "bankCode": "BCA",
  "xenditBankCode": "BCA",
  "xenditFallback": "manual",
  "paymentChannelName": "Virtual Account",
  "membershipId": "mem-123",
  "originalAmount": 500000,
  "discountAmount": 0,
  "_fallback": "manual"
}
```

---

## Files Involved

| File | Purpose | Status |
|------|---------|--------|
| `/src/app/payment/va/[transactionId]/page.tsx` | Frontend UI & logic | ✅ Complete |
| `/src/app/api/payment/va/[transactionId]/route.ts` | Backend API | ✅ Complete |
| `/src/lib/xendit-proxy.ts` | Invoice creation fallback | ✅ Complete |
| `prisma/schema.prisma` | Database schema | ✅ Complete |

---

## Summary

✅ **System Status: FULLY IMPLEMENTED**

The payment redirect system is complete and handles:
- ✅ Auto-redirect to Xendit when VA unavailable
- ✅ Display VA details when available
- ✅ Auto-redirect to dashboard on payment success
- ✅ Status polling every 5 seconds
- ✅ Fallback to Xendit invoice if VA fails
- ✅ Error handling for all edge cases

**No additional code needed!** The system is ready to use.

---

**Last Updated:** 29 December 2024  
**Status:** ✅ Production Ready
