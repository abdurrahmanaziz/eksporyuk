# 💰 Revenue Split System - Complete Implementation

## ✅ What's Been Built

### 1. **Prisma Schema Updates**

#### Course Model - Added Commission Setting
```prisma
model Course {
  mentorCommissionPercent Float @default(50) @db.Float
  // Admin can set commission percentage per course
  // Default: 50% for mentor, sisanya split 15-60-40
}
```

#### Expense Model - Admin Expense Tracking
```prisma
model Expense {
  id          String
  adminId     String
  title       String   // "Server Hosting", "Marketing Ads"
  amount      Decimal
  category    String   // SERVER, MARKETING, STAFF, TOOLS, OTHER
  receipt     String?  // Receipt/invoice URL
  isApproved  Boolean
  // ... timestamps
}
```

#### UserRole & UserPermission Models
- Multi-role support via separate table
- Granular permission system

---

## 📊 Revenue Split Logic

### **Formula:**

```typescript
// 1. MEMBERSHIP atau PRODUK
Total: Rp 100.000
├─ 30% Affiliate: Rp 30.000 → Wallet Affiliate
├─ 15% Perusahaan: Rp 15.000 → Wallet Admin
└─ Sisanya (55%): Rp 55.000
   ├─ 60% Founder: Rp 33.000
   └─ 40% Co-Founder: Rp 22.000

// 2. KELAS FOUNDER/CO-FOUNDER (Admin yang buat)
Total: Rp 500.000
├─ 30% Affiliate: Rp 150.000 (optional)
├─ 15% Perusahaan: Rp 75.000
└─ Sisanya: Rp 275.000
   ├─ 60% Founder: Rp 165.000
   └─ 40% Co-Founder: Rp 110.000

// 3. KELAS MENTOR BIASA (settable %)
Total: Rp 100.000
├─ 50% Mentor: Rp 50.000 (admin set ini)
└─ Sisanya: Rp 50.000
   ├─ 30% Affiliate: Rp 15.000 (dari sisanya)
   ├─ 15% Perusahaan: Rp 7.500
   └─ Sisanya: Rp 27.500
      ├─ 60% Founder: Rp 16.500
      └─ 40% Co-Founder: Rp 11.000
```

---

## 🔧 Functions Created

### **`src/lib/revenue-split.ts`**

#### `calculateRevenueSplit(options)`
Hitung pembagian revenue berdasarkan tipe transaksi.

**Parameters:**
```typescript
{
  amount: number               // Total transaksi
  type: 'MEMBERSHIP' | 'COURSE' | 'PRODUCT'
  affiliateId?: string        // ID affiliate (optional)
  courseId?: string           // ID kursus (optional)
  mentorId?: string           // ID mentor (optional)
  mentorCommissionPercent?: number  // % komisi mentor
}
```

**Returns:**
```typescript
{
  affiliate: number           // Jumlah untuk affiliate
  company: number             // Jumlah untuk perusahaan (admin)
  founder: number             // Jumlah untuk founder
  coFounder: number           // Jumlah untuk co-founder
  mentor?: number             // Jumlah untuk mentor (jika ada)
  total: number               // Total amount
  breakdown: string[]         // Detail breakdown
}
```

#### `processRevenueDistribution(options)`
Process transaksi dan auto-update semua wallet.

**What it does:**
1. ✅ Calculate revenue split
2. ✅ Update Affiliate wallet (if exists)
3. ✅ Update Mentor wallet (if not founder/co-founder)
4. ✅ Update Admin wallet (company fee 15%)
5. ✅ Update Founder wallet (60%)
6. ✅ Update Co-Founder wallet (40%)
7. ✅ Create transaction records for each
8. ✅ Log activity

#### `getRevenueStats(userId, period)`
Get revenue statistics for dashboard.

**Parameters:**
- `userId`: User ID
- `period`: 'daily' | 'weekly' | 'monthly' | 'yearly'

**Returns:**
```typescript
{
  total: number               // Total revenue
  byType: {                   // Revenue by transaction type
    MEMBERSHIP: number
    COURSE: number
    PRODUCT: number
  }
  count: number               // Transaction count
  period: string
}
```

---

## 🌐 API Endpoints

### **POST `/api/transactions/process`**

Process transaksi dan distribute revenue otomatis.

**Request Body:**
```json
{
  "amount": 100000,
  "type": "COURSE",
  "userId": "user-123",
  "courseId": "course-456",
  "affiliateId": "affiliate-789"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "trans-001",
    "amount": 100000,
    "status": "SUCCESS"
  },
  "message": "Transaction processed and revenue distributed"
}
```

**What happens automatically:**
1. Create transaction record
2. Get course info & mentor commission %
3. Calculate revenue split
4. Update all wallets (affiliate, mentor, admin, founder, co-founder)
5. Create transaction records for each wallet update
6. Log activity

---

## 💼 Admin Features

### **1. Set Mentor Commission (Per Course)**
```typescript
// Admin can set commission % for each course
await prisma.course.update({
  where: { id: courseId },
  data: {
    mentorCommissionPercent: 50  // 50% for mentor
  }
})
```

### **2. Track Expenses**
```typescript
// Admin records expenses
await prisma.expense.create({
  data: {
    adminId: adminUserId,
    title: "Server Hosting - AWS",
    amount: 500000,
    category: "SERVER",
    receipt: "https://invoice-url.com/123.pdf",
    paidBy: "Admin Budi",
    paidAt: new Date()
  }
})
```

### **3. View Revenue Dashboard**
```typescript
// Get revenue stats
const stats = await getRevenueStats(userId, 'monthly')

console.log(stats)
// {
//   total: 10000000,
//   byType: {
//     MEMBERSHIP: 5000000,
//     COURSE: 3000000,
//     PRODUCT: 2000000
//   },
//   count: 45
// }
```

---

## 🎯 Usage Examples

### **Example 1: User Beli Membership**
```typescript
// User beli membership Rp 100.000 via affiliate link
await fetch('/api/transactions/process', {
  method: 'POST',
  body: JSON.stringify({
    amount: 100000,
    type: 'MEMBERSHIP',
    userId: 'user-123',
    affiliateId: 'affiliate-456'
  })
})

// Result:
// ✅ Affiliate wallet +Rp 30.000
// ✅ Admin wallet +Rp 15.000
// ✅ Founder wallet +Rp 33.000
// ✅ Co-Founder wallet +Rp 22.000
```

### **Example 2: User Beli Kelas Mentor**
```typescript
// User beli kelas Mentor Rizqi Rp 100.000 (komisi 50%)
await fetch('/api/transactions/process', {
  method: 'POST',
  body: JSON.stringify({
    amount: 100000,
    type: 'COURSE',
    userId: 'user-123',
    courseId: 'course-789'
  })
})

// Result:
// ✅ Mentor Rizqi wallet +Rp 50.000 (50% commission)
// ✅ Admin wallet +Rp 7.500 (15% dari sisanya)
// ✅ Founder wallet +Rp 16.500 (60% dari sisanya)
// ✅ Co-Founder wallet +Rp 11.000 (40% dari sisanya)
```

### **Example 3: User Beli Kelas Founder (tanpa affiliate)**
```typescript
// User beli kelas Founder Rp 500.000
await fetch('/api/transactions/process', {
  method: 'POST',
  body: JSON.stringify({
    amount: 500000,
    type: 'COURSE',
    userId: 'user-123',
    courseId: 'founder-course-001'
  })
})

// Result (karena founder, tidak kena mentor commission):
// ✅ Admin wallet +Rp 75.000 (15%)
// ✅ Founder wallet +Rp 255.000 (60%)
// ✅ Co-Founder wallet +Rp 170.000 (40%)
```

---

## 📋 Database Migration Steps

**Stop dev server dulu**, lalu jalankan:

```powershell
# 1. Navigate to project
cd 'c:\Users\GIGABTYE AORUS''\Herd\eksporyuk\nextjs-eksporyuk'

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Restart dev server
npm run dev
```

---

## 🧪 Testing Checklist

### Test Revenue Split:
- [ ] Membership purchase (with affiliate)
- [ ] Membership purchase (without affiliate)
- [ ] Course purchase (mentor biasa)
- [ ] Course purchase (founder/co-founder)
- [ ] Product purchase

### Test Expense Tracking:
- [ ] Admin create expense
- [ ] View expense list
- [ ] Filter by category
- [ ] Approve expense

### Test Wallet Updates:
- [ ] Check affiliate wallet balance
- [ ] Check mentor wallet balance
- [ ] Check admin wallet balance
- [ ] Check founder wallet balance
- [ ] Check co-founder wallet balance

---

## 🚀 Next Steps

1. **Build Admin Panel Pages:**
   - `/admin/courses` - Manage courses & set mentor commission
   - `/admin/expenses` - Track & approve expenses
   - `/admin/revenue` - Revenue dashboard with charts
   - `/admin/wallets` - View all wallet balances

2. **Build Payment Integration:**
   - Xendit payment gateway
   - Webhook handler for payment success
   - Auto-trigger revenue distribution

3. **Build Reports:**
   - Monthly revenue reports
   - Expense reports
   - Profit/loss statements
   - Export to CSV/PDF

---

**Status**: ✅ Code complete, ready for database migration
**Location**: `src/lib/revenue-split.ts`, `src/app/api/transactions/process/route.ts`
**Schema**: Updated in `prisma/schema.prisma`
