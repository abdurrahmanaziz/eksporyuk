# WordPress to Eksporyuk Migration Guide

## 📋 Prerequisites

1. **Install MySQL Client**
   ```bash
   npm install mysql2
   ```

2. **Setup Environment Variables**
   ```bash
   cp scripts/wp-migration/.env.example scripts/wp-migration/.env
   ```

3. **Edit .env file** with your WordPress database credentials:
   ```env
   WP_DB_HOST=your-vps-ip-here
   WP_DB_PORT=3306
   WP_DB_USER=your-mysql-user
   WP_DB_PASSWORD=your-password
   WP_DB_NAME=your-wordpress-db
   WP_TABLE_PREFIX=wp_
   MIGRATION_LIMIT=100
   ```

## 🚀 Migration Steps

### Step 1: Extract Data from WordPress

```bash
cd nextjs-eksporyuk/scripts/wp-migration
node 1-extract-sejoli-data.js
```

**What it does:**
- Connects to WordPress database
- Extracts 100 users (configurable via MIGRATION_LIMIT)
- Extracts memberships from Sejoli orders
- Extracts affiliate data and commissions
- Saves to `extracted-data/sejoli-data-[timestamp].json`

**Expected output:**
```
✅ Data saved to: extracted-data/sejoli-data-2025-12-09.json
📊 EXTRACTION SUMMARY
Total Users:        100
Total Memberships:  45
Total Affiliates:   20
Total Commissions:  150
Total Revenue:      Rp 50,000,000
```

---

### Step 2: Import to Eksporyuk

```bash
node 2-import-to-eksporyuk.js extracted-data/sejoli-data-[timestamp].json
```

**What it does:**
- Creates users in Eksporyuk with proper role mapping:
  - `free_member` → `MEMBER_FREE`
  - `premium_member` → `MEMBER_PREMIUM`
  - `affiliate` → `AFFILIATE`
- Creates wallet for each user with correct balance
- Creates affiliate profiles with commission data
- Sets default password: `ekspor123` (users must reset)
- Marks email as verified (already verified in WordPress)

**Expected output:**
```
📊 IMPORT SUMMARY
✅ Users Created:           95
⏭️  Users Skipped:           5
❌ Users Failed:            0
💰 Wallets Created:         95
💼 Affiliate Profiles:      20
```

---

### Step 3: Verify Migration

```bash
node 3-verify-migration.js extracted-data/sejoli-data-[timestamp].json
```

**What it does:**
- Compares WordPress data vs Eksporyuk data
- Checks user counts, roles, wallets, balances
- Verifies affiliate profiles and codes
- Tests sample logins
- Calculates accuracy percentage

**Expected output:**
```
📊 VERIFICATION SUMMARY
Overall Status:     PERFECT
Accuracy:           100.00%

Users Match:        100/100
Wallets Match:      95
Affiliates Match:   20
```

---

## 🔍 Troubleshooting

### Issue: Cannot connect to database

**Error:** `ECONNREFUSED` or `ER_ACCESS_DENIED_ERROR`

**Solution:**
1. Check VPS firewall allows MySQL port 3306
2. Verify MySQL user has remote access:
   ```sql
   GRANT ALL PRIVILEGES ON *.* TO 'user'@'%' IDENTIFIED BY 'password';
   FLUSH PRIVILEGES;
   ```
3. Test connection:
   ```bash
   mysql -h your-vps-ip -u username -p
   ```

---

### Issue: Table not found

**Error:** `Table 'wp_sejoli_order' doesn't exist`

**Solution:**
1. Check actual table names in your WordPress:
   ```bash
   mysql -e "SHOW TABLES LIKE '%sejoli%';" your_database
   ```
2. Update table names in `1-extract-sejoli-data.js` if different

---

### Issue: Users already exist

**Error:** `Unique constraint failed on the fields: (email)`

**Solution:**
- Script will skip existing users automatically
- To re-import, clean database first:
  ```bash
  # BE CAREFUL! This deletes all users except admin
  node scripts/clean-test-users.js
  ```

---

## 📊 Data Mapping

### User Roles
| WordPress Role | Eksporyuk Role |
|---------------|----------------|
| Free Member   | MEMBER_FREE    |
| Premium Member| MEMBER_PREMIUM |
| Affiliate     | AFFILIATE      |

### Passwords
- Default: `ekspor123` for all imported users
- Users should reset via: `/auth/forgot-password`

### Affiliate Data
- **Affiliate Code**: Preserved from WordPress
- **Balance**: Transferred to wallet
- **Commission Rate**: Default 30% (configurable)
- **Total Earnings**: Preserved in affiliate profile

---

## ✅ Success Criteria

Migration is successful when:
- [x] User count matches (100/100)
- [x] All roles correctly mapped
- [x] Wallet balances accurate
- [x] Affiliate profiles created
- [x] Users can login with default password
- [x] Commission totals match

---

## 🔄 Full Migration (19,000 Users)

After 100-user test is successful:

1. **Update .env**:
   ```env
   MIGRATION_LIMIT=19000
   ```

2. **Backup Eksporyuk database**:
   ```bash
   pg_dump eksporyuk > backup_before_full_migration.sql
   ```

3. **Run extraction** (will take ~5-10 minutes):
   ```bash
   node 1-extract-sejoli-data.js
   ```

4. **Run import** (will take ~30-60 minutes):
   ```bash
   node 2-import-to-eksporyuk.js extracted-data/sejoli-data-[timestamp].json
   ```

5. **Verify**:
   ```bash
   node 3-verify-migration.js extracted-data/sejoli-data-[timestamp].json
   ```

---

## 📞 Support

If you encounter issues:
1. Check error logs in `import-logs/`
2. Verify WordPress database structure
3. Test with smaller MIGRATION_LIMIT first (e.g., 10 users)
4. Review extracted JSON file manually

---

## 🎯 Next Phase

After local migration success:
1. Deploy to staging server
2. Test with real users (pilot group)
3. Monitor for 24-48 hours
4. Go live with production
