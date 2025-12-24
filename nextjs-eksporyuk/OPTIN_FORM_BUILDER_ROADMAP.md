# Optin Form Builder - Implementation Roadmap

## ✅ COMPLETED (Phase 1)

### Drag & Drop Builder
- ✅ @dnd-kit integration for drag and drop
- ✅ Draggable components from left sidebar
- ✅ Sortable elements in canvas
- ✅ Visual drag overlay feedback
- ✅ Collision detection

### Layout & Design
- ✅ 3-column layout (components | mobile preview | settings)
- ✅ Mobile frame with status bar
- ✅ Scrollable canvas content
- ✅ Grid background pattern
- ✅ Sticky submit button

### Basic Form Elements
- ✅ Text input
- ✅ Email input (with icon option)
- ✅ Phone/WhatsApp input
- ✅ Dropdown (placeholder)
- ✅ Checkbox (placeholder)
- ✅ Heading (H1, H2, H3)
- ✅ Paragraph text
- ✅ Image upload from device
- ✅ Divider
- ✅ Countdown timer

### Settings Panel
- ✅ Field Settings tab
- ✅ Style tab (color picker)
- ✅ Element-specific settings
- ✅ Required field toggle
- ✅ Email validation toggle
- ✅ Icon toggle for email

## 🚧 IN PROGRESS (Phase 2)

### Form Settings & Configuration
- [ ] **After Submit Action**
  - [ ] Show success message
  - [ ] Redirect to URL
  - [ ] Redirect to WhatsApp
  - [ ] Show Thank You Page (custom builder)

- [ ] **Thank You Page Builder**
  - [ ] Drag & drop editor seperti form builder
  - [ ] Template library (Success, Download, Community Join)
  - [ ] Custom headline & message
  - [ ] CTA button configuration
  - [ ] Social proof section (avatars, ratings)
  - [ ] Footer links (Privacy, Terms)

- [ ] **Lead Magnet Integration**
  - [ ] Link to Lead Magnet from admin
  - [ ] Automatic delivery after form submit
  - [ ] Email template selection
  - [ ] Download button on thank you page

### Notification & Automation
- [ ] **Email Notifications**
  - [ ] Welcome email template selection
  - [ ] Lead magnet delivery email
  - [ ] Custom email content editor
  - [ ] Email preview
  - [ ] Integration with Mailketing

- [ ] **WhatsApp Reminders**
  - [ ] Reminder schedule (1 hour, 1 day, 3 days)
  - [ ] WhatsApp template selection
  - [ ] Custom message with variables
  - [ ] Integration with Starsender

- [ ] **Auto-Responder Series**
  - [ ] Email sequence builder
  - [ ] Delay configuration between emails
  - [ ] Template library
  - [ ] Variable insertion (name, email, etc.)

### Admin Template Management
- [ ] **Email Templates**
  - [ ] Create/Edit email templates
  - [ ] Variable support {{name}}, {{leadMagnetUrl}}
  - [ ] Preview with sample data
  - [ ] Template categories

- [ ] **WhatsApp Templates**
  - [ ] Create/Edit WhatsApp message templates
  - [ ] Character limit warning
  - [ ] Emoji support
  - [ ] Variable support

- [ ] **Thank You Page Templates**
  - [ ] Pre-built template gallery
  - [ ] Duplicate & customize
  - [ ] Preview mode
  - [ ] Template categories (Success, Download, Community)

### Form Submission & Lead Management
- [ ] **Lead Capture**
  - [ ] Save to AffiliateOptinFormLead table
  - [ ] Duplicate detection (existing lead logic)
  - [ ] Lead scoring
  - [ ] Tag assignment

- [ ] **Lead Actions**
  - [ ] Send welcome email
  - [ ] Send lead magnet
  - [ ] Add to auto-responder
  - [ ] Send WhatsApp message
  - [ ] Trigger webhook

- [ ] **Analytics**
  - [ ] Submission tracking
  - [ ] Conversion rate
  - [ ] Email open rate
  - [ ] Link click tracking

### Integration Features
- [ ] **CRM Integration**
  - [ ] Field mapping configuration
  - [ ] Auto-sync to CRM
  - [ ] Tag management
  - [ ] Custom field support

- [ ] **Marketing Tools**
  - [ ] Mailketing integration
  - [ ] Starsender WhatsApp
  - [ ] OneSignal push notifications
  - [ ] Webhook configuration

## 📋 PRIORITY TASKS (Next Sprint)

1. **Thank You Page Builder** ⭐⭐⭐
   - Copy design from provided HTML
   - Implement drag & drop editor
   - Add template library
   - Save/Preview functionality

2. **Form Settings Panel** ⭐⭐⭐
   - After submit action selector
   - Redirect URL input
   - WhatsApp number input
   - Success message editor

3. **Email Notification System** ⭐⭐
   - Email template selection
   - Variable insertion
   - Preview functionality
   - Send test email

4. **Lead Magnet Delivery** ⭐⭐
   - Auto-send email after form submit
   - Download link generation
   - Expiry configuration

5. **WhatsApp Reminder** ⭐
   - Reminder schedule UI
   - Template selection
   - Starsender integration

## 🔧 API Endpoints Needed

### Form Management
- `POST /api/affiliate/optin-forms` - Create form ✅
- `PUT /api/affiliate/optin-forms/[id]` - Update form ✅
- `DELETE /api/affiliate/optin-forms/[id]` - Delete form ✅
- `GET /api/affiliate/optin-forms/[id]` - Get form details ✅

### Thank You Page
- `POST /api/affiliate/optin-forms/[id]/thank-you-page` - Save thank you page
- `GET /api/affiliate/optin-forms/[id]/thank-you-page` - Get thank you page
- `PUT /api/affiliate/optin-forms/[id]/thank-you-page` - Update thank you page

### Templates (Admin)
- `GET /api/admin/templates/email` - List email templates
- `POST /api/admin/templates/email` - Create email template
- `GET /api/admin/templates/whatsapp` - List WhatsApp templates
- `POST /api/admin/templates/whatsapp` - Create WhatsApp template
- `GET /api/admin/templates/thank-you` - List thank you page templates

### Lead Management
- `POST /api/optin/[formSlug]/submit` - Submit form (public)
- `GET /api/affiliate/optin-forms/[id]/leads` - Get form leads
- `POST /api/affiliate/optin-forms/[id]/leads/[leadId]/notify` - Manual notification

### Automation
- `POST /api/automation/send-lead-magnet` - Send lead magnet email
- `POST /api/automation/send-whatsapp-reminder` - Send WhatsApp reminder
- `POST /api/automation/start-sequence` - Start email sequence

## 🗃️ Database Schema Extensions

```prisma
// Extend AffiliateOptinForm
model AffiliateOptinForm {
  // ... existing fields
  
  // Thank You Page
  thankYouPageEnabled    Boolean  @default(false)
  thankYouPageHeadline   String?
  thankYouPageMessage    String?
  thankYouPageCta        String?
  thankYouPageCtaUrl     String?
  thankYouPageElements   Json?    // Drag & drop elements
  
  // Email Settings
  sendWelcomeEmail       Boolean  @default(true)
  welcomeEmailTemplateId String?
  sendLeadMagnet         Boolean  @default(true)
  leadMagnetEmailTemplateId String?
  
  // WhatsApp Settings
  sendWhatsAppWelcome    Boolean  @default(false)
  whatsAppTemplateId     String?
  whatsAppReminders      Json?    // [{delay: '1h', templateId: 'xxx'}]
  
  // Auto-Responder
  autoResponderEnabled   Boolean  @default(false)
  autoResponderSequenceId String?
  
  // Advanced
  duplicateLeadAction    String   @default('show_message') // 'show_message', 'redirect', 'update'
  duplicateLeadMessage   String?
  webhookUrl             String?
  webhookEnabled         Boolean  @default(false)
}

// New Models
model EmailTemplate {
  id          String   @id @default(cuid())
  name        String
  subject     String
  body        String   @db.Text
  variables   Json?    // [{name: 'firstName', default: 'User'}]
  category    String   // 'welcome', 'lead_magnet', 'reminder'
  isActive    Boolean  @default(true)
  createdBy   String?  // Admin user id
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WhatsAppTemplate {
  id          String   @id @default(cuid())
  name        String
  message     String   @db.Text
  variables   Json?
  category    String
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ThankYouPageTemplate {
  id          String   @id @default(cuid())
  name        String
  thumbnail   String?
  elements    Json     // Drag & drop structure
  category    String   // 'success', 'download', 'community'
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AutoResponderSequence {
  id          String   @id @default(cuid())
  name        String
  description String?
  emails      Json     // [{delay: '1d', templateId: 'xxx'}]
  isActive    Boolean  @default(true)
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 📝 Implementation Notes

### Thank You Page Builder
- Reuse drag & drop logic from form builder
- Add template selection modal
- Preview in mobile frame
- Save as JSON structure

### Email Notifications
- Use existing notificationService.ts
- Extend with template support
- Add variable replacement
- Queue emails for bulk sending

### WhatsApp Integration
- Use existing starsenderService.ts
- Implement message templating
- Add delay scheduling
- Handle failed deliveries

### Lead Magnet Delivery
- Generate temporary download links
- Set expiry (24 hours default)
- Track download count
- Email with download button

## 🎯 Success Criteria

1. ✅ Affiliate dapat membuat optin form dengan drag & drop
2. ⏳ Affiliate dapat customize thank you page
3. ⏳ Affiliate dapat pilih email template dari admin
4. ⏳ Affiliate dapat set WhatsApp reminder
5. ⏳ Form submission otomatis kirim email + WhatsApp
6. ⏳ Lead magnet terkirim otomatis setelah form submit
7. ⏳ Admin dapat manage template (email, WhatsApp, thank you page)
8. ⏳ Analytics tracking untuk conversion & engagement

---

**Last Updated:** 24 Desember 2025
**Status:** Phase 1 Complete, Phase 2 In Planning
