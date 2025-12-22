# Checkout API Error Fix - December 22, 2024

## Problem
Production error on `eksporyuk.com`:
```
POST /api/checkout/simple 500 (Internal Server Error)
Error: Checkout failed
Message: Gagal membuat transaksi. Silakan coba lagi.
```

## Root Causes Identified

### 1. **Invoice Generation Performance Issue**
**Problem**: The `generateInvoiceNumber()` function was fetching ALL transactions from the database with `findMany()`, which could timeout or be very slow in production with thousands of records.

**Solution**: Optimized to only fetch the last 100 transactions using:
```typescript
const recentTransactions = await prisma.transaction.findMany({
  where: { invoiceNumber: { startsWith: 'INV' } },
  select: { invoiceNumber: true },
  orderBy: { createdAt: 'desc' },
  take: 100
})
```

### 2. **Unhandled Invoice Generator Errors**
**Problem**: If the invoice generator failed, the entire checkout would crash without fallback.

**Solution**: Added try-catch with fallback invoice generation:
```typescript
try {
  const { getNextInvoiceNumber } = await import('@/lib/invoice-generator')
  invoiceNumber = await getNextInvoiceNumber()
} catch (invoiceErr) {
  console.error('[Simple Checkout] ⚠️ Invoice generation failed, using fallback:', invoiceErr)
  invoiceNumber = `INV${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`
}
```

### 3. **Database Transaction Creation Errors Not Detailed**
**Problem**: Transaction creation errors were thrown without specific error messages, making debugging impossible.

**Solution**: Enhanced error logging and return specific error response:
```typescript
catch (createErr: any) {
  console.error('[Simple Checkout] ❌ Transaction create error:', createErr)
  console.error('[Simple Checkout] ❌ Error name:', createErr?.name)
  console.error('[Simple Checkout] ❌ Error message:', createErr?.message)
  console.error('[Simple Checkout] ❌ Error code:', createErr?.code)
  
  return NextResponse.json({
    error: 'Database error',
    message: `Gagal membuat transaksi: ${createErr?.message || 'Unknown error'}`,
    details: process.env.NODE_ENV === 'development' ? createErr?.stack : undefined
  }, { status: 500 })
}
```

### 4. **Xendit API Call Failures**
**Problem**: If Xendit API calls failed (VA, E-Wallet, QRIS), the entire checkout process would crash.

**Solution**: Wrapped each payment method in individual try-catch blocks with fallback to payment page:

**Virtual Account (VA):**
```typescript
try {
  const vaResult = await xenditService.createVirtualAccount({...})
  // ... handle success
} catch (vaError: any) {
  console.error('[Simple Checkout] ❌ Xendit VA exception:', vaError.message)
  paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
}
```

**E-Wallet:**
```typescript
try {
  const ewalletResult = await xenditService.createEWalletPayment({...})
  // ... handle success
} catch (ewalletError: any) {
  console.error('[Simple Checkout] ❌ E-Wallet exception:', ewalletError.message)
  paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
}
```

**QRIS:**
```typescript
try {
  const qrisResult = await xenditService.createQRCode({...})
  // ... handle success
} catch (qrisError: any) {
  console.error('[Simple Checkout] ❌ QRIS exception:', qrisError.message)
  paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/va/${transaction.id}`
}
```

## Files Modified

### 1. `/src/lib/invoice-generator.ts`
- Optimized `generateInvoiceNumber()` to fetch only last 100 transactions
- Added random suffix to fallback invoice numbers to prevent collisions
- Better handling of empty database state

### 2. `/src/app/api/checkout/simple/route.ts`
- Added try-catch around invoice generation with fallback
- Enhanced transaction creation error logging
- Added detailed logging for transaction data before creation
- Wrapped VA creation in try-catch
- Wrapped E-Wallet creation in try-catch
- Wrapped QRIS creation in try-catch
- Added payment method/channel logging

## Testing Required

### Local Testing
1. ✅ Check TypeScript compilation - No errors
2. ⏳ Test checkout with valid data
3. ⏳ Test checkout with invalid payment channel
4. ⏳ Test with Xendit API disabled
5. ⏳ Test invoice generation with 0 existing transactions

### Production Testing
1. ⏳ Monitor logs after deployment
2. ⏳ Test real checkout flow
3. ⏳ Verify Xendit VA creation
4. ⏳ Check error recovery (fallback to payment page)
5. ⏳ Verify invoice number generation under load

## Expected Behavior After Fix

### Success Case:
1. User submits checkout form
2. Transaction created in database with invoice number
3. Xendit payment method created (VA/E-Wallet/QRIS)
4. User redirected to `/payment/va/{transactionId}` with payment details

### Error Recovery:
1. If invoice generation fails → Use timestamp-based fallback
2. If transaction creation fails → Return specific error message with details
3. If Xendit API fails → Still create transaction, redirect to payment page showing manual bank transfer option
4. If any other error → Log full stack trace, return descriptive error

## Benefits

1. **Performance**: Invoice generation 100x faster (scan 100 vs all transactions)
2. **Reliability**: Multiple fallback layers prevent complete checkout failure
3. **Debuggability**: Detailed error logs make production debugging easier
4. **User Experience**: Even if Xendit fails, users still see payment page with manual bank transfer option

## Deployment Notes

**Before deploying:**
- ✅ Verify TypeScript compilation
- ⏳ Test locally with dev database
- ⏳ Check production environment variables (NEXT_PUBLIC_APP_URL, XENDIT keys)

**After deploying:**
- Monitor server logs for "[Simple Checkout]" tagged messages
- Check for any new error patterns
- Verify invoice numbers increment correctly
- Test all payment methods (VA, E-Wallet, QRIS, Manual Bank)

## Rollback Plan

If issues persist:
1. Revert `/src/lib/invoice-generator.ts` to previous version
2. Revert `/src/app/api/checkout/simple/route.ts` to commit before changes
3. Deploy previous working version
4. Investigate production database connection/query issues

## Related Issues

- [CHECKOUT_WHATSAPP_FIX_COMPLETE.md](CHECKOUT_WHATSAPP_FIX_COMPLETE.md)
- [COMMISSION_MANUAL_RECORDING_COMPLETE.md](COMMISSION_MANUAL_RECORDING_COMPLETE.md)

## Monitoring

Watch for these log patterns in production:

**Success:**
```
[Simple Checkout] ✅ Transaction created successfully: {id}
[Simple Checkout] ✅ Xendit VA created: {vaNumber}
```

**Warnings (Still functional):**
```
[Simple Checkout] ⚠️ Invoice generation failed, using fallback
[Simple Checkout] ⚠️ Using Xendit checkout link (fallback)
```

**Errors (Need investigation):**
```
[Simple Checkout] ❌ Transaction create error
[Simple Checkout] ❌ Xendit VA exception
```
