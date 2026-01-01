# ✅ AFFILIATE COUPON RESTRICTION - IMPLEMENTATION COMPLETE

## Policy Change: Affiliate-Only Template-Based Coupons

### What Changed
**BEFORE**: Affiliate bisa buat kupon custom sendiri dengan diskon sendiri
**AFTER**: Affiliate HANYA bisa generate kupon dari template admin

---

## Implementation Details

### File Modified
**Path**: `/src/app/api/affiliate/coupons/route.ts`

### Changes Made

#### 1. Added Validation (Lines 99-107)
```typescript
// ENFORCE: Affiliate MUST use admin template - no custom coupons allowed
if (!adminCouponId || adminCouponId === '') {
  console.log('[POST /api/affiliate/coupons] Rejected: Affiliate attempted custom coupon creation')
  return NextResponse.json(
    { error: 'Affiliate tidak diizinkan membuat kupon sendiri. Kupon harus berasal dari template admin.' },
    { status: 403 }
  )
}
```

#### 2. Removed Custom Coupon Creation
- ❌ Removed: Direct custom coupon creation logic
- ❌ Removed: Affiliate ability to set discount value
- ❌ Removed: Affiliate ability to choose target type
- ❌ Removed: Affiliate custom description

#### 3. Kept Template-Based Only
- ✅ Kept: Generation from admin template
- ✅ Kept: Using admin's discount settings
- ✅ Kept: Unique coupon codes per affiliate

---

## New Access Rules

### What Affiliate CAN Do
✅ Generate unique coupon code dari admin template
✅ Use admin's predefined discount value
✅ Use admin's predefined target products/memberships
✅ Use admin's predefined usage limits
✅ Distribute coupon dengan kode unik mereka

### What Affiliate CANNOT Do
❌ Create coupon custom sendiri
❌ Set discount value sendiri
❌ Choose products/memberships sendiri
❌ Modify usage limits sendiri
❌ Bypass admin template requirement

---

## API Response

### Success (200)
```json
{
  "coupon": {
    "id": "...",
    "code": "AFFILIATE_CODE_123",
    "discountValue": 30,        // dari admin template
    "discountType": "PERCENTAGE", // dari admin template
    "basedOnCouponId": "admin-template-id",
    "createdBy": "affiliate-user-id"
  }
}
```

### Error - No Admin Template Provided (403)
```json
{
  "error": "Affiliate tidak diizinkan membuat kupon sendiri. Kupon harus berasal dari template admin."
}
```

### Error - Admin Template Not Found (400)
```json
{
  "error": "Kupon admin tidak ditemukan"
}
```

---

## Security & Control

### Admin Control
✅ Admin controls all discount values
✅ Admin controls target products/memberships
✅ Admin controls usage limits
✅ Admin controls validity periods
✅ Affiliate tidak bisa override settings

### Affiliate Benefits
✅ Quick coupon generation
✅ Unique codes per affiliate
✅ No need to understand complex settings
✅ Consistent branding/messaging

---

## Deployment Notes

### Zero Breaking Changes
- Only affects new coupon creation attempts
- Existing affiliate coupons unchanged
- Existing custom logic remains intact (admin can still create custom coupons)

### Database Impact
- ✅ No schema changes
- ✅ No data modifications
- ✅ No migrations needed

### Testing
Admin should:
1. Create affiliate-enabled coupon template
2. Set `isAffiliateEnabled: true`
3. Provide to affiliate for generation
4. Verify affiliate gets unique codes only

---

## Error Handling

Affiliate attempting custom coupon creation will receive:
- HTTP 403 Forbidden
- Clear error message in Indonesian
- No coupon created
- Clean failure (no partial data)

---

## Status

✅ **IMPLEMENTATION COMPLETE**
✅ **SAFE DEPLOYMENT READY**
✅ **POLICY ENFORCED AT API LEVEL**

All affiliate coupon creation now requires admin template.
No custom discounts allowed from affiliate side.
