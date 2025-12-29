# Unified Settings Navigation Guide

## 📍 How to Access the New Consolidated Settings

### For Users
```
1. Login to affiliate account
2. Go to: /affiliate/settings
3. Click tabs to navigate:
   - Umum (General) - Profile & Bank
   - Penarikan Dana (Withdrawal) - Withdrawal config
   - Program Affiliate (Affiliate) - Affiliate config
   - Follow-Up - Lead follow-up
```

### For Developers

#### Main Settings Page
**File**: `/src/app/(affiliate)/affiliate/settings/page.tsx`
**Route**: `/affiliate/settings`
**Purpose**: Profile settings (name, contact, address, bank account)
**Access**: All authenticated users

#### Withdrawal Settings Sub-page
**File**: `/src/app/(affiliate)/affiliate/settings/withdrawal/page.tsx`
**Route**: `/affiliate/settings/withdrawal`
**Purpose**: Withdrawal configuration (min amount, fee, PIN)
**Access**: All users (read-only for non-admins)
**Edit Permission**: ADMIN only

#### Affiliate Settings Sub-page
**File**: `/src/app/(affiliate)/affiliate/settings/affiliate/page.tsx`
**Route**: `/affiliate/settings/affiliate`
**Purpose**: Affiliate program config (commission, auto-approve)
**Access**: All users (read-only for non-admins)
**Edit Permission**: ADMIN, FOUNDER, CO_FOUNDER

#### Tab Navigation Layout
**File**: `/src/app/(affiliate)/affiliate/settings/layout.tsx`
**Purpose**: Provides tab navigation for all sub-pages
**Components**: 4-tab responsive navigation bar

## 🔄 Tab Navigation Flow

```
User navigates to /affiliate/settings
        ↓
layout.tsx renders tab navigation
        ↓
User selects tab
        ↓
Next.js routing renders appropriate page
        ↓
Page loads data and renders UI
```

## 💾 Data Flow

### Getting Settings
```
Settings Page
    ↓
useEffect hook
    ↓
fetch('/api/admin/settings/[withdrawal|affiliate]')
    ↓
useState with data
    ↓
UI renders with current values
```

### Saving Settings
```
User clicks "Simpan Pengaturan"
    ↓
handleSave() function
    ↓
fetch POST to '/api/admin/settings/[withdrawal|affiliate]'
    ↓
Toast notification (success/error)
    ↓
Re-fetch settings if needed
```

## 🎨 Tab Navigation Details

### Tab Component Props
```tsx
interface SettingsTab {
  name: string              // "Umum", "Penarikan Dana", etc.
  href: string              // URL for the tab
  icon: React.ReactNode     // Lucide icon
  description: string       // Tooltip description
}
```

### Active Tab Detection
```tsx
const isActiveTab = (href: string) => {
  if (href === '/affiliate/settings') {
    return pathname === '/affiliate/settings'
  }
  return pathname.startsWith(href)
}
```

Active tab gets:
- Purple background (`bg-purple-50`)
- Purple text color (`text-purple-700`)
- Purple bottom border (`border-purple-600`)

Inactive tabs get:
- Gray hover state
- Transparent background
- Gray text color

## 🔐 Permission System

### Profile Settings (`/affiliate/settings`)
```
Access: All authenticated users
Edit: Own profile only
```

### Withdrawal Settings (`/affiliate/settings/withdrawal`)
```
Access: All authenticated users
View: Everyone can see current settings
Edit: ADMIN only

If non-admin tries to save:
→ Toast error: "Hanya admin yang dapat mengubah pengaturan penarikan dana"
```

### Affiliate Settings (`/affiliate/settings/affiliate`)
```
Access: All authenticated users (read-only for non-authorized)
Edit: ADMIN, FOUNDER, CO_FOUNDER only

If insufficient permissions:
→ Toast error: "Anda tidak memiliki akses ke halaman ini"
```

### Follow-Up Settings (`/affiliate/settings/followup`)
```
Access: AFFILIATE role only
Edit: Can manage own leads and follow-ups
```

## 🛠️ Troubleshooting

### Tab Not Loading
**Problem**: Clicking tab doesn't change page
**Solution**: 
- Check browser console for errors
- Verify URL structure is correct
- Clear browser cache and retry

### Settings Not Saving
**Problem**: Click save but changes don't persist
**Solution**:
- Check browser console for API errors
- Verify you have permission to edit (must be ADMIN)
- Check if API endpoint is responding
- Verify internet connection

### Wrong Tab Highlighted
**Problem**: Pathname doesn't match expected tab
**Solution**:
- Manual page reload triggers correct tab highlight
- Check `pathname` vs tab `href` values match

### Non-Admins Can't Edit
**Expected Behavior**: Non-admins see read-only view with info alert
**This is correct**: Only admins can modify system settings

## 📊 Performance Considerations

- **No N+1 queries**: Each page fetches its own settings once
- **Efficient routing**: Tab clicks use Next.js client-side routing
- **Minimal re-renders**: Settings state updates only on page load/save
- **No redundant API calls**: Each setting fetched once per page load

## 🔄 Data Synchronization

All settings pages fetch fresh data on component mount:
```tsx
useEffect(() => {
  if (status === 'authenticated') {
    fetchSettings()
  }
}, [status, session])
```

To sync changes across tabs:
1. **Within same session**: Each tab fetches fresh data independently
2. **Across browser tabs**: Refresh needed (no real-time sync)
3. **Multiple admins editing**: Last save wins (no locking)

## 📱 Mobile Responsiveness

### Tab Navigation
```
Small screens (< 640px):
Grid: 2 columns
Layout: Umum | Penarikan Dana
        Program Affiliate | Follow-Up
Icon: Always visible
Description: Hidden

Medium screens (≥ 640px):
Grid: 4 columns
Layout: Umum | Penarikan Dana | Program Affiliate | Follow-Up
Icon: Always visible
Description: Visible (sm:block)
```

### Settings Pages
```
Form inputs:
- Mobile: 1 column stack
- Tablet (≥ 768px): 2-3 columns
- Desktop: Full responsive grid

Cards:
- Always full width with padding
- Gradient headers visible on all sizes
```

## 🎯 Testing Checklist

For developers implementing features that use these settings:

- [ ] Test tab navigation on mobile
- [ ] Test admin edit permissions
- [ ] Test non-admin read-only view
- [ ] Test API endpoint responses
- [ ] Test error toast notifications
- [ ] Test loading state spinners
- [ ] Test form validation
- [ ] Test responsive layout

## 🚀 Deployment Notes

### No Breaking Changes
- Existing APIs unchanged
- Database schema unchanged
- Old admin pages still exist (can deprecate later)
- No migration needed

### When Deploying
1. Deploy new files to production
2. No database migration required
3. No configuration changes needed
4. Users automatically see new interface

### Monitoring
- Watch for API errors in logs
- Monitor settings fetch/save response times
- Check user feedback on new UI
- Track usage patterns of different tabs

## 📖 Code References

### Using Settings in Other Components
```tsx
// Fetch withdrawal settings
const response = await fetch('/api/admin/settings/withdrawal')
const data = await response.json()
const { withdrawalMinAmount, withdrawalAdminFee } = data.settings

// Use in validation
if (withdrawalAmount < withdrawalMinAmount) {
  return "Amount below minimum"
}
```

### Updating Settings from Code
```tsx
const response = await fetch('/api/admin/settings/withdrawal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    withdrawalMinAmount: 100000,
    withdrawalAdminFee: 10000,
    // ... other fields
  })
})
```

## 💡 Future Enhancements

Potential improvements for next phase:

1. **Settings Versioning**: Track settings history
2. **Audit Log**: See who changed what settings and when
3. **Settings Validation**: Client-side validation before save
4. **Confirmation Dialogs**: For critical setting changes
5. **Settings Export/Import**: Backup and restore settings
6. **A/B Testing**: Test different settings values
7. **Real-time Sync**: WebSocket updates across tabs
8. **Settings Presets**: Save and load setting combinations

---

**Last Updated**: December 2024
**Status**: Complete and tested ✅
