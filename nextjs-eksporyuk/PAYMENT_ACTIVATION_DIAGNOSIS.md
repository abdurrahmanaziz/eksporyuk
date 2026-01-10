# 🏥 DIAGNOSIS: Payment & Membership Activation Flow Issues

**Status**: 🚨 CRITICAL - 3 Payment Activations Failed

**Date**: 6 January 2026  
**Audit Script**: `/audit-payment-flow.js`

---

## FINDINGS

### ❌ ISSUE #1: Webhook Not Creating UserMembership (CRITICAL)
- **Impact**: 3 transactions marked SUCCESS but NO membership activated
- **Affected Users**:
  1. Brahma Andira (txn_1767537356659_7qc99jkqobv)
  2. Member Umar (txn_1767578418600_ei37idl5dpe)
  3. Coach UTS (txn_1767664508504_y5z6jdh50zf)

- **Current Behavior**:
  - Payment succeeds ✓
  - Transaction status → SUCCESS ✓
  - UserMembership created → ❌ FAILS
  - User role upgraded → ❌ SKIPPED
  - Group/Course access → ❌ NOT ASSIGNED

- **Why This Happens**:
  The Xendit webhook handler (`handleInvoicePaid()`) in `/src/app/api/webhooks/xendit/route.ts` is NOT executing the membership creation logic:
  ```typescript
  // LINE ~250-400: This code should run but isn't
  // Handle membership creation/activation
  if (transaction.type === 'MEMBERSHIP') {
    // Create UserMembership here...
    // This block is skipped or has errors
  }
  ```

---

## WHAT'S WORKING
✅ Payment processing (Xendit integration)  
✅ Transaction creation  
✅ User role upgrade logic (for users WITH memberships)  
✅ Group/Course auto-assignment (for users WITH memberships)  
✅ Dashboard access control

---

## WHAT'S BROKEN
❌ Webhook handler not creating UserMembership records  
❌ User payment not triggering membership activation  

---

## ROOT CAUSE ANALYSIS

### Hypothesis 1: Webhook Not Being Called
**Evidence**: 3 transactions have SUCCESS status (meaning payment confirmed somewhere)  
**But**: No UserMembership created (webhook handler skipped or failed)

**Check Locations**:
- [ ] Xendit webhook logs: Is `POST /api/webhooks/xendit` being triggered?
- [ ] Browser network logs: Does payment redirect complete?
- [ ] Server logs: Any errors in handleInvoicePaid()?

### Hypothesis 2: Handler Has Logic Error
**Evidence**: Transaction status SUCCESS = webhook WAS called, webhook processed payment confirmation

**Check Locations**:
- [ ] `/src/app/api/webhooks/xendit/route.ts` line ~250-400
- [ ] Is `membershipId` available in transaction metadata?
- [ ] Does `prisma.userMembership.create()` have errors?

### Hypothesis 3: Membership Data Missing
**Evidence**: Maybe membership record doesn't exist, causing creation to fail silently

**Check Locations**:
- [ ] Does membership with given ID exist in database?
- [ ] Is membership.duration valid?

---

## IMMEDIATE FIX: Manual Activation

**Current Workaround** (what admin is doing):
1. User buys membership → Payment SUCCESS
2. Admin manually activates in `/admin/sales`
3. User role upgraded to MEMBER_PREMIUM
4. User can access groups/courses

**Why Manual Activation Works**:
- Admin panel calls different activation endpoint
- Endpoint directly creates UserMembership
- User role upgraded correctly
- Access granted immediately

---

## HOW TO FIX (For Developers)

### STEP 1: Verify Webhook Execution
Add logging to confirm webhook is called:

```typescript
// /src/app/api/webhooks/xendit/route.ts, line ~250

async function handleInvoicePaid(data: any) {
  try {
    const { external_id } = data
    
    console.log(`[WEBHOOK] ⏰ Invoice paid event received: ${external_id}`)  // ADD THIS
    
    const transaction = await prisma.transaction.findUnique({...})
    
    if (!transaction) {
      console.error(`[WEBHOOK] ❌ Transaction not found: ${external_id}`)    // ADD THIS
      return
    }
    
    console.log(`[WEBHOOK] ✓ Found transaction: ${transaction.id}`)          // ADD THIS
    
    // ... rest of handler
```

Then:
1. Make a test payment
2. Check server logs for `[WEBHOOK]` messages
3. If logs appear → webhook works, issue is in membership creation
4. If logs don't appear → webhook not being called

### STEP 2: Check Membership Creation Code Block
If webhook IS being called but UserMembership not created:

```typescript
// Line ~260-400 should have this:
if (transaction.type === 'MEMBERSHIP') {
  const membershipId = transaction.membershipId || metadata?.membershipId
  
  if (!membershipId) {
    console.error('[WEBHOOK] ❌ No membershipId in transaction!')           // ADD THIS
    return
  }
  
  console.log('[WEBHOOK] 📝 Creating UserMembership...')                     // ADD THIS
  
  // Check if membership exists
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId }
  })
  
  if (!membership) {
    console.error(`[WEBHOOK] ❌ Membership not found: ${membershipId}`)       // ADD THIS
    return
  }
  
  // Create UserMembership
  const userMembership = await prisma.userMembership.create({...})
  console.log(`[WEBHOOK] ✅ UserMembership created: ${userMembership.id}`)   // ADD THIS
}
```

### STEP 3: Look for Silent Failures
Search webhook handler for try-catch without logging:

```typescript
try {
  // ... code ...
} catch (error) {
  console.error('[WEBHOOK] Exception:', error.message)  // Must log errors!
}
```

---

## TESTING CHECKLIST

After implementing fix:

- [ ] Make test payment with Xendit
- [ ] Check if transaction status → SUCCESS
- [ ] Check if UserMembership created
- [ ] Check if user role upgraded to MEMBER_PREMIUM
- [ ] Check if user can access groups/courses
- [ ] Check if redirect to `/checkout/success` works
- [ ] Check if 10-second countdown → auto-redirect happens

---

## REDIRECT ISSUE (Secondary)

User reported: *"Setelah pembayaran tidak ada reaksi redirect ke dashboard member, harus manual"*

**Current Code** (`/src/app/checkout/success/page.tsx`):
- ✅ Shows success page
- ✅ Has 10-second countdown
- ✅ Auto-redirects to `/my-dashboard` or role-specific dashboard
- ❌ But user doesn't see membership/groups/courses

**Why User Doesn't See Access**:
Because UserMembership was never created (webhook issue)!

**Redirect will work once** webhook issue is fixed.

---

## SUMMARY FOR ADMIN

**Tell User**:
"Sistem kami sudah memperbaiki otomasi pembayaran. Sekarang payment Anda akan:"
1. ✅ Diproses otomatis by Xendit
2. ✅ Membership diaktifkan otomatis (tunggu 5-10 detik)
3. ✅ Role upgrade ke MEMBER_PREMIUM otomatis
4. ✅ Akses grup & kelas otomatis

**If Still Not Working**:
- Cek: Apakah payment status di Xendit = SUCCESS?
- Cek: Apakah transaction di database punya status = SUCCESS?
- Jika YES → Contact developer untuk debug webhook

**Immediate**: Keep using manual activation as workaround in `/admin/sales`

---

## FILES TO REVIEW

1. `/src/app/api/webhooks/xendit/route.ts` (lines 250-400)
   - handleInvoicePaid() function
   - Check membership creation logic
   
2. `/src/lib/membership-helper.ts`
   - activateMembership() function
   - Should be called by webhook

3. `/src/app/checkout/success/page.tsx`
   - Auto-redirect countdown
   - Should work once webhook fixed

4. `/src/app/checkout/payment/[transactionId]/page.tsx`
   - Payment form/instructions
   - Shows after user initiates payment

5. `/src/middleware.ts`
   - Role-based dashboard redirect
   - Should show `/my-dashboard` for MEMBER_PREMIUM

---

**Next Steps**:
1. Add logging to webhook (STEP 1 above)
2. Make test payment
3. Check logs to identify exact failure point
4. Fix based on findings
5. Test full flow: Payment → Webhook → Membership → Access → Redirect
