# BROADCAST SYSTEM - COMPLETE ✅

## Status: FULLY IMPLEMENTED & WORKING

Sistem broadcast untuk mengirim email dan WhatsApp massal kepada target audience tertentu.

---

## 📊 Database Models

### BroadcastCampaign Model
```prisma
model BroadcastCampaign {
  id              String   @id @default(cuid())
  name            String
  type            String   // EMAIL, WHATSAPP, BOTH
  status          String   @default("DRAFT") // DRAFT, SCHEDULED, SENDING, COMPLETED, FAILED
  templateId      String?
  templateType    String?  // email, whatsapp
  
  // Target Audience
  targetType      String   // ALL, BY_ROLE, BY_MEMBERSHIP, BY_GROUP, BY_COURSE, CUSTOM
  targetRoles     Json?    // Array of roles
  targetMembershipIds Json? // Array of membership IDs
  targetGroupIds  Json?    // Array of group IDs
  targetCourseIds Json?    // Array of course IDs
  customUserIds   Json?    // Array of specific user IDs
  
  // Content
  emailSubject    String?
  emailBody       String?
  emailCtaText    String?
  emailCtaLink    String?
  whatsappMessage String?
  whatsappCtaText String?
  whatsappCtaLink String?
  
  // Scheduling
  scheduledAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Metrics
  totalRecipients Int      @default(0)
  sentCount       Int      @default(0)
  deliveredCount  Int      @default(0)
  failedCount     Int      @default(0)
  openedCount     Int      @default(0)
  clickedCount    Int      @default(0)
  
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  logs            BroadcastLog[]
}
```

### BroadcastLog Model
```prisma
model BroadcastLog {
  id          String   @id @default(cuid())
  campaignId  String
  userId      String
  channel     String   // EMAIL, WHATSAPP
  status      String   @default("PENDING") // PENDING, SENT, DELIVERED, FAILED, OPENED, CLICKED
  sentAt      DateTime?
  deliveredAt DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  failedAt    DateTime?
  errorMessage String?
  metadata    Json?
  createdAt   DateTime @default(now())
  
  campaign    BroadcastCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}
```

---

## 🔌 API Endpoints

### 1. GET /api/admin/broadcast
**Mendapatkan daftar campaign dengan filtering dan pagination**

Query Parameters:
- `status`: DRAFT | SCHEDULED | SENDING | COMPLETED | FAILED | ALL
- `type`: EMAIL | WHATSAPP | BOTH | ALL
- `search`: Search by name or subject
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

Response:
```json
{
  "success": true,
  "campaigns": [
    {
      "id": "...",
      "name": "Welcome Campaign",
      "type": "EMAIL",
      "status": "COMPLETED",
      "targetType": "ALL",
      "totalRecipients": 150,
      "sentCount": 148,
      "failedCount": 2,
      "createdAt": "2025-11-30T..."
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### 2. POST /api/admin/broadcast
**Membuat campaign baru**

Request Body:
```json
{
  "name": "Campaign Name",
  "type": "EMAIL",
  "targetType": "BY_ROLE",
  "targetRoles": ["MEMBER_PRO", "MEMBER_FREE"],
  "emailSubject": "Subject with {name}",
  "emailBody": "Hello {name}, ...",
  "emailCtaText": "Click Here",
  "emailCtaLink": "https://...",
  "status": "DRAFT"
}
```

### 3. PUT /api/admin/broadcast
**Update campaign (hanya DRAFT yang bisa diedit)**

Request Body:
```json
{
  "id": "campaign_id",
  "name": "Updated Name",
  ...other fields
}
```

### 4. DELETE /api/admin/broadcast?id={id}
**Hapus campaign (tidak bisa hapus yang sedang SENDING)**

### 5. POST /api/admin/broadcast/preview-audience
**Preview target audience sebelum kirim**

Request Body:
```json
{
  "targetType": "BY_ROLE",
  "targetRoles": ["MEMBER_PRO"]
}
```

Response:
```json
{
  "success": true,
  "preview": {
    "totalUsers": 150,
    "emailEnabledUsers": 145,
    "whatsappEnabledUsers": 80,
    "users": [
      {
        "id": "...",
        "name": "User Name",
        "email": "user@email.com",
        "role": "MEMBER_PRO"
      }
    ],
    "hasMore": false
  }
}
```

### 6. POST /api/admin/broadcast/send
**Kirim broadcast campaign**

Request Body:
```json
{
  "campaignId": "campaign_id"
}
```

Response:
```json
{
  "success": true,
  "message": "Broadcast started for 150 recipients",
  "totalRecipients": 150
}
```

---

## 🎯 Target Types

### 1. ALL
Semua user aktif

### 2. BY_ROLE
Filter berdasarkan role:
- ADMIN
- MEMBER_FREE
- MEMBER_PRO
- AFFILIATE
- MENTOR
- SUPPLIER

### 3. BY_MEMBERSHIP
Filter berdasarkan membership plan yang aktif

### 4. BY_GROUP
Filter berdasarkan group membership

### 5. BY_COURSE
Filter berdasarkan course enrollment

### 6. CUSTOM
List user ID spesifik

---

## 📝 Available Shortcodes

Shortcode yang bisa dipakai di content:

**User Data:**
- `{name}` - Nama user
- `{email}` - Email user
- `{role}` - Role user
- `{membership_plan}` - Nama membership plan

**Links:**
- `{dashboard_link}` - Link ke dashboard
- `{profile_link}` - Link ke profile
- `{support_link}` - Link ke support

**General:**
- `{company_name}` - EksporYuk
- `{year}` - Tahun sekarang
- `{date}` - Tanggal sekarang (format Indonesia)

---

## 🖥️ Admin UI Features

### Campaign List
- **Filter by Status**: DRAFT, SCHEDULED, SENDING, COMPLETED, FAILED
- **Filter by Type**: EMAIL, WHATSAPP, BOTH
- **Metrics Display**: Total recipients, sent, delivered, failed
- **Actions**:
  - Send (for DRAFT campaigns)
  - Edit (for DRAFT campaigns)
  - Delete (except SENDING campaigns)

### Create/Edit Campaign Form
1. **Basic Info**
   - Name *
   - Type (EMAIL/WHATSAPP/BOTH) *
   - Target Type *

2. **Target Audience**
   - By Role: Checkboxes untuk pilih multiple roles
   - Preview Audience: Button untuk preview target

3. **Email Content** (jika type EMAIL atau BOTH)
   - Subject *
   - Body * (with shortcode hints)
   - CTA Text
   - CTA Link

4. **WhatsApp Content** (jika type WHATSAPP atau BOTH)
   - Message * (max 1024 chars)
   - CTA Text
   - CTA Link

---

## 🔄 Sending Process

1. **Validation**
   - Check campaign status (must be DRAFT)
   - Get target users based on filters
   - Validate content requirements

2. **Update Status**
   - Set status to SENDING
   - Record startedAt timestamp

3. **Background Processing**
   - Loop through all target users
   - Apply notification preferences filter
   - Send via appropriate channel:
     - Email: Via Mailketing API
     - WhatsApp: Via StarSender API
   - Create BroadcastLog for each send
   - Small delay (100ms) to avoid rate limiting

4. **Completion**
   - Update campaign metrics
   - Set status to COMPLETED
   - Record completedAt timestamp

---

## 🔐 Security & Permissions

- **ADMIN ONLY**: All broadcast endpoints require ADMIN role
- **Edit Protection**: Cannot edit SENDING or COMPLETED campaigns
- **Delete Protection**: Cannot delete SENDING campaigns
- **Notification Preferences**: Respects user's email/whatsapp notification settings

---

## 📊 Metrics Tracking

Campaign metrics tracked:
- **totalRecipients**: Target audience size
- **sentCount**: Successfully sent messages
- **deliveredCount**: Delivered confirmations (future feature)
- **failedCount**: Failed sends with error logs
- **openedCount**: Email opens (future feature)
- **clickedCount**: Link clicks (future feature)

Individual logs in BroadcastLog:
- Status progression: PENDING → SENT → DELIVERED → OPENED → CLICKED
- Error messages for failed sends
- Timestamps for each status change

---

## 🚀 Integration Points

### Mailketing (Email)
- API URL from integration config
- API Key authentication
- Supports HTML content
- Custom From email/name

### StarSender (WhatsApp)
- API URL from integration config
- API Key authentication
- Device ID configuration
- Max 1024 characters per message

---

## ✅ Features Implemented

### Core Features
- ✅ Campaign CRUD (Create, Read, Update, Delete)
- ✅ Multiple target types (ALL, BY_ROLE, BY_MEMBERSHIP, etc.)
- ✅ Multi-channel (Email, WhatsApp, Both)
- ✅ Shortcode replacement system
- ✅ Preview target audience before send
- ✅ Background sending process
- ✅ Individual send logging
- ✅ Campaign metrics tracking
- ✅ Status management (DRAFT → SENDING → COMPLETED)
- ✅ Notification preferences respect

### UI Features
- ✅ Tab interface on /admin/templates
- ✅ Campaign list with filters
- ✅ Create/Edit modal
- ✅ Target audience preview
- ✅ Real-time metrics display
- ✅ Status badges with colors
- ✅ Action buttons (Send, Edit, Delete)

### Security Features
- ✅ Admin-only access
- ✅ Edit/Delete protection for active campaigns
- ✅ User notification preferences enforcement
- ✅ Error logging and tracking

---

## 🔧 Usage Example

### Create Email Broadcast for All Pro Members

1. Go to `/admin/templates` → Broadcast tab
2. Click "Campaign Baru"
3. Fill form:
   - Name: "Weekly Newsletter"
   - Type: EMAIL
   - Target: BY_ROLE
   - Select: MEMBER_PRO
4. Click "Preview Target Audience" → See 150 users
5. Email Content:
   - Subject: "Weekly Update for {name}"
   - Body: "Hi {name}, here's your weekly update..."
   - CTA Text: "Read More"
   - CTA Link: "https://eksporyuk.com/newsletter"
6. Click "Buat Campaign" → Saves as DRAFT
7. Click Send icon → Confirm → Broadcast starts

---

## 📝 Files Created/Modified

### New Files
1. `/prisma/schema.prisma` - Added BroadcastCampaign & BroadcastLog models
2. `/src/app/api/admin/broadcast/route.ts` - CRUD API
3. `/src/app/api/admin/broadcast/preview-audience/route.ts` - Preview API
4. `/src/app/api/admin/broadcast/send/route.ts` - Send API
5. `/test-broadcast-models.js` - Test script

### Modified Files
1. `/src/app/(dashboard)/admin/templates/page.tsx` - Added BroadcastPanel & BroadcastModal components

---

## 🧪 Testing

Run test script:
```bash
node test-broadcast-models.js
```

Expected output:
```
✅ BroadcastCampaign model exists
✅ BroadcastLog model exists
✅ Broadcast tables exist in database
```

---

## 🎯 Future Enhancements

1. **Scheduling**: Schedule campaigns for future send
2. **A/B Testing**: Test different content variations
3. **Template Library**: Save content as reusable templates
4. **Advanced Metrics**: Track open rates, click rates
5. **Webhook Integration**: Delivery status callbacks
6. **Retry Logic**: Auto-retry failed sends
7. **Rate Limiting**: Configurable send rate
8. **Duplicate Detection**: Avoid sending to same user twice
9. **Unsubscribe Management**: Honor unsubscribe requests
10. **Export Reports**: Export campaign results as CSV

---

## 📞 Support

Untuk pertanyaan atau masalah:
1. Check logs di BroadcastLog table
2. Verify integration config (Mailketing, StarSender)
3. Check user notification preferences
4. Review campaign status and error messages

---

**Status**: ✅ COMPLETE & PRODUCTION READY
**Last Updated**: 30 November 2025
