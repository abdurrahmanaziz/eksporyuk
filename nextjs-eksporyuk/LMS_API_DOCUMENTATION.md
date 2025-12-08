# LMS API Documentation

Complete API reference for EksporYuk Learning Management System.

---

## 🔐 Authentication

All API endpoints require authentication via NextAuth session cookie.

**Headers:**
```
Cookie: next-auth.session-token=...
```

**Role-Based Access:**
- `ADMIN`: Full access to all endpoints
- `MENTOR`: Access to own courses and student data
- `MEMBER`: Access to enrolled courses only
- `GUEST`: No access (401 Unauthorized)

---

## 📚 Course Management APIs

### 1. Get All Courses (Admin)

**Endpoint:** `GET /api/admin/courses`

**Auth:** ADMIN only

**Query Parameters:**
- `status` (optional): Filter by CourseStatus (DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED, ARCHIVED)
- `mentorId` (optional): Filter by mentor ID
- `search` (optional): Search in title/description

**Response:**
```json
{
  "courses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "slug": "panduan-ekspor-pemula",
      "description": "Belajar ekspor dari nol...",
      "thumbnail": "https://...",
      "price": 299000,
      "originalPrice": 499000,
      "duration": 10,
      "level": "BEGINNER",
      "status": "PUBLISHED",
      "isPublished": true,
      "publishedAt": "2025-11-20T10:00:00Z",
      "monetizationType": "PAID",
      "mentorId": "clx456def",
      "mentor": {
        "id": "clx456def",
        "user": {
          "name": "Siti Mentor",
          "email": "mentor@eksporyuk.com",
          "avatar": "https://..."
        },
        "bio": "Mentor berpengalaman..."
      },
      "enrollmentCount": 45,
      "rating": 4.8,
      "_count": {
        "modules": 5,
        "enrollments": 45
      },
      "createdAt": "2025-11-15T08:00:00Z",
      "updatedAt": "2025-11-20T10:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "totalPages": 2
}
```

---

### 2. Get Single Course (Admin)

**Endpoint:** `GET /api/admin/courses/[id]`

**Auth:** ADMIN only

**Response:**
```json
{
  "id": "clx123abc",
  "title": "Panduan Ekspor untuk Pemula",
  "slug": "panduan-ekspor-pemula",
  "description": "Belajar ekspor dari nol...",
  "thumbnail": "https://...",
  "price": 299000,
  "originalPrice": 499000,
  "duration": 10,
  "level": "BEGINNER",
  "status": "PUBLISHED",
  "isPublished": true,
  "publishedAt": "2025-11-20T10:00:00Z",
  "monetizationType": "PAID",
  "mentorCommissionPercent": 50,
  "modules": [
    {
      "id": "clx789ghi",
      "title": "Modul 1: Pengenalan Ekspor",
      "description": "Dasar-dasar ekspor",
      "order": 1,
      "lessons": [
        {
          "id": "clx999jkl",
          "title": "Apa itu Ekspor?",
          "content": "<p>Ekspor adalah...</p>",
          "videoUrl": "https://youtube.com/...",
          "duration": 15,
          "order": 1,
          "isFree": true
        }
      ]
    }
  ],
  "quizzes": [...],
  "assignments": [...]
}
```

---

### 3. Create Course (Admin/Mentor)

**Endpoint:** `POST /api/admin/courses` or `POST /api/mentor/courses`

**Auth:** ADMIN or MENTOR

**Request Body:**
```json
{
  "title": "Panduan Ekspor untuk Pemula",
  "slug": "panduan-ekspor-pemula",
  "description": "Belajar ekspor dari nol hingga mahir",
  "thumbnail": "https://...",
  "price": 299000,
  "originalPrice": 499000,
  "duration": 10,
  "level": "BEGINNER",
  "monetizationType": "PAID",
  "checkoutSlug": "beli-kelas-ekspor-pemula"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "course": {
    "id": "clx123abc",
    "title": "Panduan Ekspor untuk Pemula",
    "status": "DRAFT",
    "createdAt": "2025-11-25T08:00:00Z"
  }
}
```

---

### 4. Update Course

**Endpoint:** `PUT /api/admin/courses/[id]` or `PUT /api/mentor/courses/[id]`

**Auth:** ADMIN or MENTOR (own course)

**Request Body:**
```json
{
  "title": "Panduan Ekspor untuk Pemula (Updated)",
  "description": "Belajar ekspor...",
  "price": 249000,
  "level": "INTERMEDIATE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "course": {
    "id": "clx123abc",
    "title": "Panduan Ekspor untuk Pemula (Updated)",
    "updatedAt": "2025-11-25T09:00:00Z"
  }
}
```

---

### 5. Approve Course

**Endpoint:** `POST /api/admin/courses/[id]/approve`

**Auth:** ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "Course approved successfully",
  "course": {
    "id": "clx123abc",
    "status": "APPROVED",
    "approvedAt": "2025-11-25T10:00:00Z",
    "approvedBy": "clx999admin"
  }
}
```

**Side Effects:**
- Status changes: PENDING_REVIEW → APPROVED
- Notification sent to mentor (email, WhatsApp, in-app)

---

### 6. Reject Course

**Endpoint:** `POST /api/admin/courses/[id]/reject`

**Auth:** ADMIN only

**Request Body:**
```json
{
  "reason": "Konten tidak sesuai dengan standar kami. Mohon perbaiki deskripsi dan tambahkan materi yang lebih lengkap."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Course rejected",
  "course": {
    "id": "clx123abc",
    "status": "REJECTED",
    "rejectedAt": "2025-11-25T10:00:00Z",
    "rejectionReason": "Konten tidak sesuai..."
  }
}
```

**Side Effects:**
- Status changes: PENDING_REVIEW → REJECTED
- Notification sent to mentor with reason

---

### 7. Publish Course

**Endpoint:** `POST /api/admin/courses/[id]/publish`

**Auth:** ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "Course published successfully",
  "course": {
    "id": "clx123abc",
    "status": "PUBLISHED",
    "isPublished": true,
    "publishedAt": "2025-11-25T11:00:00Z"
  }
}
```

**Side Effects:**
- isPublished set to true
- Course visible to public
- Available for enrollment

---

### 8. Delete Course

**Endpoint:** `DELETE /api/admin/courses/[id]`

**Auth:** ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Side Effects:**
- Cascade deletes: modules, lessons, quizzes, assignments
- Enrollments soft-deleted (kept for records)

---

## 📖 Module & Lesson APIs

### 9. Get Course Modules

**Endpoint:** `GET /api/courses/[id]/modules`

**Auth:** ADMIN, MENTOR (own), MEMBER (enrolled)

**Response:**
```json
{
  "modules": [
    {
      "id": "clx789ghi",
      "title": "Modul 1: Pengenalan Ekspor",
      "description": "Dasar-dasar ekspor",
      "order": 1,
      "courseId": "clx123abc",
      "lessons": [
        {
          "id": "clx999jkl",
          "title": "Apa itu Ekspor?",
          "content": "<p>Ekspor adalah...</p>",
          "videoUrl": "https://youtube.com/...",
          "duration": 15,
          "order": 1,
          "isFree": true,
          "completed": false
        }
      ]
    }
  ]
}
```

---

### 10. Create Module

**Endpoint:** `POST /api/admin/courses/[id]/modules` or `POST /api/mentor/courses/[id]/modules`

**Auth:** ADMIN or MENTOR (own course)

**Request Body:**
```json
{
  "title": "Modul 2: Dokumentasi Ekspor",
  "description": "Pelajari dokumen-dokumen ekspor",
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Module created successfully",
  "module": {
    "id": "clx888mod",
    "title": "Modul 2: Dokumentasi Ekspor",
    "order": 2,
    "courseId": "clx123abc",
    "createdAt": "2025-11-25T12:00:00Z"
  }
}
```

---

### 11. Create Lesson

**Endpoint:** `POST /api/admin/courses/[courseId]/modules/[moduleId]/lessons`

**Auth:** ADMIN or MENTOR (own course)

**Request Body:**
```json
{
  "title": "Bill of Lading (B/L)",
  "content": "<p>Bill of Lading adalah...</p>",
  "videoUrl": "https://youtube.com/watch?v=...",
  "videoDuration": 20,
  "order": 1,
  "isFree": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson created successfully",
  "lesson": {
    "id": "clx777les",
    "title": "Bill of Lading (B/L)",
    "order": 1,
    "moduleId": "clx888mod",
    "createdAt": "2025-11-25T12:30:00Z"
  }
}
```

---

### 12. Update Lesson

**Endpoint:** `PUT /api/admin/courses/[courseId]/modules/[moduleId]/lessons/[id]`

**Auth:** ADMIN or MENTOR (own course)

**Request Body:**
```json
{
  "title": "Bill of Lading (B/L) - Updated",
  "content": "<p>Updated content...</p>",
  "videoUrl": "https://youtube.com/watch?v=new-video"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lesson updated successfully",
  "lesson": {
    "id": "clx777les",
    "title": "Bill of Lading (B/L) - Updated",
    "updatedAt": "2025-11-25T13:00:00Z"
  }
}
```

---

## 🎓 Enrollment APIs

### 13. Enroll in Course

**Endpoint:** `POST /api/courses/[id]/enroll`

**Auth:** MEMBER

**Request Body:**
```json
{
  "transactionId": "clx555trx" // Optional: if paid via transaction
}
```

**Response (Free Course):**
```json
{
  "success": true,
  "message": "Berhasil mendaftar ke kursus gratis!",
  "enrollment": {
    "id": "clx666enr",
    "courseId": "clx123abc",
    "userId": "clx444usr",
    "progress": 0,
    "completed": false,
    "createdAt": "2025-11-25T14:00:00Z"
  }
}
```

**Response (Paid Course - Need Payment):**
```json
{
  "success": false,
  "requiresPayment": true,
  "message": "Kursus ini berbayar. Silakan lakukan pembayaran terlebih dahulu.",
  "course": {
    "id": "clx123abc",
    "title": "Panduan Ekspor untuk Pemula",
    "price": 299000,
    "checkoutUrl": "/checkout/beli-kelas-ekspor-pemula"
  }
}
```

**Side Effects:**
- Enrollment created with progress 0%
- Notification sent to student (email, WhatsApp, in-app)

---

### 14. Check Enrollment Status

**Endpoint:** `GET /api/courses/[id]/enroll`

**Auth:** MEMBER

**Response (Enrolled):**
```json
{
  "enrolled": true,
  "enrollment": {
    "id": "clx666enr",
    "courseId": "clx123abc",
    "userId": "clx444usr",
    "progress": 45,
    "completed": false,
    "createdAt": "2025-11-25T14:00:00Z"
  },
  "hasAccess": true,
  "accessSource": "direct" // or "membership", "group", "product"
}
```

**Response (Not Enrolled):**
```json
{
  "enrolled": false,
  "hasAccess": false,
  "course": {
    "id": "clx123abc",
    "title": "Panduan Ekspor untuk Pemula",
    "price": 299000,
    "monetizationType": "PAID"
  }
}
```

---

### 15. Get My Enrollments

**Endpoint:** `GET /api/enrollments`

**Auth:** MEMBER

**Query Parameters:**
- `status` (optional): `active`, `completed`
- `page` (optional): Pagination page number
- `limit` (optional): Items per page (default 10)

**Response:**
```json
{
  "enrollments": [
    {
      "id": "clx666enr",
      "courseId": "clx123abc",
      "course": {
        "id": "clx123abc",
        "title": "Panduan Ekspor untuk Pemula",
        "thumbnail": "https://...",
        "slug": "panduan-ekspor-pemula"
      },
      "progress": 45,
      "completed": false,
      "enrolledAt": "2025-11-25T14:00:00Z",
      "lastAccessedAt": "2025-11-25T16:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

---

## 🎬 Course Player APIs

### 16. Get Course Player Data

**Endpoint:** `GET /api/courses/[id]/player`

**Auth:** MEMBER (enrolled)

**Response:**
```json
{
  "course": {
    "id": "clx123abc",
    "title": "Panduan Ekspor untuk Pemula",
    "description": "Belajar ekspor...",
    "thumbnail": "https://..."
  },
  "modules": [
    {
      "id": "clx789ghi",
      "title": "Modul 1: Pengenalan Ekspor",
      "lessons": [
        {
          "id": "clx999jkl",
          "title": "Apa itu Ekspor?",
          "videoUrl": "https://youtube.com/...",
          "duration": 15,
          "order": 1,
          "completed": true
        },
        {
          "id": "clx998jkm",
          "title": "Jenis-jenis Ekspor",
          "videoUrl": "https://youtube.com/...",
          "duration": 18,
          "order": 2,
          "completed": false
        }
      ]
    }
  ],
  "progress": {
    "percentage": 45,
    "completedLessons": 5,
    "totalLessons": 11,
    "lastLesson": {
      "id": "clx999jkl",
      "title": "Apa itu Ekspor?"
    }
  },
  "enrollment": {
    "id": "clx666enr",
    "enrolledAt": "2025-11-25T14:00:00Z"
  }
}
```

---

### 17. Mark Lesson as Complete

**Endpoint:** `POST /api/courses/[courseId]/lessons/[lessonId]/complete`

**Auth:** MEMBER (enrolled)

**Response:**
```json
{
  "success": true,
  "message": "Lesson marked as complete",
  "progress": {
    "lessonId": "clx999jkl",
    "completed": true,
    "completedAt": "2025-11-25T17:00:00Z"
  },
  "courseProgress": {
    "percentage": 54,
    "completedLessons": 6,
    "totalLessons": 11
  },
  "certificateGenerated": false
}
```

**Side Effects:**
- Lesson marked as complete
- Course progress updated
- If 100% complete → Certificate auto-generated
- Notification sent if certificate earned

---

## 📝 Quiz APIs

### 18. Get Quiz

**Endpoint:** `GET /api/courses/[courseId]/quizzes/[quizId]`

**Auth:** MEMBER (enrolled)

**Response:**
```json
{
  "id": "clx555quz",
  "title": "Quiz Modul 1",
  "description": "Test pemahaman Anda",
  "passingScore": 70,
  "timeLimit": 30,
  "maxAttempts": 3,
  "questions": [
    {
      "id": "clx444que",
      "type": "MULTIPLE_CHOICE",
      "question": "Apa kepanjangan dari B/L?",
      "options": [
        {
          "id": "opt1",
          "text": "Bill of Lading",
          "isCorrect": true
        },
        {
          "id": "opt2",
          "text": "Bill of Loading",
          "isCorrect": false
        },
        {
          "id": "opt3",
          "text": "Bill of Letter",
          "isCorrect": false
        }
      ]
    },
    {
      "id": "clx445que",
      "type": "TRUE_FALSE",
      "question": "Ekspor adalah kegiatan menjual barang ke luar negeri",
      "correctAnswer": true
    },
    {
      "id": "clx446que",
      "type": "ESSAY",
      "question": "Jelaskan proses ekspor dari awal hingga akhir"
    }
  ],
  "attempts": [
    {
      "attemptNumber": 1,
      "score": 65,
      "passed": false,
      "submittedAt": "2025-11-20T10:00:00Z"
    }
  ],
  "remainingAttempts": 2
}
```

---

### 19. Submit Quiz

**Endpoint:** `POST /api/courses/[courseId]/quizzes/[quizId]/submit`

**Auth:** MEMBER (enrolled)

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "clx444que",
      "selectedOptionId": "opt1"
    },
    {
      "questionId": "clx445que",
      "answer": true
    },
    {
      "questionId": "clx446que",
      "answer": "Proses ekspor dimulai dengan..."
    }
  ],
  "timeSpent": 25 // minutes
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "attempt": {
    "id": "clx777att",
    "attemptNumber": 2,
    "score": 85,
    "passed": true,
    "autoGradedScore": 75,
    "manualGradingPending": true,
    "submittedAt": "2025-11-25T18:00:00Z"
  },
  "results": {
    "correctAnswers": 8,
    "wrongAnswers": 2,
    "pendingGrading": 1,
    "totalQuestions": 11
  }
}
```

**Side Effects:**
- Quiz attempt saved
- Auto-grading for MC and T/F
- Manual grading pending for Essay
- Progress updated if passed

---

## 🏆 Certificate APIs

### 20. Get My Certificates

**Endpoint:** `GET /api/certificates`

**Auth:** MEMBER

**Response:**
```json
{
  "certificates": [
    {
      "id": "clx888cer",
      "courseId": "clx123abc",
      "course": {
        "id": "clx123abc",
        "title": "Panduan Ekspor untuk Pemula",
        "thumbnail": "https://..."
      },
      "userId": "clx444usr",
      "certificateNumber": "EKSPORYUK-2025-001234",
      "issuedAt": "2025-11-25T19:00:00Z",
      "downloadUrl": "/api/certificates/clx888cer/download",
      "verificationUrl": "/verify-certificate/EKSPORYUK-2025-001234"
    }
  ]
}
```

---

### 21. Download Certificate

**Endpoint:** `GET /api/certificates/[id]/download`

**Auth:** MEMBER (owns certificate)

**Response:** PDF file download

**Side Effects:**
- PDF generated on-the-fly
- Certificate includes:
  - Student name
  - Course title
  - Completion date
  - Certificate number
  - QR code for verification

---

### 22. Verify Certificate

**Endpoint:** `GET /api/certificates/verify?number=[certificateNumber]`

**Auth:** Public (no auth required)

**Query Parameters:**
- `number`: Certificate number (e.g., EKSPORYUK-2025-001234)

**Response (Valid):**
```json
{
  "valid": true,
  "certificate": {
    "certificateNumber": "EKSPORYUK-2025-001234",
    "studentName": "John Doe",
    "courseTitle": "Panduan Ekspor untuk Pemula",
    "issuedAt": "2025-11-25T19:00:00Z",
    "verifiedAt": "2025-11-26T10:00:00Z"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "Certificate not found or invalid"
}
```

---

## 🔔 Notification APIs

### 23. Get Notifications

**Endpoint:** `GET /api/notifications`

**Auth:** Any authenticated user

**Query Parameters:**
- `type` (optional): Filter by notification type
- `read` (optional): `true` | `false`
- `page` (optional): Pagination
- `limit` (optional): Items per page

**Response:**
```json
{
  "notifications": [
    {
      "id": "clx999not",
      "type": "COURSE_APPROVED",
      "title": "Kursus Disetujui! 🎉",
      "message": "Kursus \"Panduan Ekspor\" telah disetujui",
      "link": "/mentor/courses/clx123abc",
      "read": false,
      "createdAt": "2025-11-25T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "total": 23
}
```

---

### 24. Mark Notification as Read

**Endpoint:** `PUT /api/notifications/[id]/read`

**Auth:** Any authenticated user

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "clx999not",
    "read": true,
    "readAt": "2025-11-26T10:00:00Z"
  }
}
```

---

## 📊 Analytics APIs

### 25. Admin Analytics

**Endpoint:** `GET /api/admin/analytics/courses`

**Auth:** ADMIN only

**Response:**
```json
{
  "overview": {
    "totalCourses": 12,
    "publishedCourses": 8,
    "pendingCourses": 2,
    "totalEnrollments": 234,
    "activeEnrollments": 156,
    "activeStudents": 89,
    "completedEnrollments": 78,
    "completionRate": "33.3",
    "totalCertificates": 78,
    "totalRevenue": 45000000
  },
  "topCourses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "thumbnail": "https://...",
      "enrollmentCount": 45
    }
  ],
  "enrollmentTrends": [
    {
      "date": "2025-11-01",
      "enrollments": 12
    },
    {
      "date": "2025-11-02",
      "enrollments": 15
    }
  ],
  "recentEnrollments": [
    {
      "userName": "John Doe",
      "courseTitle": "Panduan Ekspor untuk Pemula",
      "enrolledAt": "2025-11-25T14:00:00Z"
    }
  ],
  "completionRatesByCourse": [
    {
      "courseId": "clx123abc",
      "courseTitle": "Panduan Ekspor untuk Pemula",
      "totalEnrollments": 45,
      "completedEnrollments": 23,
      "completionRate": "51.1"
    }
  ]
}
```

---

### 26. Mentor Analytics

**Endpoint:** `GET /api/mentor/analytics`

**Auth:** MENTOR

**Response:**
```json
{
  "overview": {
    "totalCourses": 3,
    "publishedCourses": 2,
    "totalEnrollments": 67,
    "activeStudents": 45,
    "completedEnrollments": 22,
    "completionRate": "32.8",
    "totalCertificates": 22,
    "totalRevenue": 15000000,
    "mentorCommission": 7500000
  },
  "topCourses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "thumbnail": "https://...",
      "enrollmentCount": 45
    }
  ],
  "enrollmentTrends": [
    {
      "date": "2025-11-01",
      "enrollments": 5
    }
  ],
  "recentStudents": [
    {
      "id": "clx666enr",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "userAvatar": "https://...",
      "courseTitle": "Panduan Ekspor untuk Pemula",
      "enrolledAt": "2025-11-25T14:00:00Z",
      "progress": 45
    }
  ],
  "courseProgress": [
    {
      "courseId": "clx123abc",
      "courseTitle": "Panduan Ekspor untuk Pemula",
      "totalStudents": 45,
      "averageProgress": 67,
      "completedStudents": 23
    }
  ]
}
```

---

## 🎯 Membership Integration APIs

### 27. Get Membership Courses (Admin)

**Endpoint:** `GET /api/admin/memberships/[id]/courses`

**Auth:** ADMIN

**Response:**
```json
{
  "membership": {
    "id": "clx111mem",
    "name": "Premium Membership",
    "price": 999000
  },
  "courses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "thumbnail": "https://...",
      "price": 299000,
      "enrollmentCount": 45
    }
  ],
  "total": 5
}
```

---

### 28. Assign Courses to Membership

**Endpoint:** `POST /api/admin/memberships/[id]/courses`

**Auth:** ADMIN

**Request Body:**
```json
{
  "courseIds": ["clx123abc", "clx456def", "clx789ghi"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 courses assigned to membership",
  "membership": {
    "id": "clx111mem",
    "name": "Premium Membership"
  }
}
```

**Side Effects:**
- Courses linked to membership
- Existing members auto-enrolled

---

### 29. Get My Membership Courses (Member)

**Endpoint:** `GET /api/memberships/[id]/courses`

**Auth:** MEMBER (active membership)

**Response:**
```json
{
  "membership": {
    "id": "clx111mem",
    "name": "Premium Membership",
    "expiresAt": "2026-11-25T00:00:00Z"
  },
  "courses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "thumbnail": "https://...",
      "slug": "panduan-ekspor-pemula",
      "enrolled": true,
      "progress": 45
    }
  ],
  "hasAccess": true
}
```

---

## 👥 Group Integration APIs

### 30. Get Group Courses (Admin)

**Endpoint:** `GET /api/admin/groups/[id]/courses`

**Auth:** ADMIN

**Response:**
```json
{
  "group": {
    "id": "clx222grp",
    "name": "Export Club Premium",
    "description": "Exclusive export community"
  },
  "courses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "thumbnail": "https://...",
      "price": 299000,
      "mentorName": "Siti Mentor",
      "enrollmentCount": 45
    }
  ],
  "total": 3
}
```

---

### 31. Assign Courses to Group

**Endpoint:** `POST /api/admin/groups/[id]/courses`

**Auth:** ADMIN

**Request Body:**
```json
{
  "courseIds": ["clx123abc", "clx456def"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "2 courses assigned to group",
  "autoEnrolled": 15
}
```

**Side Effects:**
- Courses assigned to group (groupId set)
- All group members auto-enrolled
- Auto-enroll count returned

---

### 32. Get My Group Courses (Member)

**Endpoint:** `GET /api/groups/[id]/courses`

**Auth:** MEMBER (group member)

**Response:**
```json
{
  "group": {
    "id": "clx222grp",
    "name": "Export Club Premium",
    "slug": "export-club-premium"
  },
  "courses": [
    {
      "id": "clx123abc",
      "title": "Panduan Ekspor untuk Pemula",
      "thumbnail": "https://...",
      "slug": "panduan-ekspor-pemula",
      "enrolled": true,
      "progress": 45
    }
  ],
  "isMember": true
}
```

---

## 🛡️ Error Responses

All API endpoints follow consistent error response format:

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Course not found"
}
```

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request body",
  "details": {
    "field": "price",
    "error": "Price must be a positive number"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 🔄 Webhook Events

### Course Status Change
```json
{
  "event": "course.status_changed",
  "timestamp": "2025-11-25T10:00:00Z",
  "data": {
    "courseId": "clx123abc",
    "oldStatus": "PENDING_REVIEW",
    "newStatus": "APPROVED",
    "changedBy": "clx999admin"
  }
}
```

### Enrollment Created
```json
{
  "event": "enrollment.created",
  "timestamp": "2025-11-25T14:00:00Z",
  "data": {
    "enrollmentId": "clx666enr",
    "courseId": "clx123abc",
    "userId": "clx444usr",
    "source": "direct" // or "membership", "group", "product"
  }
}
```

### Certificate Issued
```json
{
  "event": "certificate.issued",
  "timestamp": "2025-11-25T19:00:00Z",
  "data": {
    "certificateId": "clx888cer",
    "certificateNumber": "EKSPORYUK-2025-001234",
    "courseId": "clx123abc",
    "userId": "clx444usr"
  }
}
```

---

## 📚 Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Meta:**
```json
{
  "data": [...],
  "meta": {
    "total": 234,
    "page": 1,
    "limit": 10,
    "totalPages": 24,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔍 Filtering & Sorting

### Filtering
Use query parameters:
- `status=PUBLISHED`
- `mentorId=clx456def`
- `level=BEGINNER`
- `monetizationType=FREE`

### Sorting
Use `sort` and `order`:
- `sort=createdAt&order=desc`
- `sort=price&order=asc`
- `sort=enrollmentCount&order=desc`

### Search
Use `search` parameter:
- `search=ekspor` (searches in title and description)

---

## 📦 Rate Limiting

**Limits:**
- Public endpoints: 100 requests/minute
- Authenticated endpoints: 300 requests/minute
- Admin endpoints: 1000 requests/minute

**Headers:**
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 285
X-RateLimit-Reset: 1732567890
```

---

## 🧪 Testing

### Postman Collection
Download: `/docs/postman/eksporyuk-lms-api.json`

### API Base URL
- Development: `http://localhost:3000`
- Production: `https://eksporyuk.com`

### Test Accounts
```
Admin: admin@eksporyuk.com / password123
Mentor: mentor@eksporyuk.com / password123
Member: member@eksporyuk.com / password123
```

---

**Last Updated:** November 25, 2025  
**API Version:** 1.0  
**Contact:** api@eksporyuk.com
