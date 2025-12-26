# 🚀 NOTIFICATION IMPLEMENTATION GUIDE

**Tanggal**: 26 Desember 2024 03:50 WIB  
**Status**: Ready for Implementation

---

## 📊 Current Implementation Status

### ✅ Already Implemented

1. **Comment Notifications** (`/api/posts/[id]/comments/route.ts`)
   - ✅ Notify post author when someone comments
   - ✅ Notify parent commenter when someone replies
   - ✅ Notify mentioned users in comments
   - ✅ Uses Pusher + OneSignal channels

### ❌ Missing Critical Implementations

1. **Post Like Notifications** - 0% implemented
2. **New Post in Group Notifications** - 0% implemented  
3. **Course Progress Notifications** - 0% implemented
4. **Course Completion Notifications** - 0% implemented
5. **Following Activity Notifications** - 0% implemented
6. **Transaction/Payment Notifications** - Partially (admin only)

---

## 🎯 Implementation Priority

### **Phase 1: Essential (Week 1)**

#### 1.1 Post Like Notifications
**File**: `/src/app/api/posts/[id]/like/route.ts`  
**Status**: ❌ Not Implemented  
**Priority**: 🔥 CRITICAL

**Current Code** (Line 46-66):
```typescript
// Create like and increment count
await prisma.$transaction([
  prisma.postLike.create({
    data: {
      postId: id,
      userId: session.user.id,
    },
  }),
  prisma.post.update({
    where: { id },
    data: {
      likesCount: {
        increment: 1,
      },
    },
  }),
])

return NextResponse.json({ message: 'Post liked' }, { status: 201 })
```

**Implementation Required**:
```typescript
// Create like and increment count
await prisma.$transaction([
  prisma.postLike.create({
    data: {
      postId: id,
      userId: session.user.id,
    },
  }),
  prisma.post.update({
    where: { id },
    data: {
      likesCount: {
        increment: 1,
      },
    },
  }),
])

// 🔔 NOTIFICATION: Notify post author (if not self-like)
if (post.authorId !== session.user.id) {
  await notificationService.send({
    userId: post.authorId,
    type: 'POST_LIKE',
    title: 'Like Baru',
    message: `${session.user.name} menyukai postingan Anda`,
    postId: id,
    actorId: session.user.id,
    actorName: session.user.name,
    redirectUrl: `/posts/${id}`,
    channels: ['pusher'] // Real-time only, no push for likes
  })
}

return NextResponse.json({ message: 'Post liked' }, { status: 201 })
```

**Import Required**:
```typescript
import { notificationService } from '@/lib/services/notificationService'
```

---

#### 1.2 New Post in Group Notifications
**File**: `/src/app/api/posts/route.ts`  
**Status**: ❌ Not Implemented  
**Priority**: 🔥 CRITICAL

**What to Add**: After creating a post in a group, notify all group members

**Implementation Steps**:
1. Read the POST handler in `/src/app/api/posts/route.ts`
2. After successful post creation, add notification logic
3. Get all group members (exclude post author)
4. Send bulk notification via `notificationService.sendBulk()`

**Example Code**:
```typescript
// After post is created in a group
if (post.groupId) {
  // Get group members (exclude author)
  const groupMembers = await prisma.groupMembership.findMany({
    where: {
      groupId: post.groupId,
      userId: { not: session.user.id },
      status: 'APPROVED'
    },
    select: { userId: true }
  })

  if (groupMembers.length > 0) {
    // Get group info for notification message
    const group = await prisma.group.findUnique({
      where: { id: post.groupId },
      select: { name: true, slug: true }
    })

    // Send bulk notification
    await notificationService.sendBulk({
      userIds: groupMembers.map(m => m.userId),
      type: 'GROUP_POST',
      title: 'Postingan Baru di Grup',
      message: `${session.user.name} membuat postingan di ${group?.name}`,
      postId: post.id,
      groupId: post.groupId,
      actorId: session.user.id,
      actorName: session.user.name,
      redirectUrl: `/groups/${group?.slug}/posts/${post.id}`,
      channels: ['pusher', 'onesignal']
    })
  }
}
```

---

#### 1.3 Course Completion Notifications
**File**: `/src/app/api/courses/[slug]/progress/route.ts`  
**Status**: ❌ Not Implemented  
**Priority**: 🔥 CRITICAL

**Current Code** (Line 155-158):
```typescript
if (!existingCertificate) {
  await prisma.certificate.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      issuedAt: new Date(),
      certificateNumber: `CERT-${course.slug.toUpperCase()}-${session.user.id.substring(0, 8).toUpperCase()}-${Date.now()}`
    }
  })
}
```

**Implementation Required** (Add after certificate creation):
```typescript
if (!existingCertificate) {
  const certificate = await prisma.certificate.create({
    data: {
      userId: session.user.id,
      courseId: course.id,
      issuedAt: new Date(),
      certificateNumber: `CERT-${course.slug.toUpperCase()}-${session.user.id.substring(0, 8).toUpperCase()}-${Date.now()}`
    }
  })

  // 🔔 NOTIFICATION: Course completion congratulations
  await notificationService.send({
    userId: session.user.id,
    type: 'COURSE_COMPLETE',
    title: '🎉 Selamat! Kursus Selesai',
    message: `Anda telah menyelesaikan kursus "${course.title}". Sertifikat Anda sudah siap!`,
    courseId: course.id,
    certificateId: certificate.id,
    redirectUrl: `/learn/${course.slug}/certificate`,
    channels: ['pusher', 'onesignal', 'email'] // Multi-channel for important milestone
  })
}
```

---

#### 1.4 New Lesson Unlocked Notifications
**File**: `/src/app/api/courses/[slug]/progress/route.ts`  
**Status**: ❌ Not Implemented  
**Priority**: 🔥 HIGH

**What to Add**: When a lesson is completed and the next lesson unlocks, notify the user

**Implementation Logic**:
```typescript
// After updating progress, check if new lesson unlocked
if (completed && completedLessons.length > 0) {
  // Find next lesson in sequence
  let nextLesson = null
  for (const module of course.modules) {
    const currentLessonIndex = module.lessons.findIndex(l => l.id === lessonId)
    if (currentLessonIndex !== -1 && currentLessonIndex < module.lessons.length - 1) {
      // Next lesson in same module
      nextLesson = module.lessons[currentLessonIndex + 1]
      break
    } else if (currentLessonIndex === module.lessons.length - 1) {
      // Last lesson in module, check next module
      const moduleIndex = course.modules.indexOf(module)
      if (moduleIndex < course.modules.length - 1) {
        nextLesson = course.modules[moduleIndex + 1].lessons[0]
        break
      }
    }
  }

  if (nextLesson) {
    // 🔔 NOTIFICATION: New lesson unlocked
    await notificationService.send({
      userId: session.user.id,
      type: 'LESSON_UNLOCK',
      title: '✨ Pelajaran Baru Terbuka',
      message: `Pelajaran berikutnya tersedia: ${nextLesson.title}`,
      courseId: course.id,
      lessonId: nextLesson.id,
      redirectUrl: `/learn/${course.slug}/lessons/${nextLesson.slug}`,
      channels: ['pusher', 'onesignal']
    })
  }
}
```

---

### **Phase 2: Important (Week 2)**

#### 2.1 Following Activity Notifications
**Files**: Multiple following-related endpoints

**What to Implement**:
- Notify user when someone follows them
- Notify followers when user creates new post (timeline)

**Example**:
```typescript
// In follow endpoint
await notificationService.send({
  userId: targetUserId,
  type: 'FOLLOW',
  title: 'Pengikut Baru',
  message: `${session.user.name} mulai mengikuti Anda`,
  actorId: session.user.id,
  actorName: session.user.name,
  redirectUrl: `/profile/${session.user.username}`,
  channels: ['pusher', 'onesignal']
})
```

#### 2.2 Comment Like Notifications
**File**: `/src/app/api/comments/[id]/reactions/route.ts`  
**Status**: ❌ Not Implemented

**What to Add**:
```typescript
// Notify comment author when someone likes their comment
if (comment.userId !== session.user.id) {
  await notificationService.send({
    userId: comment.userId,
    type: 'COMMENT_LIKE',
    title: 'Like pada Komentar',
    message: `${session.user.name} menyukai komentar Anda`,
    commentId: commentId,
    postId: comment.postId,
    redirectUrl: `/posts/${comment.postId}#comment-${commentId}`,
    channels: ['pusher']
  })
}
```

#### 2.3 Group Invitation Notifications
**What to Implement**:
- Notify user when invited to join a group
- Notify admin when someone requests to join private group
- Notify user when their join request is approved/rejected

#### 2.4 Event Reminder Notifications
**File**: Scheduled job (needs cron setup)

**What to Implement**:
- 24 hours before event: Reminder notification
- 1 hour before event: Final reminder
- Event started: "Event is now live" notification

---

### **Phase 3: Enhanced Features (Month 2)**

#### 3.1 Transaction Notifications (Enhanced)
**Files**: Payment webhook handlers

**What to Add**:
- ✅ Payment success notification
- ✅ Payment pending notification  
- ✅ Payment failed notification
- ✅ Commission earned notification (for affiliates)

#### 3.2 Admin Broadcast System
**New File**: `/src/app/api/admin/notifications/broadcast/route.ts`

**Features**:
- Send to all users
- Send to specific roles (MEMBER_PREMIUM, AFFILIATE, etc)
- Send to specific groups
- Schedule future broadcasts

**Example**:
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, message, targetType, targetIds, channels, scheduledFor } = await request.json()

  let userIds: string[] = []

  if (targetType === 'ALL') {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    })
    userIds = users.map(u => u.id)
  } else if (targetType === 'ROLE') {
    // Get users by role
    const users = await prisma.user.findMany({
      where: { role: { in: targetIds } },
      select: { id: true }
    })
    userIds = users.map(u => u.id)
  } else if (targetType === 'GROUP') {
    // Get group members
    const members = await prisma.groupMembership.findMany({
      where: { groupId: { in: targetIds } },
      select: { userId: true }
    })
    userIds = [...new Set(members.map(m => m.userId))]
  }

  // Send bulk notification
  await notificationService.sendBulk({
    userIds,
    type: 'SYSTEM',
    title,
    message,
    channels: channels || ['pusher', 'onesignal', 'email'],
    scheduledFor
  })

  return NextResponse.json({ 
    success: true, 
    recipientsCount: userIds.length 
  })
}
```

#### 3.3 Real-Time Typing Indicators
**File**: New WebSocket channel for chat/comments

**Implementation**:
```typescript
// Client side
pusherClient.trigger('presence-channel', 'client-typing', {
  userId: currentUser.id,
  userName: currentUser.name,
  location: 'comment-section-123'
})

// Server side (no action needed, client-to-client event)
```

#### 3.4 Online Status Indicators
**Already Implemented**: `/src/app/api/users/presence/route.ts`

**Enhancement Needed**:
- Add UI component to show online status
- Add "last seen" timestamp
- Add "currently viewing" page indicator

---

## 📝 Step-by-Step Implementation Checklist

### Setup (Do Once)

- [ ] **Create Pusher Account**
  1. Go to https://pusher.com/channels
  2. Create new app "EksporYuk"
  3. Select region: ap-southeast-1 (Singapore)
  4. Get credentials from "App Keys" tab

- [ ] **Create OneSignal Account**
  1. Go to https://onesignal.com
  2. Create new app "EksporYuk"
  3. Platform: Web Push
  4. Configure site URL: https://eksporyuk.com
  5. Upload notification icon (eksporyuk logo)
  6. Get App ID and REST API Key

- [ ] **Update Environment Variables**
  ```bash
  # Local (.env.local)
  PUSHER_APP_ID="your_app_id"
  NEXT_PUBLIC_PUSHER_KEY="your_key"
  PUSHER_SECRET="your_secret"
  NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
  ONESIGNAL_APP_ID="your_app_id"
  ONESIGNAL_API_KEY="your_rest_api_key"
  
  # Production (Vercel)
  vercel env add PUSHER_APP_ID production
  vercel env add NEXT_PUBLIC_PUSHER_KEY production
  vercel env add PUSHER_SECRET production
  vercel env add NEXT_PUBLIC_PUSHER_CLUSTER production
  vercel env add ONESIGNAL_APP_ID production
  vercel env add ONESIGNAL_API_KEY production
  ```

- [ ] **Update Database Schema** (if needed)
  ```bash
  cd nextjs-eksporyuk
  npx prisma db push
  npx prisma generate
  ```

- [ ] **Install OneSignal SDK**
  ```bash
  npm install react-onesignal
  ```

- [ ] **Add OneSignal to Layout** (`/src/app/layout.tsx`)

### Phase 1 Implementation (Week 1)

- [ ] **Implement Post Like Notifications**
  - [ ] Add import to `/src/app/api/posts/[id]/like/route.ts`
  - [ ] Add notification after like creation (line 67)
  - [ ] Test: Like a post → Author gets notification
  - [ ] Deploy to production

- [ ] **Implement New Post in Group Notifications**
  - [ ] Read `/src/app/api/posts/route.ts` POST handler
  - [ ] Add group member query after post creation
  - [ ] Add bulk notification call
  - [ ] Test: Create post in group → Members get notified
  - [ ] Deploy to production

- [ ] **Implement Course Completion Notifications**
  - [ ] Add notification after certificate creation (line 158)
  - [ ] Test: Complete a course → Get congratulations
  - [ ] Deploy to production

- [ ] **Implement Lesson Unlock Notifications**
  - [ ] Add logic to detect next unlocked lesson
  - [ ] Add notification for new lesson
  - [ ] Test: Complete lesson → Get next lesson notification
  - [ ] Deploy to production

### Phase 2 Implementation (Week 2)

- [ ] **Implement Following Notifications**
  - [ ] Find follow endpoint
  - [ ] Add notification on new follow
  - [ ] Test and deploy

- [ ] **Implement Comment Like Notifications**
  - [ ] Update `/src/app/api/comments/[id]/reactions/route.ts`
  - [ ] Add notification logic
  - [ ] Test and deploy

- [ ] **Implement Group Invitation Notifications**
  - [ ] Create invite notification
  - [ ] Create approval notification
  - [ ] Test and deploy

### Phase 3 Implementation (Month 2)

- [ ] **Implement Admin Broadcast System**
  - [ ] Create `/src/app/api/admin/notifications/broadcast/route.ts`
  - [ ] Create admin UI for broadcast
  - [ ] Test and deploy

- [ ] **Enhance Transaction Notifications**
  - [ ] Update payment webhooks
  - [ ] Add multi-channel delivery
  - [ ] Test and deploy

- [ ] **Add Real-Time Features**
  - [ ] Typing indicators
  - [ ] Online status UI
  - [ ] Live counters
  - [ ] Test and deploy

---

## 🧪 Testing Scripts

### Test Pusher Connection
```javascript
// test-pusher-connection.js
const PusherServer = require('pusher')

const pusher = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true
})

async function test() {
  try {
    const result = await pusher.trigger('test-channel', 'test-event', {
      message: 'Hello from EksporYuk!'
    })
    console.log('✅ Pusher working:', result)
  } catch (error) {
    console.error('❌ Pusher error:', error)
  }
}

test()
```

### Test OneSignal Push
```javascript
// test-onesignal-push.js
const https = require('https')

const data = JSON.stringify({
  app_id: process.env.ONESIGNAL_APP_ID,
  headings: { en: 'Test from EksporYuk' },
  contents: { en: 'Testing OneSignal integration' },
  included_segments: ['Subscribed Users']
})

const options = {
  hostname: 'onesignal.com',
  path: '/api/v1/notifications',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
  }
}

const req = https.request(options, res => {
  res.on('data', d => {
    console.log('✅ OneSignal response:', d.toString())
  })
})

req.on('error', error => {
  console.error('❌ OneSignal error:', error)
})

req.write(data)
req.end()
```

### Test End-to-End Notification
```javascript
// test-e2e-notification.js
const { notificationService } = require('./src/lib/services/notificationService')

async function test() {
  const result = await notificationService.send({
    userId: 'USER_ID_HERE', // Replace with real user ID
    type: 'SYSTEM',
    title: 'Test Notification',
    message: 'This is a test from the notification system',
    channels: ['pusher', 'onesignal']
  })
  
  console.log('Result:', result)
}

test()
```

---

## 📊 Expected Results

### Before Implementation

```
❌ User likes post → No notification
❌ User creates post in group → Members don't know
❌ User completes course → No congratulations
❌ User completes lesson → No next lesson notification
❌ User gets new follower → Not notified
❌ Admin makes announcement → Users miss it
```

### After Full Implementation

```
✅ User likes post → Author gets real-time notification
✅ User creates post in group → All members notified via push
✅ User completes course → Congratulations + certificate notification
✅ User completes lesson → Next lesson unlock notification
✅ User gets new follower → Instant notification
✅ Admin makes announcement → All users get push + email
✅ User mentioned in comment → Instant @mention notification
✅ User's post gets comment → Real-time notification
✅ Transaction successful → Multi-channel confirmation
✅ Commission earned → Affiliate gets instant notification
```

---

## 🎯 Success Metrics

After implementation, measure:

1. **Notification Delivery Rate**: Target 95%+
2. **User Engagement**: Click-through rate on notifications
3. **Response Time**: Average time to deliver notification (<2 seconds)
4. **User Preferences**: How many users customize their notification settings
5. **Platform Activity**: Increase in user engagement after notification features

---

## 📚 Code References

**Notification Service**: `/src/lib/services/notificationService.ts`  
**Pusher Service**: `/src/lib/pusher.ts`  
**OneSignal Service**: `/src/lib/integrations/onesignal.ts`  
**Already Implemented**: `/src/app/api/posts/[id]/comments/route.ts` (Comment notifications)

---

**Priority**: 🔥 **CRITICAL - START IMMEDIATELY**

**Estimated Time**:
- Setup: 2 hours
- Phase 1: 8-12 hours
- Phase 2: 12-16 hours
- Phase 3: 16-20 hours
- **Total**: 40-50 hours of development

**Next Action**: Create Pusher & OneSignal accounts → Get credentials → Implement Phase 1

**Last Updated**: 26 Desember 2024 03:55 WIB
