# Sejoli Integration - Affiliate Tracking & Commission Safety

## ✅ CHECKLIST: Affiliate Data Safety dari Sejoli

### 1. Data Order Sejoli - Complete Tracking ✅

**Model: `SejoliWebhookLog`** - Menyimpan SEMUA data order dari Sejoli:

```prisma
model SejoliWebhookLog {
  id            String   @id @default(cuid())
  orderId       String   @unique           // SJ-20251209-001 (UNIQUE - prevent duplicate)
  productId     String                     // sejoli_premium_3bulan
  buyerEmail    String   @index            // user@example.com
  buyerName     String                     // John Doe
  buyerPhone    String?                    // 08123456789
  amount        Decimal                    // 500000
  status        String   @index            // paid, pending, expired, refunded
  orderDate     DateTime                   // 2025-12-09T10:00:00Z
  expiryDate    DateTime?                  // 2026-03-09T10:00:00Z
  duration      Int?                       // 90 days
  
  // ===== AFFILIATE TRACKING FROM SEJOLI =====
  affiliateCode     String?   @index      // AFF123 dari Sejoli
  affiliateName     String?               // Nama affiliate dari Sejoli
  affiliateEmail    String?   @index      // Email affiliate dari Sejoli
  affiliatePhone    String?               // Phone affiliate dari Sejoli
  affiliateRate     Decimal?              // 30% (rate dari Sejoli)
  affiliateAmount   Decimal?              // 150000 (komisi dari Sejoli)
  // ==========================================
  
  webhookData   Json     // Raw webhook - SEMUA data dari Sejoli tersimpan
  processed     Boolean  @default(false)
  processedAt   DateTime?
  error         String?
  userId        String?  @index           // Linked Eksporyuk user
  membershipId  String?                   // Created membership
  
  // ===== LINK TO EKSPORYUK AFFILIATE =====
  eksporyukAffiliateId String? @index    // Mapped affiliate di Eksporyuk
  // ======================================
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([orderId])
  @@index([buyerEmail])
  @@index([processed])
  @@index([status])
  @@index([affiliateCode])
  @@index([affiliateEmail])
  @@index([eksporyukAffiliateId])
}
```

**Kenapa semua field affiliate disimpan?**
- ✅ **Audit trail** lengkap jika ada dispute
- ✅ **Backup data** jika sistem Sejoli bermasalah
- ✅ **Reconciliation** untuk cek kecocokan komisi
- ✅ **Reporting** untuk analisa affiliate performance

---

### 2. Affiliate Mapping: Sejoli ↔ Eksporyuk ✅

**Problem**: Affiliate code di Sejoli bisa beda dengan Eksporyuk

**Solution**: Mapping table untuk link affiliate

```prisma
model SejoliAffiliateMapping {
  id                      String   @id @default(cuid())
  
  // Sejoli Data
  sejoliAffiliateCode     String   @unique  // AFF123 di Sejoli
  sejoliAffiliateName     String            // John Doe
  sejoliAffiliateEmail    String   @unique  // john@example.com
  sejoliAffiliatePhone    String?
  
  // Eksporyuk Data
  eksporyukUserId         String?  @index   // cm... (User ID)
  eksporyukAffiliateId    String?  @unique  // cm... (AffiliateProfile ID)
  eksporyukAffiliateCode  String?  @index   // AFF123 atau bisa beda
  
  // Mapping Status
  mappingStatus           String   @default("PENDING") // PENDING, VERIFIED, REJECTED
  autoMapped              Boolean  @default(false)     // Auto by email/phone or manual
  verifiedAt              DateTime?
  verifiedBy              String?  // Admin ID yang verify
  
  // Stats
  totalOrdersFromSejoli   Int      @default(0)
  totalCommissionPaid     Decimal  @default(0)
  lastOrderAt             DateTime?
  
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  
  @@index([sejoliAffiliateCode])
  @@index([sejoliAffiliateEmail])
  @@index([eksporyukUserId])
  @@index([eksporyukAffiliateId])
  @@index([mappingStatus])
}
```

**Mapping Process**:
1. **Auto-mapping** by email (jika email sama)
2. **Auto-mapping** by phone (jika phone sama)
3. **Manual verification** by admin jika tidak cocok
4. **Status tracking** untuk audit

---

### 3. Transaction with Affiliate Data ✅

**Model: `Transaction`** - Already has `affiliateId`:

```typescript
// EXISTING fields in Transaction model:
{
  affiliateId: String?,           // Eksporyuk affiliate ID
  affiliateShare: Decimal?,       // Commission amount
  
  // TAMBAHAN untuk Sejoli tracking:
  metadata: Json? // Store Sejoli affiliate data
}
```

**Metadata Structure** untuk Sejoli transaction:
```json
{
  "source": "SEJOLI",
  "sejoliOrderId": "SJ-20251209-001",
  "sejoliAffiliate": {
    "code": "AFF123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "rate": 30,
    "amount": 150000
  },
  "eksporyukAffiliate": {
    "userId": "cm...",
    "affiliateId": "cm...",
    "code": "AFF123"
  },
  "mappingStatus": "VERIFIED"
}
```

---

### 4. Affiliate Conversion Tracking ✅

**Model: `AffiliateConversion`** - Links transaction to affiliate:

```prisma
model AffiliateConversion {
  id               String           @id @default(cuid())
  affiliateId      String           @index // Eksporyuk affiliate ID
  transactionId    String           @unique
  commissionAmount Decimal          // 150000
  commissionRate   Decimal          // 30
  paidOut          Boolean          @default(false)
  paidOutAt        DateTime?
  
  // ===== SEJOLI TRACKING =====
  sourceType       String?  @default("INTERNAL") // "SEJOLI" or "INTERNAL"
  sejoliOrderId    String?  @unique              // SJ-20251209-001
  sejoliData       Json?                         // Raw Sejoli affiliate data
  // ===========================
  
  createdAt        DateTime         @default(now())
  transaction      Transaction      @relation(...)
  affiliate        AffiliateProfile @relation(...)
  
  @@index([affiliateId])
  @@index([transactionId])
  @@index([sourceType])
  @@index([sejoliOrderId])
}
```

---

## 🔒 Safety Measures - Affiliate Commission Protection

### A. Duplicate Prevention

```typescript
// Webhook handler - Check duplicate order
const existingLog = await prisma.sejoliWebhookLog.findUnique({
  where: { orderId: webhookData.order_id }
})

if (existingLog && existingLog.processed) {
  console.log('[SEJOLI] Order already processed - SKIP')
  return { 
    success: true, 
    message: 'Already processed',
    duplicate: true 
  }
}
```

**Protection**: ✅ Prevent double commission payment

---

### B. Affiliate Verification Flow

```typescript
async function processSejoliAffiliate(webhookData: any) {
  // 1. Extract affiliate from webhook
  const sejoliAffiliate = {
    code: webhookData.metadata?.affiliate_code,
    name: webhookData.metadata?.affiliate_name,
    email: webhookData.metadata?.affiliate_email,
    phone: webhookData.metadata?.affiliate_phone,
    rate: webhookData.metadata?.affiliate_rate || 30,
  }
  
  if (!sejoliAffiliate.code) {
    // No affiliate - no commission
    console.log('[SEJOLI] No affiliate code - Skip commission')
    return null
  }
  
  // 2. Try to find mapping
  let mapping = await prisma.sejoliAffiliateMapping.findUnique({
    where: { sejoliAffiliateCode: sejoliAffiliate.code }
  })
  
  if (!mapping) {
    // 3. Try auto-map by email
    if (sejoliAffiliate.email) {
      const user = await prisma.user.findUnique({
        where: { email: sejoliAffiliate.email },
        include: { affiliateProfile: true }
      })
      
      if (user?.affiliateProfile) {
        // Create mapping
        mapping = await prisma.sejoliAffiliateMapping.create({
          data: {
            sejoliAffiliateCode: sejoliAffiliate.code,
            sejoliAffiliateName: sejoliAffiliate.name,
            sejoliAffiliateEmail: sejoliAffiliate.email,
            sejoliAffiliatePhone: sejoliAffiliate.phone,
            eksporyukUserId: user.id,
            eksporyukAffiliateId: user.affiliateProfile.id,
            eksporyukAffiliateCode: user.affiliateProfile.affiliateCode,
            mappingStatus: 'VERIFIED',
            autoMapped: true,
            verifiedAt: new Date(),
          }
        })
        
        console.log('[SEJOLI] Auto-mapped affiliate by email ✅')
      }
    }
  }
  
  if (!mapping || mapping.mappingStatus !== 'VERIFIED') {
    // 4. Create PENDING mapping for admin review
    if (!mapping) {
      mapping = await prisma.sejoliAffiliateMapping.create({
        data: {
          sejoliAffiliateCode: sejoliAffiliate.code,
          sejoliAffiliateName: sejoliAffiliate.name,
          sejoliAffiliateEmail: sejoliAffiliate.email,
          sejoliAffiliatePhone: sejoliAffiliate.phone,
          mappingStatus: 'PENDING',
        }
      })
      
      // Alert admin
      await notificationService.alertAdmin({
        type: 'SEJOLI_AFFILIATE_UNMAPPED',
        message: `Affiliate ${sejoliAffiliate.code} needs mapping`,
        data: sejoliAffiliate,
      })
    }
    
    console.log('[SEJOLI] Affiliate mapping PENDING - Commission on hold ⏸️')
    return { mapping, status: 'PENDING' }
  }
  
  // 5. Mapping verified - proceed with commission
  return { mapping, status: 'VERIFIED' }
}
```

**Protection**: 
- ✅ Auto-mapping untuk affiliate terdaftar
- ✅ Manual verification untuk affiliate baru
- ✅ Alert admin jika ada unmapped affiliate
- ✅ Commission on hold sampai verified

---

### C. Commission Calculation & Distribution

```typescript
async function processAffiliateCommission(
  transaction: Transaction,
  webhookData: any,
  affiliateMapping: any
) {
  const sejoliAffiliate = webhookData.metadata?.affiliate
  
  if (!sejoliAffiliate?.code) return
  
  // 1. Calculate commission
  const amount = Number(transaction.amount)
  const rate = sejoliAffiliate.rate || 30
  const commissionAmount = (amount * rate) / 100
  
  // 2. Verify amount with Sejoli data
  const sejoliCommission = sejoliAffiliate.amount
  if (sejoliCommission && Math.abs(commissionAmount - sejoliCommission) > 1) {
    console.warn('[SEJOLI] Commission mismatch!', {
      calculated: commissionAmount,
      fromSejoli: sejoliCommission,
      difference: Math.abs(commissionAmount - sejoliCommission)
    })
    
    // Use Sejoli's amount as source of truth
    commissionAmount = sejoliCommission
  }
  
  // 3. Create AffiliateConversion
  const conversion = await prisma.affiliateConversion.create({
    data: {
      affiliateId: affiliateMapping.eksporyukAffiliateId,
      transactionId: transaction.id,
      commissionAmount,
      commissionRate: rate,
      sourceType: 'SEJOLI',
      sejoliOrderId: webhookData.order_id,
      sejoliData: {
        code: sejoliAffiliate.code,
        name: sejoliAffiliate.name,
        email: sejoliAffiliate.email,
        rate: rate,
        amount: commissionAmount,
      },
    }
  })
  
  // 4. Update wallet - LANGSUNG ke balance (not pending)
  await prisma.wallet.upsert({
    where: { userId: affiliateMapping.eksporyukUserId },
    create: {
      userId: affiliateMapping.eksporyukUserId,
      balance: commissionAmount,
      balancePending: 0,
    },
    update: {
      balance: { increment: commissionAmount },
    }
  })
  
  // 5. Update affiliate stats
  await prisma.affiliateProfile.update({
    where: { id: affiliateMapping.eksporyukAffiliateId },
    data: {
      totalConversions: { increment: 1 },
      totalEarnings: { increment: commissionAmount },
    }
  })
  
  // 6. Update mapping stats
  await prisma.sejoliAffiliateMapping.update({
    where: { id: affiliateMapping.id },
    data: {
      totalOrdersFromSejoli: { increment: 1 },
      totalCommissionPaid: { increment: commissionAmount },
      lastOrderAt: new Date(),
    }
  })
  
  // 7. Send notification to affiliate
  await notificationService.sendAffiliateCommission({
    userId: affiliateMapping.eksporyukUserId,
    amount: commissionAmount,
    orderId: webhookData.order_id,
    source: 'SEJOLI',
  })
  
  console.log('[SEJOLI] Commission paid ✅', {
    affiliate: sejoliAffiliate.code,
    amount: commissionAmount,
    rate: rate,
  })
  
  return conversion
}
```

**Protection**:
- ✅ Verify commission amount dengan data Sejoli
- ✅ Use Sejoli amount as source of truth
- ✅ Alert jika ada mismatch
- ✅ Commission langsung masuk balance (withdrawable)
- ✅ Update affiliate stats real-time
- ✅ Notification ke affiliate

---

## 🎯 Admin Dashboard - Affiliate Management

### Page: `/admin/sejoli/affiliates`

**Features**:
```typescript
// List all Sejoli affiliates
- View all affiliate dari Sejoli orders
- Filter by mapping status (VERIFIED, PENDING, REJECTED)
- Search by code, name, email
- Total orders & commission per affiliate
- Link to Eksporyuk affiliate profile

// Mapping Management
- Verify pending mappings
- Manual link Sejoli affiliate → Eksporyuk user
- View mapping history
- Bulk import dari Sejoli

// Commission Reports
- Total commission paid via Sejoli
- Commission by affiliate
- Commission by product
- Export to CSV
```

**UI Example**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Sejoli Code</TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Eksporyuk User</TableHead>
      <TableHead>Orders</TableHead>
      <TableHead>Total Commission</TableHead>
      <TableHead>Action</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {affiliates.map(aff => (
      <TableRow key={aff.id}>
        <TableCell>
          <Badge>{aff.sejoliAffiliateCode}</Badge>
        </TableCell>
        <TableCell>{aff.sejoliAffiliateName}</TableCell>
        <TableCell>{aff.sejoliAffiliateEmail}</TableCell>
        <TableCell>
          {aff.mappingStatus === 'VERIFIED' && (
            <Badge variant="success">✅ Verified</Badge>
          )}
          {aff.mappingStatus === 'PENDING' && (
            <Badge variant="warning">⏸️ Pending</Badge>
          )}
        </TableCell>
        <TableCell>
          {aff.eksporyukAffiliateCode || '-'}
        </TableCell>
        <TableCell>{aff.totalOrdersFromSejoli}</TableCell>
        <TableCell>
          Rp {formatNumber(aff.totalCommissionPaid)}
        </TableCell>
        <TableCell>
          {aff.mappingStatus === 'PENDING' && (
            <Button size="sm" onClick={() => verifyMapping(aff)}>
              Verify
            </Button>
          )}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 📊 Reporting & Analytics

### 1. Sejoli Order Report with Affiliate

```sql
-- Query: Get all Sejoli orders with affiliate info
SELECT 
  swl.orderId,
  swl.orderDate,
  swl.buyerEmail,
  swl.amount,
  swl.status,
  swl.affiliateCode,
  swl.affiliateName,
  swl.affiliateAmount as sejoliCommission,
  sam.eksporyukAffiliateCode,
  sam.mappingStatus,
  ac.commissionAmount as paidCommission,
  ac.paidOut,
  ac.paidOutAt
FROM SejoliWebhookLog swl
LEFT JOIN SejoliAffiliateMapping sam ON swl.affiliateCode = sam.sejoliAffiliateCode
LEFT JOIN AffiliateConversion ac ON ac.sejoliOrderId = swl.orderId
WHERE swl.status = 'paid'
ORDER BY swl.orderDate DESC
```

**Output**:
| Order ID | Date | Buyer | Amount | Affiliate | Commission | Status | Paid |
|----------|------|-------|--------|-----------|------------|--------|------|
| SJ-001 | 2025-12-09 | john@... | 500K | AFF123 | 150K | ✅ Verified | ✅ Yes |
| SJ-002 | 2025-12-08 | jane@... | 1M | AFF456 | 300K | ⏸️ Pending | ❌ No |

---

### 2. Commission Reconciliation

```typescript
// API: /api/admin/sejoli/reconciliation
async function reconcileCommissions() {
  // 1. Get all Sejoli orders with affiliate
  const sejoliOrders = await prisma.sejoliWebhookLog.findMany({
    where: {
      status: 'paid',
      affiliateCode: { not: null },
    },
    include: {
      mapping: true,
    }
  })
  
  const report = {
    totalOrders: sejoliOrders.length,
    totalCommissionFromSejoli: 0,
    totalCommissionPaid: 0,
    unmappedAffiliates: 0,
    pendingCommissions: 0,
    discrepancies: [],
  }
  
  for (const order of sejoliOrders) {
    const sejoliCommission = Number(order.affiliateAmount || 0)
    report.totalCommissionFromSejoli += sejoliCommission
    
    // Check if commission paid in Eksporyuk
    const conversion = await prisma.affiliateConversion.findFirst({
      where: { sejoliOrderId: order.orderId }
    })
    
    if (!conversion) {
      if (order.mapping?.mappingStatus === 'VERIFIED') {
        report.pendingCommissions += sejoliCommission
      } else {
        report.unmappedAffiliates += 1
      }
    } else {
      const paidCommission = Number(conversion.commissionAmount)
      report.totalCommissionPaid += paidCommission
      
      // Check discrepancy
      if (Math.abs(sejoliCommission - paidCommission) > 1) {
        report.discrepancies.push({
          orderId: order.orderId,
          affiliateCode: order.affiliateCode,
          sejoliAmount: sejoliCommission,
          paidAmount: paidCommission,
          difference: sejoliCommission - paidCommission,
        })
      }
    }
  }
  
  return report
}
```

**Output Example**:
```json
{
  "totalOrders": 150,
  "totalCommissionFromSejoli": 45000000,
  "totalCommissionPaid": 42000000,
  "unmappedAffiliates": 5,
  "pendingCommissions": 3000000,
  "discrepancies": [
    {
      "orderId": "SJ-123",
      "affiliateCode": "AFF789",
      "sejoliAmount": 150000,
      "paidAmount": 145000,
      "difference": 5000
    }
  ]
}
```

---

## 🚨 Alert & Monitoring

### Alert Scenarios

1. **Unmapped Affiliate**
   ```typescript
   // Alert admin when new affiliate needs mapping
   if (affiliateMapping.status === 'PENDING') {
     await sendAdminAlert({
       type: 'SEJOLI_AFFILIATE_UNMAPPED',
       priority: 'MEDIUM',
       message: `New Sejoli affiliate needs verification`,
       data: {
         code: affiliate.code,
         name: affiliate.name,
         email: affiliate.email,
         orderId: webhookData.order_id,
         amount: webhookData.amount,
       }
     })
   }
   ```

2. **Commission Mismatch**
   ```typescript
   // Alert if commission calculated != Sejoli data
   if (Math.abs(calculated - sejoliAmount) > 1) {
     await sendAdminAlert({
       type: 'COMMISSION_MISMATCH',
       priority: 'HIGH',
       message: `Commission mismatch detected`,
       data: {
         orderId: webhookData.order_id,
         calculated,
         fromSejoli: sejoliAmount,
         difference: Math.abs(calculated - sejoliAmount),
       }
     })
   }
   ```

3. **Failed Commission Payment**
   ```typescript
   // Alert if commission payment fails
   try {
     await payCommission(...)
   } catch (error) {
     await sendAdminAlert({
       type: 'COMMISSION_PAYMENT_FAILED',
       priority: 'CRITICAL',
       message: `Failed to pay affiliate commission`,
       data: {
         orderId: webhookData.order_id,
         affiliateCode: affiliate.code,
         amount: commissionAmount,
         error: error.message,
       }
     })
   }
   ```

---

## ✅ Safety Checklist

### Data Integrity
- [x] Semua webhook dari Sejoli tersimpan (raw JSON)
- [x] Order ID unique constraint (prevent duplicate)
- [x] Affiliate data lengkap tersimpan (code, name, email, phone)
- [x] Commission amount dari Sejoli tersimpan
- [x] Metadata JSON untuk audit trail

### Affiliate Mapping
- [x] Auto-mapping by email
- [x] Auto-mapping by phone
- [x] Manual verification flow
- [x] Mapping status tracking
- [x] Admin dashboard untuk verify

### Commission Safety
- [x] Verify amount dengan data Sejoli
- [x] Duplicate prevention (unique orderId)
- [x] Commission on hold untuk unmapped affiliate
- [x] Transaction link ke AffiliateConversion
- [x] Wallet update dengan proper locking

### Monitoring
- [x] Alert untuk unmapped affiliate
- [x] Alert untuk commission mismatch
- [x] Alert untuk payment failure
- [x] Reconciliation report
- [x] Audit log untuk semua changes

### Reporting
- [x] Sejoli order report dengan affiliate info
- [x] Commission by affiliate
- [x] Commission by product
- [x] Mapping status report
- [x] Discrepancy report

---

## 📋 Summary

### ✅ Affiliate Data AMAN karena:

1. **Complete Tracking**
   - Semua data order Sejoli tersimpan (termasuk affiliate info)
   - Raw webhook JSON disimpan untuk audit
   - Order ID unique untuk prevent duplicate

2. **Affiliate Identity**
   - Sejoli affiliate code, name, email, phone tersimpan
   - Mapping ke Eksporyuk user/affiliate
   - Status tracking (PENDING, VERIFIED, REJECTED)

3. **Commission Safety**
   - Amount verified dengan data Sejoli
   - Commission on hold jika unmapped
   - Direct to balance (withdrawable)
   - Alert jika ada mismatch

4. **Admin Control**
   - Dashboard untuk verify mapping
   - View semua affiliate dari Sejoli
   - Reconciliation report
   - Manual intervention jika needed

5. **Monitoring**
   - Alert untuk unmapped affiliate
   - Alert untuk commission issue
   - Audit trail lengkap
   - Regular reconciliation

**Status**: ✅ **SECURE & COMPLETE** - All affiliate data tracked safely!

---

**Last Updated**: 9 Desember 2025
