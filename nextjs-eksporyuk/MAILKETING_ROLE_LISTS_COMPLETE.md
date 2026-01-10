# Mailketing Role Lists - Feature Complete ✅

## Overview
Fitur untuk menambahkan user ke Mailketing list secara otomatis berdasarkan role mereka.

## Flow Utama

### 1. Admin Setup Role → List Mapping
- Akses: `/admin/mailketing/lists/role-settings`
- Admin pilih role (MEMBER_FREE, MEMBER_PREMIUM, AFFILIATE, dll)
- Admin pilih Mailketing list yang akan di-assign ke role tersebut
- Admin toggle opsi:
  - `autoAddOnRegister`: Auto-add saat user register
  - `autoAddOnUpgrade`: Auto-add saat user upgrade ke role ini

### 2. Auto-Add User ke List
Terjadi di beberapa titik:

**A. Saat Registrasi Baru**
- File: `/api/auth/register/route.ts`
- User baru dengan role `MEMBER_FREE` otomatis ditambahkan ke list yang di-setup untuk MEMBER_FREE
- Kondisi: `autoAddOnRegister = true`

**B. Saat Upgrade ke MEMBER_PREMIUM**
- File: `/api/webhooks/xendit/route.ts`
- Setelah payment success dan role berubah dari MEMBER_FREE → MEMBER_PREMIUM
- User ditambahkan ke list untuk role MEMBER_PREMIUM
- Kondisi: `autoAddOnUpgrade = true`

**C. Saat Jadi Affiliate**
- File: `/api/admin/affiliates/[id]/approve/route.ts` (manual approve)
- File: `/api/affiliate/apply/route.ts` (auto approve)
- User ditambahkan ke list untuk role AFFILIATE

## Database Schema

```prisma
model RoleMailketingList {
  id                  String   @id @default(cuid())
  role                Role     
  mailketingListId    String   
  mailketingListName  String   
  isActive            Boolean  @default(true)
  autoAddOnRegister   Boolean  @default(true)  // Add when user registers
  autoAddOnUpgrade    Boolean  @default(true)  // Add when user upgrades to this role
  description         String?  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([role, mailketingListId])
  @@index([role])
}
```

## API Endpoints

### GET /api/admin/mailketing/role-lists
Response:
```json
{
  "success": true,
  "data": {
    "MEMBER_FREE": {
      "role": "MEMBER_FREE",
      "userCount": 150,
      "lists": [
        {
          "id": "cuid...",
          "mailketingListId": "123",
          "mailketingListName": "Free Member List",
          "isActive": true,
          "autoAddOnRegister": true,
          "autoAddOnUpgrade": false
        }
      ]
    },
    ...
  }
}
```

### POST /api/admin/mailketing/role-lists
Body:
```json
{
  "role": "MEMBER_FREE",
  "mailketingListId": "123",
  "mailketingListName": "Free Member List",
  "autoAddOnRegister": true,
  "autoAddOnUpgrade": false,
  "description": "List untuk member gratis"
}
```

### DELETE /api/admin/mailketing/role-lists?id=xxx
Hapus mapping role → list

### PATCH /api/admin/mailketing/role-lists
Body:
```json
{
  "id": "cuid...",
  "isActive": true,
  "autoAddOnRegister": true,
  "autoAddOnUpgrade": true
}
```

### POST /api/admin/mailketing/sync-users
Sync existing users ke lists:
```json
{
  "action": "sync-all" | "sync-role" | "sync-user",
  "role": "MEMBER_FREE",  // untuk sync-role
  "userId": "xxx"         // untuk sync-user
}
```

## Service Functions

File: `/src/lib/services/mailketing-list-service.ts`

### addUserToRoleLists(userId, role, options)
- Add user ke semua list yang di-setup untuk role tersebut
- Options: `{ isRegistration?: boolean, isUpgrade?: boolean }`

### removeUserFromRoleLists(userId, role)
- Remove user dari semua list role tersebut

### handleRoleChange(userId, newRole, oldRole, options)
- Utility untuk handle role change
- Bisa remove dari old role lists jika `removeFromOldRoleLists: true`

### syncAllUsersToLists()
- Admin utility untuk sync semua user ke lists

## UI Components

### Role Settings Page
Path: `/admin/mailketing/lists/role-settings`

Features:
- Cards per role (MEMBER_FREE, MEMBER_PREMIUM, AFFILIATE, dll)
- Menampilkan jumlah user per role
- List yang di-assign ke role
- Add/Remove list dari role
- Toggle autoAddOnRegister / autoAddOnUpgrade
- Sync buttons (per role atau semua)

### Integration with Mailketing Lists Page
Path: `/admin/mailketing/lists`
- Tombol "Role Settings" untuk akses ke halaman role mapping

## Testing

### Test 1: New User Registration
1. Setup MEMBER_FREE → List "New Members"
2. Register user baru
3. Cek Mailketing apakah email ditambahkan ke list

### Test 2: Premium Upgrade
1. Setup MEMBER_PREMIUM → List "Premium Members"
2. User beli membership via Xendit
3. Cek role berubah ke MEMBER_PREMIUM
4. Cek Mailketing apakah email ditambahkan

### Test 3: Affiliate Approval
1. Setup AFFILIATE → List "Affiliates"
2. Approve affiliate application
3. Cek role berubah ke AFFILIATE
4. Cek Mailketing apakah email ditambahkan

### Test 4: Sync Existing Users
1. Buka `/admin/mailketing/lists/role-settings`
2. Klik "Sync" pada role tertentu
3. Cek semua user dengan role tersebut ditambahkan ke list

## Files Modified

1. `prisma/schema.prisma` - Added RoleMailketingList model
2. `src/app/api/admin/mailketing/role-lists/route.ts` - New
3. `src/app/api/admin/mailketing/sync-users/route.ts` - New
4. `src/lib/services/mailketing-list-service.ts` - New
5. `src/app/(dashboard)/admin/mailketing/lists/role-settings/page.tsx` - New
6. `src/app/(dashboard)/admin/mailketing/lists/page.tsx` - Added Role Settings button
7. `src/app/api/auth/register/route.ts` - Added hook
8. `src/app/api/webhooks/xendit/route.ts` - Added hooks (4 places)
9. `src/app/api/admin/affiliates/[id]/approve/route.ts` - Added hook
10. `src/app/api/affiliate/apply/route.ts` - Added hook

## Deployment Notes

1. Run `npx prisma db push` to create RoleMailketingList table
2. Run `npx prisma generate` to update client
3. Build & deploy
4. Setup role → list mappings via admin UI

---

**Status**: ✅ Complete  
**Date**: January 2026  
**Build**: Passed
