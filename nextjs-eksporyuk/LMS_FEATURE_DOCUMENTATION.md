# LMS Feature Documentation

Dokumentasi lengkap fitur Learning Management System (LMS) EksporYuk untuk Admin, Mentor, dan Student.

---

## 📚 Daftar Isi

1. [Overview](#overview)
2. [Roles & Permissions](#roles--permissions)
3. [Admin Guide](#admin-guide)
4. [Mentor Guide](#mentor-guide)
5. [Student Guide](#student-guide)
6. [Integration Features](#integration-features)
7. [Notification System](#notification-system)
8. [FAQ](#faq)

---

## Overview

EksporYuk LMS adalah sistem pembelajaran online yang memungkinkan:
- **Admin** mengelola semua kursus dan menyetujui konten
- **Mentor** membuat dan mengajar kursus
- **Student** belajar dan mendapatkan sertifikat

### Key Features
✅ Course creation with modules & lessons  
✅ Video-based learning  
✅ Quiz & Assignment system  
✅ Certificate generation  
✅ Progress tracking  
✅ Analytics dashboard  
✅ Membership integration  
✅ Group integration  
✅ Discussion forum  
✅ Multi-channel notifications  

---

## Roles & Permissions

### ADMIN (Administrator)
**Full Access:**
- ✅ Lihat semua kursus dari semua mentor
- ✅ Approve/reject course submissions
- ✅ Publish/unpublish courses
- ✅ Delete courses
- ✅ Assign courses to memberships
- ✅ Assign courses to groups
- ✅ View platform-wide analytics
- ✅ Manage quiz & assignments
- ✅ Override mentor settings

**Cannot:**
- ❌ Create courses (should use MENTOR role)

### MENTOR (Instructor/Teacher)
**Can Access:**
- ✅ Create new courses
- ✅ Edit own courses
- ✅ Add modules & lessons
- ✅ Create quizzes & assignments
- ✅ Submit course for review
- ✅ View student progress (own courses only)
- ✅ Grade assignments & essays
- ✅ View analytics (own courses only)
- ✅ Participate in course discussions
- ✅ Earn commission (50% default)

**Cannot:**
- ❌ Approve own courses
- ❌ View other mentor's courses (unless enrolled as student)
- ❌ Delete published courses
- ❌ Access admin analytics

### MEMBER (Student)
**Can Access:**
- ✅ Browse published courses
- ✅ Enroll in FREE courses
- ✅ Purchase PAID courses
- ✅ Watch video lessons
- ✅ Take quizzes
- ✅ Submit assignments
- ✅ Track own progress
- ✅ Download certificates
- ✅ Participate in discussions
- ✅ Access membership courses (if active membership)
- ✅ Access group courses (if group member)

**Cannot:**
- ❌ Create courses
- ❌ View other students' progress
- ❌ Access unpublished courses
- ❌ Skip required lessons/quizzes

---

## Admin Guide

### 1. Course Management

#### 1.1 View All Courses
**Path:** `/admin/courses`

**Features:**
- View all courses from all mentors
- Filter by status: DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED, ARCHIVED
- Filter by mentor
- Search by title/description
- Sort by date, enrollment count, revenue

**Course Statuses:**
- 🟡 **DRAFT**: Mentor masih membuat
- 🔵 **PENDING_REVIEW**: Menunggu approval admin
- 🟢 **APPROVED**: Disetujui tapi belum dipublish
- 🔴 **REJECTED**: Ditolak dengan alasan
- ✅ **PUBLISHED**: Live dan bisa diakses student
- ⚫ **ARCHIVED**: Disembunyikan dari public

#### 1.2 Review Course Submission
**Path:** `/admin/courses/[id]`

**Review Process:**
1. Click course with status "PENDING_REVIEW"
2. Review content:
   - Course details (title, description, price)
   - Modules & lessons completeness
   - Video quality
   - Quiz & assignments
3. Decision:
   - **Approve**: Course status → APPROVED
   - **Reject**: Provide detailed reason, status → REJECTED

**Rejection Reasons (Examples):**
```
❌ Konten tidak lengkap (hanya 2 modul dari 5 yang dijanjikan)
❌ Video berkualitas rendah atau tidak ada audio
❌ Materi tidak sesuai dengan deskripsi course
❌ Harga tidak sesuai dengan value yang diberikan
❌ Terdapat konten yang tidak pantas
```

**Notification:**
- Mentor akan menerima notifikasi via Email, WhatsApp, dan In-app
- Jika ditolak, alasan akan disertakan

#### 1.3 Publish Course
**Path:** `/admin/courses/[id]`

**Requirements:**
- Status harus APPROVED
- Minimal 1 modul dengan 1 lesson
- Price sudah ditentukan

**Action:**
1. Click "Publish Course"
2. Confirm
3. Course status → PUBLISHED
4. isPublished = true
5. publishedAt = current timestamp
6. Course muncul di katalog public

**Effect:**
- Students dapat melihat dan enroll
- Muncul di pencarian
- Available untuk membership/group assignment

#### 1.4 Delete Course
**Path:** `/admin/courses/[id]`

**Warning:** ⚠️ Permanent action!

**Cascade Effects:**
- Modules deleted
- Lessons deleted
- Quizzes deleted
- Assignments deleted
- Enrollments soft-deleted (kept for records)
- Certificates invalidated

**Use Case:**
- Course melanggar TOS
- Duplicate course
- Request from mentor

### 2. Course Assignment

#### 2.1 Assign to Membership
**Path:** `/admin/memberships/[id]/courses`

**Steps:**
1. Navigate to membership plan
2. Click tab "Kursus"
3. Select courses from list
4. Save

**Auto-Enrollment:**
- Existing members → auto-enrolled immediately
- New members → auto-enrolled on membership activation

**Access Control:**
- Members can access while membership active
- Access removed when membership expires
- Re-activation restores access

#### 2.2 Assign to Group
**Path:** `/admin/groups/[id]/courses`

**Steps:**
1. Navigate to group
2. Click tab "Kursus"
3. Select courses from list
4. Save

**Auto-Enrollment:**
- All current group members → enrolled immediately
- New members joining → enrolled automatically
- Member leaving group → enrollment kept (progress saved)

**Use Case:**
- Private courses for specific communities
- Corporate training
- Exclusive member benefits

### 3. Analytics Dashboard
**Path:** `/admin/analytics/courses`

**Overview Cards:**
1. **Total Courses**: Published + pending + draft
2. **Active Students**: Unique users enrolled
3. **Completion Rate**: (Completed / Total enrollments) × 100%
4. **Total Revenue**: Sum of successful course purchases

**Charts:**
- 📈 **Enrollment Trends**: Line chart, last 30 days
- 📊 **Top Courses**: By enrollment count
- 🎯 **Completion Rates**: By course
- 👥 **Recent Enrollments**: Last 10 enrollments

**Filters:**
- Date range: 7 days, 30 days, 90 days, all time
- Course status
- Mentor

**Export:**
- Download as CSV
- Generate PDF report

### 4. Commission Management

**Default Commission:** 50% to mentor, 50% to platform

**Custom Commission:**
- Can be set per course
- Navigate to course settings
- Change "Mentor Commission Percent"
- Range: 0% - 90%

**Commission Calculation:**
```
Course Price: Rp 299.000
Mentor Commission (50%): Rp 149.500
Platform Fee (50%): Rp 149.500
```

**Payment:**
- Mentors can withdraw from wallet
- View in `/mentor/analytics` → "My Commission"

---

## Mentor Guide

### 1. Creating a Course

#### 1.1 Create New Course
**Path:** `/mentor/courses` → "Buat Kursus Baru"

**Required Fields:**
- ✅ **Title**: Judul menarik (max 100 chars)
- ✅ **Description**: Deskripsi lengkap (min 200 chars)
- ✅ **Price**: 0 untuk gratis, atau harga dalam Rupiah
- ✅ **Level**: BEGINNER, INTERMEDIATE, ADVANCED
- ✅ **Duration**: Estimasi jam pembelajaran
- ✅ **Thumbnail**: Image 16:9 ratio (recommended: 1280x720px)

**Optional Fields:**
- Checkout Slug: Custom URL untuk halaman checkout
- Original Price: Untuk menampilkan diskon

**Tips:**
```
✅ Judul spesifik: "Panduan Ekspor untuk Pemula" vs "Belajar Ekspor"
✅ Deskripsi dengan bullet points
✅ Tambahkan learning outcomes
✅ Gunakan thumbnail menarik
✅ Set harga kompetitif
```

#### 1.2 Add Modules
**Path:** `/mentor/courses/[id]` → Tab "Modul & Pelajaran"

**Module Structure:**
```
📦 Course
 ├── 📂 Module 1: Pengenalan Ekspor
 │   ├── 📄 Lesson 1: Apa itu Ekspor?
 │   ├── 📄 Lesson 2: Jenis-jenis Ekspor
 │   └── 📝 Quiz 1: Pengenalan Ekspor
 ├── 📂 Module 2: Dokumentasi Ekspor
 │   ├── 📄 Lesson 3: Bill of Lading
 │   ├── 📄 Lesson 4: Invoice & Packing List
 │   └── ✍️ Assignment 1: Membuat Invoice
 └── 📂 Module 3: Praktik Ekspor
     ├── 📄 Lesson 5: Studi Kasus
     └── 🏆 Final Exam
```

**Best Practices:**
- 3-7 modules per course
- 3-5 lessons per module
- Total duration: 2-20 hours
- Mix: video lessons, quizzes, assignments

#### 1.3 Add Lessons
**Path:** `/mentor/courses/[id]/modules/[moduleId]` → "Tambah Pelajaran"

**Lesson Components:**
- **Title**: Judul lesson
- **Content**: Rich text editor (supports images, code blocks)
- **Video URL**: YouTube, Vimeo, or direct MP4 link
- **Duration**: Minutes (auto-detected from video if possible)
- **Free Preview**: Allow non-enrolled users to watch
- **Order**: Sequence number

**Video Guidelines:**
```
✅ Quality: Min 720p, recommended 1080p
✅ Duration: 5-30 minutes per lesson
✅ Audio: Clear, no background noise
✅ Editing: Add intro/outro, transitions
✅ Subtitles: Add closed captions (optional but recommended)
```

**Content Guidelines:**
```
✅ Start with learning objectives
✅ Use visuals and diagrams
✅ Provide downloadable resources
✅ End with summary and next steps
✅ Keep language simple and clear
```

#### 1.4 Create Quiz
**Path:** `/mentor/courses/[id]` → Tab "Quiz & Tugas" → "Buat Quiz"

**Quiz Settings:**
- **Title**: Quiz name
- **Passing Score**: % required to pass (default: 70%)
- **Time Limit**: Minutes (0 = unlimited)
- **Max Attempts**: Number of retries (0 = unlimited)
- **Shuffle Questions**: Randomize order
- **Shuffle Answers**: Randomize option order
- **Show Results**: Display score immediately

**Question Types:**

**1. Multiple Choice**
```
Question: Apa kepanjangan dari B/L?

Options:
○ Bill of Lading ✅ (Correct)
○ Bill of Loading
○ Bill of Letter
○ Bill of Listing

Points: 10
Explanation: B/L adalah Bill of Lading...
```

**2. True/False**
```
Question: Ekspor adalah kegiatan menjual barang ke luar negeri

○ True ✅ (Correct)
○ False

Points: 5
```

**3. Essay**
```
Question: Jelaskan proses ekspor dari awal hingga akhir (min 200 kata)

[Student will type essay here]

Points: 25 (Manual grading by mentor)
```

**Grading:**
- Multiple Choice & True/False: Auto-graded
- Essay: Manual grading by mentor
- Final score = (Total points earned / Total points) × 100%

#### 1.5 Create Assignment
**Path:** `/mentor/courses/[id]` → Tab "Quiz & Tugas" → "Buat Tugas"

**Assignment Settings:**
- **Title**: Assignment name
- **Description**: Instructions and requirements
- **Deadline**: Due date & time
- **Max Score**: Points (e.g., 100)
- **Submission Type**: File upload, text, or both
- **Allowed File Types**: pdf, docx, xlsx, zip

**Grading:**
```
1. Student submits assignment
2. Mentor receives notification
3. Mentor reviews submission
4. Mentor gives score (0-100) and feedback
5. Student receives notification with grade
```

### 2. Submit for Review

**Path:** `/mentor/courses/[id]` → "Submit untuk Review"

**Pre-Submission Checklist:**
- ✅ Course title & description complete
- ✅ Thumbnail uploaded
- ✅ Price set
- ✅ Min 1 module with 3 lessons
- ✅ Videos uploaded and working
- ✅ At least 1 quiz or assignment
- ✅ Content proofread for typos

**Submission:**
1. Click "Submit untuk Review"
2. Confirm dialog
3. Status: DRAFT → PENDING_REVIEW
4. Admin notified
5. Wait for approval (usually 1-3 business days)

**Possible Outcomes:**
- ✅ **Approved**: You'll be notified, then admin will publish
- ❌ **Rejected**: Check notification for reason, fix issues, resubmit

### 3. Student Progress Tracking

**Path:** `/mentor/courses/[id]` → Tab "Siswa"

**View:**
- List of enrolled students
- Progress percentage
- Last accessed date
- Quiz scores
- Assignment submissions

**Actions:**
- View individual student progress
- Grade assignments
- Send message to student
- Issue refund (if applicable)

### 4. Analytics Dashboard

**Path:** `/mentor/analytics`

**Overview:**
- My Courses: Total published
- Total Students: Enrolled across all courses
- Completion Rate: Avg % of students who complete
- My Commission: Total earnings (50% default)

**Charts:**
- 📈 Enrollment Trends: Daily enrollments
- 📊 Student Progress: Avg progress per course
- 🎯 Top Performing Courses

**Course Statistics:**
| Course | Students | Avg Progress | Completed |
|--------|----------|--------------|-----------|
| Panduan Ekspor | 45 | 67% | 23 |
| Dokumentasi | 32 | 78% | 18 |

**Recent Activity:**
- New enrollments
- Quiz completions
- Assignment submissions
- Certificate issued

### 5. Earnings & Withdrawal

**Path:** `/mentor/dashboard` → "Wallet"

**Commission:**
- Default: 50% of course price
- Custom: Set by admin per course

**Example:**
```
Student buys: Rp 299.000
Your commission: Rp 149.500
Platform fee: Rp 149.500
```

**Withdrawal:**
1. Navigate to Wallet
2. Click "Tarik Saldo"
3. Choose bank account
4. Enter amount
5. Submit request
6. Processed within 1-3 business days

**Minimum Withdrawal:** Rp 100.000

---

## Student Guide

### 1. Finding Courses

**Path:** `/dashboard/courses` or `/courses`

**Browse Options:**
- All Courses
- Free Courses
- Paid Courses
- By Category
- By Level (Beginner, Intermediate, Advanced)

**Search:**
- Use search bar
- Filter by price range
- Sort by: Popular, Newest, Highest Rated

**Course Card Info:**
- 🖼️ Thumbnail
- 📝 Title & Description
- 👨‍🏫 Mentor name
- ⭐ Rating (if available)
- 💰 Price
- ⏱️ Duration
- 🎓 Enrolled count

### 2. Enrolling in Course

#### 2.1 Free Course
**Steps:**
1. Click course
2. Click "Daftar Sekarang"
3. Confirm enrollment
4. ✅ Enrolled! Start learning

**Instant Access:**
- All lessons unlocked immediately
- No payment required
- Track progress
- Get certificate on completion

#### 2.2 Paid Course
**Steps:**
1. Click course
2. Click "Beli Kursus" → Redirect to checkout
3. Fill checkout form:
   - Name, Email, Phone
   - Payment method
4. Complete payment
5. ✅ Auto-enrolled after payment success
6. Start learning

**Payment Methods:**
- Bank Transfer (Manual)
- E-Wallet (Midtrans)
- Credit Card (Midtrans)

**Access via Membership:**
- If course included in your membership → Free access
- If course in your group → Free access

### 3. Learning Experience

**Path:** `/dashboard/courses/[id]`

**Player Interface:**
```
┌─────────────────────────────────────┐
│  📹 Video Player                     │
│  [========================]         │
│  ▶️ Play | ⏸️ Pause | ⏩ Speed      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  📚 Lesson Content                   │
│  Rich text, images, code examples   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  💬 Discussion Forum                 │
│  Ask questions, share insights      │
└─────────────────────────────────────┘
```

**Sidebar:**
- 📂 Course modules
- 📄 Lessons (click to navigate)
- ✅ Completed lessons (green checkmark)
- 🔒 Locked lessons (if sequential learning enabled)

**Progress Tracking:**
- Progress bar at top
- % completion
- Completed lessons / Total lessons

**Auto-Save:**
- Last watched position saved
- Resume from where you left off

### 4. Taking Quizzes

**Path:** `/dashboard/courses/[id]/quizzes/[quizId]`

**Before Starting:**
- Read instructions
- Check time limit
- Check passing score (usually 70%)
- See remaining attempts

**During Quiz:**
- Timer counts down (if time limit set)
- Navigate between questions
- Mark questions for review
- Can change answers before submit

**After Submit:**
- Auto-graded questions → instant results
- Essay questions → wait for mentor grading
- See correct answers (if enabled)
- View explanations

**Pass/Fail:**
- ✅ **Pass (≥70%)**: Progress updated, move to next lesson
- ❌ **Fail (<70%)**: Can retry (if attempts remaining)

**Tips:**
```
✅ Read questions carefully
✅ Don't rush, manage time
✅ Review before submit
✅ Learn from mistakes
✅ Contact mentor if unclear
```

### 5. Submitting Assignments

**Path:** `/dashboard/courses/[id]/assignments/[assignmentId]`

**Submission:**
1. Read assignment instructions
2. Prepare your work (document, file, etc.)
3. Upload file or type text
4. Add notes/comments (optional)
5. Submit

**After Submission:**
- Status: Pending Review
- Mentor notified
- Wait for grading (usually 3-7 days)
- Receive notification when graded

**View Grade:**
- Score: 0-100
- Mentor feedback
- Option to resubmit (if allowed)

### 6. Getting Certificate

**Requirements:**
- ✅ Complete all lessons (100%)
- ✅ Pass all quizzes (≥70%)
- ✅ Submit all assignments
- ✅ Assignments graded and passed

**Auto-Generation:**
- Certificate generated automatically
- Notification sent via Email, WhatsApp, In-app
- Available in `/dashboard/certificates`

**Certificate Contains:**
- Your name
- Course title
- Completion date
- Certificate number (e.g., EKSPORYUK-2025-001234)
- QR code for verification

**Download:**
- Click "Download PDF"
- Print or share on LinkedIn
- Verify authenticity at `/verify-certificate/[number]`

### 7. Tracking Progress

**Path:** `/dashboard`

**My Courses:**
- Active courses (in progress)
- Completed courses
- Progress percentage
- Last accessed date

**My Certificates:**
- All earned certificates
- Download as PDF
- Share link

**Learning Stats:**
- Total courses enrolled
- Courses completed
- Total learning hours
- Certificates earned

---

## Integration Features

### 1. Membership Integration

**How It Works:**
1. Admin assigns courses to membership plan
2. Member activates membership (via payment)
3. Member auto-enrolled to all membership courses
4. Member can access while membership active

**Benefits:**
- Unlimited access to included courses
- No additional payment per course
- Access to premium content
- Priority support

**Example:**
```
Premium Membership (Rp 999.000/year)
Includes:
- ✅ Panduan Ekspor untuk Pemula (Rp 299.000)
- ✅ Dokumentasi Ekspor Lengkap (Rp 399.000)
- ✅ Marketing Ekspor (Rp 249.000)
- ✅ 10+ more courses

Total Value: Rp 5.000.000+
You Pay: Rp 999.000 (Save 80%!)
```

**View Membership Courses:**
- Path: `/dashboard/my-membership/courses`
- Shows all courses included in your membership
- Click to start learning

### 2. Group Integration

**How It Works:**
1. Admin creates group
2. Admin assigns courses to group
3. Members join group
4. Members auto-enrolled to group courses

**Benefits:**
- Exclusive courses for group members
- Private discussions
- Cohort-based learning
- Community support

**Example:**
```
Export Club Premium Group
Includes:
- ✅ Exclusive webinars
- ✅ Advanced export strategies course
- ✅ 1-on-1 mentoring sessions
- ✅ Private Telegram group
```

**View Group Courses:**
- Path: `/community/groups/[slug]/courses`
- Shows all courses for that group
- Click to start learning

### 3. Product Integration

**Bundle Courses with Products:**
- Admin can bundle courses with digital products
- Customer buys product → auto-enrolled to bundled courses
- Example: "Export Toolkit + 3 Courses Bundle"

---

## Notification System

### Channel Overview

**3 Notification Channels:**
1. **Email** (via Mailketing)
2. **WhatsApp** (via Starsender)
3. **In-App** (bell icon in dashboard)

**User Preferences:**
- Users can enable/disable each channel
- Path: `/dashboard/settings/notifications`

### Notification Types

#### 1. Course Approved (Mentor)
```
📧 Email: "Kursus Anda Disetujui!"
📱 WhatsApp: "Selamat! Kursus [title] telah disetujui"
🔔 In-App: "Kursus disetujui dan siap dipublish"
```

#### 2. Course Rejected (Mentor)
```
📧 Email: "Kursus Perlu Perbaikan"
📱 WhatsApp: "Kursus [title] ditolak. Alasan: [reason]"
🔔 In-App: "Kursus ditolak. Lihat alasan dan perbaiki"
```

#### 3. Course Enrollment (Student)
```
📧 Email: "Selamat! Anda Terdaftar di [course]"
📱 WhatsApp: "Mulai belajar [course] sekarang!"
🔔 In-App: "Berhasil mendaftar. Mulai belajar!"
```

#### 4. Certificate Earned (Student)
```
📧 Email: "Sertifikat Anda Sudah Tersedia!"
📱 WhatsApp: "Download sertifikat [course] Anda"
🔔 In-App: "Selamat! Sertifikat tersedia untuk diunduh"
```

#### 5. Study Reminder (Student)
```
📧 Email: "Lanjutkan Belajar Anda"
📱 WhatsApp: "Kamu belum belajar [course] minggu ini"
🔔 In-App: "Sudah 7 hari tidak belajar. Yuk lanjutkan!"
```

**Trigger:** User inactive for 7 days in enrolled course

#### 6. Quiz Deadline (Student)
```
📧 Email: "Quiz Deadline: 2 Hari Lagi"
📱 WhatsApp: "Jangan lupa kerjakan quiz [title]"
🔔 In-App: "Quiz deadline approaching"
```

#### 7. Assignment Graded (Student)
```
📧 Email: "Tugas Anda Telah Dinilai"
📱 WhatsApp: "Nilai tugas [title]: 85/100"
🔔 In-App: "Tugas dinilai. Lihat feedback mentor"
```

#### 8. New Lesson Available (Student)
```
📧 Email: "Lesson Baru di [course]"
📱 WhatsApp: "Lesson baru telah ditambahkan"
🔔 In-App: "Lesson baru: [lesson title]"
```

### Notification Settings

**User Control:**
```
✅ Email Notifications
  ✅ Course updates
  ✅ Certificates
  ✅ Study reminders
  ❌ Marketing emails

✅ WhatsApp Notifications
  ✅ Important updates only
  ❌ All notifications

✅ In-App Notifications
  ✅ All notifications (always on)
```

---

## FAQ

### General

**Q: Apa itu EksporYuk LMS?**  
A: Platform pembelajaran online untuk belajar ekspor-impor dengan video, quiz, dan sertifikat.

**Q: Apakah gratis?**  
A: Ada kursus gratis dan berbayar. Cek badge "GRATIS" di course card.

**Q: Bagaimana cara mendaftar?**  
A: Klik "Daftar" di homepage, isi form, verifikasi email, login, dan mulai belajar.

### For Students

**Q: Bagaimana cara enroll kursus?**  
A: Klik kursus → "Daftar Sekarang" (gratis) atau "Beli Kursus" (berbayar).

**Q: Apakah bisa refund?**  
A: Ya, dalam 7 hari jika belum menyelesaikan 25% kursus. Hubungi support.

**Q: Sertifikat berlaku selamanya?**  
A: Ya, sertifikat tidak expire dan bisa diverifikasi kapan saja.

**Q: Bisa akses kursus selamanya?**  
A: Ya, sekali beli akses selamanya (lifetime access).

**Q: Video bisa didownload?**  
A: Tidak, hanya bisa ditonton online untuk mencegah pembajakan.

**Q: Bisa nonton di HP?**  
A: Ya, website mobile-friendly. Buka di browser HP Anda.

**Q: Lupa progress terakhir?**  
A: Sistem otomatis simpan progress. Login dan lanjutkan dari terakhir kali.

**Q: Cara hubungi mentor?**  
A: Via discussion forum di setiap lesson atau kirim message di dashboard.

### For Mentors

**Q: Bagaimana cara jadi mentor?**  
A: Hubungi admin via email: admin@eksporyuk.com dengan CV dan expertise.

**Q: Berapa komisi mentor?**  
A: Default 50%, bisa lebih tinggi berdasarkan kualitas dan popularitas.

**Q: Kapan komisi dibayar?**  
A: Instant ke wallet setelah student beli kursus. Withdraw kapan saja.

**Q: Berapa lama review kursus?**  
A: 1-3 hari kerja. Jika ditolak, akan ada alasan detail untuk diperbaiki.

**Q: Bisa update kursus setelah publish?**  
A: Ya, bisa tambah lesson/quiz kapan saja. Update otomatis untuk enrolled students.

**Q: Minimal harga kursus?**  
A: Gratis (Rp 0) atau minimal Rp 50.000 untuk paid courses.

**Q: Format video apa yang diterima?**  
A: MP4, YouTube, Vimeo. Recommended: 1080p, min 720p.

### For Admins

**Q: Bagaimana approve kursus?**  
A: Cek konten lengkap → klik "Approve" → Publish.

**Q: Bisa edit kursus mentor?**  
A: Ya, admin bisa edit semua aspek kursus.

**Q: Cara assign kursus ke membership?**  
A: Membership → Tab Kursus → Select courses → Save.

**Q: Cara lihat revenue?**  
A: Dashboard Admin → Analytics → Total Revenue.

**Q: Bisa custom komisi per mentor?**  
A: Ya, edit course → set "Mentor Commission Percent".

### Technical

**Q: Browser apa yang didukung?**  
A: Chrome, Firefox, Safari, Edge (versi terbaru).

**Q: Minimal spesifikasi device?**  
A: Smartphone/PC dengan koneksi internet min 2 Mbps.

**Q: Video lag/buffer terus?**  
A: Cek koneksi internet. Tutup aplikasi lain. Clear browser cache.

**Q: Error saat upload video?**  
A: Max file size 500MB. Gunakan video hosting (YouTube/Vimeo) untuk file besar.

**Q: Lupa password?**  
A: Klik "Lupa Password" di login page → masukkan email → cek email reset link.

**Q: Cara verifikasi sertifikat?**  
A: Buka `/verify-certificate/[number]` atau scan QR code di sertifikat.

---

## Support

**Email:** support@eksporyuk.com  
**WhatsApp:** +62 812-3456-789  
**Documentation:** https://docs.eksporyuk.com  
**Status Page:** https://status.eksporyuk.com  

**Office Hours:**  
Monday - Friday: 09:00 - 17:00 WIB  
Saturday: 09:00 - 12:00 WIB  
Sunday: Closed  

**Response Time:**  
- Critical: < 1 hour  
- High: < 4 hours  
- Medium: < 1 day  
- Low: < 3 days  

---

**Last Updated:** November 25, 2025  
**Version:** 1.0  
**Contributors:** EksporYuk Development Team
