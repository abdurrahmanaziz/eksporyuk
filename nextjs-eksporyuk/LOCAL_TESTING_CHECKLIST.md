# 🧪 LOCAL TESTING CHECKLIST

**Date:** November 25, 2025  
**Environment:** Development (localhost:3000)  
**Database:** SQLite (file:./dev.db)

---

## ✅ PRE-TESTING SETUP

- [x] .env file exists
- [x] Database configured (SQLite)
- [ ] Xendit TEST keys configured
- [ ] Server running (npm run dev)
- [ ] Database seeded with test data

---

## 📋 PHASE 1: AUTHENTICATION FLOW

### 1.1 User Registration
- [ ] Navigate to /auth/register
- [ ] Fill form with test data:
  - Email: test@example.com
  - Password: Test123!@#
  - Name: Test User
  - Phone: 081234567890
- [ ] Click "Daftar"
- [ ] Check success message
- [ ] Check email verification sent (if configured)
- [ ] Check database: User created

**SQL Check:**
```sql
SELECT id, email, name, emailVerified FROM User WHERE email = 'test@example.com';
```

**Expected:** User record exists, emailVerified = null (if email not configured)

### 1.2 Email Verification
- [ ] Get verification token from database
- [ ] Visit /auth/verify-email?token=xxx
- [ ] Check success message
- [ ] Check database: emailVerified = timestamp

**SQL Check:**
```sql
SELECT emailVerified FROM User WHERE email = 'test@example.com';
```

**Expected:** emailVerified has timestamp

### 1.3 Login
- [ ] Navigate to /auth/login
- [ ] Enter credentials (test@example.com / Test123!@#)
- [ ] Click "Login"
- [ ] Redirected to /dashboard
- [ ] Check session cookie set
- [ ] Check user info displayed

### 1.4 Protected Routes
- [ ] Try accessing /dashboard without login
- [ ] Expected: Redirect to /auth/login
- [ ] Login first
- [ ] Access /dashboard again
- [ ] Expected: Access granted

### 1.5 Logout
- [ ] Click "Logout" button
- [ ] Expected: Redirect to home
- [ ] Try accessing /dashboard
- [ ] Expected: Redirect to login

---

## 📋 PHASE 2: MEMBERSHIP PURCHASE

### 2.1 Select Membership
- [ ] Login as test user
- [ ] Navigate to membership page
- [ ] View available plans:
  - [ ] PRO (Rp 100,000/month)
  - [ ] LIFETIME (Rp 1,500,000)
  - [ ] 6_MONTHS (Rp 500,000)
- [ ] Click "Beli" on PRO plan

### 2.2 Checkout Flow
- [ ] Redirected to checkout page
- [ ] See order summary:
  - [ ] Plan name: PRO Membership
  - [ ] Price: Rp 100,000
  - [ ] Duration: 1 month
- [ ] Select payment method: Virtual Account
- [ ] Select bank: BCA
- [ ] Click "Bayar"

### 2.3 Virtual Account Generation
- [ ] Check transaction created in database
- [ ] Check VA number displayed
- [ ] Check payment instructions shown
- [ ] Check expiry time (24 hours)

**SQL Check:**
```sql
SELECT id, status, amount, paymentMethod, externalId 
FROM Transaction 
WHERE userId = 'test_user_id' 
ORDER BY createdAt DESC 
LIMIT 1;
```

**Expected:** Transaction status = 'PENDING'

### 2.4 Payment Simulation (TEST MODE)
- [ ] Note the transaction external_id
- [ ] Run payment test script:
  ```bash
  node test-xendit-payment.js
  ```
- [ ] Or manually trigger webhook

### 2.5 Membership Activation
- [ ] Check transaction status updated
- [ ] Check UserMembership created
- [ ] Check membership status: ACTIVE
- [ ] Check dashboard shows membership

**SQL Check:**
```sql
-- Transaction updated
SELECT status, paidAt FROM Transaction WHERE id = 'transaction_id';

-- UserMembership created
SELECT * FROM UserMembership WHERE transactionId = 'transaction_id';
```

**Expected:** 
- Transaction status = 'SUCCESS'
- UserMembership isActive = true, status = 'ACTIVE'

### 2.6 Auto-Features Granted
- [ ] Check groups joined (membership groups)
- [ ] Check courses enrolled (membership courses)
- [ ] Check products granted (membership products)

**SQL Check:**
```sql
-- Groups
SELECT g.name FROM GroupMember gm
JOIN "Group" g ON g.id = gm.groupId
WHERE gm.userId = 'test_user_id';

-- Courses
SELECT c.title FROM CourseEnrollment ce
JOIN Course c ON c.id = ce.courseId
WHERE ce.userId = 'test_user_id';
```

---

## 📋 PHASE 3: LMS FEATURES

### 3.1 Course Access
- [ ] Navigate to /my-courses
- [ ] See enrolled courses listed
- [ ] Click on a course
- [ ] See course content (lessons, modules)

### 3.2 Lesson Progress
- [ ] Click on first lesson
- [ ] Watch/read lesson content
- [ ] Mark as completed
- [ ] Check progress percentage updated

**SQL Check:**
```sql
SELECT progress FROM CourseEnrollment 
WHERE userId = 'test_user_id' AND courseId = 'course_id';
```

### 3.3 Quiz/Assignment
- [ ] Navigate to quiz section
- [ ] Answer questions
- [ ] Submit quiz
- [ ] Check score displayed
- [ ] Check results saved

### 3.4 Certificate
- [ ] Complete all lessons (100% progress)
- [ ] Navigate to certificate page
- [ ] Check certificate generated
- [ ] Download PDF certificate
- [ ] Verify certificate content

---

## 📋 PHASE 4: COMMUNITY GROUPS

### 4.1 Group Access
- [ ] Navigate to /community/groups
- [ ] See groups user is member of
- [ ] Click on a group
- [ ] See group feed

### 4.2 Create Post
- [ ] Click "Buat Post" button
- [ ] Write post content
- [ ] Upload image (optional)
- [ ] Click "Post"
- [ ] Check post appears in feed

### 4.3 Create Poll
- [ ] Click "Buat Polling" button
- [ ] Add poll question
- [ ] Add 2-4 options
- [ ] Set duration (1-168 hours)
- [ ] Create poll
- [ ] Vote on poll
- [ ] Check results update

### 4.4 Announcements (Admin/Moderator)
- [ ] Login as admin user
- [ ] Create announcement
- [ ] Check banner appears at top
- [ ] Dismiss announcement
- [ ] Check localStorage persistence

### 4.5 Moderation (Admin)
- [ ] Enable "Require Approval" setting
- [ ] Login as regular member
- [ ] Create post
- [ ] Check post status: PENDING
- [ ] Login as admin
- [ ] See pending posts queue
- [ ] Approve post
- [ ] Check post visible to all

---

## 📋 PHASE 5: ADMIN PANEL

### 5.1 Access Admin Panel
- [ ] Login as admin (role = ADMIN)
- [ ] Navigate to /admin
- [ ] Check access granted
- [ ] Try as regular user
- [ ] Expected: Access denied

### 5.2 User Management
- [ ] Navigate to /admin/users
- [ ] See all users listed
- [ ] Search for user
- [ ] View user details
- [ ] Edit user role
- [ ] Check role updated

### 5.3 Membership Management
- [ ] Navigate to /admin/memberships
- [ ] See all memberships
- [ ] Create new membership plan
- [ ] Edit existing plan
- [ ] Deactivate plan

### 5.4 Transaction Monitoring
- [ ] Navigate to /admin/transactions
- [ ] See all transactions
- [ ] Filter by status (SUCCESS, PENDING, FAILED)
- [ ] View transaction details
- [ ] Check payment method, amount, date

### 5.5 Revenue Tracking
- [ ] Navigate to /admin/revenue
- [ ] See total revenue
- [ ] See revenue breakdown:
  - [ ] Founder share (60%)
  - [ ] Co-founder share (40%)
  - [ ] Company fee (15%)
  - [ ] Affiliate commissions (10%)
- [ ] Export revenue report

---

## 📋 PHASE 6: ERROR HANDLING

### 6.1 Form Validation
- [ ] Try submit empty registration form
- [ ] Check validation errors shown
- [ ] Try invalid email format
- [ ] Check error message

### 6.2 Payment Errors
- [ ] Try payment with expired transaction
- [ ] Check error message
- [ ] Try payment with invalid data
- [ ] Check error handling

### 6.3 Unauthorized Access
- [ ] Logout
- [ ] Try access /admin
- [ ] Expected: Redirect to login
- [ ] Login as regular user
- [ ] Try access /admin
- [ ] Expected: Access denied message

---

## 📋 PHASE 7: PERFORMANCE CHECK

### 7.1 Page Load Times
- [ ] Homepage: < 2 seconds
- [ ] Dashboard: < 3 seconds
- [ ] Course page: < 2 seconds
- [ ] Admin panel: < 3 seconds

### 7.2 Database Queries
- [ ] Check no N+1 queries
- [ ] Check proper indexing
- [ ] Check query performance

### 7.3 API Response Times
- [ ] /api/courses: < 500ms
- [ ] /api/memberships: < 500ms
- [ ] /api/transactions: < 1s

---

## ✅ TESTING RESULTS

### Passed Tests: ___ / ___

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Performance Issues:
1. 
2. 
3. 

---

## 🎯 READY FOR PRODUCTION?

- [ ] All critical features working
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Xendit LIVE keys configured
- [ ] Domain configured
- [ ] Monitoring setup

**Decision:** 
- [ ] ✅ READY FOR PRODUCTION
- [ ] ⚠️ NEEDS FIXES (list above)
- [ ] ❌ NOT READY (major issues)

---

**Tested By:** ___________  
**Date:** ___________  
**Sign Off:** ___________
