# Audit Report - 3 Januari 2026

## Kasus 1: Branded Template dengan Usage Count = 0

**Masalah**: Email dari template tidak terkirim karena template dengan `usageCount = 0` tidak sedang digunakan.

**Template Terpengaruh** (9 templates):
1. `affiliate-commission-received` - Usage: 0
2. `mentor-commission-received` - Usage: 0
3. `admin-fee-pending` - Usage: 0
4. `founder-share-pending` - Usage: 0
5. `pending-revenue-approved` - Usage: 0
6. `pending-revenue-rejected` - Usage: 0
7. `commission-settings-changed` - Usage: 0

**Status**: Semua template ini `isActive = true` tapi tidak pernah dipakai (`usageCount = 0`), sehingga email tidak terkirim.

**Impact**:
- Affiliate tidak menerima notifikasi commission received
- Mentors tidak menerima notifikasi commission received
- Admin/Founder tidak menerima notifikasi pending revenue
- Commission setting change notifications tidak terkirim

**Root Cause**: Template ada tapi API routes yang seharusnya mengirim email belum integrated dengan template system atau tidak call render function.

---

## Kasus 2: Member Premium + Affiliate Role Access

**Masalah**: Member yang juga affiliate harus manual diberi akses AFFILIATE role, seharusnya otomatis.

**Status Saat Ini**:
- **Total MEMBER_PREMIUM dengan affiliate profile**: 37 users
- **Semua status affiliate**: APPROVED (100%)
- **Semua active**: YES (100%)
- **Issue**: Mereka hanya punya role `MEMBER_PREMIUM`, tidak otomatis dapat role `AFFILIATE`

**Contoh Users Terpengaruh** (37 total):
- tbrianpermadi911@gmail.com
- abojiaruru@gmail.com
- fajwatijariresources@gmail.com
- cscirebonteknik2@gmail.com
- ...dan 33 lainnya

**Problem**: 
1. User punya `affiliateProfile.applicationStatus = APPROVED`
2. User punya `affiliateProfile.isActive = true`
3. Tapi role mereka masih hanya `MEMBER_PREMIUM` (tidak ada `AFFILIATE`)
4. Mereka harus manual di-grant role AFFILIATE oleh admin

**Expected Behavior**:
Ketika user dengan MEMBER_PREMIUM menjadi APPROVED affiliate, harus otomatis:
- Tambah role `AFFILIATE` ke user
- Atau update `userRoles` table
- Sehingga mereka bisa langsung akses affiliate dashboard

---

## Rekomendasi Perbaikan

### Kasus 1: Template Usage = 0
1. Cari semua routes yang seharusnya send email untuk template ini
2. Add integration call ke `renderBrandedTemplateBySlug()` 
3. Test email send untuk setiap event yang bertrigger template

### Kasus 2: Auto-grant AFFILIATE Role
1. Tambah logic di affiliate approval endpoint
2. Ketika status berubah jadi APPROVED, otomatis:
   - Update user.role OR
   - Create entry di userRoles table dengan role=AFFILIATE
3. Add trigger/automation di affiliate status change

---

## Database Snapshot

**Branded Template Summary**:
- Total templates: 129+
- Templates dengan usage count > 0: 120+
- Templates dengan usage count = 0: 9 (perlu investigation)
- All inactive: FALSE (semua aktif tapi tidak terpakai)

**Member Premium + Affiliate**:
- Total: 37 users
- Approved affiliates: 37 (100%)
- Active affiliates: 37 (100%)
- Missing AFFILIATE role: 37 (100%) ⚠️

---

Generated: 3 Januari 2026
