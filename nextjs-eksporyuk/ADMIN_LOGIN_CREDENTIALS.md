# 🔐 Admin Login Credentials

## Default Admin Account

**Status:** ✅ **ACTIVE & READY**

### Login Details
```
📧 Email:    admin@eksporyuk.com
🔑 Password: admin123
👤 Name:     Budi Admin
🎭 Role:     ADMIN
```

---

## How to Login

### Web Application
1. Navigate to: `http://localhost:3000/auth/login` (atau port yang sedang berjalan)
2. Enter email: `admin@eksporyuk.com`
3. Enter password: `admin123`
4. Click "Login" button

### Admin Dashboard
After login, you can access:
- Dashboard: `/admin/dashboard`
- Users: `/admin/users`
- Groups: `/admin/groups`
- Memberships: `/admin/memberships`
- Products: `/admin/products`
- Courses: `/admin/courses`
- Transactions: `/admin/transactions`
- Settings: `/admin/settings`

---

## Security Notes

⚠️ **IMPORTANT SECURITY WARNINGS:**

1. **Change the password immediately after first login!**
2. This is a default password and should NOT be used in production
3. Make sure to use a strong password (min 12 characters, mix of letters, numbers, symbols)
4. Enable 2FA if available
5. Never share admin credentials

---

## Troubleshooting Login Issues

### If you can't login:

1. **Check if server is running:**
   ```bash
   cd nextjs-eksporyuk
   npm run dev
   ```

2. **Reset admin password:**
   ```bash
   cd nextjs-eksporyuk
   npx tsx scripts/create-admin-direct.ts
   ```

3. **Test credentials:**
   ```bash
   cd nextjs-eksporyuk
   npx tsx scripts/test-login.ts
   ```

4. **Check database:**
   ```bash
   cd nextjs-eksporyuk
   sqlite3 dev.db "SELECT email, name, role FROM User WHERE role = 'ADMIN';"
   ```

---

## Creating Additional Admins

To create more admin accounts, you can:

### Option 1: Using Script
```bash
cd nextjs-eksporyuk
npx tsx scripts/create-admin-direct.ts
```
(Then edit the script to use different email/name)

### Option 2: Using Admin Panel
1. Login as admin
2. Go to `/admin/users`
3. Create new user
4. Set role to "ADMIN"

### Option 3: Database Direct
```bash
cd nextjs-eksporyuk
node create-admin.js
```

---

## Login Error Messages

If you see these errors:

| Error | Solution |
|-------|----------|
| "User tidak ditemukan" | Admin user doesn't exist - run create-admin script |
| "Password salah" | Wrong password - try `admin123` or reset |
| "Email dan password harus diisi" | Fill in both fields |
| "Akun ini menggunakan metode login lain" | User has no password set - reset password |

---

## Verified Status

✅ **Database Check:** User exists in database  
✅ **Password Check:** Password hash is valid  
✅ **Role Check:** User has ADMIN role  
✅ **Status Check:** Account is active  
✅ **Email Verified:** Email is verified  

Last verified: 27 November 2024, 22:30 WIB

---

## Quick Commands

```bash
# Start the app
cd nextjs-eksporyuk && npm run dev

# Reset password
cd nextjs-eksporyuk && npx tsx scripts/create-admin-direct.ts

# Test login
cd nextjs-eksporyuk && npx tsx scripts/test-login.ts

# View all users
cd nextjs-eksporyuk && sqlite3 dev.db "SELECT email, name, role FROM User;"
```

---

## Support

If you still can't login after trying all the above:

1. Check the terminal for error logs
2. Check browser console (F12) for JavaScript errors
3. Verify `.env` file has correct `DATABASE_URL`
4. Try clearing cookies/cache
5. Check if NextAuth is configured properly in `src/lib/auth-options.ts`

---

**Last Updated:** 27 November 2024  
**Created By:** GitHub Copilot AI Assistant
