# Theme Configuration Documentation

## Overview
Sistem theming berbasis peran (role-based theming) untuk memberikan visual identity yang unik untuk setiap peran pengguna di platform Eksporyuk.

## Current Theme Colors

### 1. **FOUNDER** 👑
- **Primary**: #FF6B35 (Orange)
- **Secondary**: #F7931E
- **Accent**: #FBB034
- **Slug**: `founder`
- **Display Name**: Founder Dashboard
- **Use Case**: Platform founder/owner

### 2. **CO_FOUNDER** ⭐
- **Primary**: #FF6B35 (Orange)
- **Secondary**: #F7931E
- **Accent**: #FBB034
- **Slug**: `co-founder`
- **Display Name**: Co-Founder Dashboard
- **Use Case**: Co-founder role

### 3. **ADMIN** ⚙️
- **Primary**: #1E88E5 (Blue)
- **Secondary**: #42A5F5
- **Accent**: #64B5F6
- **Slug**: `admin`
- **Display Name**: Admin Dashboard
- **Use Case**: System administrator

### 4. **MENTOR** 🎓
- **Primary**: #7B1FA2 (Purple)
- **Secondary**: #9C27B0
- **Accent**: #BA68C8
- **Slug**: `mentor`
- **Display Name**: Mentor Dashboard
- **Use Case**: Course instructor/mentor

### 5. **AFFILIATE** 🔗
- **Primary**: #00796B (Teal)
- **Secondary**: #009688
- **Accent**: #26A69A
- **Slug**: `affiliate`
- **Display Name**: Affiliate Dashboard
- **Use Case**: Affiliate marketer/promoter

### 6. **MEMBER_PREMIUM** ⭐
- **Primary**: #F57C00 (Deep Orange)
- **Secondary**: #FB8C00
- **Accent**: #FFB74D
- **Slug**: `member-premium`
- **Display Name**: Premium Member Dashboard
- **Use Case**: Paid member

### 7. **MEMBER_FREE** 👤
- **Primary**: #424242 (Dark Gray)
- **Secondary**: #616161
- **Accent**: #9E9E9E
- **Slug**: `member-free`
- **Display Name**: Free Member Dashboard
- **Use Case**: Free tier member

## Implementation Files

### 1. **src/lib/role-themes.ts**
Central configuration for all role-based themes.

```typescript
import { getRoleTheme } from '@/lib/role-themes'

// Usage
const userRole = session?.user?.role || 'MEMBER_FREE'
const theme = getRoleTheme(userRole)

// Access colors
console.log(theme.primary)    // #FF6B35
console.log(theme.secondary)  // #F7931E
console.log(theme.accent)     // #FBB034
console.log(theme.icon)       // 👑
console.log(theme.slug)       // founder
```

### 2. **Components Using Theme**

#### DashboardSidebar.tsx
- Theme-colored logo header
- Role-specific navigation items
- Theme-colored active states
- User profile with theme-colored avatar

#### DashboardHeader.tsx
- Theme-colored notification bell
- Theme-colored accent for notification badge
- Theme-colored sign-out button
- Theme-colored email text

#### dashboard/page.tsx
- Hero section with theme gradient (primary + secondary)
- Stat cards with theme-colored left borders
- Role-specific dashboard sections
- Theme icons display

## Usage Pattern

### Step 1: Import the function
```typescript
import { getRoleTheme } from '@/lib/role-themes'
```

### Step 2: Get user role from session
```typescript
const { data: session } = useSession()
const userRole = session?.user?.role || 'MEMBER_FREE'
```

### Step 3: Retrieve theme
```typescript
const theme = getRoleTheme(userRole)
```

### Step 4: Apply to styles
```typescript
// Direct style prop
<div style={{ color: theme.primary }}>Text</div>

// With opacity
<div style={{ backgroundColor: theme.primary + '20' }}>Light background</div>

// In className
<div className="font-bold" style={{ color: theme.primary }}>Bold text</div>
```

## Color Opacity Levels

For transparency effects:
- `theme.primary + '08'` = 5% opacity
- `theme.primary + '10'` = 6% opacity
- `theme.primary + '20'` = 13% opacity
- `theme.primary + '40'` = 25% opacity
- `theme.primary + '60'` = 38% opacity
- `theme.primary + '80'` = 50% opacity

## Navigation Structure

### ADMIN (12 items)
Dashboard, Users, Membership, Products, Courses, Groups, Affiliate, Events, Transactions, Analytics, Settings, Reports

### FOUNDER (6 items)
Dashboard, Overview, Earnings, Management, Analytics, Settings

### CO_FOUNDER (6 items)
Dashboard, Overview, Earnings, Management, Analytics, Settings

### MENTOR (8 items)
Dashboard, My Courses, Students, Classes, Schedule, Materials, Earnings, Settings

### AFFILIATE (8 items)
Dashboard, My Links, Statistics, Performance, Challenges, Earnings, Payouts, Settings

### MEMBER_PREMIUM (5 items)
Dashboard, My Courses, Groups, Wishlist, Profile

### MEMBER_FREE (4 items)
Dashboard, Explore, Groups, Profile

## Database Integration (Future)

To allow custom color selection per role, create a Theme table:

```prisma
model Theme {
  id        String @id @default(cuid())
  role      String @unique
  primary   String
  secondary String
  accent    String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then update `getRoleTheme()` to fetch from database:

```typescript
export async function getRoleTheme(role: string): Promise<ThemeConfig> {
  const customTheme = await prisma.theme.findUnique({
    where: { role }
  })
  
  if (customTheme) {
    return {
      primary: customTheme.primary,
      secondary: customTheme.secondary,
      accent: customTheme.accent,
      // ... other fields
    }
  }
  
  return roleThemes[role] || roleThemes.MEMBER_FREE
}
```

## Best Practices

1. **Always provide fallback**: `session?.user?.role || 'MEMBER_FREE'`
2. **Use semantic color names**: `theme.primary` for main actions, `theme.accent` for highlights
3. **Maintain contrast**: Ensure text readability (WCAG AA compliance)
4. **Test with all roles**: Verify design with each role's theme color
5. **Consistent spacing**: Keep theme application consistent across components

## Future Enhancements

- [ ] Admin settings page for theme customization
- [ ] Theme preview component showing all colors
- [ ] Custom color selection UI for admin
- [ ] Theme export/import functionality
- [ ] Dark mode support per theme
- [ ] Animation timing customization per theme
- [ ] Font selection per role (optional)
