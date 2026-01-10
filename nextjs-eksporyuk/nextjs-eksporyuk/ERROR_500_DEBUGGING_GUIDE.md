# 🐛 Debugging Error 500 di Checkout API

## Error yang Dilaporkan User:
```
/api/checkout/simple:1  Failed to load resource: the server responded with a status of 500 ()
[DEBUG] ❌ Server Error: Object
```

## ✅ Perbaikan yang Sudah Dilakukan:

### 1. **Improved Error Handling**
- ✅ Better metadata handling (check if object before spread)
- ✅ Detailed error logging untuk tracking
- ✅ Proper error messages untuk user

### 2. **Enhanced Logging**
```typescript
// Sekarang ada logging untuk:
- APP_URL configuration
- Invoice response structure
- Metadata validation
- Detailed error stack traces
```

### 3. **Metadata Spread Fix**
```typescript
// SEBELUMNYA (bisa error jika metadata null):
metadata: {
  ...(transaction.metadata as any),  // ❌ Error jika null
  xenditInvoiceId: invoice.id
}

// SEKARANG (safe):
const existingMetadata = typeof transaction.metadata === 'object' && transaction.metadata !== null 
  ? transaction.metadata 
  : {};

metadata: {
  ...(existingMetadata as any),  // ✅ Always an object
  xenditInvoiceId: invoice.id
}
```

---

## 🔍 Kemungkinan Penyebab Error 500:

### 1. **Missing Environment Variable**
**Symptom:** Error saat membuat invoice Xendit

**Check:**
```bash
# Di Vercel dashboard, pastikan ada:
XENDIT_SECRET_KEY=xnd_production_...
NEXT_PUBLIC_APP_URL=https://eksporyuk.com
```

**Solution:**
- Go to Vercel project → Settings → Environment Variables
- Add `NEXT_PUBLIC_APP_URL` jika belum ada
- Redeploy setelah menambah variable

---

### 2. **Xendit API Error**
**Symptom:** Error "401 Unauthorized" atau "Invalid API Key"

**Possible Causes:**
- Secret key salah/kadaluarsa
- IP allowlist di Xendit (production IPs harus diizinkan)
- Xendit service down

**Solution:**
```typescript
// Cek di console logs apakah ada:
[Xendit] Invoice creation failed: 401
// atau
[Xendit] No valid secret key available
```

**Fix:**
- Verify secret key di Vercel environment
- Check Xendit dashboard → Settings → API Keys
- Pastikan mode production (bukan test mode)

---

### 3. **Database Connection Error**
**Symptom:** Error saat create/update transaction

**Possible Causes:**
- Database connection timeout
- Invalid DATABASE_URL
- Prisma client issue

**Solution:**
- Check Vercel logs untuk "PrismaClientKnownRequestError"
- Verify DATABASE_URL di environment variables
- Ensure database is accessible from Vercel IPs

---

### 4. **Transaction Metadata Issue**
**Symptom:** Error saat update transaction metadata

**Already Fixed:** ✅
- Added validation untuk ensure metadata is object
- Safe spread operator

---

## 🧪 Cara Debug Error 500:

### Method 1: Check Vercel Logs
1. Go to https://vercel.com/ekspor-yuks-projects/eksporyuk
2. Click "Deployments" → Latest deployment
3. Click "Functions" → Find `/api/checkout/simple`
4. Look for error logs yang detail:
   ```
   [Simple Checkout] ❌ MAIN ERROR
   [Simple Checkout] ❌ Error type: ...
   [Simple Checkout] ❌ Error message: ...
   ```

### Method 2: Check Browser Console
User bisa buka browser console (F12) dan lihat:
```javascript
// Di Network tab, klik request /api/checkout/simple
// Check response body untuk detail error
{
  "error": "Checkout failed",
  "message": "...",  // Exact error message
  "errorType": "...", // Error type
  "details": "..."    // Stack trace (development only)
}
```

### Method 3: Test API Directly
```bash
# Test dengan curl (tanpa session - expect 401)
curl -X POST https://eksporyuk.com/api/checkout/simple \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: {"error":"Unauthorized"}
# If different: Ada masalah di API
```

---

## 📋 Checklist untuk User yang Error 500:

### Pre-Flight Checks:
- [ ] User sudah login? (Session valid?)
- [ ] Membership plan aktif? (isActive: true)
- [ ] Form data lengkap? (nama, email, whatsapp)
- [ ] Payment method dipilih? (bank transfer, ewallet, dll)

### Environment Checks (Admin):
- [ ] XENDIT_SECRET_KEY ada di Vercel?
- [ ] NEXT_PUBLIC_APP_URL set ke https://eksporyuk.com?
- [ ] DATABASE_URL valid dan accessible?
- [ ] Prisma client ter-generate dengan benar?

### Xendit Checks:
- [ ] API Key valid dan production mode?
- [ ] Xendit service status normal? (check https://status.xendit.co)
- [ ] IP allowlist configured (jika ada)?

---

## 🔧 Quick Fixes:

### Fix 1: Redeploy
Kadang Vercel cache issue, coba:
```bash
cd nextjs-eksporyuk
vercel --prod --force
```

### Fix 2: Clear Environment Cache
Di Vercel dashboard:
1. Settings → Environment Variables
2. Edit any variable (add space, then remove)
3. Save → Redeploy

### Fix 3: Check Xendit Dashboard
1. Login ke https://dashboard.xendit.co
2. Check "Transactions" tab → Recent invoices
3. Jika ada failed invoices, lihat error message

---

## 📊 Monitoring:

Setelah deploy fix ini, error 500 seharusnya lebih jelas menunjukkan:

**Before:**
```
❌ Server Error: Object
```

**After:**
```
❌ Checkout failed
message: "Xendit API Key tidak valid atau belum diset"
errorType: "Error"
details: "... stack trace ..."
```

---

## ✅ Status Terkini:

**Deployment:** ✅ Success  
**Error Handling:** ✅ Improved  
**Logging:** ✅ Enhanced  
**Metadata:** ✅ Fixed  

**Next Steps:**
1. User coba checkout lagi
2. Jika masih error 500, check Vercel logs untuk detail
3. Report exact error message untuk debugging lebih lanjut

---

**Updated:** 30 Desember 2025  
**Commit:** "Improve error handling and logging in checkout API"  
**Status:** ✅ Deployed to Production
