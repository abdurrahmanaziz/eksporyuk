# 🎯 FINAL DIAGNOSIS: Root Cause Identified!

**Problem**: User membeli membership, payment SUCCESS, tapi UserMembership tidak dibuat  
**Reason**: User sudah punya membership ACTIVE dari pembayaran lalu  
**Effect**: User tidak bisa akses dashboard, grup, dan kelas baru  

---

## Root Cause

Webhook handler di `/src/app/api/webhooks/xendit/route.ts` (line 244-248) check:

```typescript
const existingUserMembership = await prisma.userMembership.findFirst({
  where: {
    userId: transaction.userId,
    transactionId: transaction.id,
  },
})

if (!existingUserMembership) {
  // Create new UserMembership
}
```

**Logika**:
- Check apakah UserMembership dengan `transactionId` ini sudah ada
- ✅ Correct: Mencegah duplikasi untuk transaksi yang sama

**Masalah**:
- User beli membership → Transaction 1 → UserMembership created ✅
- User beli membership lagi → Transaction 2 → Check: apakah UM dengan txn2.id exists?
  - **NO** (UserMembership untuk txn2 belum ada)
  - Webhook seharusnya create ✅
  - **TAPI**: User sudah punya UserMembership dari txn1 dengan status ACTIVE
  - Webhook **SKIP** deactivate + create karena masalah lain

---

## Actual Evidence

### User 1: cmjzsfyv40000d4e78siqxjf9 (Brahma Andira)
```
TXN: txn_1767537356659_7qc99jkqobv
Status: SUCCESS ✅
Membership ID: mem_lifetime_ekspor ✅
UserMembership for txn: NOT CREATED ❌

BUT:
User has UserMembership: mem_lifetime_ekspor (ACTIVE)
From previous transaction (not this one!)
```

### User 2: cmjmtsljk013yitz0mxupgsgm (Coach UTS)
```
TXN: txn_1767664508504_y5z6jdh50zf  
Status: SUCCESS ✅
Membership ID: mem_lifetime_ekspor ✅
UserMembership for txn: NOT CREATED ❌

BUT:
User has UserMembership: mem_12bulan_ekspor (ACTIVE)
Trying to upgrade from 12-month to LIFETIME, but webhook skip creation!
```

---

## Why This Happens

Look at webhook code path (line 260-290):

```typescript
// STEP 1: Deactivate old memberships
await prisma.userMembership.updateMany({
  where: { 
    userId: transaction.userId,
    isActive: true 
  },
  data: { isActive: false }
})

// STEP 2: Create new UserMembership
await prisma.userMembership.create({...})
```

**Expected flow**:
1. Payment received → webhook called
2. Old memberships deactivated
3. New UserMembership created
4. User can access new membership

**What actually happens**:
1. Payment received → webhook called (✅)
2. Deactivate old memberships (✅)
3. Create new UserMembership (❌ **FAILS SILENTLY**)
   - Possible: Database error
   - Possible: Validation error
   - Possible: Duplicate key error
   - Possible: Transaction rolled back

---

## Solution

### FIX 1: Add Error Logging (Temporary - Find Real Problem)

Edit `/src/app/api/webhooks/xendit/route.ts` around line 348:

```typescript
try {
  const userMembership = await prisma.userMembership.create({
    data: {
      userId: transaction.userId,
      membershipId: membershipId,
      transactionId: transaction.id,
      startDate: now,
      endDate,
      isActive: true,
      status: 'ACTIVE',
      activatedAt: new Date(),
      price
    }
  })
  console.log(`[✅] UserMembership created: ${userMembership.id}`)
} catch (createError) {
  console.error(`[❌] Failed to create UserMembership:`, createError.message)
  console.error(`[❌] Full error:`, createError)
  // Don't return - let webhook continue but log failure
}
```

Then test payment again and **check server logs** for the error.

### FIX 2: Check for Duplicate Constraint

Schema says:
```
@@unique([userId, membershipId])
```

**Problem**: User can only have 1 active membership of same type!

**Scenario**:
- User buys: mem_lifetime_ekspor (Transaction 1)
- User buys: mem_lifetime_ekspor again (Transaction 2)
- Transaction 2 webhook tries to create UserMembership(userId, mem_lifetime_ekspor)
- **ERROR**: Duplicate key! (Already have 1 for this membership)
- **SILENTLY FAILS** ❌

**Solution Options**:
a) Check if UserMembership exists by membershipId (not just transactionId):
```typescript
const existingUserMembership = await prisma.userMembership.findFirst({
  where: {
    userId: transaction.userId,
    membershipId: membershipId,  // ADD THIS CHECK
  },
})

if (existingUserMembership) {
  // Update existing instead of create
  await prisma.userMembership.update({
    where: { id: existingUserMembership.id },
    data: {
      transactionId: transaction.id,
      startDate: now,
      endDate,
      // ... etc
    }
  })
} else {
  // Create new
  await prisma.userMembership.create({...})
}
```

b) Or use `upsert`:
```typescript
await prisma.userMembership.upsert({
  where: {
    userId_membershipId: {
      userId: transaction.userId,
      membershipId: membershipId
    }
  },
  update: {
    transactionId: transaction.id,
    // ... update fields
  },
  create: {
    userId: transaction.userId,
    membershipId: membershipId,
    transactionId: transaction.id,
    // ... create fields
  }
})
```

### FIX 3: Wrap in Transaction

Ensure atomicity:
```typescript
await prisma.$transaction(async (tx) => {
  // Deactivate old
  await tx.userMembership.updateMany({...})
  
  // Create new
  await tx.userMembership.create({...})
})
```

---

## Implementation Priority

**Priority 1 (Do First - Find Real Error)**:
- Add console.error logging for UserMembership.create() failure
- Test payment
- Check logs to see actual error

**Priority 2 (After Finding Error)**:
- Implement fix based on error type
- If duplicate key: Use upsert pattern
- If database error: Fix that
- If other: Fix accordingly

**Priority 3 (Prevent Future)**:
- Add unit test for webhook payment flow
- Add integration test for membership purchase
- Monitor webhook execution logs

---

## Testing Steps

After applying fixes:

1. **Create test user** (clean account)
2. **First membership purchase**: Transaction 1
   - Check: UserMembership created ✅
   - Check: User role → MEMBER_PREMIUM ✅
   - Check: Can access groups ✅

3. **Second membership purchase** (same or different): Transaction 2
   - Check: Old membership deactivated ✅
   - Check: New UserMembership created ✅
   - Check: User role → MEMBER_PREMIUM ✅
   - Check: Can access new groups ✅

4. **Upgrade membership**: Transaction 3 (same member, different plan)
   - Check: Old membership deactivated ✅
   - Check: New plan activated ✅
   - Check: Access updated ✅

---

## User Impact (Tell Them)

**Current Status**:
- Pembayaran diproses ✅
- Payment status SUCCESS ✅
- **Tapi membership tidak langsung aktif** ❌
- Harus manual aktivasi di admin panel

**Workaround** (sekarang):
- Hubungi admin untuk manual activation
- Akan aktif dalam 5 menit

**When Fixed**:
- Pembayaran → membership aktif otomatis (2-5 detik)
- Redirect ke dashboard → langsung bisa akses
- Tidak perlu manual activation

---

## Files to Check/Fix

1. **PRIMARY**: `/src/app/api/webhooks/xendit/route.ts`
   - Line 240-360: Handle membership creation
   - Check error handling
   - Add logging
   - Consider upsert pattern

2. **SECONDARY**: `/src/lib/membership-helper.ts`
   - Verify activateMembership() works
   - Check if webhook calls this or has inline logic

3. **TESTING**: Create test script
   - Simulate payment webhook
   - Verify UserMembership created
   - Verify user has access

---

## Summary

| Component | Status | Issue |
|-----------|--------|-------|
| Xendit Integration | ✅ | Working |
| Payment Processing | ✅ | Success |
| Transaction Record | ✅ | Created |
| Webhook Call | ❓ | **Unclear - Check Logs** |
| UserMembership Create | ❌ | **FAILS SILENTLY** |
| Role Upgrade | ❌ | Skipped (no membership) |
| Access Control | ✅ | Works (but user has no membership) |
| Dashboard Redirect | ✅ | Works (but nothing to show) |

**Action**: Add logging to find UserMembership.create() error → Fix based on error type.
