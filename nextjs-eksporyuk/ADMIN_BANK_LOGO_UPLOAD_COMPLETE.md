# Admin Manual Bank Logo Upload - Implementation Complete ✅

## Overview
Redesigned manual bank accounts UI in admin payment settings with modern card-based layout and per-bank logo upload functionality.

## Changes Made

### 1. **Interface Update** (`/admin/settings/payment/page.tsx`)

#### Updated `BankAccount` Interface
```typescript
interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  branch?: string
  isActive: boolean
  logo?: string
  customLogoUrl?: string  // ✅ NEW - Custom uploaded logo
  order: number
}
```

### 2. **New Upload Functions**

#### `handleBankLogoUpload(bankId, file)`
```typescript
const handleBankLogoUpload = async (bankId: string, file: File) => {
  setUploadingLogo(bankId)
  try {
    const formData = new FormData()
    formData.append('logo', file)
    formData.append('bankId', bankId)

    const response = await fetch('/api/admin/upload-bank-logo', {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const { logoUrl } = await response.json()
      
      // Update bankAccounts with new logo URL
      setBankAccounts(banks =>
        banks.map(bank =>
          bank.id === bankId ? { ...bank, customLogoUrl: logoUrl } : bank
        )
      )
      
      toast.success('Logo bank berhasil diupload! Jangan lupa klik "Simpan Pengaturan"')
    }
  } catch (error) {
    console.error('Bank logo upload error:', error)
    toast.error('Gagal upload logo bank')
  } finally {
    setUploadingLogo(null)
  }
}
```

#### `resetBankLogo(bankId)`
```typescript
const resetBankLogo = (bankId: string) => {
  setBankAccounts(banks =>
    banks.map(bank =>
      bank.id === bankId ? { ...bank, customLogoUrl: undefined } : bank
    )
  )
  toast.success('Logo bank direset ke default. Jangan lupa klik "Simpan Pengaturan"')
}
```

### 3. **UI Redesign - From Table to Modern Card Grid**

#### Before (Table Layout)
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Bank</TableHead>
      <TableHead>Nomor Rekening</TableHead>
      <TableHead>Atas Nama</TableHead>
      <TableHead>Cabang</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Aksi</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {bankAccounts.map((bank) => (
      <TableRow key={bank.id}>
        <TableCell>{bank.bankName}</TableCell>
        <TableCell>{bank.accountNumber}</TableCell>
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### After (Modern Card Grid)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {bankAccounts.map((bank) => {
    const logoUrl = bank.customLogoUrl || getLogoUrl(bank.bankCode)
    return (
      <div key={bank.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {/* Card Header with Logo */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border-b">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{bank.bankName}</h3>
              <p className="text-xs text-muted-foreground">{bank.bankCode}</p>
            </div>
            <Switch checked={bank.isActive} onCheckedChange={() => toggleBankAccount(bank.id)} />
          </div>
          
          {/* Logo Display with Preview */}
          <div className="relative w-full h-24 bg-white rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
            <img 
              src={logoUrl} 
              alt={bank.bankName}
              className="max-w-full max-h-full object-contain p-2"
              onError={(e) => {
                e.currentTarget.src = `[fallback SVG placeholder]`
              }}
            />
          </div>

          {/* Logo Upload Controls */}
          <div className="mt-3 space-y-2">
            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors text-sm">
                <Image className="h-3.5 w-3.5" />
                <span>{uploadingLogo === bank.id ? 'Uploading...' : 'Upload Logo'}</span>
              </div>
              <input
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingLogo === bank.id}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleBankLogoUpload(bank.id, file)
                }}
              />
            </label>
            
            {bank.customLogoUrl && (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => resetBankLogo(bank.id)}>
                Reset ke Logo Default
              </Button>
            )}
          </div>
        </div>

        {/* Card Body - Account Details */}
        <div className="p-4 space-y-3 bg-white">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nomor Rekening</p>
            <p className="font-mono font-semibold text-sm">{bank.accountNumber}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Atas Nama</p>
            <p className="font-medium text-sm">{bank.accountName}</p>
          </div>
          
          {bank.branch && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cabang</p>
              <p className="text-sm">{bank.branch}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => openBankDialog(bank)}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteBankAccount(bank.id)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Hapus
            </Button>
          </div>
        </div>
      </div>
    )
  })}
</div>
```

### 4. **New API Endpoint**

Created: `/api/admin/upload-bank-logo/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    const bankId = formData.get('bankId') as string

    if (!file || !bankId) {
      return NextResponse.json({ error: 'File and bankId required' }, { status: 400 })
    }

    // Upload to Vercel Blob (production) or local (development)
    const result = await uploadFile(file, {
      folder: 'bank-logos',
      prefix: `bank-${bankId}`,
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
    })

    return NextResponse.json({
      success: true,
      logoUrl: result.url,
      storage: result.storage
    })
  } catch (error) {
    console.error('Upload bank logo error:', error)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}
```

### 5. **Checkout Integration**

Both checkout pages already support `customLogoUrl`:

#### `/checkout/pro/page.tsx`
```typescript
const logoUrl = bank.customLogoUrl || getLogoUrl(bank.bankCode)

<img 
  src={getLogoUrl(account.bankCode, account.customLogoUrl)} 
  alt={account.bankName}
  className="max-h-full max-w-full object-contain p-1"
/>
```

#### `/checkout/[slug]/page.tsx`
```typescript
const getLogoUrl = (code: string, customLogoUrl?: string) => {
  // Prioritize custom logo if available
  if (customLogoUrl) {
    return customLogoUrl
  }
  
  // ... default logos mapping
}
```

## Features

### ✅ Modern Card-Based Layout
- **Grid System**: 1 column on mobile, 2 on tablet, 3 on desktop
- **Gradient Header**: Visual distinction with `from-gray-50 to-gray-100`
- **Hover Effects**: `hover:shadow-md transition-shadow` for better UX
- **Status Toggle**: Integrated switch in card header

### ✅ Per-Bank Logo Upload
- **Upload Button**: Labeled input with icon and "Upload Logo" text
- **File Type Support**: SVG, PNG, JPEG, WebP
- **Max File Size**: 2MB per image
- **Upload State**: Shows "Uploading..." during process
- **Preview**: Real-time logo display in card header

### ✅ Logo Management
- **Custom Logo Priority**: `customLogoUrl` takes precedence over default
- **Reset Functionality**: Button to revert to default logo (only shown when custom logo exists)
- **Fallback**: SVG placeholder if logo fails to load
- **Persistence**: Saved in database via existing payment-settings API

### ✅ Account Information Display
- **Bank Name & Code**: Prominent header display
- **Account Number**: Monospace font for readability
- **Account Name**: Clear ownership display
- **Branch**: Optional field, shown only if exists
- **Active Status**: Toggle switch in card header

### ✅ Action Buttons
- **Edit**: Opens dialog to modify bank details
- **Delete**: Removes bank account with confirmation
- **Responsive Layout**: Flex layout with equal width buttons

## Data Flow

### Upload Process
1. User clicks "Upload Logo" → file input opens
2. User selects image → `onChange` triggers
3. `handleBankLogoUpload(bankId, file)` called
4. File sent to `/api/admin/upload-bank-logo` via FormData
5. API validates auth, file type, size
6. `uploadFile()` helper uploads to Vercel Blob or local storage
7. Logo URL returned to client
8. State updated: `bank.customLogoUrl = logoUrl`
9. Toast notification: "Logo bank berhasil diupload! Jangan lupa klik 'Simpan Pengaturan'"
10. Admin clicks "Simpan Pengaturan" → POST to `/api/admin/payment-settings`
11. Bank account array (with `customLogoUrl`) saved to database as JSON

### Display Process
1. Checkout page loads → fetches `/api/payment-methods`
2. Manual bank accounts retrieved from settings
3. Each bank object includes `customLogoUrl` if uploaded
4. `getLogoUrl(bankCode, customLogoUrl)` called
5. Returns `customLogoUrl` if exists, else default logo mapping
6. Logo displayed in checkout payment selection

## Files Modified

1. ✅ `/src/app/(dashboard)/admin/settings/payment/page.tsx`
   - Updated `BankAccount` interface
   - Added `handleBankLogoUpload()` function
   - Added `resetBankLogo()` function
   - Redesigned manual bank accounts tab (table → card grid)
   - Added logo upload controls per card

2. ✅ `/src/app/api/admin/upload-bank-logo/route.ts` (NEW)
   - POST endpoint for bank logo upload
   - Auth validation (ADMIN only)
   - File validation and upload
   - Returns logo URL

3. ✅ `/src/app/checkout/pro/page.tsx` (Already Compatible)
   - `getLogoUrl()` accepts `customLogoUrl` parameter
   - Manual bank rendering uses `account.customLogoUrl`

4. ✅ `/src/app/checkout/[slug]/page.tsx` (Already Compatible)
   - `getLogoUrl()` prioritizes `customLogoUrl`
   - Future manual bank implementation ready

## Database Schema

No schema changes required. Bank accounts stored as JSON in `Settings` table:

```prisma
model Settings {
  id                     String   @id @default(cuid())
  paymentBankAccounts    Json?    // Array of BankAccount objects
  paymentXenditChannels  Json?
  // ... other fields
}
```

Example JSON structure:
```json
[
  {
    "id": "bank-1",
    "bankName": "Bank BCA",
    "bankCode": "BCA",
    "accountNumber": "1234567890",
    "accountName": "PT Eksporyuk Indonesia",
    "branch": "Jakarta Pusat",
    "isActive": true,
    "customLogoUrl": "https://blob.vercel-storage.com/bank-logos/bank-1-abc123.png",
    "order": 1
  }
]
```

## Design Highlights

### Visual Hierarchy
- **Card Header** (gray gradient) → Bank identity + logo
- **Card Body** (white) → Account details
- **Card Footer** (bordered) → Action buttons

### Responsive Grid
- **Mobile (< 768px)**: 1 column
- **Tablet (768px - 1024px)**: 2 columns
- **Desktop (> 1024px)**: 3 columns

### Color Scheme
- **Border**: `#e5e7eb` (gray-200)
- **Gradient**: `from-gray-50 to-gray-100`
- **Logo Background**: White with dashed border
- **Active Toggle**: Primary color
- **Delete Button**: Red accent (`text-red-600 hover:bg-red-50`)

## User Flow

### Admin Workflow
1. Go to **Admin** → **Settings** → **Payment**
2. Click **Manual Bank Accounts** tab
3. See modern card grid with all bank accounts
4. For each bank:
   - View logo preview (default or custom)
   - Click **Upload Logo** to select custom image
   - Wait for upload (shows "Uploading...")
   - See updated logo immediately
   - Click **Reset ke Logo Default** to revert (if custom logo exists)
5. Click **Simpan Pengaturan** to persist changes
6. Custom logos now appear in checkout pages

### Checkout Display
- Users see custom bank logos (if uploaded)
- Falls back to default logos if no custom logo
- Seamless integration - no UI changes needed

## Testing Checklist

- [x] Interface updated with `customLogoUrl` field
- [x] Upload function implemented and working
- [x] Reset function clears custom logo
- [x] API endpoint validates auth (ADMIN only)
- [x] File type validation (SVG, PNG, JPEG, WebP)
- [x] File size limit enforced (2MB)
- [x] Logo preview updates immediately after upload
- [x] Card grid responsive (1/2/3 columns)
- [x] Default logos still work as fallback
- [x] Checkout pages use `customLogoUrl` parameter
- [x] Data persists to database via existing API

## Benefits

### For Admin
- **Modern UI**: Visually appealing card-based layout
- **Better UX**: Upload logo directly from bank card
- **Immediate Feedback**: Preview changes before saving
- **Easy Reset**: One-click revert to default logos
- **Responsive**: Works on all devices

### For Users (Checkout)
- **Branded Experience**: Custom bank logos match business identity
- **Trust**: Professional appearance increases confidence
- **Consistency**: Same logos across admin and public pages

## Compatibility

- ✅ Works with existing `uploadFile()` helper
- ✅ Compatible with Vercel Blob Storage (production)
- ✅ Compatible with local file storage (development)
- ✅ No database migration needed (JSON field)
- ✅ Backward compatible (graceful fallback to default logos)

## Future Enhancements

- [ ] Bulk logo upload
- [ ] Logo library/preset selection
- [ ] Drag-and-drop logo upload
- [ ] Logo dimensions validation (recommend 200x80px)
- [ ] Logo compression/optimization
- [ ] Logo preview in edit dialog
- [ ] Reorder banks via drag-and-drop

---

**Status**: ✅ COMPLETE AND READY FOR USE
**Date**: December 2024
**Implementation Time**: ~30 minutes
