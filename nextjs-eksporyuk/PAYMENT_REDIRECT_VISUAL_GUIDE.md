# 📊 Payment Redirect System - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER PAYMENT FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

1️⃣  USER INITIATES PAYMENT
    └─→ Clicks "Bayar Sekarang" on membership/product page

2️⃣  SYSTEM CREATES TRANSACTION
    ├─→ Xendit creates invoice & Virtual Account
    └─→ Transaction stored in database with VA details in metadata

3️⃣  USER REDIRECTED TO PAYMENT PAGE
    └─→ URL: https://eksporyuk.com/payment/va/{transactionId}

4️⃣  FRONTEND CALLS API
    └─→ GET /api/payment/va/{transactionId}
    
5️⃣  BACKEND CHECKS VALIDITY
    ├─→ Does transaction exist?
    ├─→ Is VA number present?
    ├─→ Is VA valid (not fallback)?
    └─→ Is there fallback option?

6️⃣  API RESPONDS WITH ACTION
    ├─→ redirect: true   → Redirect to Xendit/URL
    ├─→ redirect: false  → Display VA to user
    └─→ error: message   → Show error message

7️⃣  FRONTEND TAKES ACTION
    ├─→ If redirect → window.location.href = url
    ├─→ If VA → Display bank instructions + countdown
    └─→ If error → Show error message

8️⃣  USER COMPLETES PAYMENT (External)
    └─→ User pays on Virtual Account or Xendit page

9️⃣  XENDIT SENDS WEBHOOK
    └─→ POST /api/webhooks/xendit {status: "invoice.paid"}

🔟  SYSTEM PROCESSES PAYMENT
    ├─→ Updates transaction status to SUCCESS
    ├─→ Creates user membership/product access
    └─→ Sends notifications

1️⃣1️⃣  FRONTEND DETECTS SUCCESS
    ├─→ Polls API every 5 seconds (while on payment page)
    ├─→ Detects status = SUCCESS
    └─→ Waits 1.5 seconds for UX

1️⃣2️⃣  AUTO-REDIRECT TO DASHBOARD
    └─→ router.push('/dashboard?payment=success')

1️⃣3️⃣  USER SEES SUCCESS PAGE
    ├─→ Dashboard loads with success message
    ├─→ Membership/Product activated
    └─→ Access granted to resources
```

---

## Decision Tree - Backend API

```
START: User visits /payment/va/{transactionId}
  │
  ├─→ Transaction exists?
  │   ├─→ NO  → Return 404 error
  │   └─→ YES → Continue
  │
  ├─→ Extract VA details from metadata
  │
  ├─→ Is VA a URL (http/https)?
  │   ├─→ YES → Return { redirect: true, redirectUrl: VA_URL }
  │   └─→ NO  → Continue
  │
  ├─→ Is this a fallback/manual VA?
  │   ├─→ YES → Try to create Xendit invoice
  │   │   ├─→ Success → Return { redirect: true, redirectUrl: invoice_url }
  │   │   └─→ Fail    → Continue (fallback to manual VA)
  │   └─→ NO  → Continue
  │
  ├─→ Do we have a VA number?
  │   ├─→ NO  → Check for paymentUrl
  │   │   ├─→ Has paymentUrl → Return { redirect: true, redirectUrl: paymentUrl }
  │   │   └─→ No paymentUrl  → Return 400 error
  │   └─→ YES → Continue
  │
  └─→ Return valid VA details
      {
        vaNumber: "...",
        bankCode: "...",
        amount: ...,
        expiredAt: "...",
        ...
      }
```

---

## Frontend Logic - Payment Page

```
User visits /payment/va/{transactionId}
  │
  └─→ useEffect: Call fetchVADetails()
      │
      ├─→ Fetch /api/payment/va/{transactionId}
      │   │
      │   ├─→ Network error?
      │   │   └─→ Try again (shown in error)
      │   │
      │   ├─→ data.redirect === true?
      │   │   └─→ YES → window.location.href = data.redirectUrl
      │   │   └─→ NO  → Continue
      │   │
      │   ├─→ data.status === 'SUCCESS'?
      │   │   └─→ YES → Show success for 1.5s, then push('/dashboard')
      │   │   └─→ NO  → Continue
      │   │
      │   └─→ setVaDetails(data)
      │
      ├─→ Display UI based on data
      │   ├─→ VA Details (if available)
      │   ├─→ Countdown Timer (shows expiry)
      │   ├─→ Copy Buttons (for VA number, amount, bank code)
      │   └─→ Bank Instructions (how to transfer)
      │
      └─→ Set up polling interval
          │
          └─→ Every 5 seconds (if status === PENDING)
              └─→ Call fetchVADetails() again
                  └─→ Check if payment completed
                      └─→ If YES → Auto-redirect to dashboard
```

---

## API Response Types

### Type 1: Redirect Response
```json
{
  "redirect": true,
  "redirectUrl": "https://checkout.xendit.co/web/...",
  "message": "Silakan selesaikan pembayaran melalui Xendit"
}
```
**Action:** Frontend redirects immediately  
**Use Case:** No valid VA available, use Xendit checkout instead

### Type 2: VA Details Response
```json
{
  "redirect": false,
  "vaNumber": "1234567890123456",
  "bankCode": "BCA",
  "bankName": "Bank Central Asia (BCA)",
  "amount": 500000,
  "originalAmount": 500000,
  "discountAmount": 0,
  "status": "PENDING",
  "expiredAt": "2024-12-30T16:46:00Z",
  "paymentExpiryHours": 72,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "invoiceNumber": "INV-001",
  "itemName": "Membership Premium - 1 Bulan",
  "createdAt": "2024-12-27T16:46:00Z"
}
```
**Action:** Frontend displays VA details  
**Use Case:** Valid VA available, user can transfer directly

### Type 3: Success Response
```json
{
  "redirect": false,
  "vaNumber": "1234567890123456",
  "status": "SUCCESS",  // ← Changed from PENDING
  "amount": 500000,
  // ... other fields same
}
```
**Action:** Frontend shows success message, redirects to dashboard  
**Use Case:** Payment has been completed and confirmed

### Type 4: Error Response
```json
{
  "error": "Transaksi tidak ditemukan"
}
// Status: 404 or 400
```
**Action:** Frontend shows error message  
**Use Case:** Transaction invalid, VA not found, etc.

---

## Timeline - Example Payment

```
14:00  User clicks "Bayar Sekarang"
       → API creates transaction with VA
       → User redirected to /payment/va/{id}

14:01  Frontend loads payment page
       → Calls API /api/payment/va/{id}
       → API returns VA details
       → Page displays: VA number, bank, amount, countdown

14:02  User opens mobile banking app
       → Scans QR or enters VA number manually
       → Initiates Rp 500,000 transfer

14:03  User completes transfer
       → Bank processes payment
       → Virtual Account settled

14:04  Xendit webhook arrives
       → POST /api/webhooks/xendit {event: "invoice.paid"}
       → System processes:
         - Updates transaction.status = SUCCESS
         - Creates user membership
         - Sends success email
         - Sends WhatsApp notification

14:05  Frontend polling detects change
       → Polls API every 5 seconds
       → API returns status: "SUCCESS"
       → Frontend shows success message (1.5 sec delay)
       → Redirects to /dashboard?payment=success

14:06  User sees dashboard
       → "Aktivasi Berhasil!" message
       → New membership active
       → Access to courses/groups granted
```

---

## Error Recovery

### Scenario: Network Error on First Load
```
User visits /payment/va/{id}
  │
  ├─→ API call fails (no internet)
  │   └─→ Catch error, show: "Gagal memuat detail pembayaran"
  │
  └─→ User refreshes page (automatic or manual)
      └─→ Try again when network recovers
```

### Scenario: VA Becomes Invalid
```
VA created at 14:00, expires 14:00 + 72 hours = 14:00 next day
  │
  ├─→ At 14:00 next day, countdown shows 0
  │   └─→ Timer triggers fetchVADetails()
  │
  └─→ API returns status: EXPIRED
      └─→ Frontend shows: "Waktu pembayaran telah berakhir"
```

### Scenario: Payment Fails
```
User pays wrong amount or to wrong VA
  │
  ├─→ Xendit sends webhook: "payment_request.failed"
  │   └─→ Transaction status = FAILED
  │
  └─→ User refreshes page
      └─→ Frontend polling detects FAILED status
      └─→ Shows: "Pembayaran gagal, silakan coba lagi"
```

---

## Mobile vs Desktop Experience

### Desktop
```
┌─────────────────────────────────────────┐
│   Payment Details                       │
│ ┌─────────────────────────────────────┐ │
│ │ Bank: BCA                           │ │
│ │ VA Number: 1234567890123456    [📋] │ │  ← Click to copy
│ │ Amount: Rp 500.000            [📋] │ │
│ │                                     │ │
│ │ Transfer Instructions:              │ │
│ │ 1. Buka mobile banking BCA          │ │
│ │ 2. Pilih Transfer → VA              │ │
│ │ 3. Masukkan nomor VA                │ │
│ │ 4. Masukkan Rp 500.000              │ │
│ │ 5. Selesaikan transaksi             │ │
│ │                                     │ │
│ │ Waktu berakhir: 2 hari 3 jam   [⏱️] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Sudah transfer? Klik di sini]         │
│ [Gunakan metode pembayaran lain]       │
└─────────────────────────────────────────┘
```

### Mobile
```
┌─────────────────────────┐
│ Payment Details         │
├─────────────────────────┤
│                         │
│ BCA Virtual Account     │
│                         │
│ ┌────────────────────┐  │
│ │ 1234567890123456   │  │  ← Full screen
│ │ (tap to copy)      │  │
│ └────────────────────┘  │
│                         │
│ Amount: Rp 500.000      │
│ (tap to copy)           │
│                         │
│ ⏱️ 2 hari 3 jam        │
│                         │
│ [Transfer Now]          │
│ [More Options]          │
│                         │
│ Transfer Instructions:  │
│ • Open BCA app          │
│ • Select VA Transfer    │
│ • Enter VA number       │
│ • Enter amount          │
│ • Complete              │
│                         │
└─────────────────────────┘
```

---

## Key Metrics

| Metric | Value | Purpose |
|--------|-------|---------|
| Polling Interval | 5 seconds | Fast detection of payment |
| Redirect Delay | 1.5 seconds | Show success message |
| Payment Expiry | 72 hours (default) | Time window for payment |
| Invoice Duration | 86,400 seconds | Xendit invoice TTL |
| Fallback Timeout | Immediate | Try Xendit if VA fails |

---

## Security Considerations

✅ **Signature Verification**
- Webhook from Xendit verified with secret token
- Cannot fake payment success

✅ **User Ownership**
- Payment can only be marked SUCCESS via Xendit webhook
- Frontend cannot change status

✅ **Amount Immutability**
- Amount stored in database
- Cannot be changed by user via API

✅ **Transaction Immutability**
- Once created, transaction ID cannot change
- Each payment has unique ID

---

## Summary

The payment redirect system provides:

1. ✅ **Smart Routing** - Route to VA or Xendit checkout based on availability
2. ✅ **Automatic Detection** - Poll for payment completion automatically
3. ✅ **Error Handling** - Graceful fallbacks for all failure scenarios
4. ✅ **User Experience** - Clear instructions and real-time countdown
5. ✅ **Security** - Webhook signature verification prevents fraud
6. ✅ **Flexibility** - Works with VA, credit card, e-wallet, QRIS

**Status:** ✅ Complete and production-ready

---

**Last Updated:** 29 December 2024
