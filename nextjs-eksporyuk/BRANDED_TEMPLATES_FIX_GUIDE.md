# Fix Branded Templates - Panduan Menyelesaikan

## Status Saat Ini
✅ **Test email sudah dipindah ke Settings tab**  
✅ **Template dropdown sudah ditambahkan**  
✅ **Template dropdown sudah menggunakan filter `.isActive`** (bukan `.type === 'EMAIL'`)  
⚠️ **Templates di database masih bertipe NOTIFICATION** (seharusnya EMAIL)

## Langkah-Langkah Penyelesaian

### Opsi 1: Fix Via API (Tercepat)

1. **Buka browser dan login sebagai admin**
2. **Buka halaman /admin/branded-templates**
3. **Buka Developer Console (F12)**
4. **Copy-paste script ini dan Enter:**

```javascript
// Script untuk fix template types
async function fixTemplateTypes() {
  try {
    console.log('Fixing template types...')
    
    const response = await fetch('/api/admin/fix-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Success:', result.message)
      console.log('📋 Templates:', result.templates)
      
      console.table(result.templates.map(t => ({
        Name: t.name,
        Type: t.type,
        Active: t.isActive,
        Category: t.category
      })))
      
      alert('Template types berhasil diperbaiki! Refresh halaman.')
      
    } else {
      console.error('❌ Error:', result.error)
      alert('Error: ' + result.error)
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error)
    alert('Network error: ' + error.message)
  }
}

fixTemplateTypes()
```

5. **Refresh halaman** setelah script berhasil
6. **Cek Settings tab** - dropdown seharusnya menampilkan templates

### Opsi 2: Fix Via Terminal (Jika opsi 1 gagal)

```bash
cd nextjs-eksporyuk
# Buat script fix cepat
echo 'const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function fix() {
  console.log("Updating templates...")
  const result = await prisma.brandedTemplate.updateMany({
    where: { type: "NOTIFICATION" },
    data: { type: "EMAIL" }
  })
  console.log("Updated:", result.count, "templates")
  
  const templates = await prisma.brandedTemplate.findMany({
    select: { name: true, type: true, isActive: true, category: true }
  })
  console.log("All templates:")
  templates.forEach(t => console.log(`- ${t.name}: ${t.type} (${t.isActive ? "active" : "inactive"})`))
  
  await prisma.$disconnect()
}
fix().catch(console.error)' > fix-quick.js

node fix-quick.js
```

### Opsi 3: Manual Via Prisma Studio

```bash
npx prisma studio
```
- Buka BrandedTemplate table
- Edit setiap record: ubah `type` dari `NOTIFICATION` ke `EMAIL`

## Verifikasi Berhasil

Setelah fix berhasil, cek di `/admin/branded-templates` → **Settings tab**:

1. **Dropdown "Pilih Template"** seharusnya menampilkan:
   - Email Transaksi Berhasil (TRANSACTION)
   - Email Transaksi Pending (TRANSACTION)  
   - Email Transaksi Dibatalkan (TRANSACTION)

2. **Counter di bawah dropdown** seharusnya: "3 template tersedia"

3. **Test email flow:**
   - Pilih template dari dropdown
   - Masukkan email
   - Klik "Kirim Test"
   - Cek email masuk

## File yang Sudah Dimodifikasi

1. **src/app/(dashboard)/admin/branded-templates/page.tsx**
   - ✅ Test email dipindah ke Settings tab
   - ✅ Template dropdown ditambahkan
   - ✅ Filter menggunakan `.isActive` instead of `.type === 'EMAIL'`

2. **src/app/api/admin/fix-templates/route.ts** (baru)
   - ✅ Endpoint API untuk fix template types

3. **fix-templates-browser.js** (baru) 
   - ✅ Script browser untuk fix via console

## Expected Result

Dropdown template seharusnya menampilkan 3 templates dan test email berfungsi sempurna dengan logo & footer dari Settings.

---

**CATATAN:** Jika masih ada masalah, kemungkinan:
- Dev server perlu restart
- Browser cache perlu refresh
- Session admin perlu re-login