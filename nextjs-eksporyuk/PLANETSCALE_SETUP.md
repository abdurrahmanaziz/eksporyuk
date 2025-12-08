# 🚀 Setup PlanetScale Database (5 menit)

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
