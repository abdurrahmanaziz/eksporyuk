# Event Berbayar - Quick Testing Guide

## 🎯 Quick Reference for QA Testing

### 1. Database Check
```bash
# Check if Transaction.eventId field exists
npx prisma studio

# Navigate to Transaction model
# Verify: eventId, event relation, eventRsvps relation
```

### 2. Test Checkout Endpoint
```bash
# Using curl or Postman
POST http://localhost:3000/api/checkout/event

Body:
{
  "eventId": "YOUR_EVENT_ID",
  "couponCode": "DISCOUNT20",
  "affiliateCode": "affiliate-username"
}

Expected Response (PENDING_PAYMENT):
{
  "status": "PENDING_PAYMENT",
  "paymentUrl": "https://app.xendit.co/web/invoices/...",
  "transactionId": "txn-xxxxx",
  "amount": 85000,
  "finalPrice": 85000,
  "discountAmount": 15000
}
```

### 3. Test Free-After-Discount
```bash
POST http://localhost:3000/api/checkout/event

Body:
{
  "eventId": "YOUR_EVENT_ID",
  "couponCode": "FREE100"  # Discount >= event price
}

Expected Response (FREE_AFTER_DISCOUNT):
{
  "status": "FREE_AFTER_DISCOUNT",
  "message": "Anda sudah terdaftar untuk event ini!",
  "eventId": "event-id",
  "transactionId": "txn-id"
}

Verify in Database:
- EventRSVP created with isPaid=false
- Transaction status=SUCCESS
- paidAt=now()
```

### 4. Test Register Endpoint (Paid Event Rejection)
```bash
POST http://localhost:3000/api/events/[PAID_EVENT_ID]/register

Body: { "status": "GOING" }

Expected Response (400):
{
  "error": "This is a paid event. Please use the checkout endpoint.",
  "code": "PAID_EVENT",
  "checkoutUrl": "/api/checkout/event"
}
```

### 5. Test Xendit Webhook
```bash
# Simulate Xendit payment confirmation
# Note: In production, Xendit sends this automatically after payment

POST http://localhost:3000/api/webhooks/xendit

Headers:
{
  "x-xendit-token": "YOUR_XENDIT_WEBHOOK_TOKEN"
}

Body:
{
  "id": "xendit-invoice-id",
  "external_id": "EVT-1234567890-abc123",
  "status": "PAID",
  "paid_amount": 85000,
  "payment_method": "INVOICE",
  "amount": 85000
}

Expected Results:
1. ✅ EventRSVP created with isPaid=true, paidAt=now()
2. ✅ Transaction status updated to SUCCESS
3. ✅ Notification sent to buyer (type: EVENT_TICKET_PURCHASED)
4. ✅ Notification sent to creator (type: EVENT_TICKET_SOLD)
5. ✅ Email sent to buyer with event details
6. ✅ Wallets updated:
   - Event Creator: +70% of payment
   - Affiliate: +30% of payment (if applicable)
   - Admin: +15% of remainder
   - Founder: +60% of remainder
   - Co-Founder: +40% of remainder

Verify in Database:
- prisma.eventRSVP.findUnique({ where: { eventId_userId: {...} } })
- prisma.wallet.findUnique({ where: { userId: creatorId } })
- prisma.wallet.findUnique({ where: { userId: affiliateId } })
- prisma.transaction.findUnique({ where: { id: transactionId } })
```

### 6. Test Idempotency
```bash
# Send same Xendit webhook twice
POST http://localhost:3000/api/webhooks/xendit (same body)
POST http://localhost:3000/api/webhooks/xendit (same body)

Expected Result:
- First call: EventRSVP created successfully
- Second call: EventRSVP already exists (no duplicate created)
- Verify: Only one EventRSVP in database for this user+event
```

### 7. Verify Revenue Distribution
```bash
# Query database after payment
SELECT * FROM Wallet WHERE userId = 'EVENT_CREATOR_ID';
SELECT * FROM Wallet WHERE userId = 'AFFILIATE_ID';
SELECT * FROM Wallet WHERE userId = 'ADMIN_ID';
SELECT * FROM Wallet WHERE userId = 'FOUNDER_ID';
SELECT * FROM Wallet WHERE userId = 'COFOUNDER_ID';

# Verify amounts match expected distribution
# For Rp 1,000,000 payment with default 70% creator rate:
# - Creator: Rp 700,000
# - Affiliate (30%): Rp 90,000
# - Admin (15%): Rp 31,500
# - Founder (60%): Rp 107,100
# - Co-Founder (40%): Rp 71,400
```

### 8. Verify Notifications
```bash
# Check OneSignal notifications
# Check Pusher real-time updates
# Check Mailketing emails
# Check WhatsApp messages (if Starsender configured)

# For buyer:
# - Title: ✅ Tiket Event Terkonfirmasi!
# - Message: Event details + confirmation

# For creator:
# - Title: 🎉 Penjualan Tiket Baru!
# - Message: [Buyer] membeli tiket untuk [Event]
```

### 9. Test Workflow End-to-End
```
1. Create test event with price > 0
   - Set commissionRate = 70 (for creator)
   - Set commissionType = PERCENTAGE
   - Publish event

2. Login as user
   - POST /api/checkout/event
   - Get transactionId & paymentUrl
   - Verify transaction created with status=PENDING

3. Simulate payment
   - POST /api/webhooks/xendit (with status=PAID)
   - Verify EventRSVP created
   - Verify wallets updated
   - Verify notifications sent
   - Verify email sent

4. Check results
   - Query EventRSVP: isPaid=true, paidAt=<timestamp>
   - Query Transaction: status=SUCCESS, paidAt=<timestamp>
   - Query Wallets: all balances updated correctly
   - Check email: received with event details
```

### 10. Error Scenarios
```bash
# Test 401: No session
POST /api/checkout/event
# Expected: 401 Unauthorized

# Test 404: Event not found
POST /api/checkout/event
Body: { "eventId": "invalid-id" }
# Expected: 404 Event not found

# Test 400: Event not published
POST /api/checkout/event
Body: { "eventId": "<unpublished-event>" }
# Expected: 400 Event is not published

# Test 400: Already registered
POST /api/checkout/event (user already has RSVP)
# Expected: 400 Already registered

# Test 400: Free event
POST /api/checkout/event (event with price=0)
# Expected: 400 Use register endpoint instead
```

---

## 📊 Database Queries for Verification

```javascript
// Check EventRSVP has paid flag
const rsvp = await prisma.eventRSVP.findUnique({
  where: { id: rsvpId }
})
console.log(rsvp.isPaid)   // true/false
console.log(rsvp.paidAt)   // Date or null

// Check Transaction linked to Event
const txn = await prisma.transaction.findUnique({
  where: { id: transactionId },
  include: { event: true, eventRsvps: true }
})
console.log(txn.event.title)       // Event title
console.log(txn.eventRsvps.length) // 1 (or more if multiple RSVPs)

// Check Wallet balances
const wallet = await prisma.wallet.findUnique({
  where: { userId: userId }
})
console.log(wallet.balance)       // Available balance
console.log(wallet.totalEarnings) // Lifetime earnings

// Check all transactions of a user
const txns = await prisma.transaction.findMany({
  where: { userId: userId },
  orderBy: { createdAt: 'desc' }
})
console.log(txns.filter(t => t.type === 'EVENT')) // Event transactions only
```

---

## 🔍 Debugging

### Check Console Logs
```
[Event Checkout] Created invoice for event {eventId}: {invoiceId}
[Xendit Webhook] ✅ Event RSVP created for user {userId} to event {eventId}
[Xendit Webhook] ✅ Revenue distribution processed for event
```

### Common Issues

**Issue: EventRSVP not created after payment**
- Check: Transaction.eventId is null?
- Check: Webhook signature validation passed?
- Check: Database has Events table?
- Check: Creator exists?

**Issue: Wallet not updated**
- Check: processRevenueDistribution ran without errors?
- Check: Wallet record exists for creator?
- Check: Amount calculation correct?

**Issue: Notifications not sent**
- Check: OneSignal configured?
- Check: Pusher configured?
- Check: User ID exists?
- Check: Event creator ID exists?

**Issue: Email not sent**
- Check: Mailketing configured with API key?
- Check: User email is valid?
- Check: Email template exists?

---

## 🚀 Test Data Setup

```javascript
// Create test event for paid event testing
const testEvent = await prisma.event.create({
  data: {
    creatorId: 'CREATOR_USER_ID',
    title: 'Test Paid Event',
    description: 'Event untuk testing paid event feature',
    price: 250000,
    commissionType: 'PERCENTAGE',
    commissionRate: 70,
    type: 'WORKSHOP',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    location: 'Jakarta',
    maxAttendees: 100,
    isPublished: true,
    isFeatured: false
  }
})

console.log('Test event created:', testEvent.id)
```

---

## ✅ Sign-Off Checklist

Before marking as complete:
- [ ] Checkout endpoint creates transaction
- [ ] Xendit invoice created successfully
- [ ] Free-after-discount creates RSVP immediately
- [ ] Webhook creates EventRSVP with isPaid=true
- [ ] Webhook creates EventRSVP with paidAt timestamp
- [ ] Wallets updated for all parties (creator, affiliate, admin, founder, cofounder)
- [ ] Amounts match expected distribution (creator 70%, others follow formula)
- [ ] Buyer receives notification on all channels (pusher, onesignal, email)
- [ ] Creator receives notification (pusher, onesignal)
- [ ] Email confirmation includes event details
- [ ] Idempotency works (same webhook twice = single RSVP)
- [ ] Register endpoint rejects paid events
- [ ] Affiliate code in checkout applies commission
- [ ] Coupon discount applied correctly
- [ ] Build succeeds without errors

---

**Testing Guide Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Ready for QA Testing ✅
