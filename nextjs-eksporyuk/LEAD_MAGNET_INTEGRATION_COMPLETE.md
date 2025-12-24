# Lead Magnet Integration - Complete Implementation

## Overview
Lead Magnet system memungkinkan admin membuat konten (PDF, video, event, WhatsApp group) yang bisa dipilih affiliate untuk optin form mereka. Setelah form disubmit, lead magnet otomatis dikirim ke user.

## Database Schema

### LeadMagnet Model
```prisma
model LeadMagnet {
  id            String    @id @default(cuid())
  title         String
  description   String?   @db.Text
  type          LeadMagnetType
  fileUrl       String?   // For PDF, VIDEO
  eventLink     String?   // For EVENT  
  whatsappUrl   String?   // For WHATSAPP
  thumbnailUrl  String?
  isActive      Boolean   @default(true)
  createdBy     String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  optinForms    AffiliateOptinForm[]
  
  @@index([type])
  @@index([isActive])
}

enum LeadMagnetType {
  PDF
  VIDEO
  EVENT
  WHATSAPP
}
```

### AffiliateOptinForm Update
Added field: `leadMagnetId String?` with relation to LeadMagnet (optional, onDelete: SetNull)

## Features Implemented

### 1. Admin Lead Magnet Management ✅

**File**: `/src/app/(admin)/admin/lead-magnets/page.tsx`

**Features**:
- Tab-based interface (List, Create, Edit)
- CRUD operations untuk lead magnets
- Type-specific form fields
- Active/inactive toggle
- Usage tracking (berapa form menggunakan)
- Smart delete: soft delete jika sedang digunakan, hard delete jika tidak

**Form Fields**:
- Basic Info: Title, Description, Type
- Content (type-specific):
  - PDF: File URL, Thumbnail URL
  - VIDEO: Video URL (YouTube/Vimeo), Thumbnail URL
  - EVENT: Event Link (Zoom/Meet), Thumbnail URL
  - WHATSAPP: WhatsApp Group URL
- Status: Active/Inactive toggle

**Validations**:
- Title required
- Type-specific URL validation
- Auto-deactivate instead of delete if used by forms

**Access**: Admin only (`/admin/lead-magnets`)

### 2. API Endpoints ✅

#### Admin Endpoints

**GET `/api/admin/lead-magnets`**
- Get all lead magnets (admin only)
- Includes usage count (_count.optinForms)
- Returns: `{ leadMagnets: LeadMagnet[] }`

**POST `/api/admin/lead-magnets`**
- Create new lead magnet
- Validates type-specific requirements
- Auth: Admin only

**GET `/api/admin/lead-magnets/[id]`**
- Get single lead magnet details
- Auth: Admin only

**PATCH `/api/admin/lead-magnets/[id]`**
- Update lead magnet
- Supports partial updates
- Auth: Admin only

**DELETE `/api/admin/lead-magnets/[id]`**
- Smart delete:
  - If used by forms: set isActive = false
  - If not used: permanent delete
- Auth: Admin only

#### Affiliate Endpoints

**GET `/api/affiliate/lead-magnets`**
- Get active lead magnets only (isActive = true)
- Returns: `{ leadMagnets: LeadMagnet[] }`
- Auth: Any authenticated user
- Used by: Optin form builder

### 3. Affiliate Form Builder Integration ✅

**File**: `/src/app/(affiliate)/affiliate/optin-forms/page.tsx`

**Changes**:
- Added state: `leadMagnets[]`, `selectedLeadMagnet`
- Fetch active lead magnets on component mount
- Load/save leadMagnetId in handleOpenBuilder and handleSave
- Reset leadMagnetId in resetForm

**UI Location**: Form Settings section (sebelum "After Submit Action")

**UI Component**:
```tsx
<Select value={selectedLeadMagnet} onValueChange={setSelectedLeadMagnet}>
  <SelectItem value="">Tidak ada lead magnet</SelectItem>
  {leadMagnets.map(lm => (
    <SelectItem value={lm.id}>
      <span className="badge">{lm.type}</span> {lm.title}
    </SelectItem>
  ))}
</Select>
```

**Features**:
- Dropdown with all active lead magnets
- Type badge display (PDF, VIDEO, EVENT, WHATSAPP)
- Description preview if selected
- Optional field (can select "Tidak ada lead magnet")
- Saved to database on form create/update

### 4. API Updates for Optin Forms ✅

**POST `/api/affiliate/optin-forms`**
- Added `leadMagnetId` to request body
- Save to database on create

**PUT `/api/affiliate/optin-forms/[id]`**
- Added `leadMagnetId` to request body  
- Update leadMagnetId on form update

## Type Icons & Colors

```typescript
const TYPE_CONFIG = {
  PDF: {
    icon: FileText,
    color: 'text-red-500',
    bg: 'bg-red-50',
    label: 'PDF Download'
  },
  VIDEO: {
    icon: Video,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    label: 'Video'
  },
  EVENT: {
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    label: 'Event/Webinar'
  },
  WHATSAPP: {
    icon: MessageCircle,
    color: 'text-green-500',
    bg: 'bg-green-50',
    label: 'WhatsApp Group'
  }
}
```

## User Flow

### Admin Creates Lead Magnet
1. Admin goes to `/admin/lead-magnets`
2. Click "Buat Baru" tab
3. Fill form:
   - Title: "Ebook Panduan Export Pemula"
   - Description: "Panduan lengkap untuk pemula..."
   - Type: PDF
   - File URL: `https://drive.google.com/file/d/xyz/download`
   - Thumbnail URL: `https://example.com/cover.jpg`
   - Active: Yes
4. Click "Buat Lead Magnet"
5. Lead magnet appears in list

### Affiliate Selects Lead Magnet
1. Affiliate goes to `/affiliate/optin-forms`
2. Create or edit form
3. In Form Settings, scroll to "Lead Magnet" section
4. Select from dropdown: "PDF - Ebook Panduan Export Pemula"
5. Description shows below dropdown
6. Save form
7. leadMagnetId saved to database

### User Submits Form (Pending Implementation)
1. User visits optin form page
2. Fill form and submit
3. System redirects to thank you page
4. Thank you page displays lead magnet:
   - PDF: Download button
   - VIDEO: Watch button
   - EVENT: Join event button
   - WHATSAPP: Join group button
5. Email sent with lead magnet link (for PDF/VIDEO)

## Pending Tasks

### 5. Lead Magnet Delivery System ⏳
**Status**: Not started

**Requirements**:
- Update `/api/affiliate/optin-forms/[id]/submit` to include leadMagnet in response
- Send email with lead magnet for PDF/VIDEO types
- Direct display on thank you page for all types
- Track lead magnet deliveries (optional analytics)

**Implementation Plan**:
```typescript
// In submit API
const optinForm = await prisma.affiliateOptinForm.findUnique({
  where: { id },
  include: { leadMagnet: true }
})

// If leadMagnet exists, send email
if (optinForm.leadMagnet && (type === 'PDF' || type === 'VIDEO')) {
  await sendLeadMagnetEmail({
    to: formData.email,
    leadMagnet: optinForm.leadMagnet
  })
}

// Return leadMagnet in response for thank you page
return { success: true, leadMagnet: optinForm.leadMagnet }
```

### 6. Thank You Page Enhancement ⏳
**Status**: Not started

**File**: Create or update thank you page component

**Requirements**:
- Display lead magnet section if exists
- Type-specific UI:
  - PDF: "Download Ebook Gratis" button → download file
  - VIDEO: "Tonton Video Sekarang" button → open video
  - EVENT: "Gabung Event" button → redirect to Zoom/Meet
  - WHATSAPP: "Join Grup WhatsApp" button → open WhatsApp
- Show thumbnail if available
- Track clicks/downloads (optional)

**UI Design**:
```tsx
{leadMagnet && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>🎁 Ambil Lead Magnet Anda</CardTitle>
    </CardHeader>
    <CardContent>
      {leadMagnet.thumbnailUrl && (
        <img src={leadMagnet.thumbnailUrl} alt={leadMagnet.title} />
      )}
      <h3>{leadMagnet.title}</h3>
      <p>{leadMagnet.description}</p>
      
      <Button onClick={handleDownload}>
        {TYPE_CONFIG[leadMagnet.type].icon}
        {leadMagnet.type === 'PDF' && 'Download Sekarang'}
        {leadMagnet.type === 'VIDEO' && 'Tonton Sekarang'}
        {leadMagnet.type === 'EVENT' && 'Gabung Event'}
        {leadMagnet.type === 'WHATSAPP' && 'Join Grup'}
      </Button>
    </CardContent>
  </Card>
)}
```

## Testing Checklist

### Admin Features
- [ ] Create lead magnet (PDF type)
- [ ] Create lead magnet (VIDEO type)
- [ ] Create lead magnet (EVENT type)
- [ ] Create lead magnet (WHATSAPP type)
- [ ] Edit existing lead magnet
- [ ] Toggle active/inactive
- [ ] Delete unused lead magnet (hard delete)
- [ ] Delete used lead magnet (soft delete)
- [ ] View usage count

### Affiliate Features
- [x] Fetch active lead magnets in form builder
- [x] Select lead magnet from dropdown
- [x] See description preview
- [x] Save form with lead magnet
- [x] Edit form preserves lead magnet selection
- [ ] View lead magnet on public form (after delivery implementation)

### Public Features
- [ ] Submit form
- [ ] Receive lead magnet email (PDF/VIDEO)
- [ ] Thank you page shows lead magnet
- [ ] Download PDF
- [ ] Watch video
- [ ] Join event link works
- [ ] Join WhatsApp link works

## Security Considerations

✅ **Implemented**:
- Admin-only content upload (affiliates can't upload files)
- Role-based access control (admin vs affiliate endpoints)
- Ownership verification (affiliates can only select, not create)
- Lead magnet validation (type-specific URL checks)
- Soft delete protection (prevent accidental data loss)

⏳ **Pending**:
- Rate limiting on lead magnet delivery
- Download tracking and analytics
- File URL validation (prevent malicious links)
- Email delivery confirmation

## File Structure

```
nextjs-eksporyuk/
├── prisma/
│   └── schema.prisma                                    # LeadMagnet model
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       └── lead-magnets/
│   │   │           └── page.tsx                         # Admin management UI
│   │   ├── (affiliate)/
│   │   │   └── affiliate/
│   │   │       └── optin-forms/
│   │   │           └── page.tsx                         # Updated with lead magnet selection
│   │   └── api/
│   │       ├── admin/
│   │       │   └── lead-magnets/
│   │       │       ├── route.ts                         # GET (all), POST (create)
│   │       │       └── [id]/
│   │       │           └── route.ts                     # GET, PATCH, DELETE
│   │       └── affiliate/
│   │           ├── lead-magnets/
│   │           │   └── route.ts                         # GET (active only)
│   │           └── optin-forms/
│   │               ├── route.ts                         # Updated POST with leadMagnetId
│   │               └── [id]/
│   │                   ├── route.ts                     # Updated PUT with leadMagnetId
│   │                   └── submit/
│   │                       └── route.ts                 # TODO: Add delivery logic
└── LEAD_MAGNET_INTEGRATION_COMPLETE.md                  # This file
```

## Next Steps

1. **Implement Lead Magnet Delivery** (HIGH PRIORITY)
   - Update submit API to return leadMagnet data
   - Implement email sending for PDF/VIDEO types
   - Add email templates for lead magnet delivery

2. **Build Thank You Page** (HIGH PRIORITY)
   - Create/update thank you page component
   - Add lead magnet display section
   - Implement type-specific CTAs

3. **Testing** (MEDIUM PRIORITY)
   - Test all 4 lead magnet types end-to-end
   - Verify email delivery
   - Test on mobile devices

4. **Analytics** (LOW PRIORITY)
   - Track lead magnet downloads
   - Dashboard for admin to see performance
   - A/B testing different lead magnets

## Migration Notes

**Database**: Schema sudah di-push ke Neon PostgreSQL
- Lead Magnet table created
- AffiliateOptinForm.leadMagnetId field added
- Indexes created for performance
- Relation configured with onDelete: SetNull

**No breaking changes**: Existing optin forms tidak terpengaruh (leadMagnetId optional)

## Support

Untuk pertanyaan atau issues, hubungi tim development atau buat issue di repository.

---

**Status**: ✅ PHASE 1-4 COMPLETE | ⏳ PHASE 5-6 PENDING
**Last Updated**: December 2024
**Author**: AI Assistant with user collaboration
