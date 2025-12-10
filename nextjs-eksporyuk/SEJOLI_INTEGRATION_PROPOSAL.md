# Sejoli Integration - Premium Access System

## Konsep Sistem
User yang beli membership di **Sejoli** akan otomatis dapat akses premium di **Eksporyuk** dengan:
- ✅ Durasi akses berdasarkan **data order Sejoli** (bukan membership internal)
- ✅ Dapat akses materi, komunitas, semua fitur sesuai paket
- ✅ Bisa upgrade membership (hitung sisa hari dari Sejoli)
- ✅ **Semua transaksi & komisi tercatat** di Eksporyuk untuk tracking revenue

---

## 1. Database Schema Changes

### A. Tambah Field di `UserMembership`

```prisma
model UserMembership {
  id            String       @id @default(cuid())
  userId        String
  membershipId  String
  startDate     DateTime     @default(now())
  endDate       DateTime
  isActive      Boolean      @default(true)
  autoRenew     Boolean      @default(false)
  status        String       @default("PENDING")
  activatedAt   DateTime?
  price         Decimal?
  transactionId String?      @unique
  
  // ===== NEW FIELDS FOR SEJOLI INTEGRATION =====
  source        MembershipSource @default(INTERNAL)  // SEJOLI or INTERNAL
  sejoliOrderId String?      @unique  // ID order dari Sejoli
  sejoliProductId String?             // ID produk Sejoli
  externalData  Json?                 // Data tambahan dari Sejoli
  remainingDays Int?                  // Cache sisa hari dari Sejoli
  lastSyncAt    DateTime?             // Terakhir sync dengan Sejoli
  // ==============================================
  
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  transaction   Transaction? @relation(fields: [transactionId], references: [id])
  membership    Membership   @relation(fields: [membershipId], references: [id])
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, membershipId])
  @@index([userId])
  @@index([membershipId])
  @@index([endDate])
  @@index([status])
  @@index([source])              // NEW INDEX
  @@index([sejoliOrderId])       // NEW INDEX
}

enum MembershipSource {
  INTERNAL  // Beli langsung di Eksporyuk
  SEJOLI    // Beli via Sejoli
  MANUAL    // Ditambahkan manual oleh admin
}
```

### B. Tambah Model `SejoliWebhookLog`

```prisma
model SejoliWebhookLog {
  id            String   @id @default(cuid())
  orderId       String   @unique
  productId     String
  buyerEmail    String
  buyerName     String
  buyerPhone    String?
  amount        Decimal
  status        String   // paid, expired, refund, dll
  orderDate     DateTime
  expiryDate    DateTime?
  duration      Int?     // Durasi dalam hari
  webhookData   Json     // Raw webhook data from Sejoli
  processed     Boolean  @default(false)
  processedAt   DateTime?
  error         String?
  userId        String?  // Linked user (jika sudah di-mapping)
  membershipId  String?  // Created membership
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([orderId])
  @@index([buyerEmail])
  @@index([processed])
  @@index([status])
}
```

---

## 2. API Endpoints

### A. Webhook dari Sejoli → Eksporyuk

**Endpoint**: `POST /api/webhooks/sejoli`

**Headers**:
```
X-Sejoli-Signature: <hash untuk validasi>
Content-Type: application/json
```

**Payload dari Sejoli** (contoh):
```json
{
  "order_id": "SJ-20251209-001",
  "product_id": "sejoli_premium_3bulan",
  "product_name": "Premium 3 Bulan",
  "buyer_email": "user@example.com",
  "buyer_name": "John Doe",
  "buyer_phone": "08123456789",
  "buyer_whatsapp": "628123456789",
  "amount": 500000,
  "status": "paid",
  "order_date": "2025-12-09T10:00:00Z",
  "expiry_date": "2026-03-09T10:00:00Z",
  "duration_days": 90,
  "metadata": {
    "affiliate_code": "AFF123",
    "coupon_code": "DISC50"
  }
}
```

**Logic Flow**:
1. **Validasi** webhook signature
2. **Log** webhook data ke `SejoliWebhookLog`
3. **Cek/Create User** berdasarkan email
4. **Map Sejoli Product → Eksporyuk Membership**
5. **Create/Update UserMembership** dengan source=SEJOLI
6. **Create Transaction** record untuk tracking revenue
7. **Calculate & Distribute Commission** (jika ada affiliate)
8. **Send Welcome Email/WhatsApp**
9. **Update User Role** ke MEMBER_PREMIUM
10. **Return success response**

### B. Cek Status Membership dari Sejoli

**Endpoint**: `GET /api/memberships/sejoli/status`

**Query**: `?userId={userId}`

**Response**:
```json
{
  "success": true,
  "membership": {
    "id": "cm...",
    "source": "SEJOLI",
    "plan": {
      "name": "Premium 3 Bulan",
      "slug": "premium-3-bulan"
    },
    "startDate": "2025-12-09T10:00:00Z",
    "endDate": "2026-03-09T10:00:00Z",
    "remainingDays": 85,
    "isActive": true,
    "sejoliOrderId": "SJ-20251209-001",
    "canUpgrade": true,
    "upgradeOptions": [
      {
        "planId": "cm...",
        "planName": "Premium 6 Bulan",
        "prorata": 250000,
        "finalPrice": 850000
      }
    ]
  }
}
```

### C. Upgrade Membership (Prorata)

**Endpoint**: `POST /api/memberships/upgrade`

**Body**:
```json
{
  "currentMembershipId": "cm...",
  "targetMembershipId": "cm...",
  "useProrata": true
}
```

**Logic**:
1. Hitung sisa hari dari membership saat ini
2. Hitung nilai prorata (harga/hari × sisa hari)
3. Kurangi dari harga membership baru
4. Create transaction untuk upgrade
5. Update/Create new UserMembership
6. Nonaktifkan membership lama

---

## 3. Product Mapping Config

### File: `/config/sejoli-product-mapping.json`

```json
{
  "mapping": [
    {
      "sejoliProductId": "sejoli_premium_3bulan",
      "sejoliProductName": "Premium 3 Bulan",
      "eksporyukMembershipId": "cm...",
      "eksporyukMembershipSlug": "premium-3-bulan",
      "duration": 90,
      "affiliateCommissionRate": 30,
      "affiliateCommissionType": "PERCENTAGE"
    },
    {
      "sejoliProductId": "sejoli_premium_6bulan",
      "sejoliProductName": "Premium 6 Bulan", 
      "eksporyukMembershipId": "cm...",
      "eksporyukMembershipSlug": "premium-6-bulan",
      "duration": 180,
      "affiliateCommissionRate": 35,
      "affiliateCommissionType": "PERCENTAGE"
    },
    {
      "sejoliProductId": "sejoli_premium_1tahun",
      "sejoliProductName": "Premium 1 Tahun",
      "eksporyukMembershipId": "cm...",
      "eksporyukMembershipSlug": "premium-1-tahun",
      "duration": 365,
      "affiliateCommissionRate": 40,
      "affiliateCommissionType": "PERCENTAGE"
    }
  ]
}
```

---

## 4. Service Layer

### File: `/src/lib/services/sejoliService.ts`

```typescript
import prisma from '@/lib/prisma'
import { calculateRevenueSplit } from '@/lib/revenue-split'
import { notificationService } from './notificationService'

export class SejoliService {
  // Process webhook dari Sejoli
  async processWebhook(webhookData: any) {
    // 1. Save webhook log
    const log = await prisma.sejoliWebhookLog.create({
      data: {
        orderId: webhookData.order_id,
        productId: webhookData.product_id,
        buyerEmail: webhookData.buyer_email,
        buyerName: webhookData.buyer_name,
        buyerPhone: webhookData.buyer_phone,
        amount: webhookData.amount,
        status: webhookData.status,
        orderDate: new Date(webhookData.order_date),
        expiryDate: webhookData.expiry_date ? new Date(webhookData.expiry_date) : null,
        duration: webhookData.duration_days,
        webhookData: webhookData,
      }
    })

    // 2. CRITICAL: Check if payment is completed
    const isPaid = webhookData.status?.toLowerCase() === 'paid' || 
                   webhookData.status?.toLowerCase() === 'completed' ||
                   webhookData.status?.toLowerCase() === 'success'
    
    if (!isPaid) {
      // Log tapi tidak proses lebih lanjut
      console.log(`[SEJOLI] Order ${webhookData.order_id} status: ${webhookData.status} - NOT PAID, skipping activation`)
      
      await prisma.sejoliWebhookLog.update({
        where: { id: log.id },
        data: {
          processed: true,
          processedAt: new Date(),
          error: `Status not paid: ${webhookData.status}`,
        }
      })
      
      return { 
        success: true, 
        message: 'Webhook logged but not processed - payment not completed',
        isPaid: false 
      }
    }

    // 3. Get/Create User (HANYA jika sudah paid)
    let user = await prisma.user.findUnique({
      where: { email: webhookData.buyer_email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: webhookData.buyer_email,
          name: webhookData.buyer_name,
          phone: webhookData.buyer_phone,
          whatsapp: webhookData.buyer_whatsapp,
          role: 'MEMBER_PREMIUM',
          password: null, // Will set via reset password
          emailVerified: true,
        }
      })
    }

    // 3. Map Sejoli Product → Membership
    const mapping = await this.getProductMapping(webhookData.product_id)
    if (!mapping) {
      throw new Error(`No mapping found for Sejoli product: ${webhookData.product_id}`)
    }

    // 4. Create Transaction (COMPLETED karena sudah cek isPaid di atas)
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'MEMBERSHIP',
        status: 'COMPLETED', // Pasti COMPLETED karena sudah cek isPaid
        amount: webhookData.amount,
        customerName: webhookData.buyer_name,
        customerEmail: webhookData.buyer_email,
        customerPhone: webhookData.buyer_phone,
        customerWhatsapp: webhookData.buyer_whatsapp,
        description: `Membership from Sejoli: ${webhookData.product_name}`,
        paymentMethod: 'SEJOLI',
        paymentProvider: 'SEJOLI',
        externalId: webhookData.order_id,
        paidAt: new Date(), // Pasti ada karena sudah paid
      }
    })

    // 5. Create UserMembership (ACTIVE karena sudah paid)
    const userMembership = await prisma.userMembership.create({
      data: {
        userId: user.id,
        membershipId: mapping.eksporyukMembershipId,
        startDate: new Date(webhookData.order_date),
        endDate: new Date(webhookData.expiry_date),
        isActive: true, // TRUE karena sudah paid
        status: 'ACTIVE', // ACTIVE karena sudah paid
        activatedAt: new Date(), // Set activation time
        price: webhookData.amount,
        transactionId: transaction.id,
        source: 'SEJOLI',
        sejoliOrderId: webhookData.order_id,
        sejoliProductId: webhookData.product_id,
        externalData: webhookData,
        remainingDays: webhookData.duration_days,
        lastSyncAt: new Date(),
      }
    })

    // 6. Process Commission (if has affiliate)
    if (webhookData.metadata?.affiliate_code) {
      await this.processAffiliateCommission({
        transaction,
        affiliateCode: webhookData.metadata.affiliate_code,
        amount: webhookData.amount,
        commissionRate: mapping.affiliateCommissionRate,
      })
    }

    // 7. Update webhook log
    await prisma.sejoliWebhookLog.update({
      where: { id: log.id },
      data: {
        processed: true,
        processedAt: new Date(),
        userId: user.id,
        membershipId: userMembership.id,
      }
    })

    // 8. Send notifications
    await notificationService.sendMembershipActivated(user, userMembership)

    return { user, membership: userMembership, transaction }
  }

  // Get remaining days from Sejoli order
  async getRemainingDays(sejoliOrderId: string): Promise<number> {
    const membership = await prisma.userMembership.findFirst({
      where: { sejoliOrderId }
    })

    if (!membership) return 0

    const now = new Date()
    const endDate = new Date(membership.endDate)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  // Calculate prorata for upgrade
  async calculateProrata(currentMembershipId: string, targetMembershipId: string) {
    const currentMembership = await prisma.userMembership.findUnique({
      where: { id: currentMembershipId },
      include: { membership: true }
    })

    if (!currentMembership) throw new Error('Current membership not found')

    const targetMembership = await prisma.membership.findUnique({
      where: { id: targetMembershipId }
    })

    if (!targetMembership) throw new Error('Target membership not found')

    // Hitung sisa hari
    const remainingDays = await this.getRemainingDays(currentMembership.sejoliOrderId!)

    // Hitung nilai prorata (asumsi harga per hari dari current membership)
    const currentPrice = Number(currentMembership.price || 0)
    const currentDuration = currentMembership.membership.duration
    const pricePerDay = currentPrice / currentDuration
    const prorataValue = pricePerDay * remainingDays

    // Harga final = target price - prorata
    const targetPrice = Number(targetMembership.price)
    const finalPrice = Math.max(0, targetPrice - prorataValue)

    return {
      remainingDays,
      prorataValue,
      targetPrice,
      finalPrice,
      discount: prorataValue,
    }
  }

  // Product mapping helper
  private async getProductMapping(sejoliProductId: string) {
    // Load from config or database
    const { mapping } = require('@/config/sejoli-product-mapping.json')
    return mapping.find((m: any) => m.sejoliProductId === sejoliProductId)
  }
}

export const sejoliService = new SejoliService()
```

---

## 5. Environment Variables

Add to `.env`:

```env
# Sejoli Integration
SEJOLI_WEBHOOK_SECRET="your-sejoli-webhook-secret"
SEJOLI_API_KEY="your-sejoli-api-key"
SEJOLI_API_URL="https://api.sejoli.co.id"
SEJOLI_ENABLED="true"
```

---

## 6. Admin Dashboard Features

### A. Sejoli Orders Management

**Page**: `/admin/sejoli/orders`

**Features**:
- ✅ List semua order dari Sejoli
- ✅ Filter by status (paid, expired, refund)
- ✅ Search by email, order ID
- ✅ View raw webhook data
- ✅ Manual re-process jika gagal
- ✅ Link to user & membership

### B. Product Mapping Management

**Page**: `/admin/sejoli/product-mapping`

**Features**:
- ✅ Map Sejoli Product → Eksporyuk Membership
- ✅ Set commission rate per product
- ✅ Enable/disable specific products
- ✅ Test webhook processing

### C. Sync Status

**Feature**: Button "Sync from Sejoli" di user detail page

**Logic**:
- Call Sejoli API untuk cek status order terbaru
- Update `remainingDays` dan `lastSyncAt`
- Update `endDate` jika ada perubahan
- Show sync log

---

## 7. User Dashboard Features

### A. Membership Info Card

```tsx
// components/dashboard/SejoliMembershipCard.tsx
{membership.source === 'SEJOLI' && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="secondary">Sejoli Premium</Badge>
      <Badge variant="outline">{remainingDays} hari tersisa</Badge>
    </div>
    <p className="text-sm text-gray-600 mb-3">
      Order ID: {membership.sejoliOrderId}
    </p>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-500">Mulai:</span>
        <p className="font-medium">{formatDate(membership.startDate)}</p>
      </div>
      <div>
        <span className="text-gray-500">Berakhir:</span>
        <p className="font-medium">{formatDate(membership.endDate)}</p>
      </div>
    </div>
    <Button className="w-full mt-3" onClick={handleUpgrade}>
      Upgrade Membership
    </Button>
  </div>
)}
```

### B. Upgrade Flow with Prorata

1. User click "Upgrade Membership"
2. Show available upgrade options
3. Calculate prorata discount
4. Show price comparison:
   ```
   Premium 6 Bulan: Rp 1.000.000
   Diskon prorata (85 hari): - Rp 350.000
   ──────────────────────────────────
   Total Bayar: Rp 650.000
   ```
5. Proceed to checkout

---

## 8. Revenue & Commission Tracking

### Key Point
**SEMUA transaksi dari Sejoli HARUS tercatat di Eksporyuk** untuk:
- ✅ Revenue reporting yang akurat
- ✅ Tracking affiliate commission
- ✅ Founder/Co-Founder revenue share
- ✅ Admin fee calculation

### Commission Flow dari Sejoli Order

```typescript
// When webhook received from Sejoli
const transaction = await prisma.transaction.create({
  data: {
    // ... transaction data
    amount: 500000,
    paymentProvider: 'SEJOLI',
  }
})

// Calculate commission split
const revenueSplit = calculateRevenueSplit({
  amount: 500000,
  affiliateCommissionRate: 30, // From product mapping
  affiliateCode: 'AFF123',
})

// Result:
// - Affiliate: 150,000 (30%)
// - Remaining: 350,000
//   - Admin: 52,500 (15%)
//   - Founder: 178,500 (60% of 297,500)
//   - Co-Founder: 119,000 (40% of 297,500)

// Update wallets
await updateWallets(revenueSplit)
```

---

## 9. Migration Steps

### Step 1: Update Schema
```bash
cd nextjs-eksporyuk
npx prisma db push
npx prisma generate
```

### Step 2: Create Mapping Config
```bash
touch config/sejoli-product-mapping.json
# Edit with actual product IDs
```

### Step 3: Create API Endpoints
```bash
mkdir -p src/app/api/webhooks/sejoli
touch src/app/api/webhooks/sejoli/route.ts
```

### Step 4: Create Service
```bash
touch src/lib/services/sejoliService.ts
```

### Step 5: Create Admin Pages
```bash
mkdir -p src/app/(dashboard)/admin/sejoli/orders
mkdir -p src/app/(dashboard)/admin/sejoli/product-mapping
```

### Step 6: Test Webhook
```bash
# Use ngrok or similar for local testing
ngrok http 3000

# Configure Sejoli webhook URL:
# https://your-ngrok-url.ngrok.io/api/webhooks/sejoli
```

---

## 10. Testing Checklist

### Webhook Processing
- [ ] Webhook signature validation
- [ ] **Check status = PAID before processing** ⚠️ CRITICAL
- [ ] Reject/skip if status != PAID
- [ ] Create new user from Sejoli order (only if PAID)
- [ ] Map Sejoli product to membership
- [ ] Create transaction record (status COMPLETED only if PAID)
- [ ] Create UserMembership with source=SEJOLI (isActive=true only if PAID)
- [ ] Calculate commission correctly (only if PAID)
- [ ] Send welcome notifications (only if PAID)
- [ ] Handle duplicate webhooks (idempotency)
- [ ] Handle status updates (paid → expired, paid → refund)

### User Experience
- [ ] User can see remaining days
- [ ] User can upgrade with prorata
- [ ] User has access to all features
- [ ] Membership expires correctly
- [ ] Renewal reminders work

### Admin Features
- [ ] View all Sejoli orders
- [ ] Manual re-process failed webhooks
- [ ] Product mapping management
- [ ] Revenue reports include Sejoli sales

### Revenue & Commission
- [ ] All Sejoli sales recorded in transactions
- [ ] Affiliate commission calculated correctly
- [ ] Founder/Co-Founder share distributed
- [ ] Admin fee applied
- [ ] Wallet balances updated

---

## 11. Security Considerations

1. **Webhook Signature Validation**
   ```typescript
   import crypto from 'crypto'
   
   function validateSejoliSignature(payload: string, signature: string): boolean {
     const secret = process.env.SEJOLI_WEBHOOK_SECRET!
     const hash = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex')
     return hash === signature
   }
   ```

2. **Idempotency** - Prevent duplicate processing
   ```typescript
   const existing = await prisma.sejoliWebhookLog.findUnique({
     where: { orderId: webhookData.order_id }
   })
   if (existing && existing.processed) {
     return { success: true, message: 'Already processed' }
   }
   ```

3. **Rate Limiting** - Prevent webhook spam

4. **Input Validation** - Validate all webhook data with Zod

---

## 12. Monitoring & Alerts

### Webhook Failures
- Log all failed webhooks to `SejoliWebhookLog.error`
- Send alert to admin jika ada webhook gagal > 3x
- Dashboard showing webhook success rate

### Sync Issues
- Alert jika ada membership yang `lastSyncAt` > 7 hari
- Cron job untuk auto-sync status dari Sejoli

### Commission Discrepancies
- Compare total transactions vs total commission distributed
- Alert jika ada mismatch

---

## Summary

Sistem ini memungkinkan:
1. ✅ **User dari Sejoli otomatis dapat akses** di Eksporyuk
2. ✅ **Durasi akses dari Sejoli**, bukan dari membership internal
3. ✅ **Upgrade dengan prorata** berdasarkan sisa hari
4. ✅ **Semua revenue & komisi tercatat** di Eksporyuk
5. ✅ **Admin dapat manage** semua order dari Sejoli
6. ✅ **Reporting lengkap** untuk revenue & commission

**Next Steps**:
1. Dapatkan API documentation dari Sejoli
2. Dapatkan webhook format & signature method
3. Setup Sejoli product IDs dan mapping
4. Implement schema changes
5. Implement webhook endpoint
6. Test end-to-end flow
7. Deploy & monitor

---

**Status**: 📋 PROPOSAL - Ready for implementation
**Last Updated**: 9 Desember 2025
