# ✅ COUPON SYSTEM COMPLETE - Kupon Turunan untuk Affiliate

## 🎯 FITUR YANG DIAKTIFKAN

### 1. **Sistem Kupon Parent-Child (Kupon Turunan)**

#### Konsep:
- **Kupon Parent**: Kupon induk yang dibuat oleh admin dengan settingan lengkap
- **Kupon Child**: Kupon turunan yang di-generate dari parent untuk affiliate atau campaign tertentu
- Parent bisa punya banyak child, tapi child tidak bisa punya child lagi

#### Use Case:
1. **Affiliate Marketing**:
   - Admin buat kupon parent: `DISKON50` (50% off)
   - Enable affiliate untuk kupon ini
   - Affiliate bisa generate child: `DISKON50-DINDA123`, `DISKON50-RARA456`
   - Setiap child punya tracking sendiri untuk komisi

2. **Campaign Specific**:
   - Admin buat kupon parent: `PROMO100`
   - Generate child untuk campaign tertentu: `PROMO100-IG`, `PROMO100-FB`
   - Tracking platform mana yang lebih efektif

3. **Limited Distribution**:
   - Set max generate per affiliate: 5 kupon
   - Set max usage per child kupon: 10x penggunaan
   - Kontrol distribusi dan penggunaan

---

## 📊 DATABASE SCHEMA CHANGES

### Coupon Model - Updated Fields:

```prisma
model Coupon {
  id                      String    @id @default(cuid())
  code                    String    @unique           // ✅ Now unique
  
  // ... existing fields ...
  
  // NEW FIELDS for Parent-Child Relationship
  basedOnCouponId         String?                      // ID kupon parent (null = parent kupon)
  parentCoupon            Coupon?   @relation("CouponHierarchy", fields: [basedOnCouponId], references: [id], onDelete: Cascade)
  childCoupons            Coupon[]  @relation("CouponHierarchy")
  
  affiliateId             String?                      // Affiliate yang punya child kupon ini
  generatedBy             String?                      // Admin ID yang generate child kupon
  
  // Indexes for performance
  @@index([code])
  @@index([basedOnCouponId])
  @@index([affiliateId])
  @@index([isActive])
  @@index([isAffiliateEnabled])
}
```

**Key Changes**:
1. ✅ `code` sekarang **unique** - tidak boleh duplikat
2. ✅ Added **self-relation** `CouponHierarchy` untuk parent-child
3. ✅ Added `affiliateId` untuk tracking ownership
4. ✅ Added `generatedBy` untuk audit trail
5. ✅ Added **indexes** untuk query performance

---

## 🔧 API ENDPOINTS

### 1. GET `/api/admin/coupons`
**Updated**: Sekarang support filtering by type

**Query Parameters**:
- `type=parent` - Get only parent coupons
- `type=child` - Get only child coupons  
- `parentId={id}` - Get child coupons for specific parent
- No params - Get all coupons

**Response**:
```json
{
  "coupons": [
    {
      "id": "...",
      "code": "DISKON50",
      "discountType": "PERCENTAGE",
      "discountValue": 50,
      "isAffiliateEnabled": true,
      "maxGeneratePerAffiliate": 5,
      "maxUsagePerCoupon": 10,
      "_count": {
        "childCoupons": 12  // Total child coupons
      },
      "parentCoupon": null    // Null = ini parent
    }
  ]
}
```

### 2. POST `/api/admin/coupons/generate-child`
**NEW ENDPOINT**: Generate child coupons from parent

**Request Body**:
```json
{
  "parentCouponId": "clxxx...",
  "affiliateId": "usr_xxx",      // Optional
  "count": 5,                     // Generate 5 kupon sekaligus
  "codePrefix": "DINDA",          // Optional: DINDA-XXXXX
  "customCode": "DISKON50-SPECIAL" // Optional: exact code
}
```

**Response**:
```json
{
  "coupons": [...],
  "count": 5,
  "message": "Berhasil generate 5 kupon"
}
```

**Validation**:
- ✅ Parent must exist
- ✅ Parent must have `isAffiliateEnabled = true`
- ✅ Check `maxGeneratePerAffiliate` limit
- ✅ Auto-generate unique codes if not provided
- ✅ Child inherits parent's properties (discount, validity, min purchase, etc)
- ✅ Child cannot generate more children (`isAffiliateEnabled = false`)

### 3. PATCH `/api/admin/coupons/[id]`
**Existing**: Update coupon (parent or child)

### 4. DELETE `/api/admin/coupons/[id]`
**Existing**: Delete coupon
- ⚠️ **Cascade Delete**: Deleting parent akan hapus semua child nya

---

## 🎨 UI/UX - TAB SYSTEM

### Admin Coupons Page - 2 Tabs:

#### Tab 1: **Kupon Parent** 
```
┌─────────────────────────────────────────────────┐
│ Kupon Parent (25)                               │
├─────────────────────────────────────────────────┤
│                                                  │
│ Kode     │ Diskon │ Turunan │ Usage │ Status    │
│──────────────────────────────────────────────────│
│ DISKON50 │ 50%    │ 🔀 12   │ 45/∞  │ ✅ Aktif │
│ [Copy] [Affiliate Badge] [Renewal Badge]        │
│                                                  │
│ Actions: [Edit] [Delete]                       │
└─────────────────────────────────────────────────┘
```

Features:
- ✅ Show child coupon count with icon
- ✅ Badge untuk "Affiliate Ready" and "Renewal"
- ✅ Progress bar untuk usage limit
- ✅ Toggle active/inactive
- ✅ Copy code button

#### Tab 2: **Kupon Turunan**
```
┌─────────────────────────────────────────────────┐
│ Kupon Turunan (47)                              │
├─────────────────────────────────────────────────┤
│                                                  │
│ Kode          │ Parent    │ Diskon │ Usage      │
│──────────────────────────────────────────────────│
│ DISKON50-ABC  │ DISKON50  │ 50%    │ 8/10       │
│ [Purple Badge]                                   │
│                                                  │
│ Actions: [Delete]                               │
└─────────────────────────────────────────────────┘
```

Features:
- ✅ Show parent badge with link
- ✅ Purple theme untuk differentiate from parent
- ✅ Progress bar untuk usage (child specific limit)
- ✅ Delete only (edit disabled untuk maintain consistency)

---

## 🚀 STATS DASHBOARD

```
┌───────────────┬────────────────┬───────────────┬──────────┐
│ Total Kupon   │ Kupon Parent   │ Kupon Turunan │ Aktif    │
│     72        │      25        │      47       │    68    │
├───────────────┴────────────────┴───────────────┴──────────┤
│ Affiliate Ready │ Total Penggunaan                        │
│       18        │        1,234                            │
└──────────────────────────────────────────────────────────┘
```

Icons:
- 📈 TrendingUp - Total Kupon
- 🔀 GitFork - Kupon Turunan
- 👥 Users - Affiliate Ready
- ✅ - Active Coupons

---

## 🔥 GENERATE CHILD MODAL

### Form Fields:

1. **Pilih Kupon Parent** * (Required)
   - Dropdown hanya show parent dengan `isAffiliateEnabled = true`
   - Show detail parent: discount, limits, validity

2. **Jumlah Generate**
   - Default: 1
   - Max: 100 (untuk bulk generation)

3. **Prefix Kode** (Optional)
   - Custom prefix: `DINDA` → `DINDA-ABC123`
   - If empty: use parent code → `DISKON50-ABC123`

4. **Kode Custom** (Optional)
   - Exact code: `DISKON50-SPECIAL`
   - If filled, only 1 coupon generated (ignore count)

5. **Assign ke Affiliate** (Optional)
   - Dropdown affiliates list
   - If not selected: generic child coupon for campaign

### Auto-Inheritance from Parent:
- ✅ discountType & discountValue
- ✅ productIds, membershipIds, courseIds
- ✅ minPurchase
- ✅ validUntil
- ✅ isForRenewal

### Child-Specific Overrides:
- ✅ usageLimit = parent.maxUsagePerCoupon (if set)
- ✅ isAffiliateEnabled = false (child tidak bisa generate lagi)
- ✅ basedOnCouponId = parent ID
- ✅ affiliateId = selected affiliate
- ✅ createdBy = current admin ID

---

## 📋 WORKFLOW EXAMPLE

### Scenario: Campaign Flash Sale untuk Affiliate

**Step 1**: Admin buat Parent Coupon
```
Code: FLASHSALE50
Discount: 50% OFF
Min Purchase: Rp 500,000
Valid Until: 31 Des 2025
Affiliate Enabled: ✅ Yes
Max Generate per Affiliate: 3
Max Usage per Kupon: 20
```

**Step 2**: Admin Generate Child untuk 3 Top Affiliates

Affiliate 1 - Dinda:
```
Generate 3 kupon:
- FLASHSALE50-DINDA01 (usage: 0/20)
- FLASHSALE50-DINDA02 (usage: 0/20)
- FLASHSALE50-DINDA03 (usage: 0/20)
```

Affiliate 2 - Rara:
```
Generate 2 kupon:
- FLASHSALE50-RARA01 (usage: 0/20)
- FLASHSALE50-RARA02 (usage: 0/20)
```

**Step 3**: Tracking Performance

Admin bisa lihat:
- Parent `FLASHSALE50`: 5 child coupons
- Total usage across all children
- Which affiliate performa terbaik

Affiliate Dashboard nanti bisa show:
- My coupons: 3 kupon (Dinda)
- Usage: 45/60 (total dari 3 kupon)
- Commission earned from coupon usage

---

## 🔒 BUSINESS RULES

### Parent Coupon Rules:
1. ✅ Bisa punya child unlimited (kecuali ada limit dari max generate)
2. ✅ Delete parent → cascade delete all children
3. ✅ Edit parent → **TIDAK** update children yang sudah ada
4. ✅ Deactivate parent → children tetap bisa aktif (independent)

### Child Coupon Rules:
1. ✅ Tidak bisa generate child lagi (`isAffiliateEnabled = false`)
2. ✅ Tidak bisa edit (harus delete & re-generate)
3. ✅ Usage tracking independent dari parent
4. ✅ Deactivate child → tidak affect parent atau siblings

### Affiliate Limits:
1. ✅ `maxGeneratePerAffiliate`: Limit berapa banyak affiliate bisa generate
2. ✅ `maxUsagePerCoupon`: Setiap child punya usage limit sendiri
3. ✅ Check limit sebelum generate (return error jika exceed)

---

## 🧪 TESTING CHECKLIST

### Database:
- ✅ Schema updated with relations
- ✅ Unique constraint on `code` field
- ✅ Indexes created for performance
- ✅ Cascade delete works correctly

### API:
- ✅ GET coupons with type filtering
- ✅ POST generate child with validation
- ✅ Parent-child count accurate
- ✅ Affiliate limit enforcement

### UI:
- ✅ Tab switching smooth
- ✅ Stats cards show correct numbers
- ✅ Generate modal form validation
- ✅ Parent detail preview in modal
- ✅ Copy code button works
- ✅ Progress bars accurate
- ✅ Badges display correctly

### Edge Cases:
- ✅ Generate dengan duplicate code → skip/error
- ✅ Generate beyond affiliate limit → error
- ✅ Delete parent with children → cascade
- ✅ Empty state untuk no coupons
- ✅ Loading states during generate

---

## 📈 FUTURE ENHANCEMENTS

### Phase 2 (Optional):
1. **Affiliate Self-Service**:
   - Affiliate bisa generate kupon sendiri (dengan approval/auto)
   - Dashboard untuk lihat kupon mereka
   - Real-time usage tracking

2. **Analytics Dashboard**:
   - Top performing coupons
   - Conversion rate per child
   - Affiliate performance comparison
   - Revenue by coupon

3. **Bulk Operations**:
   - Bulk activate/deactivate children
   - Bulk extend validity
   - Export coupon list to CSV

4. **Advanced Rules**:
   - Stacking rules (allow/disallow with other coupons)
   - User-specific coupons (first-time only, VIP only)
   - Auto-expiry based on usage

---

## ✅ DEPLOYMENT STATUS

### Database:
```bash
✅ Schema pushed to Neon PostgreSQL
✅ Prisma client generated
✅ Relations working correctly
✅ Indexes created
```

### API Routes:
```bash
✅ /api/admin/coupons - Updated
✅ /api/admin/coupons/generate-child - Created
✅ /api/admin/coupons/[id] - Working
```

### UI Components:
```bash
✅ Tab system implemented
✅ Parent coupons table
✅ Child coupons table
✅ Generate child modal
✅ Create/Edit parent modal
✅ Stats dashboard
```

### Integration:
```bash
✅ Form validation
✅ Error handling
✅ Success toasts
✅ Loading states
✅ Real-time updates
```

---

## 🎯 HOW TO USE

### Admin Workflow:

1. **Buat Parent Coupon**:
   ```
   Dashboard > Admin > Coupons
   → Click "Buat Kupon Baru"
   → Fill form
   → Enable "Izinkan affiliate menggunakan kupon ini"
   → Set max generate & usage limits
   → Save
   ```

2. **Generate Child Coupons**:
   ```
   → Click "Generate Kupon Turunan"
   → Select parent coupon
   → Choose affiliate (optional)
   → Set prefix/custom code
   → Set count
   → Generate
   ```

3. **Monitor Performance**:
   ```
   → Switch to "Kupon Turunan" tab
   → See all generated children
   → Check usage stats
   → Compare affiliate performance
   ```

4. **Manage Coupons**:
   ```
   → Toggle active/inactive
   → Edit parent properties
   → Delete underperforming children
   → Copy codes for distribution
   ```

---

## 🔐 SECURITY & VALIDATION

### Input Validation:
- ✅ Code uniqueness check before save
- ✅ Required fields enforced
- ✅ Numeric fields validated (min/max)
- ✅ Date validation for validity period

### Authorization:
- ✅ Only ADMIN can access `/admin/coupons`
- ✅ Session check on all API endpoints
- ✅ Role verification before mutations

### Data Integrity:
- ✅ Cascade delete protected
- ✅ Foreign key constraints
- ✅ Index for query performance
- ✅ Transaction safety

---

## 📞 SUPPORT & MAINTENANCE

### Daily Monitoring:
```bash
# Check total coupons
SELECT COUNT(*) as parent FROM "Coupon" WHERE "basedOnCouponId" IS NULL;
SELECT COUNT(*) as child FROM "Coupon" WHERE "basedOnCouponId" IS NOT NULL;

# Check usage stats
SELECT SUM("usageCount") as total_usage FROM "Coupon";

# Top performing coupons
SELECT code, "usageCount", "discountValue" 
FROM "Coupon" 
ORDER BY "usageCount" DESC 
LIMIT 10;
```

### Common Issues:

**Issue**: Child generation failed
```bash
Solution: Check parent.isAffiliateEnabled = true
Check affiliate limit not exceeded
Verify code uniqueness
```

**Issue**: Stats tidak update
```bash
Solution: Refresh page (React state issue)
Check API response includes _count
Verify Prisma include syntax
```

---

## ✨ SYSTEM SUMMARY

**Status**: ✅ PRODUCTION READY

**Implemented Features**:
1. ✅ Parent-Child Coupon System
2. ✅ Affiliate Tracking
3. ✅ Usage Limits & Controls
4. ✅ Tab-based UI
5. ✅ Bulk Generation
6. ✅ Real-time Stats
7. ✅ Full CRUD Operations

**Database Health**: 
- ✅ Schema synced
- ✅ Relations working
- ✅ No orphan data
- ✅ Indexes optimized

**Performance**:
- ✅ Fast queries (indexed)
- ✅ Efficient rendering
- ✅ Smooth UX
- ✅ No blocking operations

**Next Steps**:
1. Test with real affiliate data
2. Monitor usage patterns
3. Collect feedback from admin
4. Iterate based on needs

---

**Developer**: GitHub Copilot (Claude Sonnet 4.5)  
**Date**: 25 Desember 2025  
**Status**: ✅ COMPLETE & TESTED
