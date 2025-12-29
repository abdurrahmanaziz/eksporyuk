# Settings Consolidation - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   UNIFIED SETTINGS INTERFACE                     │
│                  /affiliate/settings (With Tabs)                │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
        │ layout.tsx   │ │ page.tsx    │ │ Subroutes    │
        │ (Nav Bar)    │ │ (Profile)   │ │              │
        └──────────────┘ └─────────────┘ └──────────────┘
             │                │                │
             │                │    ┌───────────┼───────────┐
             │                │    │           │           │
             ▼                ▼    ▼           ▼           ▼
        ┌────────────────────────────────────────────────────────┐
        │  TAB NAVIGATION BAR (4 Tabs)                           │
        │  ┌──────────┬──────────────┬──────────────┬──────────┐ │
        │  │ Umum     │ Penarikan    │ Program      │ Follow-  │ │
        │  │ (User)   │ Dana (Admin) │ Affiliate... │ Up (User)│ │
        │  │ Profile  │ Withdrawal   │ Affiliate... │ Leads    │ │
        │  └──────────┴──────────────┴──────────────┴──────────┘ │
        └────────────────────────────────────────────────────────┘
             │
             └─────────────────┬────────────────┐
                               │                │
                ┌──────────────┴──┐  ┌──────────┴──────────┐
                │                 │  │                     │
                ▼                 ▼  ▼                     ▼
        ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐
        │ profile/     │  │ withdrawal/     │  │ affiliate/       │
        │ page.tsx     │  │ page.tsx        │  │ page.tsx         │
        │ (General)    │  │ (Withdrawal)    │  │ (Affiliate)      │
        └──────────────┘  └─────────────────┘  └──────────────────┘
             │                  │                      │
             ▼                  ▼                      ▼
        ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐
        │ API Calls    │  │ API Calls       │  │ API Calls        │
        │ Profile Save │  │ Settings Save   │  │ Settings Save    │
        │ Bank Details │  │ Withdrawal Cfg  │  │ Affiliate Cfg    │
        └──────────────┘  └─────────────────┘  └──────────────────┘
```

## User Role Access Map

```
┌─────────────────────────────────────────────────────────┐
│                  ROLE ACCESS MATRIX                      │
├─────────────────────────────────────────────────────────┤
│ Path                    │ User │ Admin │ Founder │ Notes │
├─────────────────────────┼──────┼──────┼─────────┼───────┤
│ /affiliate/settings     │ ✅   │ ✅   │ ✅      │ Edit  │
│ (Profile/General)       │ own  │ own  │ own     │ own   │
├─────────────────────────┼──────┼──────┼─────────┼───────┤
│ /affiliate/settings/    │ 👁️   │ ✅   │ ✅      │ Read  │
│ withdrawal              │ RO   │ Edit │ Edit    │ only  │
│                         │      │      │ if role │ unless│
│                         │      │      │ allows  │ admin │
├─────────────────────────┼──────┼──────┼─────────┼───────┤
│ /affiliate/settings/    │ 👁️   │ ✅   │ ✅      │ Read  │
│ affiliate               │ RO   │ Edit │ Edit    │ only  │
│                         │      │      │ if role │ unless│
│                         │      │      │ allows  │ admin │
├─────────────────────────┼──────┼──────┼─────────┼───────┤
│ /affiliate/settings/    │ ✅   │ ✅   │ ✅      │ Manage│
│ followup                │ own  │ own  │ own     │ own   │
│                         │ leads│ leads│ leads   │       │
└─────────────────────────┴──────┴──────┴─────────┴───────┘

Legend:
✅ = Full access (can view & edit)
👁️ RO = Read-only access (can view but not edit)
❌ = No access (cannot see)
```

## Data Flow Diagram

### On Page Load

```
User visits /affiliate/settings
        │
        ▼
├─ Router detects segment
├─ Layout renders (layout.tsx)
│  └─ Tab navigation bar appears
├─ Page component loads (page.tsx)
│  └─ useEffect triggers
│     └─ fetch('/api/affiliate/profile')
│        └─ setState with data
│           └─ Render form with values
└─ User sees profile page with tabs
```

### On Tab Click

```
User clicks "Penarikan Dana" tab
        │
        ▼
Next.js routes to /affiliate/settings/withdrawal
        │
        ▼
withdrawal/page.tsx loads
        │
        ▼
useEffect triggers
        │
        ▼
fetch('/api/admin/settings/withdrawal')
        │
        ▼
setState with withdrawal settings
        │
        ▼
Check user role
├─ If ADMIN: Show editable form
└─ If not: Show read-only view with alert
        │
        ▼
User sees settings page
```

### On Save

```
User clicks "Simpan Pengaturan"
        │
        ▼
handleSave() executes
        │
        ├─ Check user permission
        │  └─ If not allowed: Toast error & exit
        │
        ├─ setSaving(true)
        │
        ├─ fetch POST to API
        │  └─ Send form data as JSON
        │
        ├─ Receive response
        │  ├─ If success: setState & toast.success()
        │  └─ If error: toast.error()
        │
        └─ setSaving(false)
```

## File Structure

```
/affiliate/
  /settings/
    ├── layout.tsx                    ← Tab Navigation (Wrapper)
    │   └─ Renders: [Umum|Penarikan Dana|Program Affiliate|Follow-Up]
    │
    ├── page.tsx                      ← General Profile Settings
    │   └─ Route: /affiliate/settings
    │   └─ Features: Name, Phone, Avatar, Bank Account
    │
    ├── withdrawal/
    │   └── page.tsx                  ← Withdrawal Config
    │       └─ Route: /affiliate/settings/withdrawal
    │       └─ Features: Min Amount, Admin Fee, PIN Settings
    │       └─ Access: Admin-only editable
    │
    ├── affiliate/
    │   └── page.tsx                  ← Affiliate Program Config
    │       └─ Route: /affiliate/settings/affiliate
    │       └─ Features: Commission, Auto-Approve
    │       └─ Access: Admin/Founder-only editable
    │
    └── followup/
        └── page.tsx                  ← Lead Follow-Up Management
            └─ Route: /affiliate/settings/followup
            └─ Features: Lead Tracking, Reminders
            └─ Access: Affiliate-specific
```

## Component Hierarchy

```
<RootLayout>
  └─ <(affiliate)Layout>
      └─ <SettingsLayout>                    (layout.tsx)
          ├─ <TabNavigation>                 (4 tabs)
          │  ├─ Link to /affiliate/settings
          │  ├─ Link to /affiliate/settings/withdrawal
          │  ├─ Link to /affiliate/settings/affiliate
          │  └─ Link to /affiliate/settings/followup
          │
          └─ <Outlet>                         (children)
              └─ One of:
                  ├─ <ProfilePage>            (page.tsx)
                  ├─ <WithdrawalPage>         (withdrawal/page.tsx)
                  ├─ <AffiliatePage>          (affiliate/page.tsx)
                  └─ <FollowupPage>           (followup/page.tsx)
```

## API Integration

```
Settings Pages                  API Endpoints              Database
                                                          (Settings Model)

profile/page.tsx  ────────────► /api/affiliate/profile     user fields
                                                           profile data

withdrawal/page.tsx  ─────────► /api/admin/settings/       withdrawalMin
                                withdrawal                 withdrawalFee
                                                           withdrawalPin*

affiliate/page.tsx  ──────────► /api/admin/settings/       affiliateAuto
                                affiliate                  affiliateComm*
                                                           defaultComm

followup/page.tsx  ───────────► /api/affiliate/pending     pending leads
                                /api/affiliate/send-       follow-ups
                                reminder
```

## Mobile Responsive Layout

### Small Screen (< 640px)

```
┌─────────────────┐
│   Umum │ Penarikan   │
│        │ Dana        │
├────────┼──────────────┤
│ Program│ Follow-Up    │
│Affiliate          │
├─────────────────┤
│                 │
│  Settings Form  │
│  (Stacked)      │
│                 │
└─────────────────┘
```

### Large Screen (≥ 640px)

```
┌──────────────────────────────────────────┐
│ Umum │ Penarikan │ Program │ Follow-Up   │
│      │ Dana      │Affiliate│             │
├──────────────────────────────────────────┤
│                                          │
│         Settings Form (2-3 cols)        │
│                                          │
└──────────────────────────────────────────┘
```

## State Management

```
WithdrawalSettingsPage Component
│
├─ settings: WithdrawalSettings
│  └─ { withdrawalMinAmount, withdrawalAdminFee, ... }
│
├─ loading: boolean
│  └─ true while fetching settings
│
└─ saving: boolean
   └─ true while posting to API

Effects:
├─ useEffect: Fetch settings on mount
│  └─ Runs once when component loads
│
└─ Event handlers:
   ├─ handleSave: POST updated settings
   └─ handleChange: Update local state
```

## Error Handling Flow

```
Try to save settings
        │
        ├─ Check permission
        │  └─ If denied: toast.error("Hanya admin...") ✖
        │
        ├─ Fetch POST
        │  ├─ Network error: catch() block
        │  │  └─ toast.error("Terjadi kesalahan") ✖
        │  │
        │  ├─ Server error (400, 403, 500)
        │  │  └─ toast.error(data.error) ✖
        │  │
        │  └─ Success (200)
        │     └─ toast.success("Pengaturan berhasil disimpan!") ✓
        │
        └─ Finally: setSaving(false)
```

## Responsive Grid System

```
TabNavigation:
├─ Small: grid-cols-2  (2 tabs per row)
├─ Medium: grid-cols-2 (unchanged)
└─ Large: grid-cols-4  (all 4 tabs in row)

Forms:
├─ Small: grid-cols-1      (stacked)
├─ Medium: md:grid-cols-2  (2 columns)
└─ Large: md:grid-cols-3   (3 columns)

Cards:
├─ Max-width: max-w-3xl (limited width)
├─ Padding: responsive p-3 to p-6
└─ Spacing: gap-6 between cards
```

---

**Visual Architecture Summary**: Settings are now organized in a clean tabbed interface using Next.js App Router subrouting pattern, with proper role-based access control and responsive mobile design.
