# Logika Withdrawal: Instant vs Manual

**Platform**: Eksporyuk  
**Date**: 6 Januari 2026  
**Status**: Production Active

---

## Overview Sistem Withdrawal

Ada **3 jenis withdrawal** di platform:

1. **Manual Withdrawal** → `/api/affiliate/payouts` (POST)
2. **Instant Bank Transfer** → `/api/affiliate/payouts/xendit` (POST)
3. **Instant E-Wallet** → `/api/wallet/withdraw-ewallet` (POST)

---

## 1. Manual Withdrawal (Proses Admin)

### Endpoint
```
POST /api/affiliate/payouts
```

### Flow Diagram
```
User Request
     ↓
Validasi (Balance, PIN, Amount)
     ↓
Create Payout (status: PENDING)
     ↓
Create WalletTransaction (type: PAYOUT_REQUEST)
     ↓
TIDAK DEDUCT BALANCE! ← Penting!
     ↓
Notifikasi ke Admin
     ↓
Admin Review & Approve
     ↓
Admin Transfer Manual
     ↓
Admin Update Status → PAID
     ↓
Sistem Deduct Balance
     ↓
Update AffiliateConversion.paidOut = true
     ↓
Selesai
```

### Karakteristik

| Aspek | Detail |
|-------|--------|
| **Processing Time** | 1-3 hari kerja |
| **Admin Fee** | Rp 5,000 (setting: `withdrawalAdminFee`) |
| **Min Amount** | Rp 50,000 (setting: `withdrawalMinAmount`) |
| **Status Flow** | PENDING → APPROVED → PAID |
| **Balance Deduction** | Saat status jadi PAID (bukan saat request) |
| **Xendit Integration** | ❌ Tidak ada |
| **Auto Process** | ❌ Manual by admin |

### Code Logic

```typescript
// 1. VALIDASI
const settings = await prisma.settings.findFirst()
const minPayout = Number(settings?.withdrawalMinAmount || 50000)
const adminFee = Number(settings?.withdrawalAdminFee || 5000)

if (amount < minPayout) {
  return error('Minimal penarikan')
}

// 2. CEK PIN
if (pinRequired) {
  const isValidPin = await bcrypt.compare(pin, user.withdrawalPin)
  if (!isValidPin) return error('PIN salah')
}

// 3. CEK BALANCE (dari AffiliateConversion + Wallet)
const totalEarnings = sum(conversions.commissionAmount)
const paidOutTotal = sum(conversions where paidOut=true)
const pending = sum(payouts where status IN [PENDING, APPROVED])
const available = totalEarnings - paidOutTotal - pending

if (amount > available) {
  return error('Saldo tidak mencukupi')
}

// 4. CREATE PAYOUT (status = PENDING)
const payout = await prisma.payout.create({
  data: {
    walletId: wallet.id,
    amount,
    status: 'PENDING', // ← Menunggu admin
    bankName,
    accountName,
    accountNumber,
    notes,
    metadata: {
      adminFee,
      netAmount: amount - adminFee,
      requestedAmount: amount
    }
  }
})

// 5. CREATE TRANSACTION LOG
await prisma.walletTransaction.create({
  data: {
    walletId: wallet.id,
    amount: -amount,
    type: 'PAYOUT_REQUEST', // ← Request, bukan deduction
    description: `Request penarikan Rp ${amount.toLocaleString()}`,
    reference: payout.id
  }
})

// 6. NOTIFIKASI
await notificationService.send({
  userId: session.user.id,
  title: 'Permintaan Penarikan Dikirim',
  message: 'Mohon tunggu konfirmasi admin'
})

// Notify admin via email, pusher, onesignal
// Notify user via WhatsApp (Starsender)
```

### Admin Action Flow

**Admin Dashboard** → `/admin/payouts`

```typescript
// Admin klik "Approve"
await prisma.payout.update({
  where: { id: payoutId },
  data: { status: 'APPROVED' }
})

// Admin transfer manual ke rekening user
// Setelah transfer sukses, admin klik "Mark as Paid"

// Backend action saat mark as paid:
await prisma.$transaction([
  // Update status
  prisma.payout.update({
    where: { id: payoutId },
    data: { 
      status: 'PAID',
      paidAt: new Date()
    }
  }),
  
  // Deduct wallet balance (baru sekarang!)
  prisma.wallet.update({
    where: { id: walletId },
    data: { balance: { decrement: amount } }
  }),
  
  // Mark conversions as paid
  prisma.affiliateConversion.updateMany({
    where: { 
      affiliateId,
      paidOut: false,
      // Logic untuk mark conversion mana yang sudah paid
    },
    data: { paidOut: true }
  })
])
```

---

## 2. Instant Bank Transfer (Xendit Auto)

### Endpoint
```
POST /api/affiliate/payouts/xendit
```

### Flow Diagram
```
User Request
     ↓
Validasi (Balance, PIN, Amount, Xendit Enabled)
     ↓
Call Xendit API (createPayout)
     ↓
Xendit Response (payout.id)
     ↓
Create Payout (status: PROCESSING)
     ↓
DEDUCT BALANCE IMMEDIATELY ← Beda dengan manual!
     ↓
Create WalletTransaction (type: PAYOUT_PROCESSING)
     ↓
Wait Xendit Webhook
     ↓
Webhook Update Status (SUCCEEDED/FAILED)
     ↓
If FAILED → Refund Balance
     ↓
Selesai (5-10 menit)
```

### Karakteristik

| Aspek | Detail |
|-------|--------|
| **Processing Time** | 5-10 menit |
| **Admin Fee** | Rp 5,000 + Xendit fee |
| **Min Amount** | Rp 50,000 |
| **Status Flow** | PROCESSING → PAID/FAILED |
| **Balance Deduction** | LANGSUNG saat request |
| **Xendit Integration** | ✅ Via `/v2/payouts` API |
| **Auto Process** | ✅ Fully automated |

### Code Logic

```typescript
// 1. CEK XENDIT ENABLED
const xenditEnabled = settings?.paymentEnableXendit ?? false
if (!xenditEnabled) {
  return error('Withdrawal otomatis belum tersedia')
}

// 2. VALIDASI (sama seperti manual)
// ... validasi amount, PIN, balance ...

// 3. CALCULATE NET AMOUNT
const adminFee = Number(settings?.withdrawalAdminFee || 5000)
const netAmount = amount - adminFee

// 4. CALL XENDIT API
const xenditPayout = new XenditPayout()
const bankCode = getBankCode(bankName) // BCA → ID_BCA, Mandiri → ID_MANDIRI

const payout = await xenditPayout.createPayout({
  referenceId: `bank_${userId}_${Date.now()}`,
  channelCode: bankCode,
  channelProperties: {
    accountHolderName: accountName,
    accountNumber: accountNumber
  },
  amount: netAmount,
  currency: 'IDR',
  description: 'Bank transfer payout',
  metadata: {
    userId: session.user.id,
    type: 'bank_transfer'
  }
})

// Response dari Xendit:
// {
//   id: "disb_123abc",
//   referenceId: "bank_123_1767678262",
//   status: "ACCEPTED", // atau PROCESSING
//   amount: 95000,
//   ...
// }

// 5. CREATE PAYOUT RECORD (status = PROCESSING)
const payoutRecord = await prisma.payout.create({
  data: {
    walletId: wallet.id,
    amount,
    status: 'PROCESSING', // ← Langsung processing
    bankName,
    accountName,
    accountNumber,
    notes: 'Bank transfer otomatis via Xendit',
    metadata: {
      adminFee,
      netAmount,
      requestedAmount: amount,
      xenditId: payout.id, // ← Store Xendit ID
      xenditReferenceId: payout.referenceId
    }
  }
})

// 6. DEDUCT BALANCE IMMEDIATELY
await prisma.wallet.update({
  where: { id: wallet.id },
  data: { balance: { decrement: amount } } // ← Langsung potong!
})

// 7. CREATE TRANSACTION LOG
await prisma.walletTransaction.create({
  data: {
    walletId: wallet.id,
    amount: -amount,
    type: 'PAYOUT_PROCESSING', // ← Processing, bukan request
    description: `Bank transfer Rp ${amount.toLocaleString()}`,
    reference: payoutRecord.id,
    metadata: { xenditId: payout.id }
  }
})

// 8. RETURN SUCCESS
return {
  success: true,
  payout: payoutRecord,
  xenditPayout: {
    id: payout.id,
    status: payout.status,
    amount: netAmount
  }
}
```

### Webhook Handler

**Endpoint**: `POST /api/webhooks/xendit/payout`

```typescript
// Xendit kirim webhook saat status berubah
// Header: x-callback-token (validate against XENDIT_WEBHOOK_TOKEN)

const { id, status, reference_id } = webhookBody

// Find payout by xenditId
const payout = await prisma.payout.findFirst({
  where: {
    metadata: {
      path: ['xenditId'],
      equals: id
    }
  }
})

if (status === 'SUCCEEDED') {
  // Transfer berhasil
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: 'PAID' }
  })
  
  // Notify user: "Transfer berhasil!"
  
} else if (status === 'FAILED') {
  // Transfer gagal
  await prisma.payout.update({
    where: { id: payout.id },
    data: { status: 'FAILED' }
  })
  
  // REFUND BALANCE
  await prisma.wallet.update({
    where: { id: payout.walletId },
    data: { balance: { increment: payout.amount } }
  })
  
  // Create refund transaction
  await prisma.walletTransaction.create({
    data: {
      walletId: payout.walletId,
      amount: payout.amount,
      type: 'REFUND',
      description: 'Refund dari penarikan gagal',
      reference: payout.id
    }
  })
  
  // Notify user: "Transfer gagal, saldo dikembalikan"
}
```

---

## 3. Instant E-Wallet (DANA, OVO, GoPay, dll)

### Endpoint
```
POST /api/wallet/withdraw-ewallet
```

### Flow Diagram
```
User Request
     ↓
Validasi (Balance, PIN, Amount)
     ↓
Call Xendit Payout API (E-Wallet)
     ↓
Xendit Response (payout.id)
     ↓
Create Payout (status: PROCESSING)
     ↓
DEDUCT BALANCE IMMEDIATELY
     ↓
Store Xendit Fields (xenditPayoutId, channelCode, etc)
     ↓
Wait Xendit Webhook
     ↓
Webhook Update via xenditPayoutId lookup
     ↓
If FAILED → Refund
     ↓
Selesai (5-10 menit)
```

### Karakteristik

| Aspek | Detail |
|-------|--------|
| **Processing Time** | 5-10 menit |
| **Admin Fee** | Rp 2,500 (setting: `withdrawalAdminFee`) |
| **Min Amount** | Rp 10,000 |
| **Status Flow** | PROCESSING → PAID/FAILED |
| **Balance Deduction** | LANGSUNG saat request |
| **Xendit Integration** | ✅ Via `/v2/payouts` API (channel: EWALLET) |
| **Auto Process** | ✅ Fully automated |

### Code Logic

```typescript
// 1. VALIDASI
if (amount < 10000) {
  return error('Minimal penarikan Rp 10,000')
}

// 2. CEK PIN (sama)
const pinValid = await bcrypt.compare(pin, user.withdrawalPin)
if (!pinValid) return error('PIN salah')

// 3. CEK BALANCE
const wallet = await prisma.wallet.findUnique({
  where: { userId: session.user.id }
})

if (wallet.balance < amount) {
  return error('Saldo tidak mencukupi')
}

// 4. CALCULATE NET AMOUNT
const adminFee = Number(settings?.withdrawalAdminFee || 2500)
const netAmount = amount - adminFee

// 5. CALL XENDIT E-WALLET PAYOUT API
const xenditService = getXenditPayoutService()
const referenceId = `withdrawal_${userId}_${Date.now()}`

const payoutResult = await xenditService.createPayout(
  provider, // DANA, OVO, GoPay, LinkAja, ShopeePay
  phoneNumber, // 08118748177
  accountName, // Abdurrahman Aziz
  netAmount,
  referenceId,
  {
    userId: session.user.id,
    userEmail: session.user.email,
    originalAmount: amount,
    adminFee: adminFee,
    provider: provider
  }
)

// Xendit Response:
// {
//   id: "disb_ewallet_123abc",
//   reference_id: "withdrawal_123_1767678262",
//   channel_code: "ID_DANA",
//   status: "ACCEPTED",
//   amount: 97500,
//   ...
// }

// 6. CREATE PAYOUT WITH XENDIT FIELDS
await prisma.$transaction([
  // Deduct balance
  prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: amount } }
  }),
  
  // Create payout
  prisma.payout.create({
    data: {
      walletId: wallet.id,
      amount: amount,
      status: 'PROCESSING',
      bankName: provider,
      accountName: accountName,
      accountNumber: phoneNumber,
      notes: `E-wallet withdrawal via ${provider}`,
      
      // Xendit integration fields (dedicated columns)
      xenditPayoutId: xenditPayout.id, // ← Field khusus!
      channelCode: xenditPayout.channel_code,
      channelCategory: 'EWALLET',
      phoneNumber: phoneNumber,
      referenceId: xenditPayout.reference_id,
      xenditStatus: xenditPayout.status,
      estimatedArrival: new Date(xenditPayout.estimated_arrival_time),
      adminFee: adminFee,
      netAmount: netAmount,
      
      metadata: {
        userId: session.user.id,
        originalAmount: amount
      }
    }
  }),
  
  // Create transaction log
  prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: -amount,
      type: 'WITHDRAWAL',
      description: `Withdrawal to ${provider} ${phoneNumber}`,
      metadata: {
        provider,
        xenditPayoutId: xenditPayout.id,
        channelCode: xenditPayout.channel_code
      }
    }
  })
])
```

### Webhook Handler (E-Wallet)

**Endpoint**: `POST /api/webhooks/xendit/payout`

```typescript
// Xendit webhook untuk e-wallet payout
const { id, status, reference_id, failure_code } = webhookBody

// LOOKUP by xenditPayoutId (dedicated field!)
const payout = await prisma.payout.findFirst({
  where: { xenditPayoutId: id } // ← Fast lookup!
})

if (!payout) {
  // Fallback: cari di metadata (old format)
  payout = await prisma.payout.findFirst({
    where: {
      metadata: {
        path: ['xenditId'],
        equals: id
      }
    }
  })
}

// Map Xendit status to internal status
let internalStatus = 'PENDING'
if (status === 'SUCCEEDED') {
  internalStatus = 'PAID'
} else if (status === 'FAILED' || status === 'REVERSED') {
  internalStatus = 'FAILED'
}

// Update payout
await prisma.payout.update({
  where: { id: payout.id },
  data: {
    status: internalStatus,
    xenditStatus: status,
    failureReason: failure_code || null
  }
})

// REFUND if failed
if (internalStatus === 'FAILED') {
  await prisma.wallet.update({
    where: { id: payout.walletId },
    data: { balance: { increment: payout.amount } }
  })
  
  await prisma.walletTransaction.create({
    data: {
      walletId: payout.walletId,
      amount: payout.amount,
      type: 'REFUND',
      description: `Refund e-wallet withdrawal (${failure_code})`,
      reference: payout.id
    }
  })
}
```

---

## Perbandingan Lengkap

| Fitur | Manual | Instant Bank | Instant E-Wallet |
|-------|--------|--------------|------------------|
| **Endpoint** | `/api/affiliate/payouts` | `/api/affiliate/payouts/xendit` | `/api/wallet/withdraw-ewallet` |
| **Processing** | 1-3 hari | 5-10 menit | 5-10 menit |
| **Admin Fee** | Rp 5,000 | Rp 5,000 + Xendit fee | Rp 2,500 |
| **Min Amount** | Rp 50,000 | Rp 50,000 | Rp 10,000 |
| **Initial Status** | PENDING | PROCESSING | PROCESSING |
| **Balance Deduction** | Saat PAID | Saat request | Saat request |
| **Xendit Integration** | ❌ No | ✅ Bank Transfer | ✅ E-Wallet |
| **Auto Refund** | ❌ Manual | ✅ Auto | ✅ Auto |
| **Admin Review** | ✅ Required | ❌ No | ❌ No |
| **Webhook** | ❌ No | ✅ Yes | ✅ Yes |
| **Dedicated Fields** | ❌ No | Partial (metadata) | ✅ Yes (xenditPayoutId, etc) |

---

## Database Schema: Payout Model

```prisma
model Payout {
  id                String        @id @default(cuid())
  walletId          String
  wallet            Wallet        @relation(fields: [walletId], references: [id])
  amount            Float
  status            PayoutStatus
  bankName          String?
  accountName       String?
  accountNumber     String?
  notes             String?
  paidAt            DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Xendit Integration Fields (for instant withdrawals)
  xenditPayoutId    String?       @unique
  channelCode       String?       // ID_DANA, ID_OVO, ID_BCA, etc
  channelCategory   String?       // EWALLET, BANK
  phoneNumber       String?       // For e-wallet
  referenceId       String?       // Our reference ID
  failureReason     String?       // Xendit failure code
  xenditStatus      String?       // ACCEPTED, PROCESSING, SUCCEEDED, FAILED
  estimatedArrival  DateTime?     // Xendit estimated arrival time
  adminFee          Float?        // Admin fee amount
  netAmount         Float?        // Net amount after fee
  
  metadata          Json?         // Additional data
  
  @@index([walletId])
  @@index([status])
  @@index([xenditPayoutId]) // For fast webhook lookup
  @@index([createdAt])
}

enum PayoutStatus {
  PENDING      // Manual: waiting admin approval
  APPROVED     // Manual: admin approved, ready to transfer
  PROCESSING   // Instant: Xendit processing
  PAID         // Completed successfully
  REJECTED     // Manual: admin rejected
  FAILED       // Instant: Xendit failed
  REVERSED     // Instant: Xendit reversed
}
```

---

## Key Differences Summary

### 1. **Balance Deduction Timing**

**Manual**:
```typescript
// Request: NO deduction
status = 'PENDING'
wallet.balance = unchanged

// Admin approve: NO deduction
status = 'APPROVED'
wallet.balance = unchanged

// Admin mark as paid: DEDUCT
status = 'PAID'
wallet.balance -= amount // ← Baru di sini!
```

**Instant**:
```typescript
// Request: IMMEDIATE deduction
status = 'PROCESSING'
wallet.balance -= amount // ← Langsung!

// Webhook success: Keep deduction
status = 'PAID'
wallet.balance = unchanged

// Webhook failed: REFUND
status = 'FAILED'
wallet.balance += amount // ← Kembalikan!
```

### 2. **Status Flow**

**Manual**: `PENDING → APPROVED → PAID` (or `REJECTED`)

**Instant**: `PROCESSING → PAID` (or `FAILED` / `REVERSED`)

### 3. **Data Storage**

**Manual**: Minimal fields, mostly in `metadata`

**Instant E-Wallet**: Dedicated fields for Xendit integration
- `xenditPayoutId` - Primary Xendit ID
- `channelCode` - ID_DANA, ID_OVO, etc
- `channelCategory` - EWALLET vs BANK
- `phoneNumber` - E-wallet phone number
- `referenceId` - Our reference ID
- `xenditStatus` - Real-time Xendit status
- `failureReason` - Error details
- `adminFee`, `netAmount` - Fee breakdown

### 4. **Webhook Integration**

**Manual**: No webhook, admin manually updates

**Instant**: Webhook handler at `/api/webhooks/xendit/payout`
- Fast lookup by `xenditPayoutId` field
- Status mapping: SUCCEEDED → PAID, FAILED → FAILED
- Auto-refund on failure

---

## User Experience Flow

### Manual Withdrawal
1. User klik "Tarik Saldo" → pilih "Manual"
2. Isi jumlah, rekening, PIN
3. Status: "Menunggu Review" (PENDING)
4. Admin review (1-3 hari)
5. Admin transfer manual ke rekening
6. Admin klik "Mark as Paid"
7. Saldo berkurang
8. User dapat notifikasi "Transfer berhasil"

### Instant Withdrawal
1. User klik "Tarik Saldo" → pilih "Instant"
2. Pilih Bank/E-Wallet
3. Isi data rekening/nomor HP
4. Klik "Cek Nama Akun" (untuk e-wallet)
5. Isi jumlah, PIN
6. **Saldo langsung berkurang**
7. Status: "Sedang Diproses" (PROCESSING)
8. 5-10 menit kemudian:
   - Success: Status → PAID, dana masuk rekening
   - Failed: Status → FAILED, saldo dikembalikan

---

## Error Handling

### Manual
- Saldo tidak cukup → Check before create
- PIN salah → Validate before create
- Amount < minimum → Reject
- Admin reject → Status REJECTED, no deduction

### Instant
- Xendit error → Return 503, no deduction
- Webhook failed status → Auto refund
- Duplicate request → Check by referenceId
- Network timeout → Retry mechanism in Xendit

---

## Security Considerations

1. **PIN Validation**: All methods validate withdrawal PIN
2. **Balance Lock**: Instant methods deduct immediately to prevent double withdrawal
3. **Webhook Validation**: Verify `x-callback-token` from Xendit
4. **Idempotency**: Use unique `referenceId` to prevent duplicate payouts
5. **Audit Trail**: All transactions logged in `WalletTransaction`

---

## Monitoring & Logs

```typescript
// Log patterns untuk debugging

// Manual
console.log('[MANUAL PAYOUT] User:', userId, 'Amount:', amount, 'Status: PENDING')

// Instant Bank
console.log('[XENDIT PAYOUT] Creating:', { referenceId, bankCode, amount })
console.log('[XENDIT PAYOUT] Success:', { id: payout.id, status })

// Instant E-Wallet
console.log('[E-Wallet Withdrawal] User:', userId, 'Provider:', provider)
console.log('[E-Wallet Withdrawal] Xendit ID:', xenditPayout.id)

// Webhook
console.log('[WEBHOOK] Payout:', id, 'Status:', status, 'Lookup: xenditPayoutId')
```

---

**Kesimpulan**: 

- **Manual** = Flexible, butuh admin, lambat, deduct saat paid
- **Instant** = Fast, auto, deduct langsung, auto-refund if fail
- **E-Wallet** = Paling cepat, fee rendah, phone-based, dedicated fields

Pilih sesuai kebutuhan user dan kemampuan operasional platform!
