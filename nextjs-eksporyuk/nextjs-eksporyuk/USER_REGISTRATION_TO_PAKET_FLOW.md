# Alur Lengkap: User Daftar → Pilih Paket → Pembayaran → Aktivasi

## 🎯 Overview
Sistem Eksporyuk menggunakan alur multi-step untuk konversi user dari pendaftar menjadi member aktif dengan paket membership. Setiap tahap memiliki validasi, entitas database, dan sinkronisasi komisi affiliate.

---

## 📋 TAHAP 1: USER DAFTAR (Registration)

### 1.1 Flow Front-End
**File**: `/src/app/(auth)/register/page.tsx`

```
User klik "Daftar" di homepage → Form Register muncul
├─ Input: Nama Lengkap
├─ Input: Email Gmail
├─ Input: Username (opsional, auto-generated jika kosong)
├─ Input: WhatsApp (opsional, tapi recommended)
├─ Input: Password (min 8 karakter)
├─ Input: Konfirmasi Password
└─ Submit → POST /api/auth/register
```

### 1.2 Backend: POST /api/auth/register
**File**: `/src/app/api/auth/register/route.ts`

**Validasi**:
- ✅ Email harus valid Gmail (@gmail.com)
- ✅ Email belum terdaftar di DB (unique)
- ✅ Username belum digunakan (jika diberikan)
- ✅ Password minimal 8 karakter
- ✅ Password & Confirm Password match

**Proses**:
1. **Generate Username** (jika tidak diberikan)
   - Format: `nama_lowercase_randomstring`
   - Max 20 karakter + random 6 digit

2. **Hash Password**
   - Menggunakan bcryptjs (10 rounds)

3. **Generate Member Code**
   - Sequence ID berdasian counter di Settings
   - Contoh: `EK-20250105-0001`
   - Fallback: Null jika gagal (bisa di-generate nanti)

4. **Buat User** di Prisma
   ```typescript
   User {
     id: uuid,
     email: "user@gmail.com",
     name: "Nama User",
     username: "nama_user_abc123",
     whatsapp: "+6281234567890" | null,
     password: bcrypt_hash,
     emailVerified: null,
     role: "MEMBER_FREE", // Default role
     memberCode: "EK-20250105-0001" | null,
     isFounder: false,
     isCoFounder: false,
     isAffiliate: false,
     affiliateId: null,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

5. **Buat Wallet** (auto-related via Prisma relation)
   ```typescript
   Wallet {
     userId: uuid,
     balance: 0,
     balancePending: 0,
     balanceWithdrawn: 0,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

6. **Send Welcome Email**
   - Template: `WELCOME_EMAIL`
   - Jika template tidak ada → Log warning (don't block)

7. **Log Activity**
   ```typescript
   ActivityLog {
     userId: uuid,
     action: "USER_REGISTERED",
     details: { email, name },
     timestamp: now
   }
   ```

8. **Add to Mailketing Lists** (email marketing automation)
   - Fetch role lists berdasarkan role MEMBER_FREE
   - Auto-add user jika `autoAddOnRegister: true`
   - Async (don't block registration)

**Response**:
```json
{
  "success": true,
  "message": "Pendaftaran berhasil",
  "user": { id, email, name, username }
}
```

---

## 📦 TAHAP 2: USER LIHAT & PILIH PAKET (Package Selection)

### 2.1 Flow Front-End
**File**: `/src/app/membership/page.tsx`

```
User login → Dashboard → Klik "Lihat Paket"
├─ Fetch GET /api/memberships
├─ List paket membership ditampilkan:
│  ├─ Paket 1 Bulan (Rp 99,000)
│  ├─ Paket 3 Bulan (Rp 249,000)
│  ├─ Paket 6 Bulan (Rp 498,000) ⭐ Paling populer
│  └─ Paket 12 Bulan (Rp 995,000) ⭐ Best seller
├─ User lihat: Harga, Fitur, Durasi
└─ User klik "Pilih Paket" → Redirect ke checkout
```

### 2.2 API: GET /api/memberships
**File**: `/src/app/api/memberships/route.ts`

**Response**: Array dari `Membership` aktif
```typescript
interface Membership {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  durationType: "DAYS" | "MONTHS" | "YEARS";
  duration: number;
  formLogo: string | null;
  formBanner: string | null;
  features: string[]; // JSON array
  isBestSeller: boolean;
  isMostPopular: boolean;
  // Commission settings untuk affiliate
  affiliateCommissionRate: number; // 30, 200000, etc
  commissionType: "PERCENTAGE" | "FLAT"; // % atau Rupiah
  isActive: boolean;
}
```

### 2.3 Form Checkout
**File**: `/src/app/checkout/` components

User input data:
```
├─ planId: string (membership ID)
├─ priceOption: { price: number, name: string }
├─ couponCode?: string (optional)
├─ affiliateCode?: string (optional, jika dari referral link)
├─ name: string (nama pembeli, bisa berbeda dari nama akun)
├─ email: string
├─ phone/whatsapp: string
└─ paymentMethod: "MANUAL_TRANSFER" | "XENDIT_VA" | "XENDIT_EWALLET" | "INVOICE"
```

---

## 💳 TAHAP 3: CHECKOUT & BUAT TRANSACTION (Payment Processing)

### 3.1 POST /api/checkout/membership
**File**: `/src/app/api/checkout/membership/route.ts`

**Pre-Checkout Validasi**:

1. **Session Check** ✅
   - User harus sudah login (NextAuth session)

2. **Verify User di Database**
   - Jika user baru di session tapi belum di DB → auto-create dengan role CUSTOMER
   - Perbarui user data jika ada yang berubah (name, whatsapp, email)

3. **Cek Membership Plan**
   - Plan harus ada di DB dan `isActive: true`

4. **Cek Order Cooldown** (Anti-spam)
   - Default: 5 menit antar order
   - Setting: `Settings.orderCooldownEnabled`, `Settings.orderCooldownMinutes`
   - Query: Cari transaksi PENDING user dalam cooldown window
   - Jika ada → Reject dengan pesan tunggu X menit

5. **Cek Active Membership**
   - User tidak boleh punya membership ACTIVE lain
   - Jika punya → Reject (harus upgrade atau tunggu expired)

**Proses Checkout**:

1. **Apply Coupon** (jika ada couponCode)
   ```typescript
   Coupon {
     code: string,
     discountType: "PERCENTAGE" | "FLAT",
     discountValue: number,
     maxUses: number,
     usedCount: number,
     validFrom: date,
     validUntil: date,
     isActive: boolean,
     affiliateOnly: boolean
   }
   ```
   - Validasi: Coupon aktif, belum expired, masih ada kuota
   - Hitung discount sesuai type
   - Kurangi dari final price

2. **Track Affiliate** (jika ada affiliateCode)
   - Cari affiliate dari `AffiliateLink.code = affiliateCode`
   - Ambil affiliate's user ID
   - Store di `Transaction.affiliateId`

3. **Hitung Final Price**
   ```
   final_price = plan_price - discount
   ```

4. **Buat Transaction**
   ```typescript
   Transaction {
     id: uuid,
     userId: uuid,
     status: "PENDING", // Sebelum bayar
     type: "MEMBERSHIP",
     amount: final_price,
     originalAmount: plan_price,
     discountAmount: discount,
     paymentMethod: payment_method,
     membershipId: plan_id,
     membershipType: plan.slug,
     membershipDuration: plan.duration,
     affiliateId: affiliate_id | null,
     affiliateName: affiliate_name | null,
     affiliateCode: affiliate_code | null,
     couponId: coupon_id | null,
     expiryHours: 24, // Link bayar expired dalam 24 jam
     createdAt: timestamp,
     paidAt: null, // Belum dibayar
     externalId: null // Belum ada ID dari payment gateway
   }
   ```

5. **Generate Payment Link** (berbeda sesuai payment method)

   **A. MANUAL_TRANSFER**
   - Response: Bank account info, transaction ID, bukti transfer form
   - User harus transfer manual dan upload bukti

   **B. XENDIT_VA** (Virtual Account)
   - Call Xendit API: Create Invoice
   ```typescript
   await xenditService.createInvoice({
     externalId: transaction.id,
     amount: final_price,
     description: `Membership ${plan.name}`,
     customerEmail: user.email,
     customerName: user.name,
     invoiceDuration: 3600 // 1 hour payment window
   })
   ```
   - Return: VA number, bank code, payment URL

   **C. XENDIT_EWALLET** (OVO, Dana, LinkAja)
   - Similar dengan VA
   - API return: QR code, payment URL

   **D. INVOICE**
   - Generate invoice file
   - Send via email

6. **Return Response**
   ```json
   {
     "success": true,
     "transaction": {
       "id": "tx-uuid",
       "amount": 498000,
       "paymentUrl": "https://checkout.xendit.co/...",
       "paymentMethod": "XENDIT_VA",
       "expiryAt": "2025-01-06T12:00:00Z"
     }
   }
   ```

### 3.2 User Lihat & Lakukan Pembayaran
- Redirect ke halaman payment
- QR code atau link payment ditampilkan
- User transfer/scan QR code

---

## ✅ TAHAP 4: PAYMENT CONFIRMATION & ACTIVATION

### 4.1 Payment Gateway Webhook
**File**: `/src/app/api/webhooks/xendit/route.ts`

**Trigger**: Xendit kirim webhook ketika payment berhasil

```json
{
  "id": "xendit-invoice-id",
  "external_id": "tx-uuid",
  "status": "PAID",
  "amount": 498000,
  "paid_amount": 498000,
  "paid_at": "2025-01-05T10:00:00Z"
}
```

**Proses Webhook**:
1. Validate webhook signature (gunakan `XENDIT_WEBHOOK_TOKEN`)
2. Find transaction by `externalId`
3. Update transaction: `status: "SUCCESS"`, `paidAt: now()`
4. **TRIGGER MEMBERSHIP ACTIVATION** (lihat 4.2)
5. **TRIGGER COMMISSION PROCESSING** (lihat 4.3)

### 4.2 Aktivasi Membership
**Function**: `activateMembership()` dari `/src/lib/membership-helper.ts`

**Proses**:
1. **Buat/Update UserMembership**
   ```typescript
   UserMembership {
     userId: uuid,
     membershipId: uuid,
     status: "ACTIVE",
     purchaseDate: now,
     activatedAt: now,
     expiryDate: now + duration (dalam bulan/hari)
   }
   ```

2. **Auto-Assign Groups** (dari membership settings)
   - Query: `Membership.membershipGroups` (many-to-many)
   - Untuk setiap group → Add user ke UserGroup
   ```typescript
   UserGroup {
     userId: uuid,
     groupId: uuid,
     joinedAt: now,
     status: "ACTIVE"
   }
   ```

3. **Auto-Enroll Courses**
   - Query: `Membership.courses` (many-to-many)
   - Untuk setiap course → Create enrollment
   ```typescript
   CourseEnrollment {
     userId: uuid,
     courseId: uuid,
     enrolledAt: now,
     status: "ACTIVE",
     progress: 0
   }
   ```

4. **Send Activation Email**
   - Template: `MEMBERSHIP_ACTIVATED`
   - Data: Membership name, expiry date, akses courses/groups

### 4.3 Komisi Affiliate & Revenue Distribution
**Function**: `processTransactionCommission()` dari `/src/lib/commission-helper.ts`

**Alur Komisi**:

```
Transaction Amount: Rp 498,000
├─ Membership: "Paket 6 Bulan"
├─ Affiliate Commission Rate: 200,000 (FLAT)
├─ Affiliate: User B (dari affiliateCode)
└─ Target: Distribute ke Affiliate, Admin, Founder, Co-Founder

Step 1: Hitung komisi affiliate
  affiliateCommissionAmount = Min(200000, 498000) = 200,000
  
Step 2: Sisa setelah komisi affiliate
  remaining = 498,000 - 200,000 = 298,000
  
Step 3: Revenue split dari sisa
  adminFee = 15% × 298,000 = 44,700 → balancePending
  founderShare = 60% × (298,000 - 44,700) = 60% × 253,300 = 151,980 → balancePending
  cofounderShare = 40% × 253,300 = 101,320 → balancePending
  
Step 4: Credit to Wallets
  
  Affiliate (User B):
  ├─ Wallet.balance += 200,000 (withdrawable immediately)
  └─ WalletTransaction (type: COMMISSION)
  
  Admin:
  ├─ Wallet.balancePending += 44,700 (needs approval)
  └─ PendingRevenue record (awaiting approval)
  
  Founder:
  ├─ Wallet.balancePending += 151,980
  └─ PendingRevenue record
  
  Co-Founder:
  ├─ Wallet.balancePending += 101,320
  └─ PendingRevenue record
```

**Database Records Created**:

```typescript
// Untuk affiliate (komisi langsung)
WalletTransaction {
  walletId: affiliate_wallet_id,
  type: "COMMISSION",
  amount: 200000,
  reference: transaction_id,
  description: "Komisi Membership - Paket 6 Bulan",
  status: "COMPLETED",
  createdAt: now
}

// Untuk admin, founder, co-founder (pending approval)
PendingRevenue {
  id: uuid,
  transactionId: transaction_id,
  recipientId: admin/founder/cofounder_id,
  type: "MEMBERSHIP", // atau PRODUCT, COURSE, EVENT, SUPPLIER
  amount: 44700/151980/101320,
  reason: "Share dari komisi membership",
  status: "PENDING",
  approvedAt: null, // Belum disetujui
  rejectedAt: null,
  rejectedReason: null,
  createdAt: now,
  updatedAt: now
}
```

### 4.4 Send Notifications
- Email ke user: Payment confirmation, akses membership
- Email ke affiliate: Komisi diterima
- WhatsApp ke user: Konfirmasi aktivasi (jika tersedia)

---

## 🔄 TAHAP 5: POST-ACTIVATION FLOW

### 5.1 User Dashboard Access
User sekarang dapat:
- ✅ Akses courses yang ter-assign
- ✅ Join groups yang ter-assign
- ✅ Download materi
- ✅ Submit assignments

### 5.2 Upgrade Membership
User dengan membership aktif dapat:
- Upgrade ke paket lebih tinggi (e.g., 3 bulan → 6 bulan)
- API: `/api/memberships/upgrade/route.ts`
- Hanya bayar selisih harga, durasi dinambah

### 5.3 Affiliate Tracking (jika user adalah affiliate)
- Click tracking: Setiap klik dari short link dicatat
- Conversion tracking: Setiap pembelian dari code/link dicatat
- Commission visible di affiliate dashboard

---

## 📊 DATA MODEL SUMMARY

### Core Tables:

**1. User** (Account)
```
id, email, name, username, password (hash), whatsapp, role, 
memberCode, isFounder, isCoFounder, isAffiliate, 
createdAt, updatedAt
```

**2. Transaction** (Pesanan)
```
id, userId, status, type, amount, originalAmount, discountAmount, 
paymentMethod, membershipId, productId, affiliateId, 
couponId, externalId, paidAt, expiryHours, createdAt
```

**3. Membership** (Paket)
```
id, name, slug, price, discountPrice, duration, durationType,
features (JSON), affiliateCommissionRate, commissionType,
isActive, createdAt, updatedAt
```

**4. UserMembership** (Kepemilikan)
```
userId, membershipId, status, purchaseDate, activatedAt, 
expiryDate, createdAt, updatedAt
```

**5. Wallet** (Saldo)
```
userId, balance, balancePending, balanceWithdrawn, 
createdAt, updatedAt
```

**6. WalletTransaction** (Transaksi Dompet)
```
id, walletId, type, amount, reference, description, 
status, createdAt
```

**7. PendingRevenue** (Komisi Pending)
```
id, transactionId, recipientId, type, amount, reason, 
status, approvedAt, rejectedAt, rejectedReason, createdAt
```

**8. AffiliateLink** (Link Referral)
```
id, userId, code, shortLink, targetUrl, clicks, 
createdAt, updatedAt
```

---

## 🚀 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│ TAHAP 1: REGISTRATION                                   │
│ User → Register Form → Create User + Wallet             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ TAHAP 2: PACKAGE SELECTION                              │
│ User → Browse Memberships → Select Paket                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ TAHAP 3: CHECKOUT                                       │
│ ├─ Validasi: cooldown, active membership               │
│ ├─ Apply coupon & track affiliate                      │
│ ├─ Create Transaction (PENDING)                        │
│ └─ Generate payment link (Xendit/Manual)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ USER BAYAR                                              │
│ ├─ Transfer manual / Scan QR / Click link             │
│ └─ Payment gateway proses pembayaran                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ TAHAP 4: WEBHOOK + ACTIVATION                           │
│ ├─ Xendit webhook → Validate & Update transaction      │
│ ├─ Activate membership → Create UserMembership         │
│ ├─ Auto-assign groups & courses                        │
│ ├─ Process commission → Credit wallets                 │
│ └─ Send confirmation emails/SMS                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│ TAHAP 5: ACTIVE MEMBER                                  │
│ ├─ Access courses + groups                             │
│ ├─ View commission (jika affiliate)                    │
│ ├─ Upgrade membership                                  │
│ └─ Dashboard data reflected                            │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ IMPORTANT COMMISSION RULES

### NO HARDCODED DEFAULTS!
- ❌ NOT anymore: `affiliateCommissionRate = 30` (default)
- ✅ NOW: `affiliateCommissionRate = 0` (explicit settings only)

### Commission Calculation
- `affiliateCommissionRate` harus diset EXPLICIT di membership/product/course/event/supplier
- Default fallback: 0 (tidak ada komisi)
- Jika 0 → Affiliate tidak dapat komisi apapun

### Commission Types
- **PERCENTAGE**: `(amount × rate) / 100`
  - Contoh: Rp 500k × 10% = Rp 50k
  - Setting: `affiliateCommissionRate = 10`, `commissionType = "PERCENTAGE"`

- **FLAT**: Fixed amount (capped at transaction amount)
  - Contoh: Rp 200k per membership
  - Setting: `affiliateCommissionRate = 200000`, `commissionType = "FLAT"`
  - Safety: `min(200000, transactionAmount)` → prevent overpayment

---

## 🔍 VERIFICATION SCRIPT

Run `/audit-latest-transactions.js` untuk verify:
```bash
cd nextjs-eksporyuk
node ../audit-latest-transactions.js
```

Output:
- ✅ Commission calculations correct
- ✅ Wallet credits verified
- ✅ Membership activation status
- ✅ Groups & courses enrolled
- ❌ Issues found (missing data, wallet not credited, etc.)

---

## 📞 SUPPORT CONTACTS

**Important Notes**:
1. Jangan pake hardcoded 30% - MUST use explicit settings
2. Commission hanya diberikan jika `affiliateCommissionRate > 0`
3. Revenue split hanya untuk admin/founder/co-founder (PENDING approval)
4. Affiliate commission langsung masuk `balance` (withdrawable)
5. Test dengan `audit-latest-transactions.js` sebelum production

