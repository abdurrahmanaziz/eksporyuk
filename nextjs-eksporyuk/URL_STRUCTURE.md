# URL Structure - Eksporyuk Platform

## Struktur URL Profesional Berdasarkan Role

### 🏗️ Arsitektur URL

```
eksporyuk.com/
├── /                          → Landing page (public)
├── /login                     → Login page (public)
├── /register                  → Register page (public)
│
├── /admin/*                   → Admin panel (ADMIN only)
│   ├── /admin/dashboard       → Admin dashboard
│   ├── /admin/users           → User management
│   ├── /admin/membership      → Membership plans
│   ├── /admin/products        → Product management
│   ├── /admin/courses         → Course management
│   ├── /admin/groups          → Group management
│   ├── /admin/events          → Event management
│   ├── /admin/affiliates      → Affiliate program
│   ├── /admin/coupons         → Coupon management
│   ├── /admin/transactions    → Transaction history
│   ├── /admin/analytics       → Analytics & reports
│   └── /admin/settings        → System settings
│
├── /founder/*                 → Founder panel (FOUNDER & CO_FOUNDER)
│   ├── /founder/dashboard     → Founder dashboard
│   ├── /founder/analytics     → Business analytics
│   ├── /founder/revenue       → Revenue overview
│   ├── /founder/users         → User overview
│   ├── /founder/membership    → Membership overview
│   ├── /founder/products      → Product overview
│   ├── /founder/earnings      → Earnings & payouts
│   ├── /founder/transactions  → Financial transactions
│   ├── /founder/reports       → Business reports
│   └── /founder/settings      → Founder settings
│
├── /mentor/*                  → Mentor workspace (MENTOR only)
│   ├── /mentor/dashboard      → Mentor dashboard
│   ├── /mentor/courses        → My courses
│   ├── /mentor/students       → Student list
│   ├── /mentor/classes        → Class schedule
│   ├── /mentor/materials      → Course materials
│   ├── /mentor/assignments    → Assignments
│   ├── /mentor/products       → My products
│   ├── /mentor/earnings       → Earnings
│   ├── /mentor/analytics      → Performance analytics
│   └── /mentor/profile        → Profile settings
│
├── /affiliate/*               → Affiliate portal (AFFILIATE only)
│   ├── /affiliate/dashboard   → Affiliate dashboard
│   ├── /affiliate/links       → My affiliate links
│   ├── /affiliate/performance → Performance metrics
│   ├── /affiliate/statistics  → Detailed statistics
│   ├── /affiliate/conversions → Conversion tracking
│   ├── /affiliate/materials   → Marketing materials
│   ├── /affiliate/challenges  → Affiliate challenges
│   ├── /affiliate/earnings    → Earnings overview
│   ├── /affiliate/payouts     → Payout history
│   └── /affiliate/profile     → Profile settings
│
└── /dashboard/*               → Member area (MEMBER_PREMIUM & MEMBER_FREE)
    ├── /dashboard             → Member dashboard
    ├── /dashboard/courses     → My courses
    ├── /dashboard/progress    → Learning progress
    ├── /dashboard/groups      → Community groups
    ├── /dashboard/feed        → Social feed
    ├── /dashboard/events      → Upcoming events
    ├── /dashboard/perks       → Premium perks (PREMIUM only)
    ├── /dashboard/resources   → Resources
    ├── /dashboard/wishlist    → Wishlist
    ├── /dashboard/upgrade     → Upgrade to Premium (FREE only)
    └── /dashboard/profile     → Profile settings
```

## 🔒 Access Control & Middleware

### Role-Based Redirects

**Automatic redirects saat akses `/dashboard`:**

| Role | Redirect To |
|------|-------------|
| ADMIN | `/admin/dashboard` |
| FOUNDER | `/founder/dashboard` |
| CO_FOUNDER | `/founder/dashboard` |
| MENTOR | `/mentor/dashboard` |
| AFFILIATE | `/affiliate/dashboard` |
| MEMBER_PREMIUM | `/dashboard` (stay) |
| MEMBER_FREE | `/dashboard` (stay) |

### Route Protection

- ✅ **Admin routes** (`/admin/*`) → Only ADMIN
- ✅ **Founder routes** (`/founder/*`) → FOUNDER & CO_FOUNDER only
- ✅ **Mentor routes** (`/mentor/*`) → Only MENTOR
- ✅ **Affiliate routes** (`/affiliate/*`) → Only AFFILIATE
- ✅ **Member routes** (`/dashboard/*`) → All authenticated users
- ❌ **Unauthorized access** → Redirect to appropriate dashboard

## 📱 Benefits

### 1. **Security**
- Clear separation per role
- Easy to implement middleware protection
- Prevents unauthorized access

### 2. **SEO**
- Semantic URLs yang jelas
- Better for search engine indexing
- Professional URL structure

### 3. **User Experience**
- Role-specific workspace yang jelas
- Tidak membingungkan user
- Consistent navigation

### 4. **Development**
- Easy to maintain
- Clear file structure
- Role-specific features isolation

### 5. **Scalability**
- Easy to add new roles
- Clear permission boundaries
- Independent route development

## 🛠️ Implementation

### Folder Structure

```
src/app/
├── (admin)/
│   ├── layout.tsx
│   └── admin/
│       └── dashboard/
│           └── page.tsx
│
├── (founder)/
│   ├── layout.tsx
│   └── founder/
│       └── dashboard/
│           └── page.tsx
│
├── (mentor)/
│   ├── layout.tsx
│   └── mentor/
│       └── dashboard/
│           └── page.tsx
│
├── (affiliate)/
│   ├── layout.tsx
│   └── affiliate/
│       └── dashboard/
│           └── page.tsx
│
└── (dashboard)/
    ├── layout.tsx
    └── dashboard/
        └── page.tsx
```

### Middleware (src/middleware.ts)

```typescript
// Automatic redirect based on role
// Role-based access control
// Unauthorized access handling
```

### Navigation (DashboardSidebar)

```typescript
// Role-specific menu items
// Dynamic route generation
// Theme per role
```

## 🎨 Example URLs

### Admin
- `eksporyuk.com/admin/dashboard`
- `eksporyuk.com/admin/users?page=1&search=john`
- `eksporyuk.com/admin/products/edit/123`

### Founder
- `eksporyuk.com/founder/dashboard`
- `eksporyuk.com/founder/analytics?period=30d`
- `eksporyuk.com/founder/revenue?year=2025`

### Mentor
- `eksporyuk.com/mentor/dashboard`
- `eksporyuk.com/mentor/courses/my-course-slug`
- `eksporyuk.com/mentor/students/123`

### Affiliate
- `eksporyuk.com/affiliate/dashboard`
- `eksporyuk.com/affiliate/links?status=active`
- `eksporyuk.com/affiliate/earnings?month=11`

### Member
- `eksporyuk.com/dashboard`
- `eksporyuk.com/dashboard/courses/course-slug`
- `eksporyuk.com/dashboard/groups/group-id`

## 🔐 Security Best Practices

1. **Always check user role** di middleware
2. **Validate permissions** di setiap API endpoint
3. **Use server-side checks** untuk data access
4. **Log unauthorized attempts** untuk monitoring
5. **Implement rate limiting** untuk protection

## 📝 Migration Notes

Jika ada user yang bookmark `/dashboard`:
- Middleware akan auto-redirect ke URL yang sesuai
- Session tetap valid
- Seamless transition untuk user
