# Admin Branding Settings - Complete Implementation

## Overview
Database-backed branding management system with live preview for Ekspor Yuk platform.

## Features Implemented

### 1. **Branding Settings Page** (`/admin/settings/branding`)
Located: `src/app/(dashboard)/admin/settings/branding/page.tsx`

**Features:**
- ✅ Brand color management (Primary, Secondary, Accent)
- ✅ Button color customization (Primary, Secondary, Success, Danger)
- ✅ Button text color configuration
- ✅ Border radius selector (Square to Pill)
- ✅ Live preview sidebar
- ✅ Reset to Ekspor Yuk defaults button
- ✅ Auto-refresh after save

**Default Colors (Ekspor Yuk Brand):**
```javascript
{
  primaryColor: '#0066CC',      // Main brand blue
  secondaryColor: '#0052CC',    // Darker blue for hover
  accentColor: '#3399FF',       // Light blue for highlights
  buttonPrimaryBg: '#0066CC',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#6B7280',
  buttonSecondaryText: '#FFFFFF',
  buttonSuccessBg: '#10B981',
  buttonSuccessText: '#FFFFFF',
  buttonDangerBg: '#EF4444',
  buttonDangerText: '#FFFFFF',
  buttonBorderRadius: '0.5rem',
}
```

### 2. **Settings Navigation Component**
Located: `src/components/admin/SettingsNav.tsx`

**Tabs:**
1. **Umum** - Info website, logo, sosmed (`/admin/settings`)
2. **Branding** - Warna brand & tombol (`/admin/settings/branding`)
3. **Pembayaran** - Xendit, bank accounts (`/admin/settings/payment`)
4. **Penarikan** - Komisi & withdrawal (`/admin/settings/withdrawal`)
5. **Affiliate** - Komisi & approval (`/admin/settings/affiliate`)
6. **Follow Up** - Template WhatsApp (`/admin/settings/followup`)
7. **Kursus** - Sertifikat & akses (`/admin/settings/course`)
8. **Platform** - Fitur & integrasi (`/admin/settings/platform`)

### 3. **Database Schema Updates**
Located: `prisma/schema.prisma`

**Added/Updated Fields in Settings Model:**
```prisma
primaryColor      String?  @default("#0066CC")
secondaryColor    String?  @default("#0052CC")
accentColor       String?  @default("#3399FF")  // NEW FIELD
buttonPrimaryBg   String?  @default("#0066CC")  // Updated default
// ... existing button color fields
```

## Usage

### Accessing Branding Settings
1. Login as ADMIN
2. Go to `/admin/settings`
3. Click "Branding" tab
4. Adjust colors using color pickers or hex input
5. Preview changes in real-time on right sidebar
6. Click "Simpan Perubahan" to save
7. Page auto-refreshes to apply changes

### Reset to Defaults
Click "Reset ke Default" button to restore Ekspor Yuk brand colors.

### API Endpoints Used
- **GET** `/api/admin/settings` - Fetch current settings
- **POST** `/api/admin/settings` - Save branding changes

## Live Preview Features

### Brand Colors Preview
Shows color swatches for Primary, Secondary, and Accent colors.

### Buttons Preview
Renders actual buttons with:
- Primary Button (full width)
- Secondary Button (full width)
- Success Button (half width)
- Danger Button (half width)

### Gradient Sample
Displays gradient using Primary → Accent color combination.

## Technical Implementation

### Color Picker Component
```tsx
<input
  type="color"
  value={settings.primaryColor}
  onChange={(e) => updateSetting('primaryColor', e.target.value)}
  className="w-full h-20 border-2 border-gray-300 rounded-xl cursor-pointer"
/>
```

### Hex Input with Live Update
```tsx
<input
  type="text"
  value={settings.primaryColor}
  onChange={(e) => updateSetting('primaryColor', e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
  placeholder="#0066CC"
/>
```

### Save with Auto-Refresh
```typescript
const handleSave = async () => {
  const response = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  
  if (data.success) {
    toast.success('Pengaturan branding berhasil disimpan!')
    setTimeout(() => window.location.reload(), 1000)
  }
}
```

## Integration with Existing System

### Role-Based Theme Application
The branding colors integrate with existing role-themes system:
```typescript
import { getRoleTheme } from '@/lib/role-themes'

const theme = getRoleTheme(session?.user?.role || 'ADMIN')
// Uses saved colors from database Settings
```

### CSS Variables (Future Enhancement)
To apply colors globally without refresh, add to `globals.css`:
```css
:root {
  --color-primary: var(--db-primary, #0066CC);
  --color-secondary: var(--db-secondary, #0052CC);
  --color-accent: var(--db-accent, #3399FF);
}
```

## Files Modified/Created

### Created:
1. `src/app/(dashboard)/admin/settings/branding/page.tsx` (561 lines)
2. `src/components/admin/SettingsNav.tsx` (91 lines)

### Modified:
1. `prisma/schema.prisma` - Added `accentColor`, updated defaults
2. `src/app/(dashboard)/admin/settings/page.tsx` - Added SettingsNav component

## Testing Checklist

- [x] Color picker updates hex input
- [x] Hex input updates color picker
- [x] Live preview updates in real-time
- [x] Save button stores to database
- [x] Reset button restores Ekspor Yuk defaults
- [x] Settings navigation highlights active tab
- [x] All tabs are accessible
- [x] Mobile responsive design
- [x] Schema migration successful
- [x] No TypeScript errors

## Database Migration

```bash
cd nextjs-eksporyuk
npx prisma db push --schema=./prisma/schema.prisma
npx prisma generate
```

## Git Commit

```
✨ Add database-backed branding settings with tabbed interface

- Update Prisma schema: primaryColor default to #0066CC
- Add accentColor field to Settings model  
- Create new /admin/settings/branding page with live preview
- Features: brand colors, button customization, live preview, reset
```

## Future Enhancements

1. **Live CSS Variable Injection** - Apply colors without page refresh
2. **Color Palette Presets** - Save and load color schemes
3. **Theme Export/Import** - Share branding configs
4. **Advanced Gradient Builder** - Custom gradient configurations
5. **Typography Settings** - Font family and size management
6. **Dark Mode Support** - Automatic color inversion

## Support

For issues or questions:
- Check `/admin/settings/branding` page UI
- Review Prisma schema for field names
- Verify Settings model has all color fields
- Test with default Ekspor Yuk colors first

---

**Status:** ✅ Complete and Production Ready
**Version:** 1.0.0
**Last Updated:** December 2024
**Commit:** d2ce3d0
