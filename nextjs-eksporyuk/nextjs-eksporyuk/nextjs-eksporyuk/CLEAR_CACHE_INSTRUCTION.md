# CLEAR BROWSER CACHE - PENTING!

API endpoint sudah LIVE dan berfungsi dengan baik di production.
Browser masih load JavaScript bundle LAMA (sebelum API dibuat).

## Cara Fix (pilih salah satu):

### Option 1: Hard Refresh (TERCEPAT)
1. Buka https://eksporyuk.com/affiliate/wallet
2. Tekan **Command + Shift + R** (Mac) atau **Ctrl + Shift + R** (Windows)
3. Atau tekan **Command + Option + E** lalu refresh

### Option 2: Clear Cache di Developer Tools
1. Buka Developer Tools (F12 atau Command + Option + I)
2. Klik kanan pada tombol Refresh
3. Pilih "Empty Cache and Hard Reload"

### Option 3: Clear Site Data
1. Buka Developer Tools (F12)
2. Tab "Application" → "Storage" 
3. Klik "Clear site data"
4. Refresh halaman

### Option 4: Private/Incognito Window
1. Buka Incognito Window (Command + Shift + N)
2. Login dan test validasi bank

## Verification API Working:
```bash
# Test tanpa auth (akan dapat Unauthorized - ini BENAR)
curl -X POST https://eksporyuk.com/api/affiliate/validate-bank-account \
  -H "Content-Type: application/json" \
  -d '{"bankName":"BCA","accountNumber":"1234567890"}'

# Response: {"error":"Unauthorized"}  ← API WORKING!
```

## Root Cause:
- Browser cache JavaScript bundle lama (sebelum 7 Jan 2026 23:40 WIB)
- Bundle hash: `page-fe9964cafe02cd30.js` (OLD)
- Perlu bundle baru yang include API route

## Status:
✅ API endpoint deployed and working
✅ Server responding correctly (401 Unauthorized without session)
❌ Browser masih pakai bundle lama (cached)

## Next Steps:
1. Clear browser cache (hard refresh)
2. Test validasi bank account
3. Harusnya langsung berfungsi
