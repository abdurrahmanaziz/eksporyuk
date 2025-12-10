# MIGRATION - MANUAL EXPORT METHOD
# ==================================
# Jika SSH tunnel atau remote MySQL tidak bisa, gunakan export manual

## Step 1: Export dari HestiaCP/phpMyAdmin

1. Login ke phpMyAdmin di HestiaCP
2. Pilih database: aziz_member.eksporyuk.com
3. Klik tab "Export"
4. **Custom export**, pilih tables:
   - wp_users (ALL)
   - wp_usermeta (ALL)
   - wp_sejoli_orders (ALL - jika ada)
   - wp_sejoli_affiliates (ALL - jika ada)
   - wp_sejoli_commissions (ALL - jika ada)
   - wp_posts (WHERE post_type='shop_order' - jika WooCommerce)
   - wp_postmeta (related to orders)

5. Format: **SQL**
6. Save file: `wordpress-export.sql`

## Step 2: Copy SQL file ke folder migration

```bash
# Copy exported SQL ke project
cp ~/Downloads/wordpress-export.sql /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/scripts/migration/wp-data/
```

## Step 3: Import ke MySQL Lokal (Optional - untuk parsing)

```bash
# Buat database lokal temporary
mysql -u root -e "CREATE DATABASE wp_temp"

# Import SQL
mysql -u root wp_temp < scripts/migration/wp-data/wordpress-export.sql

# Update .env.wp untuk local
WP_DB_HOST=localhost
WP_DB_USER=root
WP_DB_PASSWORD=
WP_DB_NAME=wp_temp
```

## Step 4: Jalankan extraction

```bash
node scripts/migration/extract-sejoli-data.js
```

---

## ATAU - Alternative: JSON Export dari phpMyAdmin

1. Di phpMyAdmin, pilih tables yang sama
2. Export format: **JSON**
3. Save ke: `scripts/migration/wp-data/wordpress-manual-export.json`
4. Saya buatkan parser khusus untuk JSON format ini

---

## Mana yang lebih mudah untuk kamu?

A. Export SQL → Import ke MySQL local → Extract
B. Export JSON → Parse langsung
C. Fix SSH tunnel/Remote MySQL (perlu setting di HestiaCP)
