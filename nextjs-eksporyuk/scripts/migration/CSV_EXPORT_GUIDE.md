# CARA TERMUDAH: EXPORT CSV DARI PHPMYADMIN
# ==========================================

## Step 1: Export Users dari phpMyAdmin

1. Login phpMyAdmin: https://103.125.181.47:8083/phpmyadmin
2. Pilih database: `aziz_member.eksporyuk.com`
3. Klik table: `wp_users`
4. Klik "Export" di top
5. Format: **CSV**
6. Save: `wp_users.csv`

## Step 2: Export User Meta

1. Klik table: `wp_usermeta`
2. Export → CSV
3. Save: `wp_usermeta.csv`

## Step 3: Letakkan File di Folder

```bash
# Copy CSV files ke project
# Download dari browser, lalu:
mv ~/Downloads/wp_users.csv /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/
mv ~/Downloads/wp_usermeta.csv /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/
```

## Step 4: Parse CSV

```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
node scripts/migration/parse-csv-export.js
```

## Step 5: Import ke Eksporyuk

```bash
node scripts/migration/import-to-eksporyuk.js --file=wp-data/sejoli-export-from-csv.json
```

---

## Untuk Affiliate Data (Optional)

Export tables ini juga kalau ada:
- `wp_sejoli_affiliates` → `wp_sejoli_affiliates.csv`
- `wp_sejoli_orders` → `wp_sejoli_orders.csv`
- `wp_sejoli_commissions` → `wp_sejoli_commissions.csv`

---

## Query SQL Langsung (Alternative)

Kalau mau, bisa jalankan query ini di phpMyAdmin SQL tab:

```sql
-- Export 100 users pertama dengan metadata penting
SELECT 
  u.ID,
  u.user_email,
  u.user_login,
  u.display_name,
  u.user_registered,
  m1.meta_value as phone,
  m2.meta_value as first_name,
  m3.meta_value as last_name,
  m4.meta_value as affiliate_code,
  m5.meta_value as wallet_balance
FROM wp_users u
LEFT JOIN wp_usermeta m1 ON u.ID = m1.user_id AND m1.meta_key = 'billing_phone'
LEFT JOIN wp_usermeta m2 ON u.ID = m2.user_id AND m2.meta_key = 'first_name'
LEFT JOIN wp_usermeta m3 ON u.ID = m3.user_id AND m3.meta_key = 'last_name'
LEFT JOIN wp_usermeta m4 ON u.ID = m4.user_id AND m4.meta_key = 'sejoli_affiliate_code'
LEFT JOIN wp_usermeta m5 ON u.ID = m5.user_id AND m5.meta_key = 'sejoli_wallet_balance'
LIMIT 100;
```

Export hasil query → CSV → Parse dengan script
