# 🚀 QUICK REFERENCE - Membership Migration

**Last Updated**: 10 Desember 2025

## 📊 Current State

```
Total Users     : 18,176
Total Memberships: 9,908
  - Active      : 9,632 (97.2%)
  - Expired     : 276 (2.8%)

Membership Distribution:
  - Lifetime    : 9,480 (95.7%)
  - 12 Bulan    : 319 (3.2%)
  - 6 Bulan     : 105 (1.1%)
  - 1 Bulan     : 2
  - 3 Bulan     : 2

Total Komisi Sync: Rp 1.229.746.000 ✅
Unique Affiliates: 99
```

---

## 🎯 Common Tasks

### 1. Cek User Membership
```bash
cd nextjs-eksporyuk
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser(email) {
  const user = await prisma.user.findFirst({
    where: { email: { contains: email, mode: 'insensitive' } },
    include: {
      userMemberships: {
        include: { membership: true }
      },
      wallet: true
    }
  });
  
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log('User:', user.name);
  console.log('Email:', user.email);
  console.log('\nMemberships:');
  user.userMemberships.forEach(um => {
    const exp = new Date(um.endDate).toLocaleDateString('id-ID');
    console.log('  -', um.membership.name, '| Exp:', exp, '| Status:', um.status);
  });
  
  console.log('\nWallet:');
  console.log('  Balance:', user.wallet?.balance || 0);
  console.log('  Total Earnings:', user.wallet?.totalEarnings || 0);
  
  await prisma.\$disconnect();
}

checkUser('EMAIL_DISINI');
"
```

### 2. Manual Assign Membership (Interactive)
```bash
cd nextjs-eksporyuk
node scripts/migration/manual-assign-membership.js
```

### 3. Cek Produk Mapping
```bash
cd nextjs-eksporyuk
node -e "
const mapping = require('./scripts/migration/product-membership-mapping.js');
console.log(JSON.stringify(mapping, null, 2));
"
```

### 4. Cek Komisi Affiliate
```bash
cd nextjs-eksporyuk
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAffiliate(email) {
  const user = await prisma.user.findFirst({
    where: { email: { contains: email, mode: 'insensitive' } },
    include: {
      wallet: true,
      affiliateProfile: true
    }
  });
  
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Total Earnings:', user.wallet?.totalEarnings || 0);
  console.log('Balance:', user.wallet?.balance || 0);
  console.log('Conversions:', user.affiliateProfile?.totalConversions || 0);
  
  await prisma.\$disconnect();
}

checkAffiliate('EMAIL_DISINI');
"
```

---

## 🗺️ Product → Membership Mapping

### Quick Reference Table

| WordPress Product ID | Product Name | Next.js Membership | Komisi |
|---------------------|--------------|-------------------|--------|
| 13401 | Paket Ekspor Yuk Lifetime | **Lifetime** | Rp 325K |
| 3840 | Bundling Kelas + EYA | **Lifetime** | Rp 300K |
| 6068 | Kelas Bimbingan | **Lifetime** | Rp 250K |
| 16956 | Promo MEI Lifetime 2025 | **Lifetime** | Rp 210K |
| 15234 | Promo Lifetime THR 2025 | **Lifetime** | Rp 210K |
| 17920 | Promo Tahun Baru Islam | **Lifetime** | Rp 250K |
| 8910 | Re Kelas Lifetime | **Lifetime** | Rp 0 |
| 8683 | Kelas 12 Bulan | **12 Bulan** | Rp 300K |
| 13399 | Paket 12 Bulan | **12 Bulan** | Rp 250K |
| 8915 | Re Kelas 12 Bulan | **12 Bulan** | Rp 0 |
| 13400 | Paket 6 Bulan | **6 Bulan** | Rp 200K |
| 8684 | Kelas 6 Bulan | **6 Bulan** | Rp 250K |
| 8914 | Re Kelas 6 Bulan | **6 Bulan** | Rp 0 |
| 179 | Kelas Eksporyuk | **1 Bulan** | Rp 135K-250K |

---

## 🔧 Troubleshooting

### User tidak punya membership padahal sudah order
```bash
# 1. Cek di WordPress apakah ordernya completed
# 2. Re-run import script:
cd nextjs-eksporyuk
node scripts/migration/import-membership-from-orders.js

# 3. Atau manual assign:
node scripts/migration/manual-assign-membership.js
```

### Komisi affiliate tidak sesuai
```bash
# Reconnect SSH tunnel
ssh -f -N -L 3307:127.0.0.1:3306 eksporyuk@103.125.181.47

# Re-sync commission
cd nextjs-eksporyuk
node -e "
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

async function resyncCommission(email) {
  const wpConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'aziz_member.eksporyuk.com',
    password: 'E%ds(xRh3T]AA|Qh',
    database: 'aziz_member.eksporyuk.com'
  });
  
  const prisma = new PrismaClient();
  
  // Get WordPress data
  const [wpUsers] = await wpConn.execute(\`
    SELECT 
      u.user_email,
      SUM(a.commission) as total_commission,
      COUNT(*) as order_count
    FROM wp_sejolisa_affiliates a
    JOIN wp_users u ON a.affiliate_id = u.ID
    WHERE a.status = 'added' AND u.user_email = ?
    GROUP BY u.user_email
  \`, [email]);
  
  if (wpUsers.length === 0) {
    console.log('No commission found in WordPress');
    await wpConn.end();
    await prisma.\$disconnect();
    return;
  }
  
  const wpData = wpUsers[0];
  console.log('WordPress Commission:', wpData.total_commission);
  
  // Update Next.js
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } }
  });
  
  if (!user) {
    console.log('User not found in Next.js');
    await wpConn.end();
    await prisma.\$disconnect();
    return;
  }
  
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {
      totalEarnings: Number(wpData.total_commission),
      balance: Number(wpData.total_commission)
    },
    create: {
      userId: user.id,
      totalEarnings: Number(wpData.total_commission),
      balance: Number(wpData.total_commission),
      balancePending: 0,
      totalPayout: 0
    }
  });
  
  await prisma.affiliateProfile.updateMany({
    where: { userId: user.id },
    data: {
      totalEarnings: Number(wpData.total_commission),
      totalConversions: wpData.order_count
    }
  });
  
  console.log('Updated!');
  
  await wpConn.end();
  await prisma.\$disconnect();
}

resyncCommission('EMAIL_DISINI');
"
```

### Membership expire date salah
```bash
# Update manual via Prisma Studio
cd nextjs-eksporyuk
npx prisma studio

# Atau via script:
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExpiry(userEmail, newExpiryDate) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: userEmail, mode: 'insensitive' } }
  });
  
  const newExpiry = new Date(newExpiryDate);
  const now = new Date();
  const status = newExpiry > now ? 'ACTIVE' : 'EXPIRED';
  
  await prisma.userMembership.updateMany({
    where: { userId: user.id },
    data: {
      endDate: newExpiry,
      status: status
    }
  });
  
  console.log('Updated expiry to', newExpiry.toLocaleDateString('id-ID'));
  
  await prisma.\$disconnect();
}

fixExpiry('EMAIL_DISINI', '2025-12-31');
"
```

---

## 📁 Important Files

### Migration Scripts
```
scripts/migration/
├── product-membership-mapping.js    # Mapping config
├── import-membership-from-orders.js # Import with expiry
├── fix-membership-dates.js          # Fix existing data
├── manual-assign-membership.js      # Interactive tool
└── verify-sejoli.js                 # Verification
```

### Documentation
```
nextjs-eksporyuk/
├── MIGRATION_MEMBERSHIP_MAPPING_COMPLETE.md  # Full docs
└── MEMBERSHIP_MIGRATION_QUICK_REF.md         # This file
```

---

## 🚨 Important Notes

### DO NOT:
- ❌ Reset database tanpa backup
- ❌ Ubah commission rate sembarangan
- ❌ Edit mapping config tanpa testing
- ❌ Run import script multiple times (akan duplicate)

### ALWAYS:
- ✅ Backup database sebelum import besar
- ✅ Test di development dulu
- ✅ Verify data setelah migration
- ✅ Keep SSH tunnel alive saat query WordPress

---

## 📞 Support

**Issues?**
1. Check logs: `migration-progress.log`
2. Verify SSH tunnel: `lsof -i :3307`
3. Check database: `npx prisma studio`
4. Contact developer if data inconsistency

**WordPress Database Access:**
```bash
# Create SSH tunnel
ssh -f -N -L 3307:127.0.0.1:3306 eksporyuk@103.125.181.47

# Verify connection
mysql -h 127.0.0.1 -P 3307 -u aziz_member.eksporyuk.com -p aziz_member.eksporyuk.com
```

---

## ✅ Verification Checklist

After migration, verify:
- [ ] Total users match WordPress
- [ ] Commission totals match (Rp 1.229.746.000)
- [ ] Membership expiry dates correct
- [ ] No active memberships with past expiry
- [ ] Top affiliates match WordPress data
- [ ] Random user spot-check (5-10 users)

---

**Last Sync**: 10 Desember 2025  
**Data Source**: WordPress Sejoli (wp_sejolisa_* tables)  
**Migration Status**: ✅ COMPLETE
