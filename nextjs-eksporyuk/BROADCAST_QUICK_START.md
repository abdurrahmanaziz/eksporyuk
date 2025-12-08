# 🚀 BROADCAST SYSTEM - QUICK START GUIDE

## 📍 Access the System

```
URL: http://localhost:3000/admin/templates
Tab: Broadcast (third tab)
Role: ADMIN only
```

---

## 🎯 Quick Actions

### 1. Create Email Campaign
```
1. Click "Campaign Baru"
2. Name: "My First Email"
3. Type: EMAIL
4. Target: ALL
5. Subject: "Hello {name}"
6. Body: "Hi {name}, welcome to EksporYuk!"
7. CTA Text: "Visit Dashboard"
8. CTA Link: "https://eksporyuk.com/dashboard"
9. Click "Buat Campaign"
```

### 2. Create WhatsApp Campaign
```
1. Click "Campaign Baru"
2. Name: "WhatsApp Promo"
3. Type: WHATSAPP
4. Target: BY_ROLE → Select MEMBER_PRO
5. Message: "Halo {name}! Promo spesial untuk member pro..."
6. CTA Text: "Lihat Promo"
7. CTA Link: "https://eksporyuk.com/promo"
8. Click "Buat Campaign"
```

### 3. Preview Audience
```
1. In create/edit modal
2. Select target type and filters
3. Click "Preview Target Audience"
4. See total users and breakdown
```

### 4. Send Campaign
```
1. Find campaign with status DRAFT
2. Click Send icon (paper plane)
3. Confirm send
4. Watch status change to SENDING → COMPLETED
5. Check metrics (sent/failed counts)
```

---

## 📊 Available Shortcodes

Use these in your email subject/body or WhatsApp message:

| Shortcode | Output Example | Description |
|-----------|---------------|-------------|
| `{name}` | "John Doe" | User's full name |
| `{email}` | "john@email.com" | User's email |
| `{role}` | "MEMBER_PRO" | User's role |
| `{membership_plan}` | "Pro Plan" | Membership name |
| `{dashboard_link}` | "https://.../" | Dashboard URL |
| `{profile_link}` | "https://.../" | Profile URL |
| `{support_link}` | "https://.../" | Support URL |
| `{company_name}` | "EksporYuk" | Company name |
| `{year}` | "2025" | Current year |
| `{date}` | "30/11/2025" | Current date (ID format) |

**Example Usage**:
```
Subject: Weekly Update for {name}
Body: Hi {name}, as a {membership_plan} member, you have access to...
Visit your dashboard: {dashboard_link}
```

---

## 🎯 Target Types

| Type | Description | Example Use Case |
|------|-------------|------------------|
| **ALL** | All active users | Company announcement |
| **BY_ROLE** | Filter by user roles | Pro member exclusive |
| **BY_MEMBERSHIP** | Filter by membership plan | Membership renewal |
| **BY_GROUP** | Filter by group | Group-specific update |
| **BY_COURSE** | Filter by course enrollment | Course completion reminder |
| **CUSTOM** | Manual user ID list | VIP customer promo |

---

## 📈 Campaign Statuses

| Status | Color | Description | Actions Available |
|--------|-------|-------------|-------------------|
| **DRAFT** | Gray | Not sent yet | Send, Edit, Delete |
| **SCHEDULED** | Blue | Scheduled for future | Edit, Cancel |
| **SENDING** | Yellow | Currently sending | View only |
| **COMPLETED** | Green | Successfully sent | View, Delete |
| **FAILED** | Red | Send failed | View, Retry, Delete |

---

## ⚡ Quick Tips

### ✅ DO
- ✅ Preview audience before sending
- ✅ Test with small group first
- ✅ Use shortcodes for personalization
- ✅ Add clear CTA with link
- ✅ Keep WhatsApp under 1024 chars
- ✅ Check metrics after sending

### ❌ DON'T
- ❌ Send to ALL without preview
- ❌ Edit campaigns while SENDING
- ❌ Forget to add shortcodes
- ❌ Use too many CTAs
- ❌ Exceed WhatsApp char limit
- ❌ Send without testing content

---

## 🔧 Troubleshooting

### Campaign not sending?
```
1. Check campaign status (must be DRAFT)
2. Verify target users exist (preview audience)
3. Check Mailketing/StarSender config in /admin/integrations
4. Review error logs in BroadcastLog table
```

### Users not receiving?
```
1. Check user notification preferences
   - emailNotifications must be true for email
   - whatsappNotifications must be true for WhatsApp
2. Verify user has email/whatsapp field filled
3. Check integration service status
```

### Metrics showing 0?
```
1. Wait for COMPLETED status
2. Check failed count for errors
3. Review individual logs in BroadcastLog
4. Verify integration services are working
```

---

## 📱 API Quick Reference

### Get All Campaigns
```bash
GET /api/admin/broadcast?status=DRAFT&type=EMAIL
```

### Create Campaign
```bash
POST /api/admin/broadcast
Body: {
  "name": "Campaign Name",
  "type": "EMAIL",
  "targetType": "ALL",
  "emailSubject": "Subject",
  "emailBody": "Body"
}
```

### Preview Audience
```bash
POST /api/admin/broadcast/preview-audience
Body: {
  "targetType": "BY_ROLE",
  "targetRoles": ["MEMBER_PRO"]
}
```

### Send Campaign
```bash
POST /api/admin/broadcast/send
Body: {
  "campaignId": "campaign_id"
}
```

---

## 📊 Database Quick Access

### Check Campaign
```sql
SELECT * FROM BroadcastCampaign WHERE status = 'COMPLETED';
```

### Check Logs
```sql
SELECT * FROM BroadcastLog WHERE campaignId = 'xxx' AND status = 'FAILED';
```

### Count by Status
```sql
SELECT status, COUNT(*) FROM BroadcastCampaign GROUP BY status;
```

---

## 🎯 Common Use Cases

### 1. Welcome Email for New Members
```
Target: ALL (or BY_ROLE: MEMBER_FREE)
Subject: Welcome to EksporYuk, {name}!
Body: Hi {name}, thanks for joining us...
CTA: Visit Dashboard
```

### 2. Membership Renewal Reminder
```
Target: BY_MEMBERSHIP (expiring memberships)
Subject: {name}, Your {membership_plan} is expiring soon
Body: Don't miss out! Renew now...
CTA: Renew Membership
```

### 3. Course Launch Announcement
```
Target: ALL
Type: BOTH (Email + WhatsApp)
Subject: New Course Available!
Message: Hi {name}, we just launched...
CTA: View Course
```

### 4. VIP Customer Exclusive
```
Target: CUSTOM (list of VIP user IDs)
Type: WHATSAPP
Message: Hi {name}, special offer for you...
CTA: Claim Offer
```

---

## ✅ Testing Checklist

Before sending to production:

- [ ] Preview audience count is correct
- [ ] Shortcodes are properly placed
- [ ] CTA link is working
- [ ] Content looks good
- [ ] Character limit not exceeded (WhatsApp)
- [ ] Target type is correct
- [ ] Integration services are active
- [ ] Test send to yourself first

---

## 📞 Need Help?

1. **Documentation**: See `BROADCAST_SYSTEM_COMPLETE.md`
2. **Tests**: Run `node test-broadcast-system.js`
3. **Logs**: Check BroadcastLog table for errors
4. **Integrations**: Verify in `/admin/integrations`

---

**Quick Start Complete!** 🎉

Access: `/admin/templates` → Broadcast tab

Start broadcasting! 📢
