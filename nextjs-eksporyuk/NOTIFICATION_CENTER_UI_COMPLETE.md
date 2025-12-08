# 🔔 Notification Center UI - Implementation Guide

## ✅ Completed Features

### 1. NotificationBell Component (Enhanced)
**Location:** `src/components/layout/NotificationBell.tsx`

**Features:**
- ✅ Real-time notifications via Pusher
- ✅ Unread count badge
- ✅ Dropdown with recent 10 notifications
- ✅ Mark as read on click
- ✅ Mark all as read button
- ✅ Delete individual notification
- ✅ Toast notification on new message
- ✅ Auto-redirect to notification link
- ✅ Time ago format (Indonesian)
- ✅ Notification type icons

**Pusher Events:**
- Channel: `user-{userId}`
- Event: `notification`
- Payload: Notification object

**API Integration:**
- `GET /api/notifications?limit=10` - Fetch recent
- `PATCH /api/notifications` - Mark as read
- `DELETE /api/notifications?id={id}` - Delete

---

### 2. Notifications Page (Full)
**Location:** `src/app/(dashboard)/notifications/page.tsx`

**Features:**
- ✅ Full notification list (50 items)
- ✅ Filter by type (9 tabs: All, Chat, Post, Comment, Course, Event, Transaction, Follow, System)
- ✅ Unread only filter toggle
- ✅ Bulk selection with checkboxes
- ✅ Bulk mark as read
- ✅ Bulk delete
- ✅ Individual actions (mark read, delete)
- ✅ Real-time updates via Pusher
- ✅ Empty state
- ✅ Responsive design
- ✅ Actor info display (name + avatar)
- ✅ Time ago format

**Filter Types:**
```typescript
ALL       // 🔔 Semua
CHAT      // 💬 Chat
POST      // 📝 Postingan
COMMENT   // 💭 Komentar
COURSE    // 🎓 Kursus
EVENT     // 📅 Event
TRANSACTION // 💰 Transaksi
FOLLOW    // 👥 Follow
SYSTEM    // ⚙️ Sistem
```

**Actions Available:**
1. Select All
2. Mark All as Read
3. Mark Selected as Read
4. Delete Selected
5. Filter by Type
6. Toggle Unread Only

---

### 3. Sidebar Menu Integration
**Location:** `src/components/layout/DashboardSidebar.tsx`

**Menu Added:**
- ✅ MEMBER_PREMIUM: "Notifikasi" → `/dashboard/notifications`
- ✅ MEMBER_FREE: "Notifikasi" → `/dashboard/notifications`
- ✅ Icon: `Bell`

**Note:** ADMIN, MENTOR, and AFFILIATE roles have separate notification management in their own sections.

---

### 4. Environment Variables
**Location:** `.env.local`

**Added/Updated:**
```bash
# Pusher Real-time (Client-side)
NEXT_PUBLIC_PUSHER_KEY=1927d0c82c61c5022f22
NEXT_PUBLIC_PUSHER_CLUSTER=ap1

# Pusher (Server-side)
PUSHER_APP_ID=2077941
PUSHER_KEY=1927d0c82c61c5022f22
PUSHER_SECRET=8ba9132cc16d73fe1063
PUSHER_CLUSTER=ap1
```

---

## 🎨 UI/UX Design

### NotificationBell Dropdown
```
┌─────────────────────────────────┐
│ Notifikasi    [Tandai Semua]    │
├─────────────────────────────────┤
│ 🎓 Kursus Baru                  │
│    "Kelas Ekspor Jepang aktif"  │
│    5 menit lalu           [Baru] │
├─────────────────────────────────┤
│ 💬 Pesan Baru                   │
│    "Mentor Dinda mengirim..."    │
│    10 menit lalu                 │
├─────────────────────────────────┤
│         [Lihat Semua]            │
└─────────────────────────────────┘
```

### Notifications Page Layout
```
┌─────────────────────────────────────────┐
│ Notifikasi                              │
│ 5 notifikasi belum dibaca               │
├─────────────────────────────────────────┤
│ [Pilih Semua] [Tandai Semua] [⚙ Filter]│
├─────────────────────────────────────────┤
│ [🔔 Semua][💬 Chat][📝 Post][💭 Comment]│
│ [🎓 Course][📅 Event][💰 Transaction]   │
│ [👥 Follow][⚙️ System]                  │
├─────────────────────────────────────────┤
│ ☐ 🎓 Kursus Baru Tersedia         [Baru]│
│    "Kelas Ekspor Jepang telah aktif"    │
│    Mentor: Dinda                         │
│    5 menit lalu              [✓] [🗑]   │
├─────────────────────────────────────────┤
│ ☐ 💬 Pesan dari Mentor                  │
│    "Halo! Ada yang bisa saya bantu?"    │
│    10 menit lalu             [✓] [🗑]   │
└─────────────────────────────────────────┘
```

---

## 🔌 Real-time Integration

### Pusher Setup
**Client-side (React):**
```typescript
const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
})

const channel = pusher.subscribe(`user-${userId}`)

channel.bind('notification', (data: Notification) => {
  // Update UI
  setNotifications(prev => [data, ...prev])
  
  // Show toast
  toast.success('Notifikasi baru!')
})
```

**Server-side (API):**
```typescript
import { PusherService } from '@/lib/pusher'

// Send notification
await PusherService.trigger(
  `user-${userId}`,
  'notification',
  {
    id: notification.id,
    type: 'COURSE_ENROLLED',
    title: 'Kursus Baru',
    message: 'Kamu berhasil terdaftar',
    link: '/learn/course-slug',
    isRead: false,
    createdAt: new Date(),
  }
)
```

---

## 📊 Notification Types & Icons

| Type | Icon | Example |
|------|------|---------|
| CHAT | 💬 | "Mentor Dinda mengirim pesan" |
| POST_NEW | 📝 | "Dinda membuat postingan baru" |
| POST_LIKE | ❤️ | "Riko menyukai postinganmu" |
| COMMENT | 💭 | "Riko berkomentar di postinganmu" |
| COMMENT_REPLY | ↩️ | "Dinda membalas komentarmu" |
| COURSE_ENROLLED | 🎓 | "Kamu terdaftar di Kelas Ekspor" |
| COURSE_COMPLETED | 🏆 | "Selamat! Kamu selesai kursus" |
| COURSE_DISCUSSION | 💬 | "Diskusi baru di Modul 3" |
| EVENT_REMINDER | ⏰ | "Webinar dimulai dalam 30 menit" |
| EVENT_START | ▶️ | "Webinar telah dimulai" |
| TRANSACTION_SUCCESS | 💳 | "Pembayaran berhasil" |
| TRANSACTION_PENDING | ⏳ | "Menunggu konfirmasi" |
| FOLLOW | 👥 | "Rara mulai mengikuti kamu" |
| ACHIEVEMENT | 🏅 | "Badge 'Aktif Diskusi' diraih!" |
| SYSTEM | ⚙️ | "Sistem maintenance 2 jam" |

---

## 🧪 Testing Checklist

### Manual Testing
- [x] Bell icon shows correct unread count
- [x] Dropdown displays recent 10 notifications
- [x] Click notification marks as read
- [x] Click notification redirects to correct page
- [x] Mark all as read works
- [x] Delete notification works
- [x] Full page shows all notifications
- [x] Filter by type works
- [x] Unread only filter works
- [x] Bulk selection works
- [x] Bulk mark as read works
- [x] Bulk delete works
- [x] Real-time notification appears (Pusher)
- [x] Toast notification shows on new message
- [x] Responsive design works on mobile

### API Testing
```bash
# Fetch notifications
curl http://localhost:3000/api/notifications?limit=10

# Mark as read
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"notificationIds": ["notif-id-1"]}'

# Mark all as read
curl -X PATCH http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"markAllRead": true}'

# Delete notification
curl -X DELETE http://localhost:3000/api/notifications?id=notif-id-1
```

### Pusher Testing
1. Open `/dashboard/notifications` in browser
2. Open another terminal
3. Trigger test notification via API:
```typescript
await notificationService.send({
  userId: 'test-user-id',
  type: 'SYSTEM',
  title: 'Test Notification',
  message: 'This is a test',
  channels: ['pusher', 'database']
})
```
4. Verify: Toast appears, Bell badge updates, Notification list updates

---

## 🚀 Next Steps

### Priority 1: Chat UI Components (Task 8)
- [ ] Create chat interface layout
- [ ] Message list component
- [ ] Message input box
- [ ] Typing indicators
- [ ] Online status badges
- [ ] Mentor chat view
- [ ] Group chat view

### Priority 2: Notification Triggers (Task 9)
- [ ] Post comment → notify post author
- [ ] Post comment reply → notify comment author
- [ ] Course discussion → notify all students
- [ ] Event reminder → notify registered users
- [ ] Transaction success → notify buyer
- [ ] New follower → notify followed user
- [ ] Achievement earned → notify user

### Priority 3: Menu & Testing (Task 10)
- [ ] Add Chat menu to sidebar (all roles)
- [ ] Add unread message badge
- [ ] Test all notification types
- [ ] Test real-time delivery
- [ ] Test role-based access
- [ ] Performance testing
- [ ] Load testing (100+ notifications)

---

## 📚 Documentation References

- **PRD v7.3:** `prd.md` (ChatMentor + Realtime Engagement)
- **Database Schema:** `prisma/schema.prisma` (Notification, NotificationSubscription)
- **Backend Service:** `src/lib/services/notificationService.ts`
- **API Routes:** `src/app/api/notifications/`
- **Pusher Docs:** https://pusher.com/docs

---

## 🎯 Performance Notes

**Optimization Strategies:**
1. **Pagination:** Load 50 items per page
2. **Real-time:** Pusher handles WebSocket connections
3. **Polling Fallback:** Disabled (Pusher provides better UX)
4. **Caching:** Client-side state management
5. **Lazy Loading:** Notifications load on demand

**Database Indexes:**
```prisma
@@index([userId, isRead])
@@index([userId, createdAt])
@@index([type])
```

---

## 🔒 Security Considerations

1. **Authorization:** NextAuth session validation on all API routes
2. **CSRF Protection:** NextAuth built-in protection
3. **XSS Prevention:** React escapes all user input
4. **Rate Limiting:** Consider adding for notification creation
5. **Pusher Auth:** Private channels for user-specific notifications

---

**Last Updated:** November 26, 2025  
**Status:** ✅ Notification Center UI Complete (70% → 75%)  
**Next Task:** Build Chat UI Components
