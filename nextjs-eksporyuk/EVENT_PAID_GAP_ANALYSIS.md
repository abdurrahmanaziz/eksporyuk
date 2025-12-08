# Event Berbayar - Audit & Gap Analysis

**Date:** December 8, 2025  
**Status:** ⚠️ **PARTIAL IMPLEMENTATION - MISSING EVENT PURCHASE FLOW**

---

## Current Event System Status

### ✅ What's Implemented
- **Event Model** - Complete with price field
  - `price: DECIMAL` - Event ticket price
  - `commissionType: TEXT` - PERCENTAGE or FLAT
  - `commissionRate: DECIMAL` - Commission percentage/amount
  - Creator can set event as paid

- **EventRSVP Model** - Tracks attendance
  - `transactionId: String?` - Link to payment (but optional!)
  - `status: String` - GOING, MAYBE, NOT_GOING
  - `attended: Boolean` - Attendance tracking

- **Event Register API** - `/api/events/[id]/register`
  - Free event RSVP only
  - Creates EventRSVP record
  - No payment processing

- **Event UI** - Existing event pages
  - Event details display
  - RSVP buttons for free events
  - No "Buy Ticket" functionality for paid events

---

### ❌ What's Missing

#### 1. **Transaction Type Enum - NO EVENT TYPE**
```prisma
enum TransactionType {
  MEMBERSHIP    ✅
  PRODUCT       ✅
  COURSE        ✅
  SUPPLIER_MEMBERSHIP
  COURSE_DISCUSSION
  COURSE_ENROLLED
  MEMBERSHIP_ONLY
  PRODUCT_ONLY
  COURSE_BUNDLE
  // ❌ EVENT is MISSING!
}
```

**Impact:** Cannot create transactions for event purchases.

---

#### 2. **Transaction Model - NO EVENT RELATION**
```prisma
model Transaction {
  productId   String?    ✅ Product reference
  courseId    String?    ✅ Course reference
  // ❌ eventId is MISSING!
  
  // Has relations to Product and Course but NOT Event
  course      Course?    @relation(...)
  product     Product?   @relation(...)
  // ❌ event relation MISSING!
}
```

**Impact:** Cannot link transaction to event for payment tracking.

---

#### 3. **Event Checkout API - NOT IMPLEMENTED**
```
Missing: /api/checkout/event
Missing: /api/events/[id]/purchase
Missing: /api/events/[id]/buy-ticket
```

**Impact:** No way to initiate event ticket purchase.

---

#### 4. **Xendit Webhook - NO EVENT HANDLING**
```typescript
// In /api/webhooks/xendit/route.ts

if (transaction.type === 'MEMBERSHIP') { ✅ handled }
if (transaction.type === 'PRODUCT') { ✅ handled }
if (transaction.type === 'COURSE') { ✅ handled }
// ❌ if (transaction.type === 'EVENT') { ... } MISSING!
```

**Impact:** Even if user pays, system cannot process event registration.

---

#### 5. **Event Purchase Flow - NOT DEFINED**
**Current Free Event Flow:**
```
User → Click RSVP → EventRSVP created → Done
```

**Needed Paid Event Flow:**
```
User → Click Buy Ticket → Checkout → Payment → Xendit → 
  EventRSVP created → Email confirmation → Access to event
```

**Current State:** Steps 2-5 are completely missing!

---

#### 6. **Payment Processing Missing**
When user pays for event ticket:
- ❌ No revenue distribution
- ❌ No commission calculation
- ❌ No wallet update for event creator
- ❌ No notification triggered
- ❌ No email confirmation with event details

---

#### 7. **Access Control Missing**
For paid events:
- ❌ No check if user paid before showing event details
- ❌ No restricted access to event materials
- ❌ No ticket verification

---

## Complete Missing Feature List

### Database Changes Needed
```prisma
enum TransactionType {
  // Add:
  EVENT
}

model Transaction {
  // Add:
  eventId       String?
  event         Event?  @relation(fields: [eventId], references: [id])
}

model EventRSVP {
  // Change transactionId from optional to required for paid events:
  transactionId String?  // Keep optional for free events
  // Add:
  paid          Boolean @default(false)  // Distinguish paid vs free RSVP
  paidAt        DateTime?
}

// OR create dedicated model for paid registrations:
model EventRegistration {
  id            String   @id @default(cuid())
  eventId       String
  userId        String
  transactionId String
  paidAt        DateTime
  event         Event    @relation(...)
  user          User     @relation(...)
  transaction   Transaction @relation(...)
  
  @@unique([eventId, userId])
}
```

### API Endpoints Needed
1. **POST `/api/checkout/event`**
   - Create transaction for event ticket
   - Generate payment link via Xendit
   - Return payment URL

2. **POST `/api/events/[id]/purchase`**
   - Initiate event ticket purchase
   - Alternative to checkout endpoint

3. **POST `/api/events/[id]/register`** (EXISTING - but needs update)
   - Currently: Free event RSVP only
   - Needs: Check if event is paid, redirect to purchase if needed

### Xendit Webhook Handler Needed
```typescript
// Add to handleInvoicePaid():
if (transaction.type === 'EVENT' && transaction.eventId) {
  // Get event details
  // Create EventRSVP or EventRegistration
  // Send confirmation email with event details
  // Send OneSignal notification
  // Calculate commission for event creator
  // Update wallet
  // Trigger revenue distribution
}
```

### UI Changes Needed
1. **Event Details Page** - Show "Buy Ticket" instead of RSVP for paid events
2. **Event Card** - Show price badge
3. **Checkout Page** - Event-specific details
4. **Confirmation Page** - Ticket details with event info
5. **User Wallet** - Show event revenue if user is creator

### Email/Notification Changes Needed
1. **Event Purchase Confirmation**
   - Event details
   - Ticket information
   - Event date/time
   - Meeting link (if applicable)

2. **Event Creator Notification**
   - New ticket sale
   - Commission earned

---

## Alur Lengkap yang Dibutuhkan (Paid Event)

### Step 1: User Mengakses Event Berbayar
```
GET /api/events/[id]
→ Returns: { price: 100000, type: "PAID", ... }
→ UI shows "Buy Ticket" button
```

### Step 2: User Klik "Buy Ticket"
```
POST /api/checkout/event (atau /api/events/[id]/purchase)
Body: { eventId, affiliateCode?, couponCode? }

1. Check event exists and is published
2. Check user not already registered for this event
3. Get event details (price, commission)
4. Create Transaction record:
   - type: 'EVENT' ✅
   - eventId: params.id ✅
   - amount: event.price
   - status: 'PENDING'
5. Call Xendit to generate payment link
6. Return: { paymentUrl: "https://..." }
```

### Step 3: User Melakukan Pembayaran
```
User → Payment Gateway → Xendit processes payment
```

### Step 4: Xendit Sends Webhook (invoice.paid)
```
Webhook: POST /api/webhooks/xendit

1. Validate signature ✅
2. Find transaction by externalId ✅
3. Update transaction status = 'SUCCESS' ✅
4. Check transaction.type === 'EVENT' ✅ (CURRENTLY MISSING!)

If EVENT transaction:
  a. Create EventRSVP:
     - eventId
     - userId
     - transactionId ✅
     - status: 'GOING'
     - attended: false
  
  b. Process Revenue Distribution:
     - Affiliate commission ✅
     - Event creator commission
     - Admin fee
     - Update wallets ✅
  
  c. Send Notifications:
     - User: "Ticket purchased! Event details..."
     - Creator: "New ticket sale - commission earned"
  
  d. Send Email:
     - Confirmation with event details
     - Meeting link if applicable
```

### Step 5: User Gets Event Access
```
GET /api/events/[id]
→ User can now see full details
→ User can access event materials
→ User can join meeting link

GET /api/events/my-events
→ Shows purchased event in user's list
```

### Step 6: Event Happens
```
PUT /api/events/[id]/attendance
→ Mark user as attended
→ EventRSVP.attended = true
```

---

## Implementation Priority

### 🔴 CRITICAL (Blocking Feature)
1. **Add EVENT to TransactionType enum**
2. **Add eventId field to Transaction model**
3. **Add event relation to Transaction model**
4. **Implement event checkout API**
5. **Add EVENT handling in Xendit webhook**

### 🟠 IMPORTANT (Core Functionality)
6. **Revenue distribution for events**
7. **EventRSVP creation in webhook**
8. **Email notifications**
9. **UI updates for paid events**

### 🟡 NICE TO HAVE (Enhancement)
10. **Refund handling**
11. **Ticket reselling**
12. **Group discounts**
13. **Early bird pricing**

---

## Implementation Roadmap

### Phase 1: Database Schema (IMMEDIATE)
1. Add EVENT to TransactionType enum
2. Add eventId to Transaction model
3. Add paid field to EventRSVP
4. Run: `npx prisma db push && npx prisma generate`

### Phase 2: API Endpoints (WEEK 1)
1. Create `/api/checkout/event` endpoint
2. Update `/api/events/[id]/register` endpoint
3. Implement revenue distribution for events
4. Test with Xendit sandbox

### Phase 3: Webhook Integration (WEEK 1)
1. Add EVENT case to handleInvoicePaid()
2. Create EventRSVP on payment
3. Calculate event creator commission
4. Send notifications

### Phase 4: UI Updates (WEEK 2)
1. Update event details page
2. Add "Buy Ticket" button
3. Show price badge
4. Create event checkout page

### Phase 5: Testing & Validation (WEEK 2)
1. Test full purchase flow
2. Verify revenue distribution
3. Check email delivery
4. Verify OneSignal notifications

---

## Code Examples

### 1. Schema Changes Needed
```prisma
enum TransactionType {
  MEMBERSHIP
  PRODUCT
  COURSE
  EVENT           // ← ADD THIS
  SUPPLIER_MEMBERSHIP
  COURSE_DISCUSSION
  COURSE_ENROLLED
  MEMBERSHIP_ONLY
  PRODUCT_ONLY
  COURSE_BUNDLE
}

model Transaction {
  // ... existing fields ...
  eventId       String?
  event         Event?           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  // ... rest of model ...
  @@index([eventId])
}
```

### 2. Checkout Endpoint Template
```typescript
// /api/checkout/event/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 })
  
  const { eventId, affiliateCode, couponCode } = await request.json()
  
  // 1. Get event
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return json({ error: 'Event not found' }, { status: 404 })
  
  // 2. Check if user already registered (paid or free)
  const existingRsvp = await prisma.eventRSVP.findUnique({
    where: { eventId_userId: { eventId, userId: session.user.id } }
  })
  if (existingRsvp) return json({ error: 'Already registered' }, { status: 400 })
  
  // 3. Calculate price (with coupon/affiliate discount if applicable)
  let finalPrice = parseFloat(event.price.toString())
  
  // 4. Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: 'EVENT',
      eventId: eventId,
      amount: finalPrice,
      status: 'PENDING',
      description: `Ticket for event: ${event.title}`
    }
  })
  
  // 5. Create Xendit invoice
  const paymentUrl = await xenditService.createInvoice({
    externalId: transaction.id,
    amount: finalPrice,
    description: `Event Ticket: ${event.title}`,
    email: session.user.email,
    items: [{
      name: event.title,
      quantity: 1,
      price: finalPrice
    }]
  })
  
  return json({ paymentUrl, transactionId: transaction.id })
}
```

### 3. Xendit Webhook - EVENT Handler
```typescript
// In handleInvoicePaid() function

// Add after line where transaction is updated:
if (transaction.type === 'EVENT' && transaction.eventId) {
  // Create EventRSVP for registered user
  const eventRsvp = await prisma.eventRSVP.create({
    data: {
      eventId: transaction.eventId,
      userId: transaction.userId,
      status: 'GOING',
      transactionId: transaction.id,
      attended: false
    }
  })
  
  // Get event details
  const event = await prisma.event.findUnique({
    where: { id: transaction.eventId },
    select: { title: true, startDate: true, creator: true }
  })
  
  // Process revenue distribution
  const { processRevenueDistribution } = await import('@/lib/revenue-split')
  await processRevenueDistribution({
    transactionId: transaction.id,
    amount: transaction.amount,
    type: 'EVENT'
  })
  
  // Send notification to user
  await notificationService.send({
    userId: transaction.userId,
    type: 'EVENT_PURCHASED',
    title: 'Ticket Purchased!',
    message: `Your ticket for ${event.title} has been confirmed. Event on ${event.startDate}.`,
    eventId: transaction.eventId,
    redirectUrl: `/events/${transaction.eventId}`,
    channels: ['email', 'onesignal', 'pusher']
  })
  
  // Send notification to event creator
  await notificationService.send({
    userId: event.creator.id,
    type: 'EVENT_TICKET_SOLD',
    title: 'New Ticket Sale!',
    message: `${transaction.user.name} bought a ticket to ${event.title}`,
    eventId: transaction.eventId,
    redirectUrl: `/admin/events/${transaction.eventId}`,
    channels: ['onesignal']
  })
}
```

---

## Questions for Product Team

1. **Should paid events be available immediately?**
   - Currently: No checkout flow exists
   - Question: Should they even have price field set?

2. **Should event creators earn commission?**
   - Currently: Event.commissionRate field exists but unused
   - Question: Should commission go to event creator or stay with platform?

3. **Can users refund event tickets?**
   - Currently: No refund logic exists
   - Question: What's the refund policy?

4. **Should there be event capacity limits?**
   - Currently: Event.maxAttendees field exists but not enforced in registration
   - Question: Should we enforce hard cap or soft cap with waitlist?

5. **Should event registrations be transferable?**
   - Currently: Tied to user ID
   - Question: Can ticket holders transfer to another person?

---

## Current Situation Summary

| Component | Status | Issue |
|-----------|--------|-------|
| Event Model | ✅ | Has price field |
| TransactionType enum | ❌ | Missing EVENT |
| Transaction model | ❌ | Missing eventId field |
| EventRSVP model | ⚠️ | transactionId optional, no paid flag |
| Checkout API | ❌ | Does not exist |
| Xendit webhook | ❌ | No EVENT handler |
| Revenue distribution | ❌ | Not for events |
| Notifications | ❌ | No event purchase flow |
| UI | ❌ | No "Buy Ticket" button |

**Overall: Paid event purchase flow is 0% implemented.**

---

## Recommendation

**❌ DO NOT USE PAID EVENTS IN PRODUCTION**

Until:
1. EVENT is added to TransactionType enum
2. eventId is added to Transaction model
3. Checkout API is implemented
4. Xendit webhook handles EVENT transactions
5. Revenue distribution works for events
6. Full testing is completed

**Current Status:** Events can be marked as paid, but users have no way to purchase tickets. This will confuse users.

---

## Next Steps

1. Decide if paid events are in scope for this release
2. If YES:
   - Start Phase 1 (Database schema changes)
   - Follow roadmap above
3. If NO:
   - Remove price field from Event creation UI (to avoid confusion)
   - Hide price field in event details
   - Only allow free events

---

**Report Generated:** December 8, 2025  
**Status:** ⚠️ FEATURE NOT READY FOR PRODUCTION  
**Action Required:** Product decision on paid events scope
