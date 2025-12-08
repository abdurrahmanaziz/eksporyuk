# User Free Onboarding System

## Overview
Sistem onboarding untuk user free dengan flow:
1. **Wajib Lengkapi Profil** - Modal tidak bisa ditutup sampai profil lengkap
2. **Popup Upgrade** - Muncul setelah profil lengkap
3. **Feature Lock** - Semua fitur premium dikunci dengan overlay upgrade
4. **Email Reminder 3 Hari** - Reminder otomatis untuk upgrade

## Components Created

### 1. ProfileCompletionModal
**File:** `/src/components/member/ProfileCompletionModal.tsx`

Modal yang muncul untuk user yang belum melengkapi profil:
- Tidak bisa ditutup (tidak ada tombol close)
- Field wajib: Nama & WhatsApp
- Field opsional: Lokasi, Bio
- Progress bar menunjukkan persentase kelengkapan

### 2. UpgradeModal
**File:** `/src/components/member/UpgradeModal.tsx`

Modal upgrade membership:
- Muncul setelah profil lengkap
- Menampilkan semua paket membership dari API
- Bisa di-dismiss (disimpan di localStorage 24 jam)
- Pilihan "Ingatkan Nanti" atau "Pilih Paket"

### 3. Profile Status API
**File:** `/src/app/api/member/profile-status/route.ts`

Endpoint untuk cek status kelengkapan profil:
```
GET /api/member/profile-status

Response:
{
  success: true,
  data: {
    isComplete: boolean,
    profileCompletedAt: Date | null,
    missingFields: string[],
    missingRequired: string[],
    progress: number
  }
}
```

### 4. Upgrade Reminder Cron Job
**File:** `/src/app/api/cron/upgrade-reminders/route.ts`

Endpoint untuk mengirim email reminder:
```
GET /api/cron/upgrade-reminders
Authorization: Bearer <CRON_SECRET>

Response:
{
  success: true,
  results: {
    total: number,
    sent: number,
    failed: number,
    details: [...]
  }
}
```

## Database Schema Changes

Field baru di model User:
```prisma
profileCompletedAt      DateTime?
upgradeReminderCount    Int       @default(0)
lastUpgradeReminderAt   DateTime?
```

## Email Reminder Flow

| Day | Subject | Tone |
|-----|---------|------|
| 1 | Langkah Selanjutnya: Pilih Paket Membership | Informative, highlight benefits |
| 2 | Jangan Lewatkan! Fitur Premium Menanti | Benefit-focused |
| 3 | Terakhir Hari Ini: Mulai Perjalanan Ekspor Anda! | Urgency, FOMO |

Setelah 3 hari, tidak ada email lagi sampai user mengambil action.

## Setup Cron Job

### Option 1: Vercel Cron
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/upgrade-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### Option 2: External Cron Service (cron-job.org, easycron, etc.)
1. Set `CRON_SECRET` in environment variables
2. Configure service to call:
   - URL: `https://your-domain.com/api/cron/upgrade-reminders`
   - Method: GET
   - Header: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Daily at 9:00 AM (0 9 * * *)

### Option 3: Railway/Render Cron
Use their built-in cron configuration with similar settings.

## Environment Variables

```env
# Cron job security
CRON_SECRET=your-secure-random-string

# Email service
MAILKETING_API_KEY=your-api-key

# App URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Testing

### Test Profile Modal
1. Login sebagai user free
2. Clear localStorage: `localStorage.removeItem('profileCompleted')`
3. Refresh dashboard - modal harus muncul

### Test Upgrade Modal
1. Lengkapi profil
2. Clear localStorage: `localStorage.removeItem('upgradeModalDismissed')`
3. Refresh dashboard - modal upgrade harus muncul

### Test Cron Manual
```bash
curl -X GET "http://localhost:3000/api/cron/upgrade-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## User Flow Diagram

```
┌─────────────────┐
│  User Register  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Login Dashboard │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Profile Complete Modal  │
│ (Cannot be dismissed)   │
└────────┬────────────────┘
         │ Complete Profile
         ▼
┌─────────────────────────┐
│    Upgrade Modal        │
│ (Can dismiss for 24hr)  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌─────────────┐
│Upgrade│  │Continue Free│
└───────┘  └──────┬──────┘
                  │
                  ▼
           ┌──────────────┐
           │ Feature Lock │
           │  on Premium  │
           │   Features   │
           └──────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │   Daily Email Reminder      │
    │   (Day 1, 2, 3 then stop)   │
    └─────────────────────────────┘
```

## Files Modified

1. `/src/app/(dashboard)/dashboard/page.tsx` - Added modal imports and flow
2. `/prisma/schema.prisma` - Added new User fields

## Files Created

1. `/src/components/member/ProfileCompletionModal.tsx`
2. `/src/components/member/UpgradeModal.tsx`
3. `/src/app/api/member/profile-status/route.ts`
4. `/src/app/api/cron/upgrade-reminders/route.ts`
