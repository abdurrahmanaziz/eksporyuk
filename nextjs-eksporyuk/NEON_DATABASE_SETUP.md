# 🚀 Setup Neon PostgreSQL Database (3 menit - GRATIS SELAMANYA!)

## Step 1: Sign Up Neon (100% GRATIS)

1. Buka: https://console.neon.tech/signup
2. Sign up dengan **GitHub account** (paling cepat)
3. **Free tier**: Unlimited projects, 512MB storage, auto-pause
4. **No credit card required!** ✅

## Step 2: Create Project

1. Setelah login, klik **"Create a project"**
2. **Project name**: `eksporyuk`
3. **Region**: Pilih **AWS US East (Ohio)** atau **AWS Europe (Frankfurt)**
4. **PostgreSQL version**: 16 (latest)
5. Klik **"Create project"**
6. Tunggu ~15 detik project dibuat

## Step 3: Get Connection String

1. Setelah project dibuat, Anda akan lihat **"Connection Details"**
2. Toggle **"Pooled connection"** OFF (pakai direct connection)
3. Copy **2 connection strings**:
   - **Connection string** → untuk `DATABASE_URL`
   - Klik **"Direct connection"** → untuk `DIRECT_URL`

Format connection string:
```
postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Step 4: Update .env

1. Buka file `.env` di folder `nextjs-eksporyuk`
2. Replace kedua baris dengan connection strings dari Neon:

```bash
# Pooled connection (untuk production/Vercel)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct connection (untuk migrations)
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

💡 **Tip**: Copy exact string dari Neon dashboard, jangan edit manual!

## Step 5: Push Schema & Generate Client

```bash
cd nextjs-eksporyuk
npx prisma db push
npx prisma generate
```

## Step 6: Seed Data (Opsional)

Jika ingin populate database dengan data awal:
```bash
node seed-memberships.js
node seed-all-templates.js
```

## Step 7: Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000 - API errors seharusnya sudah hilang! ✅

---

## 🎯 Why Neon?

- ✅ **100% GRATIS SELAMANYA** - No credit card, no surprise bills
- ✅ **512 MB storage** - Cukup untuk 100k+ records
- ✅ **Auto-pause** - Database sleep otomatis saat tidak dipakai (hemat resources)
- ✅ **Instant provisioning** - Database ready dalam 15 detik
- ✅ **Branching** - Git-like workflow untuk database (seperti PlanetScale)
- ✅ **Built for serverless** - Perfect untuk Next.js + Vercel
- ✅ **PostgreSQL** - More features than MySQL (JSON, full-text search, arrays)

## 🆚 Neon vs Alternatif

| Feature | Neon | Supabase | Railway |
|---------|------|----------|---------|
| **Price** | Free forever | Free (500MB) | $5/month credit |
| **Storage** | 512 MB | 500 MB | ~1 GB |
| **Database** | PostgreSQL | PostgreSQL | PostgreSQL/MySQL |
| **Auto-pause** | ✅ Yes | ❌ No | ❌ No |
| **Setup** | 3 min | 5 min | 5 min |
| **Best for** | Development | Full-stack app | Production |

---

## 🔥 Next Steps Setelah Setup

1. **Login ke admin**: http://localhost:3000/login
   - Email: `admin@eksporyuk.com`
   - Password: `password123`

2. **Create admin user** (jika belum ada):
   ```bash
   node create-admin-user.js
   ```

3. **View database**:
   ```bash
   npx prisma studio
   ```
   Atau login ke Neon dashboard → SQL Editor

4. **Deploy ke Production**:
   - Deploy Next.js ke Vercel (gratis)
   - Add DATABASE_URL & DIRECT_URL ke Vercel environment variables
   - Done! No additional cost

---

## 🆘 Troubleshooting

**Error: "Connection refused" / "ETIMEDOUT"**
- Pastikan connection string correct (copy exact dari Neon)
- Cek internet connection
- Neon mungkin sedang auto-paused, tunggu 5-10 detik untuk cold start

**Error: "password authentication failed"**
- Password mungkin berubah, generate new password di Neon dashboard
- Copy connection string lagi (jangan edit manual)

**Error: "SSL required"**
- Pastikan ada `?sslmode=require` di akhir connection string

**Database lambat?**
- Neon auto-pause setelah 5 menit tidak dipakai
- First request after pause bisa lambat 2-3 detik (cold start)
- Subsequent requests normal speed

---

## 💡 Pro Tips

1. **Branching**: Neon punya fitur database branches (seperti git)
   - Buat branch untuk testing tanpa affect main database
   - Free tier dapat unlimited branches!

2. **Monitoring**: Neon dashboard punya query monitoring
   - Lihat slow queries
   - Track connection usage

3. **Backups**: Neon auto-backup setiap hari
   - Point-in-time recovery tersedia

4. **Scale later**: Jika project grow, tinggal upgrade ke paid plan ($19/month)
   - Tidak perlu migrate database
   - Seamless upgrade

---

**Need help?** Neon docs: https://neon.tech/docs/introduction


## Step 1: Sign Up PlanetScale (GRATIS)

1. Buka: https://auth.planetscale.com/sign-up
2. Sign up dengan **GitHub account** (paling cepat)
3. Setelah login, klik **"Create a database"**

## Step 2: Create Database

1. **Database name**: `eksporyuk`
2. **Region**: Pilih **AWS ap-southeast-1 (Singapore)** (terdekat dengan Indonesia)
3. Klik **"Create database"**
4. Tunggu ~30 detik database dibuat

## Step 3: Get Connection String

1. Setelah database dibuat, klik tab **"Connect"**
2. Di **"Connect with"**, pilih **"Prisma"**
3. Copy **connection string** yang muncul, formatnya seperti:
   ```
   mysql://xxxxx:pscale_pw_xxxxx@aws.connect.psdb.cloud/eksporyuk?sslaccept=strict
   ```

## Step 4: Update .env

1. Buka file `.env` di folder `nextjs-eksporyuk`
2. Replace baris `DATABASE_URL` dengan connection string dari PlanetScale:
   ```bash
   DATABASE_URL="mysql://xxxxx:pscale_pw_xxxxx@aws.connect.psdb.cloud/eksporyuk?sslaccept=strict"
   ```

## Step 5: Push Schema & Generate Client

```bash
cd nextjs-eksporyuk
npx prisma db push
npx prisma generate
```

## Step 6: Seed Data (Opsional)

Jika ingin populate database dengan data awal:
```bash
node seed-memberships.js
node seed-all-templates.js
```

## Step 7: Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000 - API errors seharusnya sudah hilang! ✅

---

## 🎯 Why PlanetScale?

- ✅ **Gratis** - 5GB storage, 1 billion row reads/month
- ✅ **No setup** - Tidak perlu install MySQL lokal
- ✅ **Fast** - Server di Singapore (low latency)
- ✅ **Branching** - Git-like workflow untuk database
- ✅ **Auto scaling** - Production-ready
- ✅ **Built for Prisma** - Perfect integration

## 🔥 Next Steps Setelah Setup

1. **Login ke admin**: http://localhost:3000/login
   - Email: `admin@eksporyuk.com`
   - Password: `password123`

2. **Create admin user** (jika belum ada):
   ```bash
   node create-admin-user.js
   ```

3. **Deploy ke Production**:
   - PlanetScale database sudah production-ready
   - Tinggal deploy Next.js ke Vercel/Netlify
   - Update DATABASE_URL di production environment variables

---

## 🆘 Troubleshooting

**Error: "Connection refused"**
- Pastikan connection string correct (copy exact dari PlanetScale)
- Cek internet connection

**Error: "Schema validation failed"**
- Run: `npx prisma format`
- Then: `npx prisma db push`

**Error: "Migration failed"**
- PlanetScale tidak support migrations dengan foreign keys
- Gunakan `npx prisma db push` (bukan `prisma migrate`)
- Schema sudah diset dengan `relationMode = "prisma"` untuk handle ini

---

**Need help?** PlanetScale punya docs bagus di: https://planetscale.com/docs
