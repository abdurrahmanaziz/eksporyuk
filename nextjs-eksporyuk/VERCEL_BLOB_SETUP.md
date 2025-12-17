# Setup Vercel Blob Storage untuk File Upload

## Kenapa Perlu Vercel Blob?

Vercel adalah **serverless** platform. File yang diupload ke `/public/uploads/` akan **HILANG** setelah:
- Setiap deployment baru
- Server restart
- Beberapa saat (karena ephemeral storage)

**Solusi:** Gunakan **Vercel Blob Storage** yang menyimpan file secara permanen di cloud.

## Setup Steps

### 1. Buat Blob Store di Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Pilih project `eksporyuk`
3. Klik tab **Storage**
4. Klik **Create** → **Blob**
5. Beri nama: `eksporyuk-uploads`
6. Pilih region: **Singapore (sin1)** untuk Indonesia
7. Klik **Create**

### 2. Dapatkan Token

Setelah Blob Store dibuat:
1. Klik Blob Store yang baru dibuat
2. Klik tab **Settings**
3. Scroll ke **Tokens**
4. Copy **Read/Write Token**

### 3. Tambahkan ke Environment Variables

Di Vercel Dashboard:
1. Buka project settings
2. Klik **Environment Variables**
3. Tambahkan:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: (paste token dari step 2)
   - Environments: Production, Preview, Development
4. Klik **Save**

### 4. Redeploy

```bash
# Atau trigger dari Vercel Dashboard
git commit --allow-empty -m "Trigger redeploy for Blob storage"
git push
```

## Hasil

Setelah setup:
- Upload file → Disimpan di Vercel Blob (permanent)
- URL: `https://xxxxx.public.blob.vercel-storage.com/uploads/...`
- Bisa diakses dari mana saja termasuk email clients
- File tidak akan hilang setelah deploy

## Testing Lokal

Untuk development lokal, file tetap disimpan di `public/uploads/` karena BLOB_READ_WRITE_TOKEN tidak ada.

Jika ingin test Vercel Blob lokal:
1. Copy token dari Vercel Dashboard
2. Tambahkan ke `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxx"
   ```
3. Restart dev server

## File yang Diupdate

Upload handlers yang sudah mendukung Vercel Blob:
- `/src/app/api/admin/upload/route.ts`
- `/src/app/api/admin/settings/upload-logo/route.ts`
- `/src/app/api/upload/route.ts`

## Pricing

Vercel Blob free tier:
- 5GB storage
- 1GB bandwidth/month

Lebih dari cukup untuk logo & gambar branding.

---

**PENTING:** Setup ini WAJIB dilakukan agar gambar di email bisa muncul di production!
