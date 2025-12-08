# 🎯 FITUR PRIORITAS YANG BELUM DIKERJAKAN

**Tanggal:** 27 November 2025  
**Status Database:** Membership Plans ✅ Fixed (6 paket restored)  
**Status Review System:** ✅ Complete

---

## 📊 ANALISIS FITUR EXISTING vs PRD

### ✅ **SUDAH COMPLETE (Recent)**

1. ✅ **Course Review & Rating System** - Just completed
   - Star rating (1-5)
   - Review submission
   - Helpful votes
   - Admin moderation
   - Auto rating calculation

2. ✅ **Membership Plans System** - Just fixed
   - 6 paket membership restored
   - CRUD operations
   - Payment integration
   - Commission system

3. ✅ **Certificate System** - Previously completed
   - Auto-generate on course completion
   - Admin management
   - Email delivery

4. ✅ **Admin Features Panel** - Previously completed
   - Feature toggle
   - Integration settings (Xendit, Mailketing, OneSignal, Pusher)

---

## 🔥 FITUR PRIORITAS TINGGI (P1) - BELUM DIKERJAKAN

### **1. Discussion Forum per Course** 🎓
**Status:** ✅ COMPLETE  
**Priority:** P1 - HIGH  
**Time Spent:** 5 jam  
**Documentation:** `DISCUSSION_FORUM_COMPLETE.md`

**Yang Sudah Dikerjakan:**
- ✅ Database model `CourseDiscussion` sudah ada di schema (tidak perlu changes)
- ✅ API endpoints untuk create thread/reply sudah dibuat (3 files)
- ✅ UI Discussion tab di course player sudah dibuat (6th tab)
- ✅ Fitur "Mark as Solved" oleh mentor sudah ada
- ✅ Notification ke mentor saat ada diskusi baru
- ✅ Security & enrollment checks
- ✅ Filter by solved status
- ✅ View count tracking

**Implementation:**
- API: `/api/courses/[slug]/discussions` (GET/POST)
- API: `/api/discussions/[id]` (PUT/DELETE/PATCH)
- API: `/api/discussions/[id]/replies` (POST)
- UI: Tab "Discussions" dengan MessageCircle icon
- TypeScript: 0 errors

**Benefit:**
- Meningkatkan engagement student
- Mentor bisa membantu student secara langsung
- Build community per course

**Files yang Sudah Dibuat:**
```
✅ src/app/api/courses/[slug]/discussions/route.ts (GET, POST)
✅ src/app/api/courses/discussions/[id]/route.ts (PUT, DELETE, PATCH)
✅ src/app/api/courses/discussions/[id]/replies/route.ts (POST)
✅ src/app/(dashboard)/learn/[slug]/page.tsx (Discussion tab added)
```

---

### **2. Chat Mentor + Real-time Notifications** 💬
**Status:** ✅ VERIFIED & ENHANCED  
**Priority:** P1 - HIGH  
**Time Spent:** 2 jam (Verification & Enhancement)  
**Documentation:** `CHAT_REALTIME_NOTIFICATIONS_VERIFIED.md`

**Yang Sudah Ada (Previous Implementation)**:
- ✅ Database models: ChatRoom, Message, ChatParticipant, Notification (complete dengan indexes)
- ✅ API endpoints lengkap: rooms, messages, send, read, typing, start (6 chat endpoints)
- ✅ Notification API lengkap: GET, PATCH, DELETE (3 notification endpoints)
- ✅ Service layer: chatService (560 lines), notificationService, pusherService
- ✅ Pusher integration untuk real-time updates (configured & working)
- ✅ Chat page UI lengkap dengan room list, messages, send form, typing indicator
- ✅ NotificationBell component dengan dropdown, real-time toast
- ✅ Chat menu sudah ada di semua role (ADMIN, MENTOR, STUDENT, AFFILIATE)

**Enhancement Yang Baru Dilakukan**:
- ✅ Added real-time unread badge counter di sidebar menu Chat & Notifikasi
- ✅ Pusher subscription untuk auto-update badges tanpa refresh
- ✅ Event handlers: new-message, message-read, notification, notification-read
- ✅ Zero TypeScript errors

**Features Complete**:
- ✅ 1-on-1 direct messaging (mentor-student, student-student, etc.)
- ✅ Group chat (API ready, UI basic)
- ✅ Typing indicator (real-time via Pusher)
- ✅ Read receipts & message delivery status
- ✅ Unread count badges (real-time updates)
- ✅ Notification toast (real-time, customizable)
- ✅ Mark as read (bulk & single)
- ✅ Delete notifications
- ✅ Pagination (messages & notifications)
- ✅ Security (only participants can access room)
- ✅ Cross-role support (all roles can chat)

**Benefit:**
- Student bisa langsung tanya mentor
- Real-time response meningkatkan satisfaction
- Push notification agar mentor tidak miss message

**Integration:**
- Pusher (sudah ada config di admin)
- OneSignal (sudah ada config di admin)

---

### **3. Affiliate Short Links** 🔗
**Status:** ✅ VERIFIED & ENHANCED  
**Priority:** P1 - HIGH  
**Time Spent:** 1.5 jam (Verification & Enhancement)  
**Documentation:** `AFFILIATE_SHORT_LINKS_COMPLETE.md`

**Yang Sudah Ada (Previous Implementation):**
- ✅ Database models: ShortLinkDomain, AffiliateShortLink (complete dengan indexes)
- ✅ Affiliate APIs lengkap: create, list, check username, QR code, stats (6 endpoints)
- ✅ Admin APIs untuk manage domains: CRUD lengkap (4 endpoints)
- ✅ Affiliate UI page lengkap (`/affiliate/short-links`)
- ✅ Menu integration (admin & affiliate sidebar)

**Enhancement Yang Baru Dilakukan:**
- ✅ **NEW:** Redirect handler (`/api/r/[username]`) untuk handle short link redirects
- ✅ **NEW:** Admin domain management UI (`/admin/short-links`)
- ✅ **NEW:** Click tracking logic di redirect handler (IP, user agent, referrer)
- ✅ Zero TypeScript errors

**Features Complete:**
- ✅ Multi-domain support (link.eksporyuk.com, go.eksporyuk.com, dll)
- ✅ Username availability check real-time (debounced 500ms)
- ✅ Unique constraint per domain+username+slug
- ✅ Click tracking dengan device & referrer info
- ✅ QR code generation untuk marketing
- ✅ Expiration date support
- ✅ Admin verification required sebelum domain bisa digunakan

**Time Investment:**
- Previous implementation: ~8-10 hours
- Verification & enhancements: 1.5 hours
- **Total:** ~9.5-11.5 hours

**Benefit:**
- Link lebih mudah diingat (link.eksporyuk.com/dinda)
- Professional branding
- Better click tracking
- QR code untuk offline marketing

**Files Verified & Created:**
```
✅ API: /api/affiliate/short-links (GET, POST)
✅ API: /api/affiliate/short-links/check-username (GET)
✅ API: /api/affiliate/short-links/domains (GET)
✅ API: /api/affiliate/short-links/[id]/qrcode (GET)
✅ API: /api/affiliate/short-links/[id]/stats (GET)
✅ API: /api/admin/short-link-domains (GET, POST)
✅ API: /api/admin/short-link-domains/[id] (GET, PATCH, DELETE)
✅ API: /api/r/[username] (GET) - Redirect handler ✨NEW
✅ UI: /affiliate/short-links (complete page)
✅ UI: /admin/short-links (domain management) ✨NEW
```

---

### **4. Event & Webinar System** 📅
**Status:** ❌ Belum ada  
**Priority:** P1 - MEDIUM-HIGH  
**Estimasi:** 6-8 jam  

**Yang Perlu Dikerjakan:**
- ❌ Database model untuk Events
- ❌ CRUD API untuk create/manage events
- ❌ RSVP system (register for event)
- ❌ Zoom/Google Meet integration
- ❌ Recording archive (link to video)
- ❌ Email reminder sebelum event (H-1, H-0)
- ❌ Calendar view di dashboard

**Benefit:**
- Webinar untuk promote membership
- Live Q&A sessions dengan mentor
- Build authority dan trust

---

### **5. Grup Komunitas Posts & Stories** 👥
**Status:** ⚠️ Partial - Model ada, UI minim  
**Priority:** P1 - MEDIUM  
**Estimasi:** 10-12 jam  

**Yang Perlu Dikerjakan:**
- ✅ Database model `Group`, `GroupMember` sudah ada
- ⚠️ Model `Post`, `Story` mungkin belum ada
- ❌ Feed page dengan list posts
- ❌ Create post (text, image, video)
- ❌ Create story (24 hour expiry)
- ❌ Like, comment, share functionality
- ❌ Follow system antar member
- ❌ Member active status (online/offline)
- ❌ Leaderboard & badges

**Benefit:**
- Social media experience di dalam platform
- Meningkatkan retention member
- User-generated content

---

### **5. Affiliate Short Link Generator** 🔗
**Status:** ❌ Belum ada  
**Priority:** P1 - HIGH untuk Monetization  
**Estimasi:** 4-5 jam  

**Yang Perlu Dikerjakan:**
- ❌ Database model `ShortLink` atau extend `AffiliateLink`
- ❌ Multi-domain support (admin set available domains)
- ❌ Username availability check
- ❌ Click tracking per short link
- ❌ API untuk generate short link
- ❌ UI di affiliate dashboard

**Contoh:**
- Input: `https://eksporyuk.com/membership/pro?ref=AFFILIATE123`
- Output: `link.eksporyuk.com/dinda` atau `go.ekspor.id/dinda`

**Benefit:**
- Link lebih menarik dan professional
- Tracking lebih detail per short link
- Branding affiliate lebih kuat

---

### **6. Certificate Templates CRUD** 🎨
**Status:** ❌ Belum ada  
**Priority:** P2 - MEDIUM  
**Estimasi:** 4-5 jam  

**Yang Perlu Dikerjakan:**
- ❌ Database model `CertificateTemplate`
- ❌ CRUD API untuk manage templates
- ❌ Template editor (colors, fonts, layout)
- ❌ Preview functionality
- ❌ Set default template
- ❌ Assign template per course

**Benefit:**
- Custom branding per course/mentor
- Flexibility untuk different certificate styles
- Professional appearance

---

## 🔵 FITUR PRIORITAS MEDIUM (P2)

### **7. Database Buyer/Supplier/Forwarder CRUD** 📊
**Status:** ⚠️ Model sudah ada, UI minimal  
**Priority:** P2 - MEDIUM  
**Estimasi:** 6-8 jam total (3 database)  

**Yang Perlu Dikerjakan:**
- ✅ Database models sudah ada
- ⚠️ Basic UI ada tapi butuh enhancement
- ❌ Advanced filters (country, product category, rating)
- ❌ Export to CSV
- ❌ Import from Excel
- ❌ Verification system (verified badge)
- ❌ Rating & review per entry
- ❌ Contact request tracking

---

### **8. Marketing Kit & Templates** 📧
**Status:** ❌ Belum ada  
**Priority:** P2 - MEDIUM  
**Estimasi:** 3-4 jam  

**Yang Perlu Dikerjakan:**
- ❌ Email template manager
- ❌ WhatsApp template manager
- ❌ Affiliate marketing kit (logos, banners, copy)
- ❌ Template variables ({{name}}, {{link}}, etc)
- ❌ Preview before send

---

### **9. Gamification & Leaderboard** 🏆
**Status:** ❌ Belum ada  
**Priority:** P2 - MEDIUM  
**Estimasi:** 5-6 jam  

**Yang Perlu Dikerjakan:**
- ❌ Point system (per action: post, comment, course completion)
- ❌ Badge system (achievement badges)
- ❌ Leaderboard (weekly, monthly, all-time)
- ❌ Tier system untuk affiliate (Bronze, Silver, Gold)
- ❌ Challenge system (weekly sales target)

---

## 🟢 FITUR NICE-TO-HAVE (P3)

### **10. Mobile App API Keys** 📱
**Status:** ⚠️ API ready, belum ada key management  
**Priority:** P3 - LOW (untuk later)  
**Estimasi:** 2-3 jam  

### **11. WordPress Member Migration** 🔄
**Status:** ❌ Belum ada  
**Priority:** P3 - LOW  
**Estimasi:** 3-4 jam  

### **12. Advanced Analytics Dashboard** 📈
**Status:** ⚠️ Basic stats ada, advanced belum  
**Priority:** P3 - LOW  
**Estimasi:** 6-8 jam  

---

## 🎯 REKOMENDASI PRIORITAS KERJA

### **Phase 1: Core Engagement (P1)** - 2-3 hari
1. ✅ Discussion Forum per Course (5-6 jam)
2. ✅ Event & Webinar System (6-8 jam)
3. ✅ Affiliate Short Link Generator (4-5 jam)

**Total:** ~18 jam = 2-3 hari kerja

### **Phase 2: Community & Real-time (P1)** - 2-3 hari  
4. ✅ Chat Mentor + Real-time Notifications (8-10 jam)
5. ✅ Grup Komunitas Posts & Stories (10-12 jam)

**Total:** ~20 jam = 2-3 hari kerja

### **Phase 3: Enhancement & Tools (P2)** - 2 hari
6. ✅ Certificate Templates CRUD (4-5 jam)
7. ✅ Database Enhancement (6-8 jam)
8. ✅ Marketing Kit & Templates (3-4 jam)

**Total:** ~15 jam = 2 hari kerja

---

## 📝 CATATAN PENTING

### **Fitur yang Sudah Solid (Jangan Diubah):**
- ✅ Authentication & Authorization
- ✅ Membership & Payment System
- ✅ Course Management & Progress Tracking
- ✅ Certificate Generation
- ✅ Course Reviews & Ratings
- ✅ Admin Dashboard & Settings
- ✅ Affiliate Link System (basic)

### **Integration yang Sudah Ready:**
- ✅ Xendit (Payment)
- ✅ Mailketing (Email)
- ✅ OneSignal (Push notification - config ready)
- ✅ Pusher (Real-time - config ready)

### **Database Models yang Sudah Ada:**
- ✅ User, Role, Permission
- ✅ Membership, UserMembership
- ✅ Course, CourseModule, CourseLesson
- ✅ CourseEnrollment, CourseProgress
- ✅ CourseDiscussion (belum dipakai)
- ✅ Certificate
- ✅ CourseReview, CourseReviewHelpful
- ✅ AffiliateLink, Transaction
- ✅ Group, GroupMember
- ✅ Buyer, Supplier, Forwarder

---

## 🚀 NEXT ACTION

**Pilih salah satu untuk dikerjakan sekarang:**

1. **Discussion Forum** (Paling cepat, impact besar)
2. **Short Link Generator** (Monetization booster)
3. **Event & Webinar** (Marketing & engagement)
4. **Chat + Notifications** (Paling complex tapi high value)

**Atau lanjut yang lain?** 👇
