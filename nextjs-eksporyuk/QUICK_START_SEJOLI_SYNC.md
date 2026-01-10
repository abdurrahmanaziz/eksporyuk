# 🚀 Quick Start - Komisi Sejoli Sync

## ✅ Status: Ready to Use

Komisi tercatat otomatis di:
- ✅ Transaction table (INV + COM- records)
- ✅ Wallet table (affiliate balance)
- ✅ AffiliateConversion table
- ✅ UserMembership table
- ✅ Database terintegrasi penuh

---

## 🎯 Cara Menggunakan

### 1. Buka Halaman Sync
```
http://localhost:3000/admin/sync/sejoli
```

### 2. Pilih Setting
- **Membership**: Dari dropdown (auto-populate)
- **Affiliate**: Dari dropdown (auto-populate)
- **Commission**: Auto-calculate dari membership rate

### 3. Upload Data
```csv
email,name,price,status,INV
test@example.com,John,100000,completed,INV12001
```

### 4. Click "Start Sync"
- User created
- Transaction created (INV12001)
- Commission transaction created (COM-INV12001)
- Affiliate wallet +Rp{commission}
- Membership assigned

### 5. Lihat Hasil
- ✅ Processed: 1
- ✅ Created: 1
- ✅ Commissions: 1
- ✅ Memberships: 1

---

## 🔍 Verify Data

### Check All Commission Data
```bash
cd nextjs-eksporyuk
node verify-commission-data.js
```

Output:
```
✅ Total Transactions: X
💰 Total Commission: RpX
👥 Affiliates: X
🎁 Memberships: X
```

---

## 📊 Database Records

### Per Transaction
```
Transaction (INV)
  ↓ amount: Rp100,000
  ↓ type: MEMBERSHIP
  
Transaction (COM-)
  ↓ amount: Rp30,000
  ↓ type: COMMISSION
  
Wallet
  ↓ balance: +Rp30,000
  ↓ totalEarnings: +Rp30,000
  
UserMembership
  ↓ status: ACTIVE
  ↓ endDate: calculated
  
AffiliateConversion
  ↓ commissionAmount: Rp30,000
  ↓ commissionRate: 30%
```

---

## 💰 Commission Flow

```
CSV: price=100,000, commission_rate=30%
  ↓
Affiliate receives: Rp30,000
  ↓
Added to wallet.balance
  ↓
Added to wallet.totalEarnings
  ↓
Can withdraw via payout system
```

---

## ⚙️ API Endpoints

### POST /api/admin/sync/sejoli
- Input: csvData, membershipId, affiliateId, affiliateCommission
- Output: {processed, created, commissionsProcessed, membershipsAssigned}
- Auth: Admin required

### GET /api/admin/membership-plans/list
- Output: [{id, name, price, affiliateCommissionRate}]
- Auth: Admin required

### GET /api/admin/affiliates/simple
- Output: [{id, name, email}]
- Auth: Admin required

---

## 🛠️ Testing Commands

```bash
# Test complete flow
node test-sync-complete-flow.js

# Verify all data
node verify-commission-data.js

# Test HTTP API
node test-sync-api-http.js
```

---

## 📝 CSV Format

| Column | Type | Example | Required |
|--------|------|---------|----------|
| email | string | user@example.com | ✅ Yes |
| name | string | John Doe | ✅ Yes |
| price | number | 100000 | ✅ Yes |
| status | string | completed | ✅ Yes |
| INV | string | INV12001 | ❌ Optional |

**Valid status values:**
- completed
- success
- selesai

---

## ⚠️ Notes

- ✅ Komisi hanya ke affiliate terpilih (no split)
- ✅ Wallet balance increment immediate
- ✅ Duplicate detection active
- ✅ Invoice auto-increment 12001+
- ✅ Membership endDate calculated dari duration
- ✅ LIFETIME = 2099-12-31

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Membership dropdown kosong | Check if active memberships exist |
| Affiliate dropdown kosong | Check if active affiliates exist |
| Commission Rp0 | Check membership.affiliateCommissionRate |
| Sync tidak jalan | Check browser console for errors |
| Wallet tidak update | Check database connection |

---

## 📞 Support

File locations:
- API: `/src/app/api/admin/sync/sejoli/route.js`
- UI: `/src/app/(admin)/admin/sync/sejoli/page.js`
- Test: `test-sync-complete-flow.js`
- Verify: `verify-commission-data.js`

---

**Version**: 1.0  
**Status**: ✅ Production Ready  
**Date**: 20 Dec 2025
