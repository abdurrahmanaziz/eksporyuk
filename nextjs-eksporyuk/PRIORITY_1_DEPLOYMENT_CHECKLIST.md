# Priority 1 Deployment & Next Steps Checklist

**Date:** 8 Desember 2025  
**Status:** ✅ Implementation Complete - Ready for Testing

---

## 🚀 Pre-Deployment Checklist

### Environment Variables to Set:

```env
# 1. Generate webhook secret (if not already set):
# Terminal: openssl rand -base64 32
# Copy output and add to .env:
ONESIGNAL_WEBHOOK_SECRET=your_generated_secret_here

# 2. Verify these are already configured:
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_api_key

# 3. Verify database is configured:
DATABASE_URL=file:./dev.db
```

### Database Verification:

```bash
# Check database has been synced:
npx prisma db push

# Verify new tables exist:
sqlite3 prisma/dev.db ".tables"
# Should show: NotificationConsent, NotificationDeliveryLog, ConversionEvent, OneSignalWebhookLog
```

### Build Verification:

```bash
# Full build test (no errors):
npm run build

# Expected: ✓ Compiled successfully
# Should show 0 critical errors
```

---

## 🔧 OneSignal Dashboard Setup (REQUIRED)

### 1. Enable Webhooks:

```
OneSignal Dashboard
  → Settings
    → Webhooks
      → Add New Webhook
        
URL: https://eksporyuk.com/api/webhooks/onesignal
Authentication Type: Bearer Token
Token: {ONESIGNAL_WEBHOOK_SECRET value from .env}

Events to Subscribe:
  ✅ Notification Delivered
  ✅ Notification Opened
  ✅ Notification Clicked
  ✅ Notification Bounced
  
Status: Active
```

### 2. Verify Webhook Health:

```
After setup:
  → OneSignal Dashboard
    → Webhooks → View Details
      → Should show "Healthy" status
      → Recent deliveries showing
```

### 3. Test Webhook Manually:

```
OneSignal Dashboard
  → Webhooks → Test
    → Send Test Event
      → Check your /api/webhooks/onesignal receives it
      → Check OneSignalWebhookLog table for entry
```

---

## 🧪 Testing Steps (In Order)

### Phase 1: Local Development Testing (30 min)

```bash
# 1. Start dev server:
npm run dev

# 2. Test API endpoints (see PRIORITY_1_API_TESTING_GUIDE.md):
# - POST /api/users/onesignal-sync
# - GET /api/users/onesignal-sync
# - POST /api/users/notification-consent
# - GET /api/users/notification-consent
# - DELETE /api/users/notification-consent

# 3. Check database after each test:
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM NotificationConsent;"
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM User WHERE oneSignalPlayerId IS NOT NULL;"

# 4. Test webhook manually (see testing guide)
```

### Phase 2: Integration Testing (1 hour)

```bash
# 1. Login with test user account
# 2. Subscribe to web push notifications
# 3. Check User.oneSignalPlayerId populated in database
# 4. Send test notification from OneSignal dashboard
# 5. Verify NotificationDeliveryLog shows "delivered"
# 6. Open notification → Check "opened" status
# 7. Click notification link → Check "clicked" + URL
```

### Phase 3: GDPR Compliance Testing (30 min)

```bash
# 1. Test consent recording:
POST /api/users/notification-consent with various channel combos

# 2. Verify database:
SELECT * FROM NotificationConsent WHERE userId = 'test_user_id';

# 3. Test consent revocation:
DELETE /api/users/notification-consent with reason

# 4. Verify sync with User table:
SELECT emailNotifications, whatsappNotifications FROM User WHERE id = 'test_user_id';
```

### Phase 4: Error Handling Testing (30 min)

```bash
# Test all error scenarios in PRIORITY_1_API_TESTING_GUIDE.md:
# - Missing authentication
# - Invalid payloads
# - Webhook signature verification
# - Database constraint violations
```

---

## 📋 Feature Verification Checklist

### Player ID Sync (Priority 1.1):
- [ ] OneSignalComponent has syncRef and setupSubscriptionListener
- [ ] POST /api/users/onesignal-sync accepts playerId
- [ ] Player ID stored in User.oneSignalPlayerId
- [ ] Timestamp stored in User.oneSignalSubscribedAt
- [ ] Duplicate Player IDs handled correctly
- [ ] Activity logging works

### Webhooks (Priority 1.2):
- [ ] POST /api/webhooks/onesignal endpoint exists
- [ ] Signature verification implemented
- [ ] 4 event types handled: delivered, opened, clicked, bounced
- [ ] NotificationDeliveryLog table populated
- [ ] ConversionEvent table populated when user linked
- [ ] Bounce event unsubscribes user
- [ ] Webhook logging in OneSignalWebhookLog table

### GDPR Consent (Priority 1.3):
- [ ] POST /api/users/notification-consent creates record
- [ ] GET /api/users/notification-consent returns status
- [ ] DELETE /api/users/notification-consent revokes
- [ ] NotificationConsent table has:
  - ipAddress recorded
  - userAgent recorded
  - consentExpiry set to 1 year
  - channels structure correct
- [ ] User notification prefs synced

---

## 🚀 Deployment Steps

### 1. Production Environment Setup:

```bash
# 1. Push code to production:
git add .
git commit -m "Priority 1: OneSignal core features implementation"
git push origin main

# 2. Deploy on production server:
# (Using your deployment process - Vercel, Railway, etc)

# 3. Run migrations on production:
npm run build
npx prisma db push --skip-generate
```

### 2. OneSignal Configuration on Production:

```
Repeat webhook setup from "OneSignal Dashboard Setup" section:
  → Use production URL: https://eksporyuk.com/api/webhooks/onesignal
  → Use same ONESIGNAL_WEBHOOK_SECRET
  → Test webhook health
```

### 3. Database Backup (Recommended):

```bash
# Before deploying:
sqlite3 prisma/dev.db ".dump" > db_backup_20251208.sql

# If using production database:
# Follow your database backup procedure
```

---

## 📊 Success Criteria

Priority 1 is complete when:

- [ ] All 3 new API endpoints working (sync, webhooks, consent)
- [ ] Database schema synchronized with 4 new tables
- [ ] Build completes with 0 errors
- [ ] Webhooks configured in OneSignal dashboard
- [ ] Player ID syncing works end-to-end
- [ ] Delivery tracking logs events
- [ ] GDPR compliance audit trail recorded
- [ ] Error handling graceful (no crashes)
- [ ] All tests pass (see checklist above)

---

## 🔄 What To Do When Complete

### Immediate (Same Day):
1. ✅ Verify all endpoints work locally
2. ✅ Deploy to staging environment
3. ✅ Test webhooks on staging
4. ✅ Get stakeholder sign-off

### Next 24 Hours:
1. Monitor webhook logs for errors
2. Check NotificationDeliveryLog entries
3. Verify Player ID sync happening for new signups
4. Test with real user notifications

### This Week:
1. Monitor OneSignalWebhookLog for patterns
2. Run analytics queries (see testing guide)
3. Plan Priority 2 features (Segmentation, Analytics, Personalization)
4. Create user documentation for consent management

### Next Phase (Priority 2):
- Behavior-based segmentation (active, at-risk, churned)
- Analytics dashboard (open rate, click rate, conversion rate)
- Personalization with merge tags
- See ONESIGNAL_PRIORITY_ROADMAP.md for details

---

## 🆘 Troubleshooting Reference

### Issue: Build fails with Prisma errors
```
Solution:
1. npm install @prisma/client
2. npx prisma generate
3. npm run build
```

### Issue: Webhook not receiving events
```
Solution:
1. Verify webhook URL in OneSignal dashboard
2. Check ONESIGNAL_WEBHOOK_SECRET matches
3. View recent webhook logs in OneSignal dashboard
4. Check server firewall allows OneSignal IPs
```

### Issue: Player ID not syncing
```
Solution:
1. Check browser DevTools → Network → /api/users/onesignal-sync
2. Verify session cookie is valid
3. Check OneSignalComponent.tsx is loaded
4. Check NEXT_PUBLIC_ONESIGNAL_APP_ID set
5. Try manual sync: POST to /api/users/onesignal-sync
```

### Issue: Consent not saving
```
Solution:
1. Verify authenticated session (GET /api/users/onesignal-sync first)
2. Check request JSON is valid
3. Verify table exists: SELECT * FROM NotificationConsent LIMIT 1;
4. Check User update privilege
```

---

## 📞 Support Documents

- `PRIORITY_1_IMPLEMENTATION_COMPLETE.md` - Full technical details
- `PRIORITY_1_API_TESTING_GUIDE.md` - API testing & curl commands
- `ONESIGNAL_IMPLEMENTATION_GUIDE.md` - Code examples for future features
- `ONESIGNAL_PRIORITY_ROADMAP.md` - Feature roadmap & timeline

---

## ✨ Final Notes

### What Was Accomplished:
- ✅ Browser → Database Player ID sync
- ✅ Webhook event tracking (delivery, open, click, bounce)
- ✅ GDPR-compliant consent management
- ✅ Complete audit trail & logging
- ✅ Zero build errors
- ✅ Production-ready code

### Code Quality:
- ✅ Fully documented with JSDoc
- ✅ Error handling throughout
- ✅ Input validation
- ✅ Security measures (auth, signature verification)
- ✅ Performance optimized (indexed queries)
- ✅ Indonesian comments & messages

### Ready for:
- ✅ Testing by QA team
- ✅ Code review
- ✅ Staging deployment
- ✅ Production rollout

**Timeline:** Ready to deploy immediately after stakeholder approval ✅

