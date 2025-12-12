# Branding & Dashboard Theme Integration - Complete Documentation

## ✅ Status: FULLY INTEGRATED

Sistem branding dan dashboard theme telah terintegrasi sempurna dengan database.

---

## 📋 Overview

Admin dapat mengubah warna dashboard melalui halaman `/admin/settings/branding`. Perubahan warna akan tersimpan di database dan langsung diterapkan ke sidebar serta komponen dashboard lainnya.

---

## 🗄️ Database Schema

Prisma schema (`prisma/schema.prisma`) telah ditambahkan 19 field untuk dashboard theme:

```prisma
model Settings {
  // ... existing fields ...
  
  // Dashboard Theme Colors
  dashboardSidebarBg        String?  @default("#1e293b")
  dashboardSidebarText      String?  @default("#e2e8f0")
  dashboardSidebarActiveText String? @default("#ffffff")
  dashboardSidebarActiveBg  String?  @default("#3b82f6")
  dashboardSidebarHoverBg   String?  @default("#334155")
  dashboardHeaderBg         String?  @default("#ffffff")
  dashboardHeaderText       String?  @default("#1f2937")
  dashboardBodyBg           String?  @default("#f1f5f9")
  dashboardCardBg           String?  @default("#ffffff")
  dashboardCardBorder       String?  @default("#e2e8f0")
  dashboardCardHeaderBg     String?  @default("#f8fafc")
  dashboardTextPrimary      String?  @default("#1f2937")
  dashboardTextSecondary    String?  @default("#64748b")
  dashboardTextMuted        String?  @default("#94a3b8")
  dashboardBorderColor      String?  @default("#e2e8f0")
  dashboardSuccessColor     String?  @default("#22c55e")
  dashboardWarningColor     String?  @default("#f59e0b")
  dashboardDangerColor      String?  @default("#ef4444")
  dashboardInfoColor        String?  @default("#3b82f6")
}
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BRANDING SETTINGS FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. Admin Page                                                             │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │  /admin/settings/branding                                     │        │
│   │  ├─ Color Pickers for Dashboard Theme                         │        │
│   │  └─ Klik "Simpan" → POST /api/admin/settings                  │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                              │                                              │
│                              ▼                                              │
│   2. API Layer                                                             │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │  /api/admin/settings (POST)                                   │        │
│   │  ├─ Validates admin role                                      │        │
│   │  ├─ Extracts all 19 dashboard color fields                    │        │
│   │  └─ prisma.settings.upsert()                                  │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                              │                                              │
│                              ▼                                              │
│   3. Database (SQLite/PostgreSQL)                                          │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │  Settings table                                               │        │
│   │  └─ id: 1 (singleton record)                                  │        │
│   │     ├─ dashboardSidebarBg: "#1e293b"                         │        │
│   │     ├─ dashboardSidebarText: "#e2e8f0"                       │        │
│   │     └─ ... (17 more fields)                                   │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                              │                                              │
│                              ▼                                              │
│   4. Settings Provider                                                      │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │  SettingsProvider.tsx                                         │        │
│   │  ├─ Fetches GET /api/settings                                 │        │
│   │  ├─ Sets CSS variables on document.documentElement            │        │
│   │  │   --dashboard-sidebar-bg: #1e293b                          │        │
│   │  │   --dashboard-sidebar-text: #e2e8f0                        │        │
│   │  │   ... (17 more CSS vars)                                   │        │
│   │  └─ Provides settings via useSettings() hook                  │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                              │                                              │
│                              ▼                                              │
│   5. Components                                                             │
│   ┌───────────────────────────────────────────────────────────────┐        │
│   │  DashboardSidebar.tsx                                         │        │
│   │  ├─ const { settings } = useSettings()                        │        │
│   │  ├─ dashboardTheme = {                                        │        │
│   │  │     sidebarBg: settings.dashboardSidebarBg || '#1e293b',  │        │
│   │  │     sidebarText: settings.dashboardSidebarText || '...',  │        │
│   │  │     ...                                                    │        │
│   │  │   }                                                        │        │
│   │  └─ style={{ backgroundColor: dashboardTheme.sidebarBg }}     │        │
│   └───────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Files Modified

### 1. Schema
- `prisma/schema.prisma` - Added 19 dashboard color fields

### 2. API Routes
- `/src/app/api/admin/settings/route.ts` - POST handler for saving settings
- `/src/app/api/settings/route.ts` - GET handler for fetching settings (public)

### 3. Providers
- `/src/components/providers/SettingsProvider.tsx` - Context provider with CSS variables

### 4. Components
- `/src/components/layout/DashboardSidebar.tsx` - Uses settings with fallbacks
- `/src/app/(dashboard)/admin/settings/branding/page.tsx` - Admin UI for editing colors

---

## 🎨 Dashboard Theme Color Categories

### Sidebar Colors
| Field | Default | Description |
|-------|---------|-------------|
| `dashboardSidebarBg` | `#1e293b` | Sidebar background color |
| `dashboardSidebarText` | `#e2e8f0` | Sidebar text color |
| `dashboardSidebarActiveText` | `#ffffff` | Active menu item text |
| `dashboardSidebarActiveBg` | `#3b82f6` | Active menu item background |
| `dashboardSidebarHoverBg` | `#334155` | Menu item hover background |

### Header & Body Colors
| Field | Default | Description |
|-------|---------|-------------|
| `dashboardHeaderBg` | `#ffffff` | Header background |
| `dashboardHeaderText` | `#1f2937` | Header text color |
| `dashboardBodyBg` | `#f1f5f9` | Main content area background |

### Card Colors
| Field | Default | Description |
|-------|---------|-------------|
| `dashboardCardBg` | `#ffffff` | Card background |
| `dashboardCardBorder` | `#e2e8f0` | Card border color |
| `dashboardCardHeaderBg` | `#f8fafc` | Card header background |

### Text Colors
| Field | Default | Description |
|-------|---------|-------------|
| `dashboardTextPrimary` | `#1f2937` | Primary text color |
| `dashboardTextSecondary` | `#64748b` | Secondary text color |
| `dashboardTextMuted` | `#94a3b8` | Muted/disabled text |
| `dashboardBorderColor` | `#e2e8f0` | General border color |

### Status Colors
| Field | Default | Description |
|-------|---------|-------------|
| `dashboardSuccessColor` | `#22c55e` | Success/positive states |
| `dashboardWarningColor` | `#f59e0b` | Warning states |
| `dashboardDangerColor` | `#ef4444` | Error/danger states |
| `dashboardInfoColor` | `#3b82f6` | Information states |

---

## 🛠️ Usage Example

### In Components

```tsx
import { useSettings } from '@/components/providers/SettingsProvider'

function MyComponent() {
  const { settings } = useSettings()
  
  // Use with fallbacks
  const theme = {
    bg: settings.dashboardCardBg || '#ffffff',
    text: settings.dashboardTextPrimary || '#1f2937',
  }
  
  return (
    <div style={{ 
      backgroundColor: theme.bg, 
      color: theme.text 
    }}>
      Content
    </div>
  )
}
```

### Via CSS Variables

```css
.my-component {
  background-color: var(--dashboard-card-bg);
  color: var(--dashboard-text-primary);
  border: 1px solid var(--dashboard-border-color);
}
```

---

## ✅ Verification Checklist

- [x] Schema updated with 19 dashboard color fields
- [x] Database synced (`npx prisma db push`)
- [x] Admin API `/api/admin/settings` handles all fields
- [x] Public API `/api/settings` returns all fields
- [x] SettingsProvider fetches and provides settings
- [x] SettingsProvider sets CSS variables
- [x] DashboardSidebar uses settings with fallbacks
- [x] Branding page has UI for all dashboard colors
- [x] Save functionality works (POST to API)
- [x] Auto-refresh after save

---

## 🧪 Testing

Run the test script to verify integration:

```bash
cd nextjs-eksporyuk
node test-branding-integration.js
```

---

## 📝 How to Use

1. Login as Admin
2. Navigate to **Settings > Branding** (`/admin/settings/branding`)
3. Scroll down to **"Warna Dashboard"** section
4. Modify colors using the color pickers or input hex values
5. Click **"Simpan Perubahan"**
6. Page will auto-refresh and new colors will be applied

---

## 🔧 Troubleshooting

### Sidebar colors not showing?
- Clear browser cache
- Check if settings.dashboardSidebarBg exists in database
- Verify SettingsProvider is wrapping the app

### Changes not persisting?
- Check browser console for API errors
- Verify admin role in session
- Check `/api/admin/settings` response

### Colors reset after refresh?
- Ensure database connection is working
- Check if Settings record exists (id: 1)
- Run `npx prisma db push` if schema changed

---

## 📅 Last Updated
December 2025 - Full integration completed
