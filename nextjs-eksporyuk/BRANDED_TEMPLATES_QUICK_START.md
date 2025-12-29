# 🚀 QUICK START - Branded Templates Settings

## ⚡ 5-Minute Setup

### 1. Start Development Server
```bash
cd nextjs-eksporyuk
npm run dev
```

### 2. Login to Admin
- URL: `http://localhost:3000/login`
- Email: `admin@eksporyuk.com`
- Password: `admin123` (or your configured password)

### 3. Access Branded Templates
- Navigate to: `http://localhost:3000/admin/branded-templates`
- Click tab: **"Pengaturan Template"**

### 4. Configure Settings

**Logo:**
```
1. Upload logo file OR
2. Paste URL: https://example.com/logo.png
3. See preview below input
```

**Email Footer:**
```
Fill these fields (optional except Company Name):
- Nama Perusahaan: PT. Eksporyuk
- Deskripsi: Platform Ekspor Indonesia
- Alamat: Jl. Sudirman No. 123
- Telepon: +62-21-1234-5678
- Email: support@eksporyuk.com
- Website: https://eksporyuk.com
- Instagram: https://instagram.com/eksporyuk
- Facebook: https://facebook.com/eksporyuk
- LinkedIn: https://linkedin.com/company/eksporyuk
- Copyright: © 2025 Eksporyuk
```

### 5. Test Email
```
1. Select template from "Pilih Template" dropdown
2. Enter your email in "Email Tujuan"
3. Click "Kirim Test"
4. Check inbox for test email with logo & footer
```

### 6. Save Settings
```
Click "Simpan Pengaturan" button
Wait for success notification
```

---

## 🎯 Key Endpoints

### GET Settings
```bash
curl http://localhost:3000/api/settings
```

### Save Settings (Admin Only)
```bash
curl -X POST http://localhost:3000/api/admin/settings \
  -H "Content-Type: application/json" \
  -d '{
    "siteLogo": "https://...",
    "emailFooterCompany": "PT. Eksporyuk",
    "emailFooterText": "...",
    ...
  }'
```

### Upload Logo (Admin Only)
```bash
curl -X POST http://localhost:3000/api/admin/upload \
  -F "file=@logo.png" \
  -F "type=logo"
```

### Send Test Email (Admin Only)
```bash
curl -X POST http://localhost:3000/api/admin/branded-templates/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template-id-here",
    "testEmail": "your@email.com",
    "testData": {...}
  }'
```

---

## 📁 File Structure

```
├── src/app/(dashboard)/admin/branded-templates/
│   └── page.tsx                    ← Main UI component
├── src/app/api/
│   ├── settings/
│   │   └── route.ts               ← GET settings
│   └── admin/
│       ├── settings/
│       │   └── route.ts           ← POST settings (save)
│       ├── upload/
│       │   └── route.ts           ← File upload
│       └── branded-templates/
│           ├── test-email/
│           │   └── route.ts       ← Send test email
│           ├── [id]/
│           │   ├── preview/
│           │   │   └── route.ts
│           │   └── usage/
│           │       └── route.ts
│           └── route.ts           ← CRUD templates
└── prisma/
    └── schema.prisma             ← Database models
```

---

## 🧪 Quick Test

### Test Settings Save
1. Open DevTools (F12)
2. Go to Settings tab
3. Change "Nama Perusahaan" field
4. Click "Simpan Pengaturan"
5. Check Console for success message
6. Refresh page - value should persist

### Test Logo Upload
1. Click "Upload dari Device"
2. Select a PNG/JPG file (< 5MB)
3. See preview appear
4. Click "Simpan Pengaturan"
5. Check `/public/uploads/` folder

### Test Email Send
1. Select template from dropdown
2. Enter your email
3. Click "Kirim Test"
4. Wait 1-2 minutes
5. Check inbox (including spam)

---

## ⚠️ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Logo not showing | Verify URL is valid, use absolute URL |
| Email not received | Check spam folder, verify Mailketing API status |
| Settings not saving | Check browser console, verify admin auth |
| Upload fails | Check file size (< 5MB), file type (image only) |
| Page won't load | Refresh page, clear cache, restart dev server |

---

## 📊 Status Check

### Verify All Components Working

```typescript
// Check in browser console:
fetch('/api/settings').then(r => r.json()).then(console.log)

// Should return settings object with email footer fields
```

### Check Database
```bash
cd nextjs-eksporyuk
npx prisma studio
# Navigate to Settings table, check id=1 has email footer data
```

---

## 💡 Tips & Tricks

1. **Footer Preview Updates Real-Time** - No need to save to see preview
2. **Test Email with Sample Data** - Always uses placeholder data, safe to test
3. **Logo Preview Lazy Loads** - Only loads after URL confirmed
4. **Settings Auto-Load** - Fetched when opening settings tab
5. **Multiple Uploads OK** - Old files kept for reference

---

## 🔍 Debugging

### Enable Verbose Logging
In page.tsx, uncomment console.logs:
```typescript
console.log('Sending test email for template:', template.id)
console.log('[Settings API] Received data:', body)
```

### Check Network Requests
DevTools → Network tab:
1. Filter by: `admin/settings`, `upload`, `test-email`
2. Check request/response in each tab
3. Look for 401/403 (auth errors)
4. Look for 400/500 (validation errors)

### Check Database Directly
```bash
npx prisma db execute --stdin << 'EOF'
SELECT siteLogo, emailFooterCompany FROM Settings WHERE id = 1;
EOF
```

---

## ✅ Verification Checklist

Before going to production:

- [ ] Settings page loads without errors
- [ ] Logo can be uploaded and saved
- [ ] Email footer fields can be edited
- [ ] Footer preview shows in real-time
- [ ] Test email sends successfully
- [ ] Test email has logo and footer
- [ ] Settings persist after refresh
- [ ] All validation working (size, type, format)
- [ ] Error messages display correctly
- [ ] No console errors (F12)

---

## 📞 Need Help?

1. Check **BRANDED_TEMPLATES_SETTINGS_GUIDE.md** for detailed docs
2. Check **BRANDED_TEMPLATES_IMPLEMENTATION_SUMMARY.md** for technical details
3. Run `npm run dev` and check server logs
4. Check browser DevTools Console tab for errors
5. Check Network tab in DevTools for API issues

---

**Ready to go!** 🎉

Your settings page is fully configured and tested. Start using it now!
