# OneSignal - Detailed Priority Roadmap

**Date:** 8 Desember 2025  
**Current Status:** 40% Implemented (20 features) | 60% Missing (30+ features)

---

## 🔴 PRIORITY 1 - CRITICAL (Week 1-2)
*Fundamental infrastructure gaps that block everything else*

### 1.1 Browser → Server Player ID Sync
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** HIGH - Without this, subscribers are orphaned in OneSignal  
**Effort:** 2-3 hours  
**Files to Create:**
- `src/app/api/users/onesignal-sync/route.ts` - New sync endpoint
- Update `src/components/providers/OneSignalProvider.tsx` - Trigger sync on subscription

**What it does:**
- When user subscribes to web push → Generate OneSignal Player ID
- Auto-send Player ID to backend
- Store in `User.oneSignalPlayerId` database field
- Link user account to OneSignal subscriber

**Current Gap:**
```
User subscribes to push notifications
  → OneSignal generates Player ID: "abc123def456"
  → Player ID stays only in browser
  → Backend has NO way to know who subscribed
  → Admin sees "100 subscribers" but can't link to actual users
```

**After Implementation:**
```
User subscribes
  → Frontend calls POST /api/users/onesignal-sync
  → Backend stores { userId: "xyz", oneSignalPlayerId: "abc123def456" }
  → Now notifications can be targeted by user/role/segment
```

**Testing:**
- Subscribe to push notifications
- Check browser DevTools → OneSignal Player ID appears
- Query database → `User.oneSignalPlayerId` is populated
- Admin page → Can see user linked to Player ID

---

### 1.2 Event Webhooks - Delivery & Open Tracking
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** HIGH - Can't measure notification effectiveness  
**Effort:** 3-4 hours  
**Files to Create:**
- `src/app/api/webhooks/onesignal/route.ts` - New webhook handler
- Schema additions: `NotificationDeliveryLog`, `ConversionEvent` models

**What it does:**
- OneSignal sends events to backend: delivery, opened, clicked, bounced
- Backend logs each event with timestamp
- Calculate open rate: `(opened / delivered) × 100%`
- Calculate click rate: `(clicked / opened) × 100%`

**OneSignal Configuration Needed:**
1. Go to OneSignal Dashboard → Settings → Webhooks
2. Add webhook URL: `https://eksporyuk.com/api/webhooks/onesignal`
3. Set secret: Add `ONESIGNAL_WEBHOOK_SECRET` to `.env`
4. Enable events: Notification Delivered, Opened, Clicked, Bounced

**Current Gap:**
```
Send notification → OneSignal shows "100 delivered"
But no way to know:
  - How many actually opened it?
  - How many clicked the link?
  - Did it convert to purchase?
```

**After Implementation:**
```
Webhook Log (Database):
- Delivered: 100 users (timestamp: 2025-12-08 10:00)
- Opened: 45 users (timestamp: 2025-12-08 10:05-10:30)
- Clicked: 12 users (timestamp: 2025-12-08 10:15-11:00)
→ Open rate: 45% | Click rate: 26.7%
```

**Testing:**
- Send test notification to admin
- Check browser DevTools → See push notification
- Click notification
- Query `NotificationDeliveryLog` → Should see opened/clicked events
- Admin analytics page → Show open/click rates

---

### 1.3 GDPR Consent Tracking
**Status:** ❌ NOT IMPLEMENTED (Partially in UI)  
**Impact:** HIGH - Legal requirement for EU users  
**Effort:** 2-3 hours  
**Files to Create:**
- `src/app/api/users/notification-consent/route.ts` - Consent API
- Schema: `NotificationConsent` model

**What it does:**
- Record when user gives/revokes consent
- Track which channels approved (email, push, SMS, etc)
- Store IP address + user agent for audit trail
- Set expiry date (consent valid for 1 year)
- Unsubscribe link in emails/notifications

**Current Gap:**
```
User preferences page: Has toggles for opt-in/out
But NO tracking of:
  - When consent was given
  - By which user
  - From which IP/device
  - Consent validity period
→ Can't prove GDPR compliance if audited
```

**After Implementation:**
```
NotificationConsent table:
- userId: "user123"
- consentGiven: true
- channels: { email: true, push: true, sms: false }
- timestamp: "2025-12-08T10:00:00Z"
- ipAddress: "192.168.1.1"
- userAgent: "Mozilla/5.0..."
- consentExpiry: "2026-12-08T10:00:00Z"

Audit trail shows proof of consent for compliance
```

**Testing:**
- Enable notifications in preferences
- Query `NotificationConsent` table → Should have record
- Disable notifications
- Query again → Should have new revocation record
- Verify IP address captured

---

## 🟡 PRIORITY 2 - HIGH (Week 2-3)
*Important features that unlock targeting and analytics*

### 2.1 Behavior-Based Segmentation
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** MEDIUM-HIGH - Better targeting than role/province alone  
**Effort:** 3-4 hours  
**Files to Create:**
- `src/lib/services/segmentationService.ts` - Auto-segment logic
- `src/app/api/admin/segments/route.ts` - API to view/manage segments
- Schema: `UserSegment` model

**Segments to Create:**
1. **Active Users** - Logged in last 7 days
   - Who: Daily active users
   - Purpose: New features, special offers
   - Size: ~30-40% of user base

2. **At-Risk Users** - Last login 30-90 days ago
   - Who: Used to be active, now slowing down
   - Purpose: Re-engagement campaigns
   - Size: ~20-30%

3. **Churned Users** - No login 90+ days
   - Who: Lost customers
   - Purpose: Win-back campaigns
   - Size: ~10-20%

4. **High Engagement** - 10+ posts in last 30 days
   - Who: Community champions
   - Purpose: VIP offers, beta features
   - Size: ~5-10%

5. **Recent Joiners** - Signed up in last 30 days
   - Who: Onboarding candidates
   - Purpose: Tutorial notifications
   - Size: ~5-15%

**Current Gap:**
```
Send notification → Only options are:
- All users (100% audience)
- By role (admin, mentor, member)
- By province (manual list)

No way to say "only send to users who haven't logged in 30+ days"
```

**After Implementation:**
```
Admin sends notification:
- Select dropdown: "At-Risk Users"
- Auto-sends to 50 users (last login 30-90 days ago)
- Perfect for re-engagement campaign
```

**Testing:**
- Run `segmentationService.createBehaviorSegments()`
- Check `UserSegment` table → Should have 5 segments with player IDs
- Admin page → Should show segment selection dropdown
- Send notification to "At-Risk Users"
- Verify only those users receive it

---

### 2.2 Webhook Analytics Dashboard
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** MEDIUM-HIGH - See how notifications perform  
**Effort:** 2-3 hours  
**Files to Create:**
- `src/app/(dashboard)/admin/onesignal/analytics/page.tsx` - New page

**Metrics to Display:**
```
Last 7 Days:
┌─────────────────────────────────────┐
│ Total Sent      │ 125 notifications  │
│ Delivery Rate   │ 98.4% (123/125)    │
│ Open Rate       │ 42% (52/123)       │
│ Click Rate      │ 18% (9/52)         │
│ Conversion Rate │ 3.2% (4/125)       │
└─────────────────────────────────────┘

Best Performing:
1. "New Course Released" - 62% open, 28% click
2. "Weekly Digest" - 48% open, 22% click
3. "Special Offer" - 35% open, 12% click

Worst Performing:
1. "System Update" - 15% open, 2% click
```

**Current Gap:**
```
Admin page shows:
- Total users: 500
- Subscribers: 350
BUT no data on:
- How many opened last notification?
- Which subject lines work best?
- Best time to send?
```

**After Implementation:**
```
New "Analytics" tab shows:
- Line chart: Open rate trend (7d, 30d, 90d)
- Bar chart: Click rate by notification type
- Table: Top 10 best performing notifications
- Metrics: A/B test results if running
```

**Testing:**
- Send 5 test notifications
- Wait for webhook events to arrive
- View analytics page → Should show metrics
- Verify charts populate with data

---

### 2.3 Personalization - Merge Tags
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** MEDIUM - Increases engagement 20-30%  
**Effort:** 2-3 hours  
**Files to Create:**
- `src/lib/onesignal-helper.ts` - Merge tag replacement function
- Update `src/app/(dashboard)/admin/onesignal/page.tsx` - Show merge tag options

**Merge Tags Available:**
```
{firstName}      → "Abdur"
{lastName}       → "Aziz"
{fullName}       → "Abdur Aziz"
{email}          → "user@example.com"
{role}           → "MENTOR"
{tier}           → "PREMIUM"
{city}           → "Jakarta"
{joinDate}       → "1 Oktober 2024"
{lastLogin}      → "5 jam lalu"
{postCount}      → "42"
```

**Current Gap:**
```
Send notification:
- Title: "Hello there!"
- Message: "Check out our new course"

Sent to all 500 users - feels impersonal
```

**After Implementation:**
```
Template:
- Title: "Hey {firstName}!"
- Message: "As a {role}, check out this {tier} course"

User1 (Mentor from Jakarta):
- "Hey Abdur!"
- "As a MENTOR, check out this PREMIUM course"

User2 (Member from Surabaya):
- "Hey Rini!"
- "As a MEMBER, check out this FREE course"
```

**Testing:**
- Create template with merge tags
- Send to 3 test users with different data
- Verify each receives personalized version
- Check database that original user data wasn't modified

---

## 🟢 PRIORITY 3 - MEDIUM (Week 3-4)
*Nice-to-have features that improve UX and efficiency*

### 3.1 Scheduled Notifications
**Status:** ⚠️ PARTIALLY IMPLEMENTED  
**Impact:** MEDIUM - Can schedule campaigns ahead  
**Effort:** 2-3 hours  
**Files to Modify:**
- `src/app/(dashboard)/admin/onesignal/page.tsx` - Add time picker
- Update `POST /api/admin/onesignal/send` - Handle scheduled sends

**What it does:**
- Choose send time: now, specific datetime, or recurrence
- Notification queues and sends at exact time
- Cancel scheduled notification before it sends
- Show scheduled notification status

**Current Gap:**
```
Admin dashboard - Send notification form:
- Can only send immediately
- No way to schedule for later
- Have to manually set reminder to send at specific time
```

**After Implementation:**
```
New options in Send form:
○ Send now
○ Send at specific time → Datetime picker
○ Recurring schedule → Daily/Weekly/Monthly

Example: "Send every Monday at 10 AM"
```

**Testing:**
- Schedule notification for 5 minutes from now
- Check if sends at exact time
- Try to cancel before send → Should work
- Try to cancel after send → Should fail

---

### 3.2 A/B Testing - Subject Lines
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** MEDIUM - Find best performing messages  
**Effort:** 3-4 hours  
**Files to Create:**
- `src/app/(dashboard)/admin/onesignal/ab-test/page.tsx` - A/B test page
- Schema: `NotificationABTest` model

**What it does:**
- Split audience 50/50
- Variant A: Subject line "New Course Available"
- Variant B: Subject line "Exclusive: New Course Just For You"
- Send both
- Track which has better open rate
- Show winner with stats

**Current Gap:**
```
"What subject line should I use?"
- Just guess
- Use whatever feels right
- No data-driven approach
```

**After Implementation:**
```
Create A/B test:
- Variant A: "New Course Available" 
- Variant B: "Exclusive: New Course Just For You"

Results after 1 hour:
- Variant A: 35% open rate (175/500)
- Variant B: 48% open rate (240/500)
→ Variant B wins! Use it for future campaigns
```

**Testing:**
- Create A/B test with 2 variants
- Send to test group
- Wait for webhook events
- View results → Should show winner

---

### 3.3 Bulk User Management
**Status:** ⚠️ PARTIALLY IMPLEMENTED  
**Impact:** MEDIUM - Faster bulk operations  
**Effort:** 2-3 hours  
**Files to Create:**
- `src/app/api/admin/users/bulk-tags/route.ts` - Bulk tagging API
- `src/app/(dashboard)/admin/users/bulk-operations/page.tsx` - UI

**What it does:**
- Import CSV of user IDs
- Apply tags to all at once
- Export subscriber list
- Bulk update notification preferences

**Current Gap:**
```
Add tag to 100 users → Click each individually
Takes 10 minutes

Delete 50 inactive users → One by one
Takes 15 minutes
```

**After Implementation:**
```
Upload CSV file:
userId, action, tag
123, add_tag, VIP
124, add_tag, VIP
125, remove_tag, INACTIVE
→ Done in 5 seconds
```

**Testing:**
- Create CSV with 10 users
- Upload via bulk operations page
- Verify all tagged correctly
- Export → Should have tags included

---

### 3.4 Rich Notification Features
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** MEDIUM - More interactive notifications  
**Effort:** 3-4 hours  
**Files to Modify:**
- `POST /api/admin/onesignal/send` - Add rich media options

**Features:**
1. **Action Buttons** - Add 2-3 buttons to notification
   - "View Course" → Opens course page
   - "Dismiss" → Close notification
   
2. **Badge/Icon** - Small image next to notification
   
3. **Big Picture** - Large banner image when expanded
   
4. **Priority Level** - High/normal/low urgency

**Current Gap:**
```
Notification: "New Course Available"
- User sees it
- Can only click → Opens link
- No other options
```

**After Implementation:**
```
Notification: "New Course Available"
[View Course] [Save Later]
(+ big course image when expanded)
→ More clickable, better UX
```

**Testing:**
- Send notification with 2 action buttons
- Click "View Course" → Should open correct page
- Click "Save Later" → Should save to wishlist

---

## 🔵 PRIORITY 4 - LOW (Future nice-to-haves)
*Non-critical features, can implement later*

### 4.1 Mobile App Push Notifications
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** LOW (No mobile app yet)  
**Effort:** 5-6 hours  

**What it does:**
- iOS & Android app integration
- Same notifications on mobile devices
- Increase reach since users more likely to have app installed

**When to implement:** After mobile app is built

---

### 4.2 SMS & Email Integration
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** LOW (OneSignal SMS is paid)  
**Effort:** 4-5 hours  

**What it does:**
- Send SMS via OneSignal
- Send email via OneSignal
- Multi-channel campaigns from one dashboard

**When to implement:** If SMS budget approved

---

### 4.3 Advanced Segmentation (Machine Learning)
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** LOW (Requires historical data)  
**Effort:** 8-10 hours  

**What it does:**
- Predict churn probability
- Find most likely to convert
- Auto-segment by predicted value

**When to implement:** After 3-6 months of notification data

---

### 4.4 Webhook Outbound (Slack Alerts)
**Status:** ❌ NOT IMPLEMENTED  
**Impact:** LOW (Nice monitoring feature)  
**Effort:** 2-3 hours  

**What it does:**
- Send Slack alert when notification sent
- Alert if delivery rate drops below 90%
- Alert if bounce rate too high

**When to implement:** If Slack integration wanted

---

## 📊 IMPLEMENTATION TIMELINE

### Week 1 (Dec 9-13)
- ✅ Player ID Browser Sync (Priority 1.1)
- ✅ Event Webhooks Setup (Priority 1.2)
- ✅ Start GDPR Consent (Priority 1.3)

### Week 2 (Dec 16-20)
- ✅ Finish GDPR Consent
- ✅ Behavior Segmentation (Priority 2.1)
- ✅ Webhook Analytics (Priority 2.2)

### Week 3 (Dec 23-27)
- ✅ Merge Tags Personalization (Priority 2.3)
- ✅ Scheduled Notifications (Priority 3.1)
- ✅ A/B Testing (Priority 3.2)

### Week 4 (Jan 6-10)
- ✅ Bulk Operations (Priority 3.3)
- ✅ Rich Notifications (Priority 3.4)
- 📝 Tech debt & optimization

---

## 🎯 SUCCESS METRICS

After implementing Priority 1 features:
- ✅ All 500+ web push subscribers linked to user accounts
- ✅ 100% notification delivery tracked
- ✅ Can measure open rate & click rate
- ✅ GDPR compliant with consent audit trail
- ✅ Can target by user behavior

After implementing Priority 2 features:
- ✅ Open rate improves from baseline to 35%+
- ✅ Click rate improves to 15%+
- ✅ Personalized messages have 25% better open rate
- ✅ Can do 5-7 targeted campaigns per week

After implementing Priority 3 features:
- ✅ Schedule campaigns without manual intervention
- ✅ A/B tests show 10-15% improvement in winners
- ✅ Admin can manage 1000+ users in bulk
- ✅ Rich notifications get 30% more clicks

---

## 📋 DEPENDENCY CHAIN

```
Priority 1.1 (Browser Sync)
    ↓
Priority 1.2 (Event Webhooks)
    ↓
Priority 1.3 (GDPR Consent)
    ↓
Priority 2.1 (Behavior Segmentation)
    ↓
Priority 2.2 (Analytics Dashboard)
    ↓
Priority 2.3 (Merge Tags)
    ↓
Priority 3.1 (Scheduled Notifications)
    ↓
Priority 3.2 (A/B Testing)
    ↓
Priority 3.3 (Bulk Operations)
    ↓
Priority 3.4 (Rich Notifications)
```

**Key Point:** Priority 1.1 MUST complete before 1.2 & 1.3  
(Can't track webhooks without knowing which user they belong to)

---

## 🚀 NEXT STEPS

1. **Review this roadmap** - Any changes to priorities?
2. **Start Priority 1.1** - Browser Sync (2-3 hours)
   - File: `src/app/api/users/onesignal-sync/route.ts`
   - File: Update `src/components/providers/OneSignalProvider.tsx`
3. **Deploy & test** - Verify Player ID syncs correctly
4. **Move to Priority 1.2** - Event Webhooks

Ready to start implementing? Let me know! 🚀

