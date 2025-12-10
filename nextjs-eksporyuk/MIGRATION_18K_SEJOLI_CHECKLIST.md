# Migration Checklist: 18,000 Users dari Sejoli

**Status**: ⚠️ **BELUM SIAP** - Perlu persiapan sebelum migrasi

**Target**: Migrasi 18,000 users + data terkait dari Sejoli ke Eksporyuk

---

## ❌ Yang Belum Siap

### 1. **Database Schema** - Status: ❌ BELUM ADA
```prisma
// Perlu tambah ke schema.prisma:

model SejoliWebhookLog {
  id                    String    @id @default(cuid())
  orderId               String    @unique
  orderStatus           String    // PENDING, PAID, EXPIRED, REFUNDED
  productId             String
  productName           String
  buyerName             String
  buyerEmail            String
  buyerPhone            String?
  buyerWhatsapp         String?
  amount                Float
  paidAmount            Float?
  paidAt                DateTime?
  
  // Affiliate data dari Sejoli
  affiliateCode         String?
  affiliateName         String?
  affiliateEmail        String?
  affiliatePhone        String?
  affiliateRate         Float?
  affiliateAmount       Float?
  eksporyukAffiliateId  String?   // Linked to our system
  
  // Processing
  processed             Boolean   @default(false)
  processedAt           DateTime?
  processError          String?
  
  // Raw data
  webhookPayload        Json      // Full webhook data
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([orderId])
  @@index([buyerEmail])
  @@index([affiliateCode])
  @@index([processed])
  @@index([orderStatus])
}

model SejoliAffiliateMapping {
  id                  String    @id @default(cuid())
  
  // Sejoli data
  sejoliAffiliateCode String    @unique
  sejoliAffiliateName String
  sejoliEmail         String?
  sejoliPhone         String?
  
  // Eksporyuk mapping
  eksporyukUserId     String?
  eksporyukAffiliate  AffiliateProfile? @relation(fields: [eksporyukUserId], references: [userId])
  
  // Verification
  mappingStatus       String    @default("PENDING") // PENDING, VERIFIED, REJECTED
  verifiedBy          String?
  verifiedAt          DateTime?
  notes               String?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([sejoliAffiliateCode])
  @@index([eksporyukUserId])
  @@index([mappingStatus])
}

model DataImportLog {
  id                String    @id @default(cuid())
  source            String    // "SEJOLI", "WORDPRESS"
  importType        String    // "users", "orders", "memberships", "affiliates"
  batchNumber       Int       @default(1)
  
  status            String    @default("PENDING") // PENDING, RUNNING, COMPLETED, FAILED
  totalRecords      Int       @default(0)
  processedCount    Int       @default(0)
  successCount      Int       @default(0)
  skippedCount      Int       @default(0)
  errorCount        Int       @default(0)
  
  errors            Json?     // Array of errors
  summary           Json?     // Import summary
  
  startedAt         DateTime?
  completedAt       DateTime?
  duration          Int?      // in seconds
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([source])
  @@index([importType])
  @@index([status])
  @@index([batchNumber])
}
```

**Action Required**: 
```bash
cd nextjs-eksporyuk
# 1. Update schema.prisma dengan models di atas
# 2. Run migration
npx prisma db push
npx prisma generate
```

---

### 2. **Import Service** - Status: ❌ BELUM ADA

**File yang perlu dibuat**: `/src/lib/services/sejoliImportService.ts`

Fitur yang perlu:
- ✅ Batch processing (import per 100-500 users)
- ✅ Error handling & retry logic
- ✅ Duplicate detection (by email/phone)
- ✅ Data validation sebelum insert
- ✅ Progress tracking
- ✅ Rollback mechanism jika gagal
- ✅ Mapping affiliate otomatis
- ✅ Transaction import dengan commission tracking

---

### 3. **API Endpoints** - Status: ❌ BELUM ADA

**Perlu dibuat**:

```typescript
// /src/app/api/admin/import/sejoli/orders/route.ts
POST /api/admin/import/sejoli/orders
- Import orders dalam batch
- Validate data
- Create users jika belum ada
- Create transactions
- Map affiliates
- Calculate commissions

// /src/app/api/admin/import/sejoli/memberships/route.ts
POST /api/admin/import/sejoli/memberships
- Import memberships
- Link ke users yang sudah di-import
- Set expiry dates
- Activate memberships

// /src/app/api/admin/import/sejoli/affiliates/route.ts
POST /api/admin/import/sejoli/affiliates
- Import affiliate data
- Auto-mapping by email/phone
- Create pending mappings for manual review

// /src/app/api/admin/import/sejoli/status/[id]/route.ts
GET /api/admin/import/sejoli/status/[id]
- Check import progress
- Get errors
- View summary
```

---

### 4. **Admin Dashboard** - Status: ❌ BELUM ADA

**Page**: `/admin/data-import`

**Fitur yang perlu**:
- [ ] Upload CSV/Excel untuk batch import
- [ ] Start import dengan konfigurasi (batch size, retry count, dll)
- [ ] Real-time progress monitoring
- [ ] Error logs & detail
- [ ] Retry failed imports
- [ ] Preview data sebelum import
- [ ] Export import report
- [ ] Affiliate mapping verification interface

---

### 5. **Data dari Sejoli** - Status: ❓ BELUM DAPAT

**Yang perlu didapatkan dari Sejoli**:

#### A. **Export Data Orders** (CSV/Excel)
```
Columns needed:
- order_id
- order_date
- product_id
- product_name
- buyer_name
- buyer_email
- buyer_phone
- buyer_whatsapp
- amount
- paid_amount
- payment_status (PAID/PENDING/EXPIRED)
- paid_date
- expiry_date
- affiliate_code (jika ada)
- affiliate_name
- affiliate_email
- affiliate_commission_rate
- affiliate_commission_amount
```

#### B. **Export Data Memberships**
```
Columns needed:
- membership_id
- user_email
- product_id
- product_name
- start_date
- expiry_date
- status (active/expired)
- price
- order_id (link ke orders)
```

#### C. **Export Data Affiliates**
```
Columns needed:
- affiliate_code
- affiliate_name
- affiliate_email
- affiliate_phone
- commission_rate
- total_referrals
- total_commissions
- total_paid
- join_date
```

**Action Required**: 
1. Login ke Sejoli dashboard
2. Export data ke CSV/Excel
3. Simpan di folder `/import-data/sejoli/`

---

### 6. **Testing Environment** - Status: ❌ BELUM SIAP

**Perlu**:
- [ ] Backup database sebelum testing
- [ ] Staging environment untuk test import
- [ ] Test dengan sample data dulu (100-500 users)
- [ ] Verify data integrity setelah import
- [ ] Check performance dengan 18K users

---

### 7. **Server Capacity** - Status: ❓ PERLU DICEK

**Yang perlu diverifikasi**:
- [ ] Database size limit (SQLite → perlu migrasi ke MySQL/Postgres?)
- [ ] Memory limit untuk batch processing
- [ ] Storage untuk 18K user data + attachments
- [ ] Bandwidth untuk import process

**Rekomendasi**:
```
Untuk 18K users, sebaiknya:
1. Migrasi dari SQLite ke MySQL/PostgreSQL
2. Minimum server specs:
   - 4GB RAM
   - 50GB Storage
   - Multi-core CPU untuk parallel processing
```

---

## ✅ Tahapan Migrasi (Recommended)

### Phase 1: Preparation (2-3 hari)
```
1. ✅ Update database schema
2. ✅ Create import services
3. ✅ Create API endpoints
4. ✅ Create admin dashboard
5. ✅ Get data from Sejoli
6. ✅ Setup staging environment
```

### Phase 2: Testing (2-3 hari)
```
1. ✅ Test dengan 100 users dulu
2. ✅ Verify data accuracy
3. ✅ Test affiliate mapping
4. ✅ Test commission calculation
5. ✅ Fix bugs jika ada
6. ✅ Test dengan 1000 users
```

### Phase 3: Production Import (1 hari)
```
1. ✅ Backup production database
2. ✅ Maintenance mode ON
3. ✅ Run full import (18K users)
4. ✅ Verify all data
5. ✅ Test login untuk sample users
6. ✅ Test affiliate commission tracking
7. ✅ Maintenance mode OFF
```

### Phase 4: Verification (1-2 hari)
```
1. ✅ User verification (random sampling)
2. ✅ Transaction verification
3. ✅ Membership status check
4. ✅ Affiliate commission verification
5. ✅ Send notification ke users
```

---

## 🎯 Checklist Lengkap

### Database & Schema
- [ ] Add `SejoliWebhookLog` model
- [ ] Add `SejoliAffiliateMapping` model
- [ ] Add `DataImportLog` model
- [ ] Add `importSource` field ke `User` model
- [ ] Add `externalId` field ke models yang perlu
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`

### Backend Services
- [ ] Create `SejoliImportService` class
- [ ] Implement batch processing
- [ ] Implement error handling & retry
- [ ] Implement duplicate detection
- [ ] Implement data validation
- [ ] Implement affiliate mapping logic
- [ ] Implement commission calculation
- [ ] Implement rollback mechanism

### API Endpoints
- [ ] Create `/api/admin/import/sejoli/orders`
- [ ] Create `/api/admin/import/sejoli/memberships`
- [ ] Create `/api/admin/import/sejoli/affiliates`
- [ ] Create `/api/admin/import/sejoli/status/[id]`
- [ ] Create `/api/admin/import/sejoli/verify`
- [ ] Add authentication & authorization

### Admin Dashboard
- [ ] Create `/admin/data-import` page
- [ ] Add import form (CSV/Excel upload)
- [ ] Add batch configuration options
- [ ] Add progress monitoring UI
- [ ] Add error logs display
- [ ] Add retry functionality
- [ ] Add affiliate mapping interface
- [ ] Add verification interface
- [ ] Add export report functionality

### Data Preparation
- [ ] Get orders export from Sejoli
- [ ] Get memberships export from Sejoli
- [ ] Get affiliates export from Sejoli
- [ ] Validate data format
- [ ] Clean data (remove duplicates, invalid emails, etc)
- [ ] Save to `/import-data/sejoli/` folder

### Infrastructure
- [ ] Backup current database
- [ ] Setup staging environment
- [ ] Verify server capacity
- [ ] Consider MySQL/Postgres migration if needed
- [ ] Setup monitoring & alerts
- [ ] Prepare rollback plan

### Testing
- [ ] Test import dengan 100 users
- [ ] Test import dengan 1000 users
- [ ] Test data accuracy
- [ ] Test affiliate mapping
- [ ] Test commission calculation
- [ ] Test login functionality
- [ ] Test membership access
- [ ] Performance testing

### Production Import
- [ ] Schedule maintenance window
- [ ] Backup production database
- [ ] Enable maintenance mode
- [ ] Run import script
- [ ] Monitor progress
- [ ] Verify data
- [ ] Test critical features
- [ ] Disable maintenance mode

### Post-Import Verification
- [ ] Random user verification (100 samples)
- [ ] Transaction verification
- [ ] Membership status check
- [ ] Affiliate commission verification
- [ ] Test login for all user types
- [ ] Send welcome emails
- [ ] Monitor for issues (24-48 hours)

---

## 📊 Estimasi Waktu

| Phase | Duration | Status |
|-------|----------|--------|
| **1. Preparation** | 2-3 hari | ❌ Not Started |
| **2. Testing** | 2-3 hari | ❌ Not Started |
| **3. Production Import** | 1 hari | ❌ Not Started |
| **4. Verification** | 1-2 hari | ❌ Not Started |
| **TOTAL** | **6-9 hari** | **0% Complete** |

---

## 🚨 Risks & Mitigation

### Risk 1: Data Loss
**Mitigation**: 
- Full backup sebelum import
- Test di staging dulu
- Implement rollback mechanism

### Risk 2: Duplicate Users
**Mitigation**:
- Check by email & phone
- Manual verification untuk edge cases
- Merge duplicate records

### Risk 3: Affiliate Commission Mismatch
**Mitigation**:
- Store raw Sejoli data untuk reference
- Verify commission calculation
- Manual review untuk high-value transactions

### Risk 4: Performance Issues
**Mitigation**:
- Batch processing (500 users/batch)
- Queue system untuk background processing
- Monitoring & alerts

### Risk 5: Failed Import Mid-Process
**Mitigation**:
- Transactional import (rollback if fail)
- Resume capability (continue from last successful batch)
- Detailed error logs

---

## 📝 Next Steps (Priority Order)

### 🔴 CRITICAL (Harus Selesai Dulu)

1. **Update Database Schema**
   ```bash
   cd nextjs-eksporyuk
   # Edit prisma/schema.prisma
   # Add models: SejoliWebhookLog, SejoliAffiliateMapping, DataImportLog
   npx prisma db push
   npx prisma generate
   ```

2. **Get Data from Sejoli**
   - Login ke Sejoli dashboard
   - Export orders (CSV/Excel)
   - Export memberships
   - Export affiliates
   - Save ke folder `/import-data/sejoli/`

3. **Create Import Service**
   - File: `/src/lib/services/sejoliImportService.ts`
   - Implement batch processing
   - Implement error handling

### 🟡 HIGH PRIORITY

4. **Create API Endpoints**
   - `/api/admin/import/sejoli/orders`
   - `/api/admin/import/sejoli/memberships`
   - `/api/admin/import/sejoli/affiliates`

5. **Create Admin Dashboard**
   - `/admin/data-import` page
   - Import form + progress monitoring

6. **Setup Testing Environment**
   - Backup database
   - Test dengan sample data

### 🟢 MEDIUM PRIORITY

7. **Test Import Process**
   - Test dengan 100 users
   - Verify data accuracy
   - Fix bugs

8. **Production Import**
   - Schedule maintenance
   - Run full import
   - Verify

---

## ❓ Questions to Answer Before Migration

1. **Database**: Apakah mau tetap pakai SQLite atau migrasi ke MySQL/PostgreSQL untuk 18K users?
2. **Server**: Apakah server current bisa handle 18K users? Perlu upgrade?
3. **Data**: Apakah sudah bisa akses & export data dari Sejoli dashboard?
4. **Timeline**: Kapan target completion untuk migration ini?
5. **Maintenance**: Berapa lama maintenance window yang acceptable?
6. **Notification**: Perlu kirim email ke 18K users after migration?
7. **Old System**: Sejoli akan tetap aktif atau di-decommission after migration?

---

## 📞 Support Needed

### From Sejoli Team:
- [ ] API access untuk bulk export
- [ ] Documentation untuk data format
- [ ] Webhook configuration untuk real-time sync after migration
- [ ] Support contact jika ada issues

### From Dev Team:
- [ ] Server access & capacity check
- [ ] Database backup access
- [ ] Staging environment setup
- [ ] Monitoring setup

---

## ✅ Summary

**Current Status**: ⚠️ **BELUM SIAP untuk migrasi 18K users**

**What's Missing**:
1. ❌ Database schema belum update
2. ❌ Import service belum dibuat
3. ❌ API endpoints belum ada
4. ❌ Admin dashboard belum dibuat
5. ❌ Data dari Sejoli belum dapat
6. ❌ Testing environment belum ready
7. ❌ Server capacity belum dicek

**Estimated Time to Ready**: 6-9 hari kerja

**Recommendation**: 
1. **Jangan migrasi sekarang** - masih banyak yang belum siap
2. **Follow checklist di atas** untuk persiapan
3. **Test dengan sample data dulu** (100-1000 users)
4. **Baru production import** setelah semua tested & verified

---

**Last Updated**: 9 Desember 2025  
**Status**: ⚠️ **PREPARATION PHASE** - Not ready for production import
