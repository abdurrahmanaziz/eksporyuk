# Tutor LMS Import (DB Sejoli)

Script ini import **Course / CourseModule / CourseLesson** langsung dari database WordPress Sejoli (Tutor LMS).

## Prasyarat

- File env tersedia: `nextjs-eksporyuk/.env.sejoli`
- Dependency sudah terinstall (repo ini sudah punya `mysql2` + Prisma)

## 1) Buka SSH tunnel ke server Sejoli

Direkomendasikan pakai script tunnel (non-interaktif):

```bash
cd nextjs-eksporyuk
nohup node scripts/open-sejoli-tunnel.js > .sejoli-tunnel.log 2>&1 &
```

Cek tunnel listening:

```bash
lsof -nP -iTCP:3307 -sTCP:LISTEN
```

## 2) Jalankan import Tutor LMS

Pakai host localhost (agar lewat tunnel), port tetap mengikuti `SEJOLI_DB_PORT` dari `.env.sejoli` (default `3307`).

```bash
cd nextjs-eksporyuk
SEJOLI_DB_HOST=127.0.0.1 node scripts/import-tutor-lms-sejoli-db.js
```

Catatan:
- Script ini **idempotent** (bisa di-run ulang) karena memakai ID deterministik:
  - `tutor_course_{wpId}`
  - `tutor_topic_{wpId}`
  - `tutor_lesson_{wpId}`

## 3) Stop tunnel (opsional)

```bash
pkill -f "ssh .*3307:127.0.0.1:3306" || true
pkill -f "open-sejoli-tunnel.js" || true
```
