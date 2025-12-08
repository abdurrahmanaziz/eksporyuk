# Event Management System - Product-Based Architecture

## 📋 Overview

Event management has been separated from the products page to a dedicated `/admin/events` interface for better management of event-specific features like reminders, meeting settings, and attendee tracking.

## 🏗️ Architecture

**Hybrid Approach (OPSI C):**
- Events stored as `Product` with `productType='EVENT'`
- No database migration needed
- Unified checkout flow
- Dedicated admin UI at `/admin/events`

## 📁 Files Created

### API Endpoints
1. **`/api/admin/events/route.ts`** (195 lines)
   - `GET`: List events with status filter
   - `POST`: Create new event
   
2. **`/api/admin/events/[id]/route.ts`** (198 lines)
   - `GET`: Get single event with attendees
   - `PUT`: Update event details
   - `DELETE`: Delete event (only if no attendees)

### Admin Page
3. **`/admin/events/page.tsx`** (787 lines)
   - Event list with status tabs
   - Stats cards dashboard
   - Create/Edit dialog with full form
   - Attendee tracking

## 🔍 API Endpoints

### GET /api/admin/events?status={status}
Filter events by status:
- `all`: All events
- `upcoming`: eventDate > now
- `ongoing`: eventDate ≤ now AND eventEndDate ≥ now
- `past`: eventEndDate < now

**Response:**
```json
{
  "events": [
    {
      "id": "...",
      "name": "Event Name",
      "eventDate": "2024-01-15T10:00:00Z",
      "eventEndDate": "2024-01-15T12:00:00Z",
      "price": 250000,
      "maxParticipants": 50,
      "isActive": true,
      "isFeatured": false,
      "creator": { "id": "...", "name": "...", "email": "..." },
      "_count": { "userProducts": 25 }
    }
  ]
}
```

### POST /api/admin/events
Create new event.

**Request Body:**
```json
{
  "name": "Export Masterclass 2024",
  "description": "Learn export fundamentals...",
  "shortDescription": "Brief description",
  "price": 500000,
  "originalPrice": 750000,
  "thumbnail": "https://...",
  "eventDate": "2024-02-01T09:00:00Z",
  "eventEndDate": "2024-02-01T17:00:00Z",
  "eventDuration": 480,
  "eventUrl": "https://zoom.us/j/...",
  "meetingId": "123 456 7890",
  "meetingPassword": "password123",
  "maxParticipants": 100,
  "eventVisibility": "PUBLIC",
  "isActive": true,
  "isFeatured": true,
  "reminders": {
    "reminder7Days": true,
    "reminder3Days": true,
    "reminder1Day": true,
    "reminder1Hour": true,
    "reminder15Min": false
  }
}
```

### GET /api/admin/events/[id]
Get single event with full details and attendee list.

**Response:**
```json
{
  "event": {
    "id": "...",
    "name": "...",
    "userProducts": [
      {
        "user": { "id": "...", "name": "...", "email": "..." }
      }
    ],
    "_count": { "userProducts": 10 }
  }
}
```

### PUT /api/admin/events/[id]
Update event details. Same body as POST, all fields optional.

### DELETE /api/admin/events/[id]
Delete event. Returns 400 error if event has attendees.

## 🎨 Admin UI Features

### Dashboard Stats
- Total Events
- Total Attendees
- Upcoming Events
- Ongoing Events

### Event List
- **Tabs**: All / Upcoming / Ongoing / Past
- **Status Badges**: Upcoming 🔜 / Ongoing 🔴 / Past ⏮️
- **Info Display**: Date, duration, attendees, price
- **Actions**: View, Edit, Delete

### Create/Edit Dialog
**Basic Info:**
- Event Name *
- Short Description
- Full Description
- Thumbnail URL

**Pricing:**
- Price (Rp) *
- Original Price (Rp)

**Date & Time:**
- Start Date & Time *
- End Date & Time
- Duration (minutes)
- Max Participants (0 = unlimited)

**Meeting Details:**
- Event URL (Zoom/Google Meet)
- Meeting ID
- Meeting Password

**Visibility:**
- PUBLIC
- PRIVATE
- PASSWORD_PROTECTED (with password field)

**Reminders:**
- ☐ 7 days before
- ☐ 3 days before
- ☐ 1 day before
- ☐ 1 hour before
- ☐ 15 minutes before

**Status:**
- ☐ Active (Published)
- ☐ Featured Event

## 💾 Database Schema

### Product Model (EVENT fields)
```prisma
model Product {
  productType     String   // 'EVENT'
  
  // Event-specific fields
  eventDate       DateTime?
  eventEndDate    DateTime?
  eventDuration   Int?
  eventUrl        String?
  meetingId       String?
  meetingPassword String?
  eventVisibility String?
  eventPassword   String?
  maxParticipants Int?
  
  // Reminder flags
  reminder7Days   Boolean @default(false)
  reminder3Days   Boolean @default(false)
  reminder1Day    Boolean @default(false)
  reminder1Hour   Boolean @default(false)
  reminder15Min   Boolean @default(false)
  
  // Relations
  userProducts UserProduct[] // Attendees
  creator      User
}
```

### UserProduct (Attendees)
```prisma
model UserProduct {
  product   Product
  user      User
  createdAt DateTime // Registration date
}
```

## 🎯 Date Filtering Logic

### Upcoming
```typescript
eventDate > now
```

### Ongoing
```typescript
eventDate <= now AND eventEndDate >= now
```

### Past
```typescript
eventEndDate < now
OR (eventDate < now AND eventEndDate is null)
```

## 🚀 Usage Example

### Creating an Event
1. Go to `/admin/events`
2. Click "Create Event" button
3. Fill in the form:
   - Name: "Export Workshop 2024"
   - Date: Select date/time
   - Price: 500000
   - Meeting URL: Zoom link
   - Enable reminders: 7d, 3d, 1d
4. Toggle "Active" ON
5. Click "Create Event"

### Viewing Attendees
1. Navigate to `/admin/events`
2. Click "View" icon on event card
3. See full attendee list with registration dates

### Managing Reminders
- Toggle reminder switches in create/edit dialog
- System will send notifications automatically based on enabled reminders
- Supported intervals: 7d, 3d, 1d, 1h, 15m

## ✅ Benefits

### No Migration Needed
- Uses existing Product model
- Events already in database work automatically

### Unified Checkout
- Same checkout flow as digital products
- UserProduct tracks purchases/registrations

### Dedicated Interface
- Clean separation from product management
- Event-specific filters and views
- Easy reminder configuration

### Advanced Features
- Date-based status filtering
- Capacity management
- Meeting integration
- Revenue tracking
- Attendee management

## 📊 Statistics Tracking

```typescript
// Total revenue from events
const revenue = await prisma.userProduct.aggregate({
  where: {
    product: { productType: 'EVENT' }
  },
  _sum: { price: true }
})

// Total attendees
const attendees = await prisma.userProduct.count({
  where: {
    product: { productType: 'EVENT' }
  }
})

// Upcoming events count
const upcoming = await prisma.product.count({
  where: {
    productType: 'EVENT',
    eventDate: { gt: new Date() }
  }
})
```

## 🔐 Security

- Admin-only access (role check in middleware)
- Cannot delete events with attendees
- Slug uniqueness validation
- Meeting password optional (hidden in UI with ***)

## 🎉 Status

✅ **COMPLETE** - Event management system fully integrated and ready to use!

Access: `/admin/events` (Admin role required)
