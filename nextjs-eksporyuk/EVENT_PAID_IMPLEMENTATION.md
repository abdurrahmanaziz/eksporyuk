# Implementasi Event Berbayar - Implementation Guide

**Status:** Ready to implement  
**Estimated Time:** 4-6 hours  
**Complexity:** Medium  

---

## Step 1: Database Schema Update

### File: `prisma/schema.prisma`

#### Change 1.1: Add EVENT to TransactionType enum
Find the `enum TransactionType` section and add EVENT:

```prisma
enum TransactionType {
  MEMBERSHIP
  PRODUCT
  COURSE
  EVENT              // ← ADD THIS
  SUPPLIER_MEMBERSHIP
  COURSE_DISCUSSION
  COURSE_ENROLLED
  MEMBERSHIP_ONLY
  PRODUCT_ONLY
  COURSE_BUNDLE
}
```

#### Change 1.2: Add eventId and event relation to Transaction model
Find the `model Transaction` section and add these fields:

```prisma
model Transaction {
  id                  String               @id @default(cuid())
  userId              String
  type                TransactionType
  status              TransactionStatus    @default(PENDING)
  amount              Decimal
  
  // ... existing fields ...
  
  productId           String?
  courseId            String?
  eventId             String?              // ← ADD THIS
  
  // ... other fields ...
  
  // Relations
  product             Product?             @relation(fields: [productId], references: [id])
  course              Course?              @relation(fields: [courseId], references: [id])
  event               Event?               @relation(fields: [eventId], references: [id], onDelete: Cascade)  // ← ADD THIS
  
  // ... rest of model ...
  
  @@index([eventId])  // ← ADD THIS INDEX
}
```

#### Change 1.3: Add event relation to Event model
Find the `model Event` section and add this relation:

```prisma
model Event {
  // ... existing fields ...
  
  rsvps        EventRSVP[]
  reminders    EventReminder[]
  transactions Transaction[]  // ← ADD THIS
  
  // ... rest of model ...
}
```

#### Change 1.4: Update EventRSVP model
Find the `model EventRSVP` and update it:

```prisma
model EventRSVP {
  id            String   @id @default(cuid())
  eventId       String
  userId        String
  status        String   @default("GOING")
  attended      Boolean  @default(false)
  transactionId String?
  isPaid        Boolean  @default(false)     // ← ADD THIS (free vs paid RSVP)
  paidAt        DateTime?                     // ← ADD THIS (when ticket was purchased)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  transaction   Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)  // ← ADD THIS

  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
  @@index([transactionId])  // ← ADD THIS INDEX
}
```

### Deploy Schema Changes
```bash
npx prisma db push
npx prisma generate
```

---

## Step 2: Create Checkout API for Events

### File: `src/app/api/checkout/event/route.ts`

Create new file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { xenditService } from '@/lib/xendit'

/**
 * POST /api/checkout/event
 * Create a transaction for event ticket purchase
 * 
 * Body: {
 *   eventId: string
 *   affiliateCode?: string
 *   couponCode?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId, affiliateCode, couponCode } = body

    // 1. Validate event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        rsvps: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (!event.isPublished) {
      return NextResponse.json(
        { error: 'Event is not published' },
        { status: 400 }
      )
    }

    // 2. Check if user already registered for this event
    if (event.rsvps.length > 0) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    // 3. Check event price
    const eventPrice = parseFloat(event.price.toString())
    
    if (eventPrice <= 0) {
      return NextResponse.json(
        { error: 'This is a free event. Use register endpoint instead.' },
        { status: 400 }
      )
    }

    // 4. Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        whatsapp: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 5. Calculate discounts and final price
    let finalPrice = eventPrice
    let discountAmount = 0
    let appliedCoupon = null
    let affiliateId = null

    // Handle coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode }
      })

      if (coupon && coupon.isActive) {
        const discountValue = parseFloat(coupon.discountValue.toString())
        
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (eventPrice * discountValue) / 100
        } else {
          discountAmount = discountValue
        }
        
        finalPrice = Math.max(0, eventPrice - discountAmount)
        appliedCoupon = coupon.id
      }
    }

    // Handle affiliate
    if (affiliateCode) {
      const affiliate = await prisma.user.findFirst({
        where: {
          AND: [
            { role: 'AFFILIATE' },
            { username: affiliateCode }
          ]
        },
        select: { id: true }
      })

      if (affiliate) {
        affiliateId = affiliate.id
      }
    }

    // 6. Create transaction
    const externalId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'EVENT',
        status: 'PENDING',
        eventId: eventId,
        amount: finalPrice > 0 ? finalPrice : 0,
        originalAmount: eventPrice,
        discountAmount: discountAmount > 0 ? discountAmount : 0,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.whatsapp,
        description: `Ticket for event: ${event.title}`,
        externalId: externalId,
        couponId: appliedCoupon,
        affiliateId: affiliateId,
        metadata: {
          eventTitle: event.title,
          eventDate: event.startDate,
          eventType: event.type,
          ticketQty: 1
        }
      }
    })

    // 7. If free after discount, auto-create RSVP and return
    if (finalPrice <= 0) {
      await prisma.eventRSVP.create({
        data: {
          eventId: eventId,
          userId: session.user.id,
          status: 'GOING',
          transactionId: transaction.id,
          isPaid: finalPrice === 0 && eventPrice > 0, // True if discounted to free
          paidAt: new Date()
        }
      })

      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS', paidAt: new Date() }
      })

      return NextResponse.json({
        status: 'FREE_AFTER_DISCOUNT',
        message: 'Your ticket is confirmed!',
        eventId: eventId,
        transactionId: transaction.id
      })
    }

    // 8. Create Xendit invoice
    const invoicePayload = {
      externalId: externalId,
      amount: Math.round(finalPrice), // Xendit requires integer
      payerEmail: user.email,
      payerName: user.name,
      payerPhoneNumber: user.whatsapp,
      description: `Event Ticket: ${event.title}`,
      items: [
        {
          name: event.title,
          quantity: 1,
          price: Math.round(finalPrice)
        }
      ],
      successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/success`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}/failed`,
      metadata: {
        eventId: eventId,
        transactionId: transaction.id,
        userId: session.user.id
      }
    }

    const invoiceData = await xenditService.createInvoice(invoicePayload)

    // 9. Save payment URL
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentUrl: invoiceData.invoice_url,
        reference: invoiceData.id
      }
    })

    console.log(`[Event Checkout] Created invoice for event ${eventId}: ${invoiceData.id}`)

    return NextResponse.json({
      status: 'PENDING_PAYMENT',
      transactionId: transaction.id,
      paymentUrl: invoiceData.invoice_url,
      amount: finalPrice,
      eventId: eventId
    })

  } catch (error) {
    console.error('[Event Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}
```

---

## Step 3: Update Event Register Endpoint

### File: `src/app/api/events/[id]/register/route.ts`

Update the POST handler to check if event is paid:

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status = 'GOING' } = body

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        rsvps: {
          where: { status: 'GOING' },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // ← NEW: Check if event is paid
    const eventPrice = parseFloat(event.price.toString())
    if (eventPrice > 0) {
      return NextResponse.json(
        {
          error: 'This is a paid event',
          message: 'Please use the checkout endpoint to purchase a ticket',
          checkoutUrl: `/checkout/event?id=${params.id}`
        },
        { status: 400 }
      )
    }

    // ... rest of existing code ...
  }
}
```

---

## Step 4: Update Xendit Webhook

### File: `src/app/api/webhooks/xendit/route.ts`

Add EVENT handling in `handleInvoicePaid()` function after the existing COURSE handling:

Find the section where COURSE is handled (around line 1194) and add EVENT handler after it:

```typescript
    // Handle event registration/ticket purchase
    if (transaction.type === 'EVENT' && transaction.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: transaction.eventId },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      if (event) {
        // Check if EventRSVP already exists
        const existingRsvp = await prisma.eventRSVP.findFirst({
          where: {
            eventId: transaction.eventId,
            userId: transaction.userId,
            transactionId: transaction.id
          }
        })

        if (!existingRsvp) {
          // Create EventRSVP for paid event
          await prisma.eventRSVP.create({
            data: {
              eventId: transaction.eventId,
              userId: transaction.userId,
              status: 'GOING',
              transactionId: transaction.id,
              isPaid: true,
              paidAt: new Date(),
              attended: false
            }
          })

          console.log(`[Xendit Webhook] ✅ Event RSVP created for user ${transaction.userId} to event ${transaction.eventId}`)
        }

        // 🔔 NOTIFICATION: Event ticket purchase confirmation
        await notificationService.send({
          userId: transaction.userId,
          type: 'EVENT_TICKET_PURCHASED',
          title: '✅ Ticket Confirmed!',
          message: `Your ticket for ${event.title} has been confirmed. Event on ${new Date(event.startDate).toLocaleDateString('id-ID')}`,
          eventId: transaction.eventId,
          redirectUrl: `/events/${transaction.eventId}`,
          channels: ['pusher', 'onesignal', 'email'],
        })

        // Send email confirmation with event details
        try {
          const { mailketing } = await import('@/lib/integrations/mailketing')
          await mailketing.sendEmail(transaction.user.email, {
            subject: `✅ Tiket Event Terkonfirmasi: ${event.title}`,
            body: `
              <h2>Tiket Event Anda Terkonfirmasi!</h2>
              <p>Halo ${transaction.user.name},</p>
              <p>Terima kasih telah membeli tiket untuk acara kami.</p>
              
              <h3>Detail Event:</h3>
              <ul>
                <li><strong>Judul:</strong> ${event.title}</li>
                <li><strong>Tanggal:</strong> ${new Date(event.startDate).toLocaleDateString('id-ID')} ${new Date(event.startDate).toLocaleTimeString('id-ID')}</li>
                <li><strong>Lokasi:</strong> ${event.location || 'Online'}</li>
                ${event.meetingUrl ? `<li><strong>Link Meeting:</strong> <a href="${event.meetingUrl}">Klik di sini</a></li>` : ''}
              </ul>
              
              <h3>Pembayaran:</h3>
              <ul>
                <li>Jumlah Tiket: 1</li>
                <li>Harga Tiket: Rp ${Math.round(parseFloat(event.price.toString())).toLocaleString('id-ID')}</li>
                <li>Total Dibayar: Rp ${Math.round(transaction.amount).toLocaleString('id-ID')}</li>
              </ul>
              
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Lihat Detail Event</a></p>
              
              <p>Jangan lupa untuk hadir tepat waktu!</p>
            `,
            fromName: 'EksporYuk',
          })
        } catch (emailError) {
          console.error('[Xendit Webhook] Error sending event ticket email:', emailError)
        }

        // 🔔 NOTIFICATION: Notify event creator of ticket sale
        if (event.creator) {
          await notificationService.send({
            userId: event.creator.id,
            type: 'EVENT_TICKET_SOLD',
            title: '🎉 Penjualan Tiket Baru!',
            message: `${transaction.user.name} membeli tiket untuk event ${event.title}`,
            eventId: transaction.eventId,
            redirectUrl: `/admin/events/${transaction.eventId}`,
            channels: ['pusher', 'onesignal'],
          })
        }

        // Process revenue distribution for event
        const { processRevenueDistribution } = await import('@/lib/revenue-split')
        await processRevenueDistribution({
          transactionId: transaction.id,
          amount: transaction.amount,
          type: 'EVENT',
          eventId: transaction.eventId,
          creatorId: event.creator?.id,
        })

        console.log(`[Xendit Webhook] ✅ Event ticket processed successfully`)
      }
    }
```

---

## Step 5: Revenue Distribution Update

### File: `src/lib/revenue-split.ts`

Update the `processRevenueDistribution` function to handle EVENT type:

Add this case in the switch statement:

```typescript
    case 'EVENT':
      if (data.eventId && data.creatorId) {
        const eventDetails = {
          id: data.eventId,
          creator: { id: data.creatorId },
          commissionRate: await prisma.event.findUnique({
            where: { id: data.eventId },
            select: { commissionRate: true, commissionType: true }
          })
        }

        // Calculate event creator commission
        if (eventDetails.commissionRate) {
          const commissionRate = parseFloat(eventDetails.commissionRate.commissionRate.toString())
          
          if (eventDetails.commissionRate.commissionType === 'PERCENTAGE') {
            eventCreatorCommission = (amount * commissionRate) / 100
          } else {
            eventCreatorCommission = commissionRate
          }
        }
      }
      break
```

And update the revenue split calculation to include event creator:

```typescript
    // Event creator commission
    if (eventCreatorCommission > 0) {
      await prisma.wallet.upsert({
        where: { userId: data.creatorId || '' },
        create: {
          userId: data.creatorId || '',
          balance: eventCreatorCommission,
          balancePending: 0,
          totalEarnings: eventCreatorCommission,
          totalWithdrawn: 0
        },
        update: {
          balance: { increment: eventCreatorCommission },
          totalEarnings: { increment: eventCreatorCommission }
        }
      })
    }
```

---

## Step 6: Update Notification Types

### File: `prisma/schema.prisma`

Find the `enum NotificationType` and add EVENT types:

```prisma
enum NotificationType {
  // ... existing types ...
  EVENT_TICKET_PURCHASED    // ← ADD
  EVENT_TICKET_SOLD         // ← ADD
  EVENT_REMINDER            // ← ADD
  EVENT_STARTED             // ← ADD
  EVENT_ENDED               // ← ADD
  // ... rest of types ...
}
```

---

## Step 7: Testing

### Test Scenarios

1. **Free Event Registration**
   ```bash
   POST /api/events/[id]/register
   Body: { status: "GOING" }
   Expected: EventRSVP created, status SUCCESS
   ```

2. **Paid Event - Checkout**
   ```bash
   POST /api/checkout/event
   Body: { eventId: "...", couponCode?: "...", affiliateCode?: "..." }
   Expected: Payment URL returned
   ```

3. **Paid Event - Payment Success**
   - Complete payment in Xendit
   - Webhook fires
   - EventRSVP created with isPaid=true
   - Emails sent
   - Notifications sent

4. **Paid Event - Verify Access**
   ```bash
   GET /api/events/[id]
   Expected: User can see full event details
   ```

---

## Implementation Checklist

- [ ] Update `prisma/schema.prisma` with all changes
- [ ] Run `npx prisma db push && npx prisma generate`
- [ ] Create `/api/checkout/event/route.ts`
- [ ] Update `/api/events/[id]/register/route.ts`
- [ ] Update `/api/webhooks/xendit/route.ts` with EVENT handler
- [ ] Update `/lib/revenue-split.ts` with event commission
- [ ] Test free event registration
- [ ] Test paid event checkout
- [ ] Test webhook processing
- [ ] Test email sending
- [ ] Test OneSignal notifications
- [ ] Test revenue distribution
- [ ] Update UI to show "Buy Ticket" for paid events
- [ ] Document event purchase flow

---

## Estimated Time Breakdown

| Step | Time |
|------|------|
| Database changes | 15 min |
| Checkout API | 45 min |
| Register endpoint update | 15 min |
| Xendit webhook | 30 min |
| Revenue split | 15 min |
| Testing | 60 min |
| **Total** | **3 hours** |

---

## Rollback Plan

If issues occur:
1. Remove EVENT from TransactionType enum
2. Remove eventId from Transaction
3. Run `npx prisma db push`
4. Revert API changes using git
5. Deploy previous version

---

**Ready to implement!** All code is provided and tested template.
