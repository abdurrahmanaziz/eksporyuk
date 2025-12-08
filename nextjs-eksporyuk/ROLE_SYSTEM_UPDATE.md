# 🎭 Role System Update - Multi-Role & Permission System

## ✅ Changes Completed

### 1. **Prisma Schema Updated**
- ❌ Removed `FOUNDER` and `CO_FOUNDER` from Role enum
- ✅ Kept: `ADMIN`, `MENTOR`, `AFFILIATE`, `MEMBER_PREMIUM`, `MEMBER_FREE`
- ✅ Added `isFounder`, `isCoFounder`, `revenueSharePercent` fields to User model
- ✅ Created `UserRole` model for multi-role support
- ✅ Created `UserPermission` model for granular access control

### 2. **Theme System Updated**
- ❌ Removed FOUNDER and CO_FOUNDER themes from `role-themes.ts`
- ✅ Now 5 roles: ADMIN, MENTOR, AFFILIATE, MEMBER_PREMIUM, MEMBER_FREE

### 3. **Authentication Updated**
- ✅ Updated demo users in `auth-options.ts`:
  - `admin@eksporyuk.com` → ADMIN
  - `mentor@eksporyuk.com` → MENTOR (isFounder: true, 60% revenue)
  - `cofounder@eksporyuk.com` → MENTOR (isCoFounder: true, 40% revenue)
  - `affiliate@eksporyuk.com` → AFFILIATE
  - `premium@eksporyuk.com` → MEMBER_PREMIUM
  - `free@eksporyuk.com` → MEMBER_FREE

### 4. **Middleware Updated**
- ❌ Removed `/founder/*` routes
- ✅ Simplified redirects (no founder/co-founder checks)
- ✅ Access control: `/admin/*`, `/mentor/*`, `/affiliate/*`, `/dashboard/*`

### 5. **Sidebar Navigation Updated**
- ❌ Removed FOUNDER and CO_FOUNDER menu sections
- ✅ Clean menu for: ADMIN, MENTOR, AFFILIATE, MEMBERS

### 6. **Folder Structure**
- ❌ Deleted `src/app/(founder)` folder
- ✅ Kept: `(admin)`, `(mentor)`, `(affiliate)`, `(dashboard)`

### 7. **Documentation Updated**
- ✅ Updated `LOGIN_CREDENTIALS.md` with new role structure

---

## 📊 New Database Schema

```prisma
model User {
  // ... existing fields
  role                Role      @default(MEMBER_FREE)  // Primary role
  isFounder           Boolean   @default(false)        // Special flag
  isCoFounder         Boolean   @default(false)        // Special flag
  revenueSharePercent Float?    // 60 or 40 or null
  
  // Relations
  userRoles           UserRole[]       // Can have multiple roles
  permissions         UserPermission[] // Granular permissions
}

model UserRole {
  id        String   @id
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      Role     // ADMIN, MENTOR, AFFILIATE, etc.
  
  @@unique([userId, role])
}

model UserPermission {
  id      String  @id
  userId  String
  user    User    @relation(fields: [userId], references: [id])
  feature String  // "revenue_share", "wallet_access", etc.
  enabled Boolean @default(true)
  value   Json?   // { percentage: 60, tier: "gold" }
  
  @@unique([userId, feature])
}
```

---

## 🚀 Next Steps (TODO)

### Step 1: Apply Database Migration
**Stop dev server dulu**, lalu jalankan:
```powershell
cd 'c:\Users\GIGABTYE AORUS''\Herd\eksporyuk\nextjs-eksporyuk'
npx prisma generate
npx prisma db push
```

### Step 2: Test Login
```
✅ admin@eksporyuk.com / password123 → Redirect ke /admin/dashboard
✅ mentor@eksporyuk.com / password123 → Redirect ke /mentor/dashboard (Founder 60%)
✅ cofounder@eksporyuk.com / password123 → Redirect ke /mentor/dashboard (Co-Founder 40%)
✅ affiliate@eksporyuk.com / password123 → Redirect ke /affiliate/dashboard
✅ premium@eksporyuk.com / password123 → Stay at /dashboard
✅ free@eksporyuk.com / password123 → Stay at /dashboard
```

### Step 3: Build Admin Panel for User Management
Create: `/admin/users` with features:
- ✅ List all users
- ✅ Edit user roles (add MENTOR, AFFILIATE, etc.)
- ✅ Set special permissions (isFounder, isCoFounder)
- ✅ Set revenue share percentage
- ✅ Add custom permissions per feature

### Step 4: Create Permission Helper
```typescript
// src/lib/permissions.ts
export async function hasPermission(userId: string, feature: string) {
  const permission = await prisma.userPermission.findUnique({
    where: { userId_feature: { userId, feature } }
  })
  return permission?.enabled || false
}

export async function getUserRoles(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId }
  })
  return userRoles.map(ur => ur.role)
}
```

---

## 💡 How It Works

### Multi-Role Example:
```typescript
// User "Dinda" bisa punya:
Primary Role: MENTOR
Additional Roles (via UserRole): [AFFILIATE]
Permissions:
  - isFounder: true
  - revenueSharePercent: 60
  - feature: "create_course" → enabled: true
  - feature: "manage_users" → enabled: false
```

### Revenue Split Example:
```typescript
// Transaction: Membership Rp 100.000

1. Affiliate (10%): Rp 10.000
2. Platform fee (15%): Rp 15.000
3. Remaining: Rp 75.000

Split to founders:
- Dinda (isFounder, 60%): Rp 45.000
- Andi (isCoFounder, 40%): Rp 30.000
```

### Admin Sets Permissions:
```typescript
// Admin Panel UI:
┌────────────────────────────────┐
│ Edit User: Dinda              │
├────────────────────────────────┤
│ Primary Role: MENTOR ▼         │
│                                │
│ Additional Roles:              │
│ ☑ Affiliate                   │
│ ☐ Member Premium              │
│                                │
│ Special Flags:                 │
│ ☑ Founder (60% revenue)       │
│ ☐ Co-Founder (40% revenue)    │
│                                │
│ Permissions:                   │
│ ☑ Create courses              │
│ ☑ Manage wallet               │
│ ☐ Manage users                │
└────────────────────────────────┘
```

---

## 🔧 Migration Commands

```powershell
# 1. Stop dev server (Ctrl+C di terminal yang running)

# 2. Generate Prisma client
npx prisma generate

# 3. Push schema to database
npx prisma db push

# 4. Restart dev server
npm run dev
```

---

## ✨ Benefits

1. **Flexible**: User bisa jadi MENTOR + AFFILIATE sekaligus
2. **Scalable**: Mudah tambah role/permission baru
3. **Granular**: Permission per fitur (tidak terikat role)
4. **Admin Control**: Admin bisa assign permission ke siapa saja
5. **Clean Code**: Tidak ada role FOUNDER/CO_FOUNDER yang bikin bingung

---

## 📝 Test Cases

### Test 1: Login as Founder Mentor
```
Email: mentor@eksporyuk.com
Expected: 
- Redirect to /mentor/dashboard
- See purple theme (#7B1FA2)
- Access to course management
- See revenue share: 60%
```

### Test 2: Login as Co-Founder Mentor
```
Email: cofounder@eksporyuk.com
Expected:
- Redirect to /mentor/dashboard  
- See purple theme (#7B1FA2)
- Access to course management
- See revenue share: 40%
```

### Test 3: Login as Regular Mentor
```
Email: (other mentor)
Expected:
- Redirect to /mentor/dashboard
- See purple theme (#7B1FA2)
- Access to course management only
- NO revenue share from platform
- Get 20% commission from own courses
```

---

**Status**: ✅ Code changes completed, waiting for database migration.
**Next**: Stop dev server → Run migration → Test login → Build admin panel
