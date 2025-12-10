# Sejoli Payment Status Flow - Status PAID/LUNAS Only

## ⚠️ CRITICAL RULE: Hanya Status PAID yang Dapat Akses Premium

**PENTING**: User **HANYA** mendapat akses premium di Eksporyuk jika status order di Sejoli = **PAID/COMPLETED/SUCCESS**.

---

## Status Mapping dari Sejoli → Eksporyuk

### 1. Status: PENDING / WAITING PAYMENT
**Sejoli Status**: `pending`, `waiting_payment`, `awaiting_payment`

**Action di Eksporyuk**:
- ✅ Log webhook ke `SejoliWebhookLog`
- ✅ Create user (jika belum ada) dengan role `MEMBER_FREE`
- ❌ **TIDAK** create `UserMembership` aktif
- ❌ **TIDAK** create transaction COMPLETED
- ❌ **TIDAK** aktivasi membership
- ❌ **TIDAK** kirim welcome email
- ❌ **TIDAK** hitung komisi affiliate
- ❌ **TIDAK** update user role ke MEMBER_PREMIUM

**Database**:
```json
{
  "SejoliWebhookLog": {
    "status": "pending",
    "processed": true,
    "error": "Payment not completed - status: pending",
    "userId": "cm...",
    "membershipId": null
  },
  "User": {
    "role": "MEMBER_FREE",
    "isActive": true
  },
  "UserMembership": null,
  "Transaction": null
}
```

**User Experience**:
- ❌ Tidak bisa akses materi premium
- ❌ Tidak bisa akses komunitas premium
- ✅ Bisa login tapi sebagai free member
- 💡 Dashboard menampilkan: "Menunggu pembayaran di Sejoli..."

---

### 2. Status: PAID / COMPLETED / SUCCESS ✅
**Sejoli Status**: `paid`, `completed`, `success`, `lunas`

**Action di Eksporyuk**:
- ✅ Log webhook ke `SejoliWebhookLog`
- ✅ Create/Update user dengan role `MEMBER_PREMIUM`
- ✅ **CREATE** `UserMembership` dengan:
  - `status = 'ACTIVE'`
  - `isActive = true`
  - `source = 'SEJOLI'`
  - `activatedAt = NOW()`
- ✅ **CREATE** transaction dengan `status = 'COMPLETED'`
- ✅ **AKTIVASI** membership (akses penuh)
- ✅ **KIRIM** welcome email/WhatsApp
- ✅ **HITUNG** komisi affiliate (jika ada)
- ✅ **DISTRIBUSI** revenue ke founder/co-founder
- ✅ **UPDATE** wallet balances

**Database**:
```json
{
  "SejoliWebhookLog": {
    "status": "paid",
    "processed": true,
    "error": null,
    "userId": "cm...",
    "membershipId": "cm..."
  },
  "User": {
    "role": "MEMBER_PREMIUM",
    "isActive": true
  },
  "UserMembership": {
    "status": "ACTIVE",
    "isActive": true,
    "source": "SEJOLI",
    "sejoliOrderId": "SJ-20251209-001",
    "startDate": "2025-12-09",
    "endDate": "2026-03-09",
    "activatedAt": "2025-12-09T10:00:00Z"
  },
  "Transaction": {
    "status": "COMPLETED",
    "amount": 500000,
    "paidAt": "2025-12-09T10:00:00Z"
  }
}
```

**User Experience**:
- ✅ Dapat akses penuh ke semua materi
- ✅ Dapat akses komunitas premium
- ✅ Dapat download sertifikat
- ✅ Dapat ikut webinar
- ✅ Dashboard menampilkan sisa hari membership

---

### 3. Status: EXPIRED
**Sejoli Status**: `expired`, `ended`

**Action di Eksporyuk**:
- ✅ Log webhook ke `SejoliWebhookLog`
- ✅ **UPDATE** `UserMembership`:
  - `status = 'EXPIRED'`
  - `isActive = false`
- ✅ **UPDATE** user role:
  - Jika tidak ada membership aktif lain → `role = 'MEMBER_FREE'`
- ✅ **KIRIM** email notifikasi: "Membership expired"
- ❌ **TIDAK** hitung komisi baru
- ❌ **TIDAK** create transaction baru

**Database**:
```json
{
  "UserMembership": {
    "status": "EXPIRED",
    "isActive": false,
    "endDate": "2026-03-09",
    "lastSyncAt": "2026-03-10T10:00:00Z"
  },
  "User": {
    "role": "MEMBER_FREE"
  }
}
```

**User Experience**:
- ❌ Akses premium dicabut
- ✅ Masih bisa login
- ✅ Bisa lihat history membership
- 💡 Dashboard menampilkan: "Membership expired. Perpanjang sekarang!"

---

### 4. Status: REFUNDED / CANCELLED
**Sejoli Status**: `refunded`, `cancelled`, `canceled`, `refund`

**Action di Eksporyuk**:
- ✅ Log webhook ke `SejoliWebhookLog`
- ✅ **UPDATE** `UserMembership`:
  - `status = 'REFUNDED'`
  - `isActive = false`
- ✅ **UPDATE** `Transaction`:
  - `status = 'REFUNDED'`
- ⚠️ **REVERSE** komisi affiliate (kembalikan ke wallet pending)
- ⚠️ **REVERSE** revenue share founder/co-founder
- ✅ **KIRIM** email notifikasi: "Refund processed"

**Database**:
```json
{
  "UserMembership": {
    "status": "REFUNDED",
    "isActive": false
  },
  "Transaction": {
    "status": "REFUNDED"
  },
  "Wallet": {
    "balance": "dikurangi komisi yang sudah dibayar",
    "balancePending": "adjusted"
  }
}
```

**User Experience**:
- ❌ Akses premium langsung dicabut
- ✅ Masih bisa login sebagai free member
- 💡 Dashboard: "Refund processed. Contact support for questions."

---

## Code Implementation

### Webhook Handler dengan Status Check

```typescript
// /src/app/api/webhooks/sejoli/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { sejoliService } from '@/lib/services/sejoliService'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. Get webhook data
    const webhookData = await request.json()
    
    // 2. Validate signature
    const signature = request.headers.get('X-Sejoli-Signature')
    if (!validateSignature(webhookData, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // 3. Log webhook (always)
    console.log('[SEJOLI WEBHOOK]', {
      orderId: webhookData.order_id,
      status: webhookData.status,
      email: webhookData.buyer_email,
      amount: webhookData.amount,
    })
    
    // 4. Process based on status
    const status = webhookData.status?.toLowerCase()
    
    switch (status) {
      case 'paid':
      case 'completed':
      case 'success':
        // ✅ PROCESS - Activate membership
        const result = await sejoliService.processWebhook(webhookData)
        return NextResponse.json({
          success: true,
          message: 'Webhook processed - Membership activated',
          data: result,
        })
      
      case 'pending':
      case 'waiting_payment':
      case 'awaiting_payment':
        // ⏸️ LOG ONLY - Don't activate
        await sejoliService.logWebhookOnly(webhookData)
        return NextResponse.json({
          success: true,
          message: 'Webhook logged - Payment pending',
        })
      
      case 'expired':
      case 'ended':
        // ⏹️ DEACTIVATE - Expire membership
        await sejoliService.expireMembership(webhookData)
        return NextResponse.json({
          success: true,
          message: 'Membership expired',
        })
      
      case 'refunded':
      case 'cancelled':
      case 'canceled':
        // ↩️ REVERSE - Refund & deactivate
        await sejoliService.refundMembership(webhookData)
        return NextResponse.json({
          success: true,
          message: 'Membership refunded',
        })
      
      default:
        // ❓ UNKNOWN STATUS
        await sejoliService.logWebhookOnly(webhookData)
        return NextResponse.json({
          success: true,
          message: `Webhook logged - Unknown status: ${status}`,
        })
    }
    
  } catch (error: any) {
    console.error('[SEJOLI WEBHOOK ERROR]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function validateSignature(data: any, signature: string | null): boolean {
  if (!signature) return false
  
  const secret = process.env.SEJOLI_WEBHOOK_SECRET!
  const payload = JSON.stringify(data)
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return hash === signature
}
```

### Service dengan Status Logic

```typescript
// /src/lib/services/sejoliService.ts

export class SejoliService {
  
  // Process webhook HANYA jika status = PAID
  async processWebhook(webhookData: any) {
    // CRITICAL: Validate payment status
    const isPaid = this.isStatusPaid(webhookData.status)
    
    if (!isPaid) {
      throw new Error(`Cannot process - Payment not completed. Status: ${webhookData.status}`)
    }
    
    // 1. Log webhook
    const log = await prisma.sejoliWebhookLog.create({
      data: {
        orderId: webhookData.order_id,
        status: webhookData.status,
        webhookData,
        // ... other fields
      }
    })
    
    // 2. Create/Get User
    let user = await prisma.user.findUnique({
      where: { email: webhookData.buyer_email }
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: webhookData.buyer_email,
          name: webhookData.buyer_name,
          role: 'MEMBER_PREMIUM', // Langsung PREMIUM karena sudah PAID
          // ... other fields
        }
      })
    } else {
      // Update existing user to PREMIUM
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_PREMIUM' }
      })
    }
    
    // 3. Get membership mapping
    const mapping = await this.getProductMapping(webhookData.product_id)
    
    // 4. Create Transaction (COMPLETED)
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'MEMBERSHIP',
        status: 'COMPLETED', // Pasti COMPLETED
        amount: webhookData.amount,
        paymentProvider: 'SEJOLI',
        externalId: webhookData.order_id,
        paidAt: new Date(), // Pasti ada
        // ... other fields
      }
    })
    
    // 5. Create UserMembership (ACTIVE)
    const membership = await prisma.userMembership.create({
      data: {
        userId: user.id,
        membershipId: mapping.eksporyukMembershipId,
        status: 'ACTIVE', // Pasti ACTIVE
        isActive: true, // Pasti TRUE
        source: 'SEJOLI',
        sejoliOrderId: webhookData.order_id,
        startDate: new Date(webhookData.order_date),
        endDate: new Date(webhookData.expiry_date),
        activatedAt: new Date(), // NOW
        transactionId: transaction.id,
        // ... other fields
      }
    })
    
    // 6. Process commission (karena sudah PAID)
    await this.processCommission(transaction, webhookData)
    
    // 7. Send notifications
    await this.sendWelcomeNotification(user, membership)
    
    // 8. Update log
    await prisma.sejoliWebhookLog.update({
      where: { id: log.id },
      data: {
        processed: true,
        userId: user.id,
        membershipId: membership.id,
      }
    })
    
    return { user, membership, transaction }
  }
  
  // Log webhook tanpa aktivasi (untuk status PENDING)
  async logWebhookOnly(webhookData: any) {
    await prisma.sejoliWebhookLog.create({
      data: {
        orderId: webhookData.order_id,
        status: webhookData.status,
        webhookData,
        processed: true,
        error: `Payment not completed - Status: ${webhookData.status}`,
      }
    })
  }
  
  // Expire membership
  async expireMembership(webhookData: any) {
    const membership = await prisma.userMembership.findFirst({
      where: { sejoliOrderId: webhookData.order_id }
    })
    
    if (membership) {
      await prisma.userMembership.update({
        where: { id: membership.id },
        data: {
          status: 'EXPIRED',
          isActive: false,
        }
      })
      
      // Check if user has other active memberships
      const otherActive = await prisma.userMembership.findFirst({
        where: {
          userId: membership.userId,
          isActive: true,
          id: { not: membership.id }
        }
      })
      
      // If no other active membership, downgrade to FREE
      if (!otherActive) {
        await prisma.user.update({
          where: { id: membership.userId },
          data: { role: 'MEMBER_FREE' }
        })
      }
    }
  }
  
  // Refund membership
  async refundMembership(webhookData: any) {
    const membership = await prisma.userMembership.findFirst({
      where: { sejoliOrderId: webhookData.order_id },
      include: { transaction: true }
    })
    
    if (membership) {
      // Update membership
      await prisma.userMembership.update({
        where: { id: membership.id },
        data: {
          status: 'REFUNDED',
          isActive: false,
        }
      })
      
      // Update transaction
      if (membership.transaction) {
        await prisma.transaction.update({
          where: { id: membership.transaction.id },
          data: { status: 'REFUNDED' }
        })
      }
      
      // Reverse commissions
      await this.reverseCommissions(membership.transaction)
      
      // Downgrade user if no other active membership
      const otherActive = await prisma.userMembership.findFirst({
        where: {
          userId: membership.userId,
          isActive: true,
          id: { not: membership.id }
        }
      })
      
      if (!otherActive) {
        await prisma.user.update({
          where: { id: membership.userId },
          data: { role: 'MEMBER_FREE' }
        })
      }
    }
  }
  
  // Helper: Check if status is PAID
  private isStatusPaid(status: string): boolean {
    const paidStatuses = ['paid', 'completed', 'success', 'lunas']
    return paidStatuses.includes(status?.toLowerCase())
  }
}
```

---

## Testing Scenarios

### Scenario 1: User Bayar di Sejoli (PAID)
1. User checkout di Sejoli
2. User bayar → Status = PAID
3. Sejoli kirim webhook dengan status=paid
4. Eksporyuk process webhook:
   - ✅ Create user dengan role MEMBER_PREMIUM
   - ✅ Create UserMembership ACTIVE
   - ✅ Create Transaction COMPLETED
   - ✅ Hitung komisi
   - ✅ Kirim welcome email
5. User langsung bisa login & akses premium

**Expected Result**: ✅ User dapat akses penuh

---

### Scenario 2: User Checkout tapi Belum Bayar (PENDING)
1. User checkout di Sejoli
2. User belum bayar → Status = PENDING
3. Sejoli kirim webhook dengan status=pending
4. Eksporyuk process webhook:
   - ✅ Log webhook only
   - ❌ Tidak create membership
   - ❌ Tidak aktivasi
5. User coba login:
   - ✅ Bisa login sebagai MEMBER_FREE
   - ❌ Tidak bisa akses premium

**Expected Result**: ❌ User tidak dapat akses premium

---

### Scenario 3: User Bayar di Sejoli Setelah PENDING
1. User status PENDING (dari scenario 2)
2. User bayar → Status berubah ke PAID
3. Sejoli kirim webhook BARU dengan status=paid
4. Eksporyuk process webhook:
   - ✅ Create UserMembership ACTIVE
   - ✅ Update user role ke MEMBER_PREMIUM
   - ✅ Process komisi
5. User refresh dashboard → Langsung bisa akses

**Expected Result**: ✅ User dapat akses penuh setelah bayar

---

### Scenario 4: Membership Expired
1. User punya membership aktif (90 hari)
2. Hari ke-91 → Sejoli kirim webhook expired
3. Eksporyuk process webhook:
   - ✅ Update UserMembership status=EXPIRED
   - ✅ Set isActive=false
   - ✅ Update user role ke MEMBER_FREE (jika tidak ada membership lain)
4. User coba akses premium:
   - ❌ Ditolak
   - 💡 Dashboard: "Membership expired"

**Expected Result**: ❌ User tidak dapat akses premium

---

### Scenario 5: User Request Refund
1. User request refund di Sejoli
2. Sejoli approve → Status = REFUNDED
3. Sejoli kirim webhook dengan status=refunded
4. Eksporyuk process webhook:
   - ✅ Update UserMembership status=REFUNDED
   - ✅ Update Transaction status=REFUNDED
   - ✅ Reverse komisi affiliate
   - ✅ Reverse revenue share
5. User akses dicabut langsung

**Expected Result**: ❌ User tidak dapat akses, komisi di-reverse

---

## Security Checklist

- [ ] Webhook signature validation HARUS ada
- [ ] Status check HARUS dilakukan sebelum aktivasi
- [ ] Idempotency check untuk prevent duplicate processing
- [ ] Rate limiting untuk prevent spam
- [ ] Log semua webhook (success & failed)
- [ ] Alert admin jika webhook gagal > 3x
- [ ] Encrypt sensitive data di SejoliWebhookLog
- [ ] Validate expiry date (tidak boleh kurang dari order date)
- [ ] Validate amount (tidak boleh negatif atau 0)

---

## Summary

| Sejoli Status | User Role | Membership Active | Transaction Status | Commission | Access |
|---------------|-----------|-------------------|-------------------|------------|---------|
| PENDING | MEMBER_FREE | ❌ No | ❌ None | ❌ No | ❌ No |
| PAID | MEMBER_PREMIUM | ✅ Yes | COMPLETED | ✅ Yes | ✅ Yes |
| EXPIRED | MEMBER_FREE* | ❌ No | COMPLETED | - | ❌ No |
| REFUNDED | MEMBER_FREE* | ❌ No | REFUNDED | ↩️ Reversed | ❌ No |

*) Hanya jika tidak ada membership aktif lainnya

---

**GOLDEN RULE**: 
🔐 **NO PAYMENT = NO ACCESS**  
✅ **PAID ONLY = FULL ACCESS**

**Last Updated**: 9 Desember 2025
