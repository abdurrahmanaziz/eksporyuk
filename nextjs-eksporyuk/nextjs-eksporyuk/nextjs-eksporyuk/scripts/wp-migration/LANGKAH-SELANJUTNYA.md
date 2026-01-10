# ✅ MIGRATION SCRIPTS READY - LANGKAH SELANJUTNYA

## 📦 Yang Sudah Disiapkan:

✅ **Script 1: WordPress Data Extractor** (`1-extract-sejoli-data.js`)
   - Connect ke WordPress MySQL database
   - Extract 100 users pertama
   - Extract memberships, affiliates, commissions
   - Save ke JSON file

✅ **Script 2: Eksporyuk Importer** (`2-import-to-eksporyuk.js`)
   - Import users dengan role mapping
   - Create wallets dengan balance
   - Create affiliate profiles
   - Handle duplicates

✅ **Script 3: Migration Verifier** (`3-verify-migration.js`)
   - Compare WordPress vs Eksporyuk
   - Check accuracy
   - Test logins

✅ **Dependencies Installed**
   - mysql2 ✅
   - dotenv ✅

---

## 🎯 YANG HARUS KAMU LAKUKAN SEKARANG:

### 1. Setup Database Credentials (5 menit)

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/wp-migration

# Copy template
cp .env.example .env

# Edit dengan credentials WordPress kamu
nano .env  # atau gunakan VS Code
```

**Isi dengan info ini:**
```env
WP_DB_HOST=192.168.x.x        # IP VPS WordPress kamu
WP_DB_PORT=3306               # Port MySQL (biasanya 3306)
WP_DB_USER=root               # MySQL username
WP_DB_PASSWORD=xxxxxx         # MySQL password
WP_DB_NAME=wordpress_db       # Nama database WordPress
WP_TABLE_PREFIX=wp_           # Table prefix (biasanya wp_)
MIGRATION_LIMIT=100           # Test dulu dengan 100 users
```

**💡 Cara dapat credentials:**

**Option A: Via SSH ke VPS**
```bash
ssh root@your-vps-ip
cat /var/www/html/wp-config.php | grep DB_
```

**Option B: Via WordPress Admin**
1. Login ke WordPress admin
2. Install plugin "WP PHPMyAdmin"
3. Lihat credentials di database

**Option C: Via Hosting Panel (cPanel/Plesk)**
1. Login ke hosting panel
2. Buka "Database" section
3. Lihat credentials MySQL

---

### 2. Test Database Connection (2 menit)

Setelah .env diisi, test dulu koneksinya:

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk

# Test connection
node scripts/wp-migration/1-extract-sejoli-data.js
```

**Jika sukses, kamu akan lihat:**
```
✅ Connected!
📊 EXTRACTION SUMMARY
Total Users:        100
Total Memberships:  XX
...
```

**Jika gagal:**
- Check firewall VPS (pastikan port 3306 terbuka)
- Check MySQL user permissions
- Verify credentials di .env

---

### 3. Run Full Migration (10 menit)

Setelah extraction sukses:

```bash
# Step 1: Extract sudah jalan
# Data saved di: extracted-data/sejoli-data-[timestamp].json

# Step 2: Import ke Eksporyuk
node scripts/wp-migration/2-import-to-eksporyuk.js \
  scripts/wp-migration/extracted-data/sejoli-data-XXXXX.json

# Step 3: Verify
node scripts/wp-migration/3-verify-migration.js \
  scripts/wp-migration/extracted-data/sejoli-data-XXXXX.json
```

---

## 🔍 Expected Results:

**After Extraction:**
```
✅ Data saved to: extracted-data/sejoli-data-2025-12-09T12-30-00.json
📊 EXTRACTION SUMMARY
Total Users:        100
Total Memberships:  45
Total Affiliates:   20
Total Revenue:      Rp 50,000,000
```

**After Import:**
```
📊 IMPORT SUMMARY
✅ Users Created:           95
⏭️  Users Skipped:           5  (already exist)
💰 Wallets Created:         95
💼 Affiliate Profiles:      20
```

**After Verification:**
```
📊 VERIFICATION SUMMARY
Overall Status:     PERFECT ✅
Accuracy:           100.00%
Users Match:        100/100
```

---

## ⚠️ PENTING - Checklist Sebelum Mulai:

- [ ] VPS WordPress accessible (test ping / SSH)
- [ ] MySQL port 3306 open (test telnet your-vps 3306)
- [ ] Database credentials correct
- [ ] Backup Eksporyuk database (jaga-jaga)
- [ ] Dev server Eksporyuk running (localhost:3000)

---

## 📞 Troubleshooting:

**Problem: Connection refused**
```bash
# Check if MySQL allows remote connections
# Edit MySQL config di VPS:
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Change:
bind-address = 0.0.0.0  # instead of 127.0.0.1

# Restart MySQL:
sudo systemctl restart mysql
```

**Problem: Access denied**
```bash
# Grant remote access to MySQL user:
mysql -u root -p
GRANT ALL PRIVILEGES ON *.* TO 'username'@'%' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
```

---

## 🎯 Next After Success:

Setelah 100 users berhasil:

1. **Test Login** - Coba login dengan:
   - Email: (dari extracted users)
   - Password: `ekspor123`

2. **Check Commission** - Verify affiliate balance di wallet

3. **Scale Up** - Ubah MIGRATION_LIMIT ke 500, 1000, atau 19000

4. **Go Production** - Deploy ke staging/live

---

## 📋 Quick Command Reference:

```bash
# Navigate to migration folder
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/wp-migration

# Setup .env
cp .env.example .env && nano .env

# Run extraction
node 1-extract-sejoli-data.js

# Import (ganti XXXXX dengan timestamp actual)
node 2-import-to-eksporyuk.js extracted-data/sejoli-data-XXXXX.json

# Verify
node 3-verify-migration.js extracted-data/sejoli-data-XXXXX.json

# Quick start helper
./quick-start.sh
```

---

## ✅ SIAP!

**NEXT ACTION:** 
1. Isi .env dengan database credentials
2. Run `node 1-extract-sejoli-data.js`
3. Report hasilnya ke saya!

Kalau ada error, screenshot dan kirim ke saya. 🚀
