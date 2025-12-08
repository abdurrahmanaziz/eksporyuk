# LMS Testing Guide

Panduan lengkap untuk testing semua fitur Learning Management System (LMS) di EksporYuk.

## 📋 Testing Checklist

### ✅ 1. Admin Course Management
- [ ] Create course (DRAFT status)
- [ ] Edit course details
- [ ] Upload course thumbnail
- [ ] Add modules and lessons
- [ ] Review submitted courses
- [ ] Approve/Reject courses
- [ ] Publish courses
- [ ] Delete courses
- [ ] View course analytics

### ✅ 2. Instructor (Mentor) Dashboard
- [ ] Create new course
- [ ] Edit course content
- [ ] Add modules & lessons
- [ ] Submit course for review
- [ ] View course status
- [ ] View student progress
- [ ] Access analytics dashboard

### ✅ 3. Student Enrollment & Learning
- [ ] Browse available courses
- [ ] Enroll in FREE course
- [ ] Enroll in PAID course (via payment)
- [ ] Access course player
- [ ] Watch video lessons
- [ ] Complete lessons
- [ ] Track progress percentage

### ✅ 4. Quiz & Assignment System
- [ ] Create quiz with multiple choice questions
- [ ] Create quiz with true/false questions
- [ ] Create essay questions
- [ ] Student takes quiz
- [ ] Auto-grading (MC & T/F)
- [ ] Manual grading (Essay)
- [ ] View quiz results
- [ ] Retry quiz (if allowed)

### ✅ 5. Certificate System
- [ ] Complete all course requirements
- [ ] Auto-generate certificate
- [ ] Download certificate (PDF)
- [ ] Verify certificate authenticity
- [ ] View certificate in dashboard

### ✅ 6. Membership Integration
- [ ] Admin assigns course to membership plan
- [ ] Member with active membership can access course
- [ ] Member without membership cannot access
- [ ] Member views membership courses list
- [ ] Auto-enroll when membership activated

### ✅ 7. Group Integration
- [ ] Admin assigns course to group
- [ ] Group members auto-enrolled
- [ ] New member joins group → auto-enrolled to group courses
- [ ] Group course access validation
- [ ] Group members view group courses

### ✅ 8. Notification System
- [ ] Course approval notification (Email + WhatsApp + In-app)
- [ ] Course rejection notification
- [ ] Enrollment confirmation
- [ ] New lesson available notification
- [ ] Certificate earned notification
- [ ] Study reminder (inactive users)
- [ ] Quiz deadline reminder
- [ ] Assignment deadline reminder

### ✅ 9. Analytics Dashboards
- [ ] Admin analytics: enrollment trends
- [ ] Admin analytics: completion rates
- [ ] Admin analytics: top courses
- [ ] Admin analytics: revenue stats
- [ ] Mentor analytics: student progress
- [ ] Mentor analytics: quiz scores
- [ ] Mentor analytics: course performance
- [ ] Mentor analytics: commission earnings

### ✅ 10. Discussion Forum
- [ ] Create discussion topic
- [ ] Reply to discussion
- [ ] Like discussion
- [ ] Pin important discussions
- [ ] Mentor responds to questions

---

## 🧪 Detailed Test Scenarios

### Scenario 1: Complete Course Creation Workflow

**Actor:** Admin + Mentor + Student

**Steps:**
1. **Mentor Creates Course**
   ```
   Login as: mentor@eksporyuk.com
   Navigate to: /mentor/courses
   Click: "Buat Kursus Baru"
   Fill: Title, Description, Price, Duration, Level
   Submit → Status: DRAFT
   ```

2. **Mentor Adds Modules & Lessons**
   ```
   Navigate to: /mentor/courses/[courseId]
   Tab: "Modul & Pelajaran"
   Click: "Tambah Modul"
   Fill: Module Title, Order
   Submit
   
   Click: "Tambah Pelajaran"
   Fill: Lesson Title, Content, Video URL, Duration
   Submit
   
   Repeat for multiple modules/lessons
   ```

3. **Mentor Submits for Review**
   ```
   Click: "Submit untuk Review"
   Confirm
   Status changes: DRAFT → PENDING_REVIEW
   ```

4. **Admin Reviews Course**
   ```
   Login as: admin@eksporyuk.com
   Navigate to: /admin/courses
   Filter: "Pending Review"
   Click course
   Review content
   
   Option A (Approve):
   - Click: "Approve"
   - Status: PENDING_REVIEW → APPROVED
   - Mentor receives notification
   
   Option B (Reject):
   - Click: "Reject"
   - Provide reason
   - Status: PENDING_REVIEW → REJECTED
   - Mentor receives notification with reason
   ```

5. **Admin Publishes Course**
   ```
   Click: "Publish"
   Confirm
   Status: APPROVED → PUBLISHED
   isPublished: true
   publishedAt: current timestamp
   ```

6. **Student Enrolls**
   ```
   Login as: student@eksporyuk.com (or register)
   Navigate to: /dashboard/courses
   Click course
   Click: "Daftar Sekarang"
   
   If FREE:
   - Direct enrollment
   - Redirect to course player
   
   If PAID:
   - Redirect to checkout
   - Complete payment
   - Auto-enrolled after successful payment
   ```

7. **Student Completes Course**
   ```
   Navigate to: /dashboard/courses/[courseId]
   Watch each lesson
   Complete quizzes
   Submit assignments
   
   When 100% complete:
   - Certificate auto-generated
   - Notification sent
   - Certificate available for download
   ```

**Expected Results:**
- ✅ Course created successfully
- ✅ All status transitions work
- ✅ Notifications sent at each step
- ✅ Enrollment works for FREE/PAID
- ✅ Certificate generated on completion

---

### Scenario 2: Quiz & Assignment System

**Actor:** Mentor + Student

**Steps:**
1. **Mentor Creates Quiz**
   ```
   Login as: mentor@eksporyuk.com
   Navigate to: /mentor/courses/[courseId]
   Tab: "Quiz & Tugas"
   Click: "Buat Quiz"
   Fill:
   - Title: "Quiz Modul 1"
   - Passing Score: 70%
   - Time Limit: 30 minutes
   - Max Attempts: 3
   
   Add Questions:
   - Multiple Choice: 10 questions
   - True/False: 5 questions
   - Essay: 2 questions
   
   Submit
   ```

2. **Student Takes Quiz**
   ```
   Login as: student@eksporyuk.com
   Navigate to: /dashboard/courses/[courseId]
   Click: "Mulai Quiz"
   Answer questions
   Submit
   
   Auto-grading for MC & T/F
   Manual grading pending for Essay
   ```

3. **Mentor Grades Essay**
   ```
   Login as: mentor@eksporyuk.com
   Navigate to: /mentor/courses/[courseId]
   Tab: "Penilaian"
   View pending essay submissions
   Grade each essay (0-100)
   Add feedback
   Submit grades
   ```

4. **Student Views Results**
   ```
   Navigate to: /dashboard/courses/[courseId]
   Tab: "Quiz Saya"
   View score, correct answers, feedback
   
   If failed (< 70%):
   - Can retry (up to max attempts)
   
   If passed (≥ 70%):
   - Progress updated
   - Move to next lesson
   ```

**Expected Results:**
- ✅ Quiz created with mixed question types
- ✅ Auto-grading works correctly
- ✅ Manual grading by mentor
- ✅ Retry logic enforced
- ✅ Progress tracked accurately

---

### Scenario 3: Membership & Group Integration

**Actor:** Admin + Member

**Steps:**
1. **Admin Assigns Course to Membership**
   ```
   Login as: admin@eksporyuk.com
   Navigate to: /admin/membership-plans
   Click membership plan
   Tab: "Kursus"
   Select courses to include
   Save
   ```

2. **Member Activates Membership**
   ```
   Login as: member@eksporyuk.com
   Navigate to: /dashboard/membership
   Choose plan
   Complete payment
   Membership activated
   ```

3. **Member Auto-Enrolled to Courses**
   ```
   Check enrollments:
   - All membership courses auto-enrolled
   - Can access immediately
   ```

4. **Admin Assigns Course to Group**
   ```
   Login as: admin@eksporyuk.com
   Navigate to: /admin/groups
   Click group
   Tab: "Kursus"
   Select courses
   Save
   ```

5. **Group Members Auto-Enrolled**
   ```
   All existing members:
   - Auto-enrolled to group courses
   
   New member joins:
   - Auto-enrolled to all group courses
   ```

6. **Member Views Courses**
   ```
   Navigate to: /dashboard/my-membership/courses
   See all membership courses
   
   Navigate to: /community/groups/[groupId]/courses
   See all group courses
   ```

**Expected Results:**
- ✅ Courses assigned to membership
- ✅ Auto-enrollment on membership activation
- ✅ Courses assigned to group
- ✅ Auto-enrollment for group members
- ✅ Proper access control

---

### Scenario 4: Analytics Testing

**Actor:** Admin + Mentor

**Steps:**
1. **Admin Views Analytics**
   ```
   Login as: admin@eksporyuk.com
   Navigate to: /admin/analytics/courses
   
   Verify Data:
   - Total Courses: correct count
   - Active Students: unique enrolled users
   - Completion Rate: (completed / total) * 100
   - Total Revenue: sum of successful transactions
   - Enrollment Trends Chart: last 30 days
   - Top Courses: by enrollment count
   - Recent Enrollments: last 10
   ```

2. **Mentor Views Analytics**
   ```
   Login as: mentor@eksporyuk.com
   Navigate to: /mentor/analytics
   
   Verify Data:
   - My Courses: mentor's published courses
   - Total Students: enrolled in mentor's courses
   - Completion Rate: mentor's courses
   - My Commission: 50% of total revenue
   - Student Progress Chart: by course
   - Recent Students: last 10 enrollments
   ```

**Expected Results:**
- ✅ All stats calculated accurately
- ✅ Charts render correctly
- ✅ Commission calculation correct (50%)
- ✅ Real-time data updates

---

## 🔐 Access Control Testing

### Test Role-Based Access

| Feature | ADMIN | MENTOR | MEMBER | GUEST |
|---------|-------|--------|--------|-------|
| View all courses | ✅ | ❌ | ❌ | ❌ |
| Approve courses | ✅ | ❌ | ❌ | ❌ |
| Create course | ✅ | ✅ | ❌ | ❌ |
| Enroll in course | ✅ | ✅ | ✅ | ❌ |
| View analytics (all) | ✅ | ❌ | ❌ | ❌ |
| View analytics (own) | ✅ | ✅ | ❌ | ❌ |
| Assign to membership | ✅ | ❌ | ❌ | ❌ |
| Assign to group | ✅ | ❌ | ❌ | ❌ |

---

## 📊 Performance Testing

### Load Testing Targets
- [ ] 100 concurrent users browsing courses
- [ ] 50 concurrent video streams
- [ ] 20 concurrent quiz submissions
- [ ] Certificate generation < 3 seconds
- [ ] Analytics dashboard load < 2 seconds

### Database Query Optimization
- [ ] Course list query with pagination
- [ ] Enrollment check query indexed
- [ ] Analytics aggregation queries optimized
- [ ] N+1 query problems resolved

---

## 🐛 Bug Report Template

```markdown
**Title:** [Short description]

**Priority:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: Chrome 120
- Role: ADMIN / MENTOR / MEMBER
- URL: /admin/courses

**Screenshots:**
[Attach if applicable]

**Console Errors:**
```
[Paste console errors here]
```
```

---

## ✅ Final Acceptance Criteria

### Must Pass Before Production
- [ ] All test scenarios pass
- [ ] Zero TypeScript errors
- [ ] Zero console errors
- [ ] All notifications working (Email, WhatsApp, In-app)
- [ ] Certificate PDF generation works
- [ ] Payment integration tested
- [ ] Access control enforced
- [ ] Analytics data accurate
- [ ] Mobile responsive
- [ ] Loading states implemented
- [ ] Error handling complete

---

## 🚀 Testing Commands

```bash
# Check TypeScript errors
npm run type-check

# Run development server
npm run dev

# Check database
npx prisma studio

# View database
npx prisma db push

# Seed test data
npx prisma db seed
```

---

## 📞 Support

If you encounter issues during testing:
1. Check console for errors
2. Verify database schema is up-to-date
3. Check environment variables
4. Review API response in Network tab
5. Contact: admin@eksporyuk.com

---

**Last Updated:** November 25, 2025
**Version:** 1.0
**Status:** Ready for Testing
