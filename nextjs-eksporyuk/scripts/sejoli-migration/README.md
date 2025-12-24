# Sejoli → Eksporyuk Migration Guide

Migrasi lengkap dari WordPress Sejoli ke sistem Eksporyuk baru.

## 📋 Preparation

### 1. Install Dependencies

```bash
cd scripts/sejoli-migration
npm install
```

### 2. Configure Database Access

File `.env.sejoli` sudah dibuat dengan credentials:

```env
SEJOLI_DB_HOST=103.125.181.47
SEJOLI_DB_NAME=aziz_member.eksporyuk.com
SEJOLI_DB_USER=aziz_member.eksporyuk.com
SEJOLI_DB_PASSWORD=E%ds(xRh3T]AA|Qh
```

## 🚀 Migration Steps

### Step 1: Inspect Database

```bash
npm run inspect
```

**Output:**
- List semua tabel Sejoli
- Struktur tabel penting
- Sample data
- User roles distribution

**Tujuan:** Memahami struktur data sebelum export

---

### Step 2: Export Data

```bash
npm run export
```

**Exports to `exports/` directory:**
- `users.json` - Semua WordPress users
- `user-meta.json` - Phone, address, dll
- `affiliates.json` - Data affiliate Sejoli
- `orders.json` - Transaksi/orders
- `commissions.json` - Komisi affiliate
- `products.json` - Products/memberships
- `groups.json` - Communities/groups
- `_summary.json` - Export summary

**Data yang di-export:**
- ✅ Users (email, nama, role, tanggal daftar)
- ✅ User metadata (phone, address)
- ✅ Affiliate profiles
- ✅ Orders/Transactions
- ✅ Commissions
- ✅ Products/Memberships
- ✅ Groups/Communities

---

### Step 3: Migrate to Eksporyuk

```bash
npm run migrate
```

**Proses:**

1. **Users Migration**
   - Create `User` record
   - Map WordPress roles → Eksporyuk roles
   - Generate username dari email
   - Set default password: `TempPassword123!`
   - Create `Wallet` untuk setiap user

2. **Profile Creation**
   - Affiliate → `AffiliateProfile` (dengan code & short link)
   - Mentor → `MentorProfile`
   - Admin → Admin role

3. **Affiliate Data**
   - Import total earnings
   - Import total referrals
   - Set commission rates

4. **Transactions**
   - Import completed orders
   - Link ke user yang sesuai
   - Set status berdasarkan Sejoli status

**Role Mapping:**

| WordPress Role | Eksporyuk Role |
|---------------|----------------|
| administrator | ADMIN |
| mentor/teacher | MENTOR |
| affiliate | AFFILIATE |
| subscriber/member | MEMBER_PREMIUM |
| (default) | MEMBER_FREE |

---

### Step 4 (Optional): Full Migration

Run semua steps sekaligus:

```bash
npm run full-migration
```

## 📊 Migration Validation

After migration, verify:

```bash
# Check user count
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(c => console.log('Users:', c))"

# Check affiliates
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.affiliateProfile.count().then(c => console.log('Affiliates:', c))"

# Check transactions
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.transaction.count().then(c => console.log('Transactions:', c))"
```

## ⚠️ Important Notes

### Password Reset Required

Semua user akan memiliki password default: `TempPassword123!`

**Options:**

1. **Force reset on first login** (recommended)
2. **Send password reset emails** 
3. **Keep default password** (untuk testing)

### Data Mapping Issues

**Handled automatically:**
- Duplicate emails → Skip migration
- Missing roles → Default to MEMBER_FREE
- Missing metadata → Use NULL values

**Manual review needed:**
- Custom product types
- Special membership tiers
- Complex commission structures

### Affiliate Codes

Generated automatically:
- Format: `AFF000001`, `AFF000002`, etc.
- Based on new Eksporyuk user ID
- Sejoli codes NOT preserved (to avoid conflicts)

### Short Links

Auto-generated:
- Format: `https://eksporyuk.com/go/{username}`
- Username from email (e.g., `azizbiasa@gmail.com` → `azizbiasa`)

## 🔍 Troubleshooting

### Connection Error

```bash
# Test database connection
mysql -h 103.125.181.47 -u aziz_member.eksporyuk.com -p'E%ds(xRh3T]AA|Qh' aziz_member.eksporyuk.com
```

### Missing Tables

If Sejoli tables not found, check:
- Sejoli plugin installed?
- Table prefix correct? (default: `wp_`)
- Database selected correctly?

### Duplicate Users

If migration fails due to duplicate emails:

```bash
# Check existing users first
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany().then(u => console.table(u.map(x => ({id: x.id, email: x.email}))))"
```

## 📁 File Structure

```
sejoli-migration/
├── 01-inspect-database.js      # Database inspector
├── 02-export-sejoli-data.js    # Data exporter
├── 03-migrate-to-eksporyuk.js  # Main migration
├── package.json                # Dependencies
├── README.md                   # This file
└── exports/                    # Export output
    ├── users.json
    ├── affiliates.json
    ├── orders.json
    └── _summary.json
```

## 🎯 Success Criteria

Migration successful when:

- ✅ All users migrated with correct roles
- ✅ Affiliate profiles created
- ✅ Wallets initialized
- ✅ Transactions linked correctly
- ✅ No duplicate users
- ✅ Login works for migrated users (after password reset)

## 📞 Post-Migration Tasks

1. **Send Welcome Emails**
   ```bash
   node scripts/send-welcome-emails.js
   ```

2. **Send Password Reset**
   ```bash
   node scripts/send-password-reset-emails.js
   ```

3. **Verify Affiliate Links**
   - Test short links redirect correctly
   - Verify affiliate tracking works

4. **Test Transactions**
   - Check transaction history displays
   - Verify commission calculations

5. **Backup Migrated Data**
   ```bash
   node scripts/backup-database.js
   ```

## 🚨 Rollback

If migration fails, restore from backup:

```bash
# Neon console → Restore from backup before migration
# Or clear migrated data:
npx prisma migrate reset
```

---

**Migration Date:** 24 Desember 2025  
**Source:** member.eksporyuk.com (WordPress Sejoli)  
**Destination:** Neon PostgreSQL (eksporyuk.com)
