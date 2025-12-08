# OneSignal Priority 1 - API Testing Guide

**Date:** 8 Desember 2025  
**Status:** ✅ All APIs Ready for Testing

---

## 🧪 Quick Test Commands

### 1. Browser → Server Player ID Sync

#### Sync New Player ID:
```bash
curl -X POST http://localhost:3000/api/users/onesignal-sync \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie_here" \
  -d '{
    "playerId": "abc123def456",
    "tags": {
      "email": "user@example.com",
      "role": "MENTOR"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "oneSignalPlayerId": "abc123def456",
    "oneSignalSubscribedAt": "2025-12-08T10:00:00Z",
    "role": "MENTOR",
    "province": "DKI Jakarta",
    "city": "Jakarta Pusat"
  }
}
```

#### Check Subscription Status:
```bash
curl -X GET http://localhost:3000/api/users/onesignal-sync \
  -H "Cookie: your_session_cookie_here"
```

**Expected Response:**
```json
{
  "subscribed": true,
  "playerId": "abc123def456",
  "subscribedAt": "2025-12-08T10:00:00Z"
}
```

---

### 2. Webhook Event Testing

#### Simulate Delivery Event:
```bash
curl -X POST http://localhost:3000/api/webhooks/onesignal \
  -H "Content-Type: application/json" \
  -H "X-OneSignal-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "type": "notification.delivered",
    "notification_id": "notif123",
    "player_ids": ["player1", "player2", "player3"],
    "timestamp": 1702011600
  }'
```

#### Simulate Open Event:
```bash
curl -X POST http://localhost:3000/api/webhooks/onesignal \
  -H "Content-Type: application/json" \
  -H "X-OneSignal-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "type": "notification.opened",
    "notification_id": "notif123",
    "player_id": "player1",
    "timestamp": 1702011605
  }'
```

#### Simulate Click Event:
```bash
curl -X POST http://localhost:3000/api/webhooks/onesignal \
  -H "Content-Type: application/json" \
  -H "X-OneSignal-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "type": "notification.clicked",
    "notification_id": "notif123",
    "player_id": "player1",
    "click_url": "https://eksporyuk.com/course/123",
    "timestamp": 1702011610
  }'
```

#### Simulate Bounce Event:
```bash
curl -X POST http://localhost:3000/api/webhooks/onesignal \
  -H "Content-Type: application/json" \
  -H "X-OneSignal-Signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "type": "notification.bounced",
    "notification_id": "notif123",
    "player_id": "player1",
    "bounce_reason": "InvalidDeviceToken",
    "timestamp": 1702011615
  }'
```

**Expected Response (all):**
```json
{
  "success": true,
  "processed": true
}
```

---

### 3. GDPR Consent Management

#### Give Consent:
```bash
curl -X POST http://localhost:3000/api/users/notification-consent \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie_here" \
  -d '{
    "consentGiven": true,
    "channels": {
      "email": true,
      "push": true,
      "sms": false,
      "inapp": true
    },
    "purpose": "marketing"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "consent": {
    "consentGiven": true,
    "channels": {
      "email": true,
      "push": true,
      "sms": false,
      "inapp": true
    },
    "purpose": "marketing",
    "expiresAt": "2026-12-08T10:00:00Z",
    "recordedAt": "2025-12-08T10:00:00Z"
  }
}
```

#### Check Current Consent:
```bash
curl -X GET http://localhost:3000/api/users/notification-consent \
  -H "Cookie: your_session_cookie_here"
```

**Expected Response:**
```json
{
  "consent": {
    "consentGiven": true,
    "channels": {
      "email": true,
      "push": true,
      "sms": false,
      "inapp": true
    },
    "purpose": "marketing",
    "consentedAt": "2025-12-08T10:00:00Z",
    "expiresAt": "2026-12-08T10:00:00Z",
    "revokedAt": null,
    "revocationReason": null,
    "isExpired": false,
    "isRevoked": false
  }
}
```

#### Revoke Consent:
```bash
curl -X DELETE http://localhost:3000/api/users/notification-consent \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie_here" \
  -d '{
    "reason": "Too many notifications"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Consent revoked successfully"
}
```

---

## 🗄️ Database Verification Queries

### Check Player ID Sync:
```sql
SELECT id, email, oneSignalPlayerId, oneSignalSubscribedAt 
FROM User 
WHERE oneSignalPlayerId IS NOT NULL 
LIMIT 5;
```

### Check Delivery Logs:
```sql
SELECT 
  notificationId, 
  COUNT(*) as delivered_count,
  SUM(CASE WHEN openedAt IS NOT NULL THEN 1 ELSE 0 END) as opened_count,
  SUM(CASE WHEN clickedAt IS NOT NULL THEN 1 ELSE 0 END) as clicked_count
FROM NotificationDeliveryLog
GROUP BY notificationId
ORDER BY timestamp DESC
LIMIT 10;
```

### Check Consent Records:
```sql
SELECT 
  u.email,
  nc.consentGiven,
  nc.channels,
  nc.consentTimestamp,
  nc.consentExpiry,
  nc.revocationTimestamp
FROM User u
LEFT JOIN NotificationConsent nc ON u.id = nc.userId
WHERE nc.id IS NOT NULL
LIMIT 10;
```

### Check Conversion Events:
```sql
SELECT 
  u.email,
  ce.conversionType,
  ce.conversionValue,
  ce.timestamp
FROM ConversionEvent ce
JOIN User u ON ce.userId = u.id
ORDER BY ce.timestamp DESC
LIMIT 10;
```

### Check Webhook Logs:
```sql
SELECT 
  eventType,
  processingStatus,
  COUNT(*) as count,
  SUM(CASE WHEN processingStatus = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM OneSignalWebhookLog
GROUP BY eventType
ORDER BY timestamp DESC;
```

---

## 🔑 Authentication Notes

### Get Session Cookie:
1. Login at http://localhost:3000/auth/login
2. Open DevTools → Application → Cookies
3. Copy value of `next-auth.session-token` cookie
4. Use in test commands above

### Alternative: Using Postman
1. Login in browser first
2. Copy session cookie value
3. In Postman: Set-Cookie header with session value
4. Test endpoints

---

## 🐛 Error Handling Tests

### Test Missing Authentication:
```bash
curl -X POST http://localhost:3000/api/users/onesignal-sync \
  -H "Content-Type: application/json" \
  -d '{"playerId": "test"}'
```

**Expected:** 401 Unauthorized

### Test Invalid Player ID:
```bash
curl -X POST http://localhost:3000/api/users/onesignal-sync \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie" \
  -d '{"playerId": ""}'
```

**Expected:** 400 Bad Request - "Invalid or missing playerId"

### Test Invalid Webhook Signature:
```bash
curl -X POST http://localhost:3000/api/webhooks/onesignal \
  -H "Content-Type: application/json" \
  -H "X-OneSignal-Signature: invalid_signature" \
  -d '{"type": "notification.delivered", "notification_id": "test"}'
```

**Expected:** 401 Unauthorized (development mode allows unsigned)

---

## 📊 Performance Testing

### Load Test Webhook (1000 events):
```bash
# Using Apache Bench
ab -n 1000 -c 10 -p webhook_data.json \
  -H "Content-Type: application/json" \
  -H "X-OneSignal-Signature: YOUR_SIGNATURE" \
  http://localhost:3000/api/webhooks/onesignal
```

### Expected Response Time:
- Single webhook: ~50-100ms
- Sync endpoint: ~100-150ms
- Consent endpoint: ~80-120ms

---

## 📝 Testing Checklist

### Browser Sync:
- [ ] POST with valid playerId → 200 OK
- [ ] GET subscription status → 200 OK
- [ ] POST with invalid playerId → 400 Bad Request
- [ ] POST without auth → 401 Unauthorized
- [ ] Check User.oneSignalPlayerId in database
- [ ] Check User.oneSignalSubscribedAt has timestamp

### Webhooks:
- [ ] POST delivery event → 200 OK
- [ ] Check NotificationDeliveryLog created
- [ ] POST open event → Log status updated
- [ ] POST click event → clickUrl recorded
- [ ] POST bounce event → User unsubscribed
- [ ] Check OneSignalWebhookLog entries
- [ ] Invalid signature rejected → 401

### Consent:
- [ ] POST with consent → 200 OK
- [ ] GET consent → Returns correct data
- [ ] DELETE consent → Revoked
- [ ] Check NotificationConsent table
- [ ] Check User notification prefs synced
- [ ] POST without auth → 401 Unauthorized

---

## 🔧 Troubleshooting

### Player ID Not Syncing:
1. Check browser console for OneSignal errors
2. Verify NEXT_PUBLIC_ONESIGNAL_APP_ID in .env
3. Check network tab - POST to /api/users/onesignal-sync
4. Verify session cookie is valid

### Webhook Not Triggering:
1. Check OneSignal webhook configuration
2. Verify ONESIGNAL_WEBHOOK_SECRET matches
3. Check OneSignalWebhookLog table for errors
4. Verify firewall allows OneSignal IP ranges

### Consent Not Saving:
1. Check session is valid (GET /api/users/onesignal-sync first)
2. Verify request JSON format is correct
3. Check NotificationConsent table
4. Verify User.emailNotifications field synced

---

## 📚 Related Documentation

- `PRIORITY_1_IMPLEMENTATION_COMPLETE.md` - Full implementation details
- `ONESIGNAL_IMPLEMENTATION_GUIDE.md` - Code examples for Priority 2+
- `ONESIGNAL_PRIORITY_ROADMAP.md` - Complete feature roadmap

