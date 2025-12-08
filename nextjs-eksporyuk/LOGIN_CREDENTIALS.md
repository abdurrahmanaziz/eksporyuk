# 🔐 Login Credentials - Eksporyuk Test Users

Semua user menggunakan password yang sama: **`password123`**

## 📋 Daftar User

| Role | Email | Password | Special Permissions | Deskripsi |
|------|-------|----------|---------------------|-----------|
| ⚙️ **ADMIN** | `admin@eksporyuk.com` | `password123` | - | Administrator sistem |
| 🎓 **MENTOR (Founder)** | `mentor@eksporyuk.com` | `password123` | 60% Revenue Share | Mentor yang juga founder platform |
| 🎓 **MENTOR (Co-Founder)** | `cofounder@eksporyuk.com` | `password123` | 40% Revenue Share | Mentor yang juga co-founder |
| 🔗 **AFFILIATE** | `affiliate@eksporyuk.com` | `password123` | - | Affiliate marketer |
| ⭐ **PREMIUM** | `premium@eksporyuk.com` | `password123` | - | Premium member |
| 👤 **FREE** | `free@eksporyuk.com` | `password123` | - | Free member |

## 🎨 Theme Colors Per Role

- **ADMIN**: Blue (#1E88E5) ⚙️
- **MENTOR**: Purple (#7B1FA2) 🎓
- **AFFILIATE**: Teal (#00796B) 🔗
- **PREMIUM**: Deep Orange (#F57C00) ⭐
- **FREE**: Gray (#424242) 👤

## 💡 Multi-Role & Permission System

**Mentor bisa memiliki special permissions:**
- ✅ **isFounder = true**: 60% revenue share dari membership/produk
- ✅ **isCoFounder = true**: 40% revenue share dari membership/produk
- ✅ Mentor biasa: Hanya dapat 20% komisi dari kursusnya sendiri

**Admin bisa assign permission khusus via Admin Panel:**
- Revenue share percentage
- Wallet access
- Course creation rights
- User management rights

## 📝 Cara Import Data

### Opsi 1: Via TypeScript Seed (Jika MySQL Running)
```bash
npm run prisma:seed
```

### Opsi 2: Via SQL File (Manual Import)
1. Buka Herd GUI → Database → eksporyuk
2. Atau gunakan CLI:
```bash
# Jika MySQL CLI tersedia
mysql -u root eksporyuk < prisma/seed.sql
```

### Opsi 3: Via Herd DB GUI
1. Buka **Herd** → klik icon database
2. Pilih database `eksporyuk`
3. Import file `prisma/seed.sql`

## 🔧 Test Login

1. Akses: http://eksporyuk.test/login
2. Pilih salah satu email di atas
3. Password: `password123`
4. Lihat dashboard dengan theme color sesuai role!

## 💰 Wallet Balance

- Founder: Rp 100.000.000
- Co-Founder: Rp 50.000.000
- Admin: Rp 5.000.000
- Mentor: Rp 3.000.000
- Affiliate: Rp 2.000.000
- Premium: Rp 1.000.000
- Free: Rp 0
