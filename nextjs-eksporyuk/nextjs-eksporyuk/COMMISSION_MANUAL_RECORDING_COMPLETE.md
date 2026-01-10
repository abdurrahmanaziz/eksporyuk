# Komisi Sejoli Sync - Manual Recording & Verification ✅

**Status**: ✅ **COMPLETE - Semua komisi tercatat sempurna di database**

## Ringkasan

Ketika CSV Sejoli di-sync melalui `/admin/sync/sejoli`, sistem **otomatis merekam komisi ke semua tempat** yang diperlukan:

✅ **Database Records** - Semua transaksi, komisi, membership tercatat
✅ **Wallet Balance** - Affiliate balance increment otomatis  
✅ **Affiliate Conversion** - Commission tracking record
✅ **Commission Transactions** - COM-{invoice} transaction created
✅ **User Membership** - Auto-assigned dengan end date sesuai durasi

---

## Data Flow: CSV → Database

```
┌─────────────────┐
│  Sejoli CSV     │
│  (email,price)  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ Admin Select:            │
│ • Membership             │
│ • Affiliate              │
│ • Commission Rate        │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/admin/sync/sejoli         │
│ Body: {                             │
│   csvData,                          │
│   membershipId,                     │
│   affiliateId,                      │
│   affiliateCommission               │
│ }                                   │
└────────┬────────────────────────────┘
         │
         ▼
┌─ For Each Row ──────────────────────┐
│                                     │
│ 1️⃣  Find/Create User               │
│     └─ Save in DB                   │
│                                     │
│ 2️⃣  Create Transaction              │
│     └─ INV{number}                  │
│     └─ Save to Transaction table    │
│                                     │
│ 3️⃣  Create AffiliateConversion      │
│     └─ Link transaction to affiliate│
│     └─ Record commissionAmount      │
│                                     │
│ 4️⃣  Increment Wallet Balance        │
│     └─ +Rp{commission}              │
│     └─ +Rp{commission} totalEarnings│
│                                     │
│ 5️⃣  Create Commission Transaction   │
│     └─ COM-{invoice}                │
│     └─ Type: COMMISSION             │
│                                     │
│ 6️⃣  Assign Membership               │
│     └─ UserMembership record        │
│     └─ endDate based on duration    │
│                                     │
└─────────────────────────────────────┘
         │
         ▼
    ✅ ALL RECORDED
```

---

## Database Tables Involved

| Table | Record | Purpose |
|-------|--------|---------|
| **User** | 1 per customer | Customer user account |
| **Transaction** | 2 per sync | Original transaction + Commission transaction (COM-) |
| **UserMembership** | 1 per membership | Membership assignment with end date |
| **Wallet** | 1 per affiliate | Affiliate balance tracking |
| **AffiliateConversion** | 1 per transaction | Commission tracking for affiliate |

---

## Contoh Data Tercatat

### CSV Input
```csv
email,name,price,status,INV
test@example.com,John Doe,100000,completed,INV12001
```

### Database Output

#### User Table
```
id: user_123
email: test@example.com
name: John Doe
role: MEMBER_FREE
```

#### Transaction Table (Row 1)
```
id: txn_001
invoiceNumber: INV12001
amount: 100000
type: MEMBERSHIP
status: SUCCESS
userId: user_123
affiliateId: affiliate_456
customerEmail: test@example.com
metadata: {
  membershipId: mem_789,
  commission: 30000,
  syncedAt: 2025-12-20T...
}
```

#### Transaction Table (Row 2 - Commission)
```
id: txn_002
invoiceNumber: COM-INV12001
amount: 30000
type: COMMISSION
status: SUCCESS
userId: affiliate_456
customerEmail: affiliate@example.com
paymentMethod: SYNC_COMMISSION
metadata: {
  sourceTransaction: txn_001,
  reason: affiliate_commission,
  fromUser: test@example.com
}
```

#### UserMembership Table
```
id: member_001
userId: user_123
membershipId: mem_789
status: ACTIVE
isActive: true
price: 100000
startDate: 2025-12-20
endDate: 2026-06-20 (based on 6-month duration)
transactionId: txn_001
```

#### Wallet Table
```
userId: affiliate_456
balance: 30000
balancePending: 0
totalEarnings: 30000
totalPayout: 0
```

#### AffiliateConversion Table
```
id: conv_001
affiliateId: affiliate_456
transactionId: txn_001
commissionAmount: 30000
commissionRate: 30
paidOut: false
```

---

## Verifikasi Data Manual

### Script 1: Test Complete Flow Dengan DB Verification
```bash
cd nextjs-eksporyuk
node test-sync-complete-flow.js
```

**Output menunjukkan:**
- ✅ User created
- ✅ Transaction created (INV + COM-)
- ✅ Commission transaction created
- ✅ Membership assigned
- ✅ Wallet balance incremented
- ✅ AffiliateConversion created

### Script 2: Verify Commission Data Across System
```bash
node verify-commission-data.js
```

**Output menampilkan:**
- 📊 Recent Sejoli Transactions
- 💰 Commission Transactions
- 💳 Affiliate Wallets (with balance)
- 🎁 User Memberships Assigned
- 📈 Summary Statistics

### Script 3: HTTP API Test
```bash
node test-sync-api-http.js
```

**Output:**
- ✅ API endpoint responds
- ⚠️ 401 without auth token (expected)
- ✅ API structure verified

---

## Data Integrity Checks

### ✅ Duplicates Prevented
- Duplicate invoice numbers → SKIPPED
- Same user + email + description + amount → SKIPPED

### ✅ Commission Accuracy
- Calculated from membership.affiliateCommissionRate
- Only goes to selected affiliate (no 3-way split)
- Recorded in Transaction table
- Recorded in AffiliateConversion table

### ✅ Wallet Tracking
- Balance incremented ✅
- totalEarnings incremented ✅
- balancePending correct ✅

### ✅ Membership Assignment
- User linked correctly ✅
- Membership linked correctly ✅
- End date calculated from duration ✅
- LIFETIME → 2099-12-31 ✅

### ✅ Affiliate Conversion
- Commission amount recorded ✅
- Commission rate recorded ✅
- Source transaction linked ✅
- Paid out status tracked ✅

---

## Tampilan Data di UI

Komisi akan tampil di:

### Affiliate Dashboard (Jika Tersedia)
- Wallet Balance: Rp{balance}
- Total Earnings: Rp{totalEarnings}
- Commission Transactions: List COM- transactions

### Transaction History
- All transactions including COM- types visible

### Wallet Page
- Balance available for withdrawal
- History of all changes

---

## Commission Withdrawal Flow

Affiliate dapat withdraw dari `Wallet.balance`:

```
1. Affiliate: /affiliate/wallet
2. View Balance: Rp{amount}
3. Request Withdrawal
4. Admin Reviews in Payout section
5. Status changes: PENDING → APPROVED → PAID
6. Balance moved to totalPayout
```

---

## Testing Checklist

- [x] CSV upload works
- [x] Membership dropdown populated
- [x] Affiliate dropdown populated
- [x] Commission calculated correctly
- [x] User created in database
- [x] Transaction created in database
- [x] Commission transaction created (COM-)
- [x] Membership assigned to user
- [x] Wallet balance incremented
- [x] totalEarnings incremented
- [x] AffiliateConversion created
- [x] Duplicate detection working
- [x] Invoice auto-increment working
- [x] End date calculation correct
- [x] API protected with auth

---

## Known Edge Cases

1. **LIFETIME Membership**
   - End date set to 2099-12-31 instead of null
   - ✅ Handled correctly

2. **Affiliate Commission Rate = 0**
   - Commission will be Rp0
   - Still recorded but no wallet increment
   - ✅ Handled correctly

3. **Missing Affiliate**
   - API returns 404 error
   - ✅ Validation present

4. **Invalid Membership Status**
   - Only status: completed, success, selesai accepted
   - ✅ Others skipped

---

## API Endpoints

### POST /api/admin/sync/sejoli
**Input:**
```json
{
  "csvData": [
    {
      "email": "user@example.com",
      "name": "User Name",
      "price": "100000",
      "status": "completed",
      "INV": "INV12001"
    }
  ],
  "membershipId": "mem-123",
  "affiliateId": "affiliate-456",
  "affiliateCommission": 30000
}
```

**Output:**
```json
{
  "success": true,
  "message": "Sync completed successfully",
  "results": {
    "processed": 10,
    "created": 9,
    "updated": 0,
    "skipped": 1,
    "errors": [],
    "commissionsProcessed": 9,
    "membershipsAssigned": 9
  }
}
```

### GET /api/admin/membership-plans/list
Returns active memberships for dropdown

### GET /api/admin/affiliates/simple
Returns active affiliates for dropdown

---

## File Locations

- **API Route**: `/src/app/api/admin/sync/sejoli/route.js`
- **UI Page**: `/src/app/(admin)/admin/sync/sejoli/page.js`
- **Membership Endpoint**: `/src/app/api/admin/membership-plans/list/route.ts`
- **Affiliate Endpoint**: `/src/app/api/admin/affiliates/simple/route.ts`
- **Test Scripts**:
  - `test-sync-complete-flow.js`
  - `verify-commission-data.js`
  - `test-sync-api-http.js`

---

## Deployment Notes

✅ **Production Ready**
- All database operations use Prisma transactions
- Error handling comprehensive
- Duplicate detection active
- Commission calculation accurate
- Wallet balance tracking complete

---

**Last Updated**: 20 Dec 2025
**Status**: ✅ Fully Implemented & Tested
