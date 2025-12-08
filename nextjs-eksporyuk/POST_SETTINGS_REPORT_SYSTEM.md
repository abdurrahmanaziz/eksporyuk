# Post Settings & Report System

## ✅ Fitur yang Diimplementasikan

### 1. **Post Settings (Owner)**
Ketika user melihat postingan miliknya sendiri, ada menu dropdown dengan opsi:

#### Actions:
- **Edit Postingan** - Full rich text editor dengan:
  - ✅ Text formatting (Bold, Italic, Underline, Strikethrough)
  - ✅ Typography (Heading, Normal, Quote)
  - ✅ Lists (Bullet, Numbered)
  - ✅ Media upload (Images, Videos, Documents)
  - ✅ Emoji picker
  - ✅ @Mentions & #Hashtags
  - ✅ Link preview
  - ✅ Initial content pre-filled (text + existing images)
  - ✅ Large modal (max-w-3xl) for comfortable editing
  - ✅ Same UX as creating new post
  
- **Pin/Unpin Postingan** - Pasang di atas timeline (dengan border biru dan badge)
- **Tutup/Buka Komentar** - Toggle aktif/nonaktif komentar
- **Hapus Postingan** - Hapus permanent (dengan konfirmasi)

#### Visual Indicators:
- **Pinned Post**: 
  - Border biru (ring-2 ring-blue-500)
  - Badge "Postingan Dipasang" dengan icon pin
  - Muncul paling atas di timeline
  
- **Comments Disabled**:
  - Icon komentar dengan lock icon
  - Opacity 50% dan cursor not-allowed
  - Tidak bisa diklik

---

### 2. **Report System (User Lain)**
Ketika user melihat postingan orang lain, ada menu dropdown dengan opsi:

#### Report Options:
- **Laporkan ke Admin** - Buka modal report

#### Report Modal:
- **Alasan Laporan** (Required):
  - Spam atau Iklan
  - Pelecehan atau Bullying
  - Ujaran Kebencian
  - Informasi Palsu
  - Konten Tidak Pantas
  - Pelanggaran Hak Cipta
  - Lainnya

- **Detail Laporan** (Optional):
  - Textarea untuk penjelasan lengkap

#### Flow:
1. User klik "Laporkan ke Admin"
2. Modal terbuka dengan form
3. User pilih alasan dan isi detail
4. Klik "Kirim Laporan"
5. Laporan masuk ke database (status: PENDING)
6. Admin mendapat notifikasi
7. Toast success: "Laporan berhasil dikirim ke admin"

---

## 📁 File Structure

### Frontend
```
src/app/(dashboard)/[username]/page.tsx
├── Post Settings Dropdown (MoreVertical icon)
├── Edit Post Modal (Dialog)
├── Report Post Modal (Dialog)
└── Visual Indicators (Pin badge, Lock icon)
```

### Backend APIs
```
src/app/api/
├── posts/[id]/
│   ├── route.ts                    # PATCH (edit), DELETE
│   ├── toggle-comments/route.ts    # PATCH (toggle comments)
│   └── pin/route.ts                # PATCH/POST (toggle pin)
└── reports/route.ts                # POST (create), GET (admin list)
```

### Database (Prisma)
```prisma
model Post {
  isPinned         Boolean  @default(false)
  commentsEnabled  Boolean  @default(true)
  reports          Report[]
  // ... other fields
}

model Report {
  id           String       @id @default(cuid())
  reporterId   String
  type         ReportType   # POST, COMMENT, USER, GROUP
  reason       String       # SPAM, HARASSMENT, etc.
  description  String?
  postId       String?
  status       ReportStatus @default(PENDING)
  // ... other fields
}
```

---

## 🔒 Security & Permissions

### Post Owner Actions:
- ✅ Edit own post
- ✅ Delete own post
- ✅ Pin/unpin own post
- ✅ Toggle comments on own post

### Admin Override:
- ✅ Can delete any post
- ✅ Can review all reports
- ✅ Receives notifications for new reports

### Other Users:
- ✅ Can report any post (except own)
- ❌ Cannot edit/delete others' posts
- ❌ Cannot see post settings of others

---

## 🎨 UI/UX Features

### Post Menu (MoreVertical icon)
- Compact button (h-8 w-8)
- Ghost variant for minimal look
- Positioned top-right of post header

### Dropdown Menu
- Align right
- Width 48 (w-48)
- Conditional rendering based on ownership
- Proper icons for each action
- Red text for destructive actions (Delete, Report)
- Separator before destructive actions

### Modals
- **Edit Modal**:
  - Large size (max-w-3xl) for comfortable editing
  - Scrollable (max-h-90vh overflow-y-auto)
  - RichTextEditor with full features:
    - Text formatting (Bold, Italic, Underline, etc.)
    - Media upload (Images, Videos, Documents)
    - Emoji picker
    - @Mentions & #Hashtags
    - Pre-filled with existing content
    - Pre-loaded with existing media
  - Save button with loading state ("Menyimpan...")
  - No separate Cancel button (close via X or outside click)
  
- **Report Modal**:
  - Select dropdown for reason
  - Optional textarea for details
  - Cancel & Submit buttons
  - Red variant for submit button
  - Disabled when no reason selected

### Toast Notifications
- ✅ Success: "Postingan berhasil diupdate"
- ✅ Success: "Postingan di-pin/unpin"
- ✅ Success: "Komentar diaktifkan/dinonaktifkan"
- ✅ Success: "Postingan berhasil dihapus"
- ✅ Success: "Laporan berhasil dikirim ke admin"
- ❌ Error: "Gagal [action]"

---

## 📊 API Endpoints

### 1. Edit Post
```typescript
PATCH /api/posts/[id]
Content-Type: multipart/form-data OR application/json

FormData Body: {
  content: string
  images: File[] | string[] (new uploads or existing URLs)
}

OR JSON Body: {
  content: string
  images: string[] (existing URLs only)
}

Response: { post: Post }
Auth: Required (owner only)

Features:
- Supports FormData for new image uploads
- Supports JSON for text-only edits
- Preserves existing images if not replaced
- Auto-creates upload directory
- Saves files to /public/uploads/posts/
- Returns updated post with all relations
```

### 2. Delete Post
```typescript
DELETE /api/posts/[id]
Response: { success: boolean }
Auth: Required (owner or admin)
```

### 3. Toggle Comments
```typescript
PATCH /api/posts/[id]/toggle-comments
Body: { commentsEnabled: boolean }
Response: { post: Post }
Auth: Required (owner only)
```

### 4. Toggle Pin
```typescript
PATCH /api/posts/[id]/pin
Body: { isPinned: boolean }
Response: { isPinned: boolean, message: string }
Auth: Required (owner, group mod, or admin)
```

### 5. Create Report
```typescript
POST /api/reports
Body: {
  type: 'POST' | 'COMMENT' | 'USER' | 'GROUP'
  reason: string
  description?: string
  postId?: string
  commentId?: string
  userId?: string
  groupId?: string
}
Response: { report: Report, message: string }
Auth: Required
Side Effect: Notifies all admins
```

### 6. Get Reports (Admin)
```typescript
GET /api/reports?status=PENDING&type=POST
Response: { reports: Report[] }
Auth: Required (admin only)
```

---

## 🚀 Features Highlights

### ✅ Implemented
1. ✅ Post Settings Menu (owner only)
2. ✅ Edit Post with modal
3. ✅ Delete Post with confirmation
4. ✅ Pin/Unpin Post with visual indicator
5. ✅ Toggle Comments with lock icon
6. ✅ Report System with comprehensive reasons
7. ✅ Admin notifications for reports
8. ✅ Pinned posts shown first in timeline
9. ✅ Disabled comment UI when turned off
10. ✅ All actions with loading states
11. ✅ Toast feedback for all actions
12. ✅ Security checks (ownership, roles)

### 🎯 Data Integrity
- ✅ Cascade delete (comments, likes when post deleted)
- ✅ Transaction safety
- ✅ Validation on frontend & backend
- ✅ Authorization checks on all endpoints
- ✅ Proper error handling

### 🎨 Design System
- ✅ Consistent with existing UI
- ✅ Solid colors (no gradients)
- ✅ Smooth transitions (duration-200)
- ✅ Proper hover states
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Accessible (disabled states, ARIA)

---

## 📝 Usage Example

### User Story 1: Post Owner
```
1. User creates a post
2. Clicks MoreVertical icon (⋮)
3. Sees: Edit, Pin, Close Comments, Delete
4. Clicks "Pin" → Post moves to top with blue border
5. Clicks "Close Comments" → Comment button disabled
6. Clicks "Edit" → Modal opens, edits text, saves
7. Clicks "Delete" → Confirms → Post removed
```

### User Story 2: Other User
```
1. User sees someone else's post
2. Clicks MoreVertical icon (⋮)
3. Sees: "Laporkan ke Admin" (red text)
4. Clicks Report
5. Modal opens with dropdown reasons
6. Selects "Spam atau Iklan"
7. Adds detail: "Jualan produk tidak relevan"
8. Clicks "Kirim Laporan"
9. Toast: "Laporan berhasil dikirim ke admin"
10. Admin gets notification
```

---

## 🔐 Admin Panel Integration

Reports dapat dilihat di:
- `/admin/reports` (future implementation)
- Notification bell dengan badge count
- Filter by status (PENDING, REVIEWED, RESOLVED)
- Review actions: APPROVE, REJECT, DELETE_CONTENT

---

## ✨ Next Steps (Optional Enhancement)

1. 🔔 Real-time notification when report reviewed
2. 📧 Email notification to reporter when action taken
3. 📊 Report analytics dashboard for admin
4. 🚫 Auto-ban system for repeated offenders
5. 📝 Bulk actions for admin (approve/reject multiple)
6. 🔍 Search and filter reports
7. 📅 Report age tracking and SLA monitoring

---

## 🎉 Completed!

All features implemented, tested, and production-ready!
- ✅ No errors in TypeScript compilation
- ✅ All APIs functional
- ✅ UI/UX polished
- ✅ Security enforced
- ✅ Documentation complete
