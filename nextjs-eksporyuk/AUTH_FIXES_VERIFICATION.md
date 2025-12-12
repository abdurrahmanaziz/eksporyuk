# AUTH FIXES VERIFICATION GUIDE

## 🔧 FIXES YANG SUDAH DILAKUKAN

### 1. **Register API** (`/api/auth/register`)

**Fixes:**
- ✅ Better error handling untuk Prisma unique constraint violations
- ✅ Handle member code generation errors gracefully
- ✅ Detailed logging untuk debugging
- ✅ User-friendly error messages
- ✅ Activity log error handling

**Error Handling:**
```typescript
// Sebelum:
- Generic error: "Terjadi kesalahan server"
- No detail tentang field yang conflict

// Setelah:
- Specific error: "Email sudah terdaftar" / "Username sudah terdaftar"
- Detailed console logs untuk debugging
- Prisma error code (P2002) detection
- Graceful member code generation failure
```

### 2. **Google OAuth** (`auth-options.ts`)

**Fixes:**
- ✅ Ensure `name` field always has value (required field)
- ✅ Auto-generate `memberCode` for OAuth users
- ✅ Auto-create `wallet` dengan balance 0
- ✅ Auto-verify email untuk OAuth users (`emailVerified: true`)
- ✅ Handle race conditions (duplicate user creation)
- ✅ Fallback values untuk missing data

**Field Defaults:**
```typescript
name: user.name || user.email?.split('@')[0] || username
emailVerified: true  // Auto-verify Google users
memberCode: auto-generated (EY0001, EY0002, dst)
wallet: { balance: 0 }
role: 'MEMBER_FREE'
```

---

## 🧪 CARA TESTING

### **Test 1: Register Normal (Manual)**

**URL**: https://app.eksporyuk.com/auth/register

**Test Cases:**

1. **Success Case**
   ```
   Email: testuser@gmail.com
   Name: Test User
   Password: password123
   
   Expected: 
   ✅ "Registrasi berhasil! Silakan cek email Anda untuk verifikasi."
   ✅ User created dengan memberCode
   ✅ Wallet created otomatis
   ✅ Verification email sent
   ```

2. **Duplicate Email**
   ```
   Email: (email yang sudah terdaftar)
   
   Expected:
   ❌ "Email sudah terdaftar"
   ```

3. **Short Password**
   ```
   Password: 1234567 (< 8 chars)
   
   Expected:
   ❌ "Password minimal 8 karakter"
   ```

4. **Non-Gmail Email**
   ```
   Email: test@yahoo.com
   
   Expected:
   ❌ "Email harus menggunakan Gmail (@gmail.com)"
   ```

### **Test 2: Google OAuth Login**

**URL**: https://app.eksporyuk.com/auth/login

**Test Cases:**

1. **New Google User**
   ```
   Click "Sign in with Google"
   Select Google account
   
   Expected:
   ✅ User created otomatis
   ✅ Redirect ke dashboard
   ✅ Check di database:
      - name: filled
      - memberCode: EYxxxx
      - wallet: exists
      - emailVerified: true
      - role: MEMBER_FREE
   ```

2. **Existing Google User**
   ```
   Click "Sign in with Google"
   Select account yang sudah pernah login
   
   Expected:
   ✅ Login success tanpa error
   ✅ Redirect ke dashboard
   ✅ Avatar updated (jika sebelumnya kosong)
   ```

3. **Suspended User**
   ```
   Login dengan account yang di-suspend
   
   Expected:
   ❌ Blocked
   ❌ Error message tentang suspend
   ```

---

## 🔍 DEBUGGING

### **Check Logs (Production)**

```bash
vercel logs https://app.eksporyuk.com --since 1h
```

**Look for:**
- `[Register]` prefix untuk register logs
- `[AUTH]` prefix untuk auth logs
- `Prisma error code: P2002` untuk duplicate errors
- `Generated member code:` untuk verify member code creation

### **Check Database**

```sql
-- Cek user terakhir yang register
SELECT id, email, name, memberCode, emailVerified, role, createdAt 
FROM User 
ORDER BY createdAt DESC 
LIMIT 5;

-- Cek user dengan Google OAuth
SELECT id, email, name, password, emailVerified, memberCode 
FROM User 
WHERE password IS NULL 
ORDER BY createdAt DESC 
LIMIT 5;

-- Cek user tanpa wallet (should be 0)
SELECT u.id, u.email, u.name 
FROM User u 
LEFT JOIN Wallet w ON u.id = w.userId 
WHERE w.id IS NULL;

-- Cek user tanpa memberCode
SELECT id, email, name, memberCode, createdAt 
FROM User 
WHERE memberCode IS NULL;
```

### **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid prisma user create" | Missing required field | ✅ Fixed: Ensure name, memberCode, wallet |
| Google login fails | Missing name | ✅ Fixed: Fallback to email/username |
| Duplicate memberCode error | Race condition | ✅ Fixed: Retry mechanism in getNextMemberCode |
| User without wallet | Create without nested wallet | ✅ Fixed: Always create wallet |
| emailVerified false for OAuth | Not set during OAuth | ✅ Fixed: Auto-set to true |

---

## 📊 MONITORING POST-DEPLOYMENT

### **Check Success Rate**

```bash
# Check register endpoint
curl -X POST https://app.eksporyuk.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","name":"Test","password":"12345678"}' \
  | jq '.success'

# Should return: true (if new) or error message (if exists)
```

### **Verify Google OAuth**

1. Login dengan Google account baru
2. Check console logs untuk:
   ```
   [AUTH] Creating new Google user: xxx
   [AUTH] Generated member code: EYxxxx
   [AUTH] New Google user created successfully
   ```
3. Check dashboard untuk verify data lengkap

### **Expected Metrics**

After deployment:
- ✅ Register success rate: >95%
- ✅ Google OAuth success rate: >98%
- ✅ Users with memberCode: 100% (new users)
- ✅ Users with wallet: 100%
- ✅ OAuth users emailVerified: 100%

---

## ✅ VERIFICATION CHECKLIST

**Before Testing:**
- [x] Code deployed to production
- [x] Database schema up to date
- [x] Environment variables configured (GOOGLE_CLIENT_ID, etc)

**Register Testing:**
- [ ] Can register with valid Gmail
- [ ] Duplicate email shows proper error
- [ ] Password validation works
- [ ] Non-Gmail shows error
- [ ] User created with memberCode
- [ ] Wallet created automatically
- [ ] Verification email sent

**Google OAuth Testing:**
- [ ] New Google user can login
- [ ] User created with all fields
- [ ] memberCode auto-generated
- [ ] Wallet created
- [ ] emailVerified = true
- [ ] Existing user can re-login
- [ ] Suspended user blocked
- [ ] Avatar updates for existing users

**Database Integrity:**
- [ ] All new users have memberCode
- [ ] All new users have wallet
- [ ] OAuth users have emailVerified = true
- [ ] No duplicate memberCodes
- [ ] No missing required fields

---

## 🚨 ROLLBACK PLAN

If issues persist:

```bash
# Rollback to previous deployment
vercel rollback https://app.eksporyuk.com

# Or rollback to specific deployment
vercel rollback https://app.eksporyuk.com <deployment-id>

# Check previous deployments
vercel list eksporyuk
```

**Previous working commit**: `8d1e6b0`
**Current fixed commit**: `2d5d321`

---

## 📞 SUPPORT

If you encounter issues:

1. **Check Logs**: `vercel logs --since 1h`
2. **Check Database**: Run SQL queries above
3. **Test Locally**: `npm run dev` dan test di localhost
4. **Contact**: Developer untuk technical issues

---

**Status**: ✅ **ALL FIXES DEPLOYED TO PRODUCTION**

**Last Updated**: 12 Desember 2025
**Deployment**: https://eksporyuk-54jz2lrvp-ekspor-yuks-projects.vercel.app
