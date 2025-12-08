# 🎯 Membership System - Developer Quick Reference

## 📁 File Structure

```
nextjs-eksporyuk/
├── prisma/
│   └── schema.prisma                    # Membership models (lines 900-1100)
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   └── membership/
│   │   │   │       ├── route.ts         # GET/POST memberships
│   │   │   │       ├── [id]/
│   │   │   │       │   └── route.ts     # GET/PATCH/DELETE single
│   │   │   │       ├── plans/
│   │   │   │       │   └── route.ts     # GET all plans
│   │   │   │       ├── [id]/extend/
│   │   │   │       │   └── route.ts     # POST extend duration
│   │   │   │       └── sync-features/
│   │   │   │           └── route.ts     # POST sync features
│   │   │   │
│   │   │   ├── memberships/
│   │   │   │   ├── packages/
│   │   │   │   │   ├── route.ts         # GET public packages
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts     # GET single package
│   │   │   │   ├── user/
│   │   │   │   │   └── route.ts         # GET user membership
│   │   │   │   ├── purchase/
│   │   │   │   │   └── route.ts         # POST purchase flow
│   │   │   │   └── upgrade/
│   │   │   │       └── route.ts         # POST upgrade flow
│   │   │   │
│   │   │   ├── sales/
│   │   │   │   ├── route.ts             # GET/POST sales
│   │   │   │   └── stats/
│   │   │   │       └── route.ts         # GET statistics
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   └── route.ts             # GET/POST transactions
│   │   │   │
│   │   │   └── webhooks/
│   │   │       └── xendit/
│   │   │           └── route.ts         # POST webhook handler
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   └── membership/
│   │   │   │       └── page.tsx         # Admin management UI
│   │   │   └── my-dashboard/
│   │   │       └── page.tsx             # User membership view
│   │   │
│   │   ├── membership/
│   │   │   └── [slug]/
│   │   │       └── page.tsx             # Public salespage
│   │   │
│   │   └── checkout/
│   │       ├── [slug]/
│   │       │   └── page.tsx             # Single checkout
│   │       └── compare/
│   │           └── page.tsx             # Compare plans
│   │
│   └── lib/
│       ├── membership-features.ts       # Feature logic
│       └── revenue-split.ts             # Revenue distribution
│
└── docs/
    ├── MEMBERSHIP_SYSTEM_SPEC.md        # Full specification
    ├── OPSI_C_COMPLETE.md              # Implementation summary
    └── TEST_RESULTS_OPSI_B.md          # Test results
```

---

## 🔌 API Quick Reference

### Admin Endpoints (Auth Required: ADMIN/FOUNDER/CO_FOUNDER)

```typescript
// List all memberships
GET /api/admin/membership
Query: page?, limit?, status?, search?
Response: { memberships: [], pagination: {}, stats: {} }

// Create membership
POST /api/admin/membership
Body: { name, description, prices, features, groups, courses, products, followUps }
Response: { membership }

// Get single membership
GET /api/admin/membership/[id]
Response: { membership with relations }

// Update membership
PATCH /api/admin/membership/[id]
Body: { partial updates }
Response: { membership }

// Delete membership
DELETE /api/admin/membership/[id]
Response: { success: true }

// Get all plans (dropdown)
GET /api/admin/membership/plans
Response: { plans: [] }

// Extend user membership
POST /api/admin/membership/[id]/extend
Body: { userId, days }
Response: { userMembership }

// Sync features
POST /api/admin/membership/sync-features
Body: { membershipId, features }
Response: { updated: count }
```

### Public Endpoints (No Auth)

```typescript
// List public packages
GET /api/memberships/packages
Response: { packages: [] }

// Get single package
GET /api/memberships/packages/[id]
Response: { package with details }
```

### User Endpoints (Auth Required: Any logged-in user)

```typescript
// Get my membership
GET /api/memberships/user
Response: { membership, features, access }

// Purchase membership
POST /api/memberships/purchase
Body: { membershipId, duration, couponCode?, affiliateId? }
Response: { transaction, paymentUrl }

// Upgrade membership
POST /api/memberships/upgrade
Body: { newMembershipId, paymentMode }
Response: { transaction, paymentUrl }
```

### Sales & Transaction Endpoints

```typescript
// Get sales (Admin only)
GET /api/sales
Query: period?, type?, status?, userId?, page?, limit?
Response: { sales: [], stats: {}, pagination: {} }

// Create manual sale (Admin only)
POST /api/sales
Body: { userId, type, amount, membershipId/productId/courseId }
Response: { sale }

// Get sales statistics (Admin only)
GET /api/sales/stats
Response: { today, week, month, year, allTime, topProducts, recentSales }

// Get transactions
GET /api/transactions
Query: type?, status?, period?, userId?, page?, limit?
Response: { transactions: [], stats: {}, pagination: {} }

// Create manual transaction (Admin only)
POST /api/transactions
Body: { userId, type, amount, status, metadata }
Response: { transaction }
```

### Webhook Endpoint

```typescript
// Xendit webhook
POST /api/webhooks/xendit
Headers: { x-callback-token: string }
Body: Xendit webhook payload
Response: { received: true }

// Handles: invoice.paid, invoice.expired, invoice.failed
// Auto-activates membership on payment success
```

---

## 💾 Database Schema

### Membership Model

```prisma
model Membership {
  id                   String   @id @default(cuid())
  name                 String
  slug                 String   @unique
  description          String?
  logo                 String?
  banner               String?
  
  // Pricing (JSON)
  prices               Json     // [{ duration: 'ONE_MONTH', price: 99000 }]
  
  // Marketing
  isPopular            Boolean  @default(false)
  isCheapest           Boolean  @default(false)
  externalSalespage    String?
  
  // Follow-up (JSON)
  followUpMessages     Json?    // [{ delay: 0, message: "..." }]
  
  // Settings
  affiliateCommission  Float    @default(0.30)  // 30%
  status               Status   @default(ACTIVE)
  
  // Relations
  features             MembershipFeature[]
  userMemberships      UserMembership[]
  membershipGroups     MembershipGroup[]
  membershipCourses    MembershipCourse[]
  membershipProducts   MembershipProduct[]
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

### UserMembership Model

```prisma
model UserMembership {
  id             String   @id @default(cuid())
  userId         String
  membershipId   String
  
  startDate      DateTime
  endDate        DateTime
  status         UserMembershipStatus  // ACTIVE, EXPIRED, CANCELLED
  
  transactionId  String?
  
  user           User @relation(fields: [userId], references: [id])
  membership     Membership @relation(fields: [membershipId], references: [id])
  transaction    Transaction? @relation(fields: [transactionId], references: [id])
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([userId, membershipId, status])
}
```

### Relations Models

```prisma
model MembershipGroup {
  id             String @id @default(cuid())
  membershipId   String
  groupId        String
  
  membership     Membership @relation(fields: [membershipId], references: [id])
  group          Group @relation(fields: [groupId], references: [id])
  
  @@unique([membershipId, groupId])
}

model MembershipCourse {
  id             String @id @default(cuid())
  membershipId   String
  courseId       String
  
  membership     Membership @relation(fields: [membershipId], references: [id])
  course         Course @relation(fields: [courseId], references: [id])
  
  @@unique([membershipId, courseId])
}

model MembershipProduct {
  id             String @id @default(cuid())
  membershipId   String
  productId      String
  
  membership     Membership @relation(fields: [membershipId], references: [id])
  product        Product @relation(fields: [productId], references: [id])
  
  @@unique([membershipId, productId])
}
```

---

## 🔄 Key Workflows

### 1. Purchase Flow

```typescript
// 1. User clicks "Beli Sekarang" on salespage
// 2. Redirect to checkout page with slug
// 3. User login/register
// 4. Select duration, enter coupon (optional)
// 5. Click "Bayar Sekarang"
// 6. API: POST /api/memberships/purchase
const response = await fetch('/api/memberships/purchase', {
  method: 'POST',
  body: JSON.stringify({
    membershipId: 'clx123',
    duration: 'ONE_MONTH',
    couponCode: 'LAUNCH50',
    affiliateId: 'aff123'
  })
});

// 7. Response: { transaction, paymentUrl }
// 8. Redirect to Xendit payment page
// 9. User completes payment
// 10. Xendit sends webhook to /api/webhooks/xendit
// 11. Webhook processes:
//    - Update transaction status to SUCCESS
//    - Create UserMembership
//    - Auto-join groups
//    - Auto-enroll courses
//    - Auto-grant products
//    - Process revenue distribution
//    - Send notifications
//    - Start follow-up sequence
```

### 2. Upgrade Flow

```typescript
// 1. User on /dashboard/my-membership clicks "Upgrade"
// 2. Select new plan
// 3. Choose payment mode (ACCUMULATE or FULL_PAYMENT)
// 4. API: POST /api/memberships/upgrade
const response = await fetch('/api/memberships/upgrade', {
  method: 'POST',
  body: JSON.stringify({
    newMembershipId: 'clx456',
    paymentMode: 'ACCUMULATE' // or 'FULL_PAYMENT'
  })
});

// 5. Calculate price:
//    - ACCUMULATE: new_price - (old_price * remaining_days / total_days)
//    - FULL_PAYMENT: new_price
// 6. Create transaction, redirect to payment
// 7. On success via webhook:
//    - Expire old membership
//    - Create new membership
//    - Log upgrade in MembershipUpgradeLog
//    - Update group/course/product access
```

### 3. Revenue Distribution

```typescript
// Called on every successful payment
import { processRevenueDistribution } from '@/lib/revenue-split';

await processRevenueDistribution({
  amount: 500000, // Total payment
  type: 'MEMBERSHIP',
  referenceId: transaction.id,
  affiliateId: 'aff123', // optional
  membershipId: 'mem123', // for commission %
  userId: 'user123',
  description: 'Membership Gold purchase'
});

// This function:
// 1. Get commission settings from membership
// 2. Calculate splits:
//    - Affiliate: 30% (150,000)
//    - Company: 15% (75,000)
//    - Remaining 55% (275,000):
//      * Founder: 60% = 165,000
//      * Co-Founder: 40% = 110,000
// 3. Update all wallets
// 4. Create WalletTransaction records
// 5. Create Transaction records
// 6. Log activities
```

### 4. Auto-Activation (Webhook)

```typescript
// In /api/webhooks/xendit/route.ts
async function handleInvoicePaid(data: any) {
  // 1. Get transaction
  const transaction = await prisma.transaction.findUnique({
    where: { externalId: data.external_id }
  });
  
  // 2. Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: 'SUCCESS', paidAt: new Date() }
  });
  
  // 3. Get membership with relations
  const membership = await prisma.membership.findUnique({
    where: { id: transaction.membershipId },
    include: {
      membershipGroups: { include: { group: true } },
      membershipCourses: { include: { course: true } },
      membershipProducts: { include: { product: true } }
    }
  });
  
  // 4. Calculate end date
  const startDate = new Date();
  const endDate = calculateEndDate(startDate, transaction.duration);
  
  // 5. Create UserMembership
  await prisma.userMembership.create({
    data: {
      userId: transaction.userId,
      membershipId: membership.id,
      startDate,
      endDate,
      status: 'ACTIVE',
      transactionId: transaction.id
    }
  });
  
  // 6. Auto-join groups
  for (const mg of membership.membershipGroups) {
    await prisma.groupMember.create({
      data: {
        groupId: mg.group.id,
        userId: transaction.userId,
        role: 'MEMBER'
      }
    }).catch(() => {}); // Ignore if already member
  }
  
  // 7. Auto-enroll courses
  for (const mc of membership.membershipCourses) {
    await prisma.courseEnrollment.create({
      data: {
        userId: transaction.userId,
        courseId: mc.course.id
      }
    }).catch(() => {});
  }
  
  // 8. Auto-grant products
  for (const mp of membership.membershipProducts) {
    await prisma.userProduct.create({
      data: {
        userId: transaction.userId,
        productId: mp.product.id,
        transactionId: transaction.id,
        purchaseDate: new Date(),
        price: 0
      }
    }).catch(() => {});
  }
  
  // 9. Process revenue distribution
  await processRevenueDistribution({
    amount: transaction.amount,
    type: 'MEMBERSHIP',
    referenceId: transaction.id,
    affiliateId: transaction.affiliateId,
    membershipId: membership.id,
    userId: transaction.userId,
    description: `Membership ${membership.name} purchase`
  });
  
  // 10. Send notifications (email + WhatsApp)
  // 11. Start follow-up sequence
}
```

---

## 🧪 Testing Commands

```bash
# Feature audit (check completion)
node audit-membership-features.js

# Opsi C integration tests
node test-opsi-c.js

# Test specific endpoint
curl http://localhost:3000/api/memberships/packages

# Test with auth (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/memberships/user

# Test purchase (POST)
curl -X POST http://localhost:3000/api/memberships/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"membershipId":"clx123","duration":"ONE_MONTH"}'
```

---

## 🚨 Common Issues & Fixes

### Issue: TypeScript Error on GroupMember.create()
```
Property 'joinedVia' does not exist
```

**Fix:** Remove `joinedVia` field (doesn't exist in schema)
```typescript
// ❌ Wrong
await prisma.groupMember.create({
  data: { userId, groupId, joinedVia: 'MEMBERSHIP' }
});

// ✅ Correct
await prisma.groupMember.create({
  data: { userId, groupId, role: 'MEMBER' }
});
```

### Issue: UserProduct requires 'price' field
```
Property 'price' is missing
```

**Fix:** Always include price field
```typescript
// ❌ Wrong
await prisma.userProduct.create({
  data: { userId, productId, transactionId }
});

// ✅ Correct
await prisma.userProduct.create({
  data: { userId, productId, transactionId, purchaseDate: new Date(), price: 0 }
});
```

### Issue: End date calculation incorrect
```
Membership expires after 30 days for all durations
```

**Fix:** Use proper date addition
```typescript
// ❌ Wrong
const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

// ✅ Correct
const endDate = new Date(startDate);
switch (duration) {
  case 'ONE_MONTH': endDate.setMonth(endDate.getMonth() + 1); break;
  case 'THREE_MONTHS': endDate.setMonth(endDate.getMonth() + 3); break;
  case 'SIX_MONTHS': endDate.setMonth(endDate.getMonth() + 6); break;
  case 'TWELVE_MONTHS': endDate.setFullYear(endDate.getFullYear() + 1); break;
  case 'LIFETIME': endDate.setFullYear(endDate.getFullYear() + 100); break;
}
```

---

## 📝 Code Snippets

### Check User Active Membership

```typescript
import { prisma } from '@/lib/prisma';

async function hasActiveMembership(userId: string) {
  const active = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() }
    },
    include: { membership: true }
  });
  
  return active;
}
```

### Get User Features

```typescript
async function getUserFeatures(userId: string) {
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: { gte: new Date() }
    },
    include: {
      membership: {
        include: { features: true }
      }
    }
  });
  
  return membership?.membership.features || [];
}
```

### Calculate Remaining Days

```typescript
function getRemainingDays(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
```

---

## 🔐 Security Checklist

- [ ] All admin endpoints check role (ADMIN/FOUNDER/CO_FOUNDER)
- [ ] User endpoints verify session.user.id
- [ ] Webhook verifies Xendit signature
- [ ] Transaction idempotency (check externalId duplicate)
- [ ] Sanitize user input (SQL injection prevention)
- [ ] Rate limiting on public endpoints
- [ ] CORS configured properly
- [ ] HTTPS enforced in production

---

## 📚 Additional Resources

- [Full Specification](./MEMBERSHIP_SYSTEM_SPEC.md)
- [Opsi C Complete](./OPSI_C_COMPLETE.md)
- [Test Results](./TEST_RESULTS_OPSI_B.md)
- [PRD](../prd.md)
- [Xendit Docs](https://docs.xendit.co/api-reference/)

---

**Last Updated:** 23 November 2025  
**System Version:** v1.0 (Production Ready)
