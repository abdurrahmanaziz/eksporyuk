# Setup Environment Variables di Vercel

## Auto-Backup System - Critical Setup

Untuk mengaktifkan auto-backup di production, set environment variables berikut di **Vercel Dashboard**:

### 1. CRON_SECRET (Required)
**Value:**
```
932b763053e9731698cf3d693f1f228c782fc9660e3fc8941cc927c2b5e33a77
```

**Cara set:**
1. Buka https://vercel.com/ekspor-yuks-projects/eksporyuk
2. Settings → Environment Variables
3. Add New Variable:
   - **Name:** `CRON_SECRET`
   - **Value:** (copy dari atas)
   - **Environment:** Production, Preview, Development (pilih semua)
4. Save

### 2. BLOB_READ_WRITE_TOKEN (Sudah ada?)
Cek apakah token ini sudah ada di Vercel:
- Jika **belum ada**, ambil dari local `.env`:
  ```
  vercel_blob_rw_2O4Ab48sR0ROKwSf_Q2UfUm1QSOlMCFbODmvt0zwO0RupNx
  ```
- Set dengan cara yang sama seperti `CRON_SECRET`

### 3. Vercel Cron Jobs (Sudah Aktif)
Cron job sudah dikonfigurasi di `vercel.json`:
```json
{
  "path": "/api/cron/auto-backup",
  "schedule": "*/30 * * * *"
}
```

**Vercel akan otomatis:**
- Jalankan backup setiap 30 menit
- Call endpoint dengan header: `Authorization: Bearer {CRON_SECRET}`
- Simpan ke Vercel Blob Storage di folder `db-backups/`

### 4. Redeploy
Setelah environment variables di-set:
```bash
# Push perubahan .env.example
git add .
git commit -m "docs: add BLOB_READ_WRITE_TOKEN to env example"
git push origin main
```

Atau **Redeploy manual** di Vercel Dashboard → Deployments → Latest → Redeploy

### Verifikasi
Setelah deploy, tunggu 30 menit lalu cek:
1. **Vercel Logs:** Deployments → Functions → Filter by `/api/cron/auto-backup`
2. **Vercel Blob:** Storage → Blob → Lihat folder `db-backups/`
3. **Jumlah backup:** Harus ada maksimal 48 file (24 jam × 2 backup/jam)

### Troubleshooting
**Jika cron tidak jalan:**
- Pastikan `CRON_SECRET` sudah di-set di **Production** environment
- Check Vercel logs untuk error messages
- Test manual: `curl -X GET https://eksporyuk.com/api/cron/auto-backup -H "Authorization: Bearer 932b763053e9731698cf3d693f1f228c782fc9660e3fc8941cc927c2b5e33a77"`

**Jika backup error:**
- Pastikan `BLOB_READ_WRITE_TOKEN` valid (tidak expired)
- Regenerate token di Vercel Dashboard → Storage jika perlu
