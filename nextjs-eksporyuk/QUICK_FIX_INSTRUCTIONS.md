# 🔧 Perbaikan Cepat - Setelah Database Reset

## ✅ FIXED: Postingan Grup
**Masalah:** RichTextEditor memanggil `handleCreatePost` yang tidak ada
**Solusi:** Ditambahkan function `handleCreatePost` di `groups/[slug]/page.tsx`
**Status:** ✅ SELESAI - Sekarang postingan sudah bisa dibuat

---

## ⚠️ PERLU DIPERBAIKI: Profile Error 404

**Masalah:** 
- Session memiliki User ID lama: `cmil1gsx50004itjv2dz0j9a2`
- Database memiliki User ID baru: `cmitrz6yx00045tcty2iehi0`
- Mismatch ini menyebabkan `/profile` return 404

**Penyebab:**
Database di-reset dengan `prisma migrate reset --force` tapi session browser masih menyimpan user ID lama.

### ✅ SOLUSI TERCEPAT (Pilih salah satu):

#### **Opsi 1: Logout & Login Ulang** (TERCEPAT)
1. Buka browser developer tools (F12)
2. Application → Cookies → Hapus semua cookies `localhost:3000`
3. Atau buka `/auth/signout`
4. Login ulang dengan credentials yang sama

#### **Opsi 2: Recreate User dengan ID Lama**
```bash
cd /Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk
npx tsx <<EOF
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixUser() {
  try {
    // Delete current admin
    await prisma.user.delete({
      where: { email: 'admin@eksporyuk.com' }
    }).catch(() => {})
    
    // Recreate dengan ID yang sama dengan session
    const user = await prisma.user.create({
      data: {
        id: 'cmil1gsx50004itjv2dz0j9a2', // Session user ID
        email: 'admin@eksporyuk.com',
        name: 'Admin Eksporyuk',
        username: 'admin',
        password: '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Admin+Eksporyuk&background=3b82f6&color=fff',
        emailVerified: new Date(),
        phone: '+628123456789',
        whatsapp: '+628123456789',
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        profileCompleted: true,
      }
    })
    
    console.log('✅ User recreated:', user.email)
  } finally {
    await prisma.\$disconnect()
  }
}

fixUser()
EOF
```

#### **Opsi 3: Clear Auth Cookies via Code**
Tambahkan route `/api/auth/clear-session`:
```typescript
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  cookieStore.delete('next-auth.session-token')
  cookieStore.delete('next-auth.csrf-token')
  return NextResponse.json({ success: true })
}
```

---

## 📊 Root Cause Analysis

**Kesalahan yang Terjadi:**
1. Menambahkan field `showStats` ke schema
2. Langsung run `prisma migrate reset --force` ❌
3. Semua data terhapus termasuk user records
4. Session browser masih mengingat user ID lama
5. API `/api/user/profile` tidak bisa find user dengan ID session

**Yang Seharusnya Dilakukan:**
```bash
# Untuk perubahan schema yang simple, gunakan db push
npx prisma db push

# Atau buat migration yang proper
npx prisma migrate dev --name add_show_stats

# JANGAN PERNAH run reset di development dengan data real!
```

---

## 🎯 Rekomendasi ke Depan

1. **Setup Database Backup:**
   ```bash
   # Backup database sebelum migrasi
   cp prisma/dev.db prisma/dev.db.backup
   
   # Restore jika ada masalah
   cp prisma/dev.db.backup prisma/dev.db
   ```

2. **Gunakan Seed Script:**
   - Simpan script seed untuk data penting
   - Jalankan after reset: `npx prisma db seed`

3. **Testing di Staging:**
   - Test perubahan schema di environment terpisah
   - Jangan langsung test di database development utama

---

## 📝 Testing

Setelah fix, test:

1. **Postingan Grup:**
   - ✅ Buka `/community/groups/komunitas-ekspor-indonesia`
   - ✅ Tulis postingan di RichTextEditor
   - ✅ Klik "Post"
   - ✅ Postingan muncul di feed

2. **Profile Page:**
   - Buka `/profile` atau `/profil`
   - Harus muncul form profile, bukan error 404
   - Data user harus terload dengan benar

---

## 💡 Prevention

**Checklist sebelum run migration:**
- [ ] Backup database (`cp dev.db dev.db.backup`)
- [ ] Cek apakah perlu reset atau cukup `db push`
- [ ] Pastikan seed script ready
- [ ] Test di database copy terlebih dahulu
- [ ] NEVER use `--force` flag di production!

