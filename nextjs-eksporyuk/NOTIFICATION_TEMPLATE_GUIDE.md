# 📋 Notification & Reminder Template Guide

## 📍 Quick Locations

### EMAIL TEMPLATES
```
src/lib/email-templates.ts              → Main email templates
src/lib/email-template-library.ts       → Template library
src/lib/email-renderer.ts               → Rendering engine
src/lib/email-service.ts                → Email operations
src/lib/branded-template-engine.ts      → Branded customization
src/lib/email/supplier-email.ts         → Supplier emails
src/lib/email/certificate-email.ts      → Certificate emails
```

### REMINDER TEMPLATES
```
src/lib/reminder-templates.ts                    → Core reminders
src/lib/membership-reminder-templates.ts         → Membership reminders
src/lib/follow-up-templates.ts                   → Follow-up sequences
src/lib/services/reminderService.ts              → Reminder service
```

### SPECIAL TEMPLATES
```
src/lib/certificate-template.tsx        → Certificate rendering (React)
src/lib/branded-template-helpers.ts     → Branding helpers
```

### SERVICES
```
src/lib/services/notificationService.ts         → Core notifications
src/lib/services/mailketingService.ts           → Mailketing integration
```

---

## 📧 EMAIL TEMPLATE TYPES

| Template | File | Purpose |
|----------|------|---------|
| Membership Activation | email-templates.ts | Confirm membership activation |
| Welcome Email | email-templates.ts | First email to new users |
| Supplier Notifications | supplier-email.ts | Supplier-specific emails |
| Certificate Issued | certificate-email.ts | Certificate completion |
| Course Enrollment | mailketingService.ts | Course enrollment confirm |
| Payment Receipt | mailketingService.ts | Transaction confirmation |
| Password Reset | email-service.ts | Password recovery |
| Event Reminder | reminder-templates.ts | Event pre-notifications |
| Course Deadline | reminder-templates.ts | Assignment deadlines |

---

## ⏰ REMINDER TYPES

| Reminder | File | Timing |
|----------|------|--------|
| EVENT_REMINDER | reminder-templates.ts | Pre-event (7/3/1 day, 1 hour) |
| COURSE_DEADLINE | reminder-templates.ts | Before submission deadline |
| MEMBERSHIP_RENEWAL | membership-reminder-templates.ts | Pre-renewal alerts |
| PAYMENT_DUE | reminder-templates.ts | Payment reminders |
| MATERIAL_AVAILABLE | reminder-templates.ts | New material alerts |
| CLASS_START | reminder-templates.ts | Class starting soon |
| membershipExpiring | membership-reminder-templates.ts | Pre-expiration |
| membershipExpired | membership-reminder-templates.ts | Post-expiration |

---

## 🔧 HOW TO USE

### Send Email with Template
```typescript
// src/lib/services/mailketingService.ts
await sendMail({
  to: user.email,
  template: 'membershipActivation',
  data: { userName: user.name, membershipDate: new Date() }
})
```

### Schedule Reminder
```typescript
// src/lib/services/reminderService.ts
await scheduleReminder({
  userId: userId,
  type: 'MEMBERSHIP_RENEWAL',
  daysBeforeEvent: 7,
  data: { membershipId: membershipId }
})
```

### Send Notification with Template
```typescript
// src/lib/services/notificationService.ts
await notificationService.send({
  userId: userId,
  type: 'TRANSACTION',
  emailTemplate: 'transactionConfirmation',
  data: { transactionId, amount }
})
```

---

## 🎨 CUSTOMIZATION

### Variables Available
```
{{userName}}
{{userEmail}}
{{eventName}}
{{eventDate}}
{{amount}}
{{transactionId}}
{{courseTitle}}
{{certificateName}}
```

### Branding Customization
```typescript
import { brandedTemplateEngine } from '@/lib/branded-template-engine'

const html = await brandedTemplateEngine.render({
  template: 'transactionConfirmation',
  colors: { primary: '#1f2937', accent: '#3b82f6' },
  logo: 'https://...',
  data: { /* data */ }
})
```

---

## 📊 Integration Points

### Mailketing Service
- Sends all email templates
- Handles email delivery
- Tracks opens/clicks

### Reminder Service  
- Schedules reminders
- Sends at specified time
- Respects user preferences

### Notification Service
- Multi-channel delivery
- Combines all templates
- Handles all notification types

---

## ✅ Status

- ✅ 7 Email template files
- ✅ 4 Reminder template files
- ✅ 1 Special template file
- ✅ 20+ distinct templates
- ✅ 5,825+ lines of code
- ✅ All systems operational

