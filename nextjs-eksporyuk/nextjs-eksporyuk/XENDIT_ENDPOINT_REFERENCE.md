# XENDIT PAYOUT API - ENDPOINT REFERENCE & RESPONSE FORMATS

**Date:** 6 Januari 2026  
**Purpose:** Complete endpoint specifications with real request/response examples

---

## INDEX

1. [Account Validation Endpoint](#account-validation-endpoint)
2. [Create Payout Endpoint](#create-payout-endpoint)
3. [Get Payout Status Endpoint](#get-payout-status-endpoint)
4. [Cancel Payout Endpoint](#cancel-payout-endpoint)
5. [List Payouts Endpoint](#list-payouts-endpoint)
6. [Webhook Endpoint](#webhook-endpoint)
7. [Response Codes Summary](#response-codes-summary)

---

## ACCOUNT VALIDATION ENDPOINT

### Endpoint Details
```
Method:  POST
URL:     https://api.xendit.co/v1/account_validation
Auth:    Basic HTTP Authentication
```

### Complete Request Example - E-Wallet

```http
POST /v1/account_validation HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
Content-Type: application/json
Content-Length: 102

{
  "channel_category": "EWALLET",
  "channel_code": "ID_DANA",
  "account_holder": {
    "phone_number": "+628118748177"
  }
}
```

### Complete Request Example - Bank

```http
POST /v1/account_validation HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
Content-Type: application/json
Content-Length: 102

{
  "channel_category": "BANK",
  "channel_code": "ID_BCA",
  "account_holder": {
    "account_number": "123456789012"
  }
}
```

### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `channel_category` | string | ✅ | `EWALLET` or `BANK` | `"EWALLET"` |
| `channel_code` | string | ✅ | Must include ID_ prefix | `"ID_DANA"` |
| `account_holder` | object | ✅ | Holder information | `{...}` |
| `account_holder.phone_number` | string | For EWALLET | E-wallet phone with +62 | `"+628118748177"` |
| `account_holder.account_number` | string | For BANK | Bank account number | `"123456789012"` |

### ✅ Success Response (200 OK)

```json
{
  "account_holder_name": "AZIZ RAHMAN",
  "channel_category": "EWALLET",
  "channel_code": "ID_DANA",
  "account_number": "628118748177",
  "phone_number": "+628118748177",
  "is_verified": true
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `account_holder_name` | string | Name of account holder (from bank/e-wallet) |
| `channel_category` | string | Echo back of request (`EWALLET` or `BANK`) |
| `channel_code` | string | Echo back of request (e.g., `ID_DANA`) |
| `account_number` | string | Account/phone number |
| `phone_number` | string | Phone number (for e-wallet) |
| `is_verified` | boolean | Always `true` if successful |

### ❌ Error Responses

#### 400 - Account Not Found
```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Account holder name could not be found",
  "error_details": {
    "channel_code": "ID_DANA",
    "phone_number": "+628118748177"
  }
}
```

#### 400 - Invalid Phone Format
```json
{
  "error_code": "INVALID_PARAMETER",
  "message": "Phone number format is invalid",
  "error_details": {
    "field": "account_holder.phone_number",
    "expected_format": "+62XXXXXXXXXX"
  }
}
```

#### 400 - Unsupported Channel
```json
{
  "error_code": "CHANNEL_NOT_SUPPORTED",
  "message": "Channel ID_INVALID is not supported for validation",
  "error_details": {
    "channel_code": "ID_INVALID"
  }
}
```

#### 401 - Invalid API Key
```json
{
  "error_code": "UNAUTHORIZED",
  "message": "Invalid API key"
}
```

#### 500 - Server Error
```json
{
  "error_code": "SERVICE_ERROR",
  "message": "Service temporarily unavailable. Please try again later.",
  "retry_after": 60
}
```

---

## CREATE PAYOUT ENDPOINT

### Endpoint Details
```
Method:  POST
URL:     https://api.xendit.co/v2/payouts
Auth:    Basic HTTP Authentication
Headers: Idempotency-Key (REQUIRED)
```

### Complete Request Example - E-Wallet Payout

```http
POST /v2/payouts HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
Content-Type: application/json
Idempotency-Key: withdrawal_user123_1673000000
Content-Length: 398

{
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  },
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal to DANA wallet",
  "receipt_notification": {
    "email_to": [
      "user@example.com"
    ]
  },
  "metadata": {
    "user_id": "user123",
    "withdrawal_type": "instant",
    "created_at": "2026-01-06T10:00:00Z"
  }
}
```

### Complete Request Example - Bank Payout

```http
POST /v2/payouts HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
Content-Type: application/json
Idempotency-Key: withdrawal_user456_1673100000
Content-Length: 420

{
  "reference_id": "withdrawal_user456_1673100000",
  "channel_code": "ID_BCA",
  "channel_properties": {
    "account_holder_name": "BUDI SANTOSO",
    "account_number": "123456789012"
  },
  "amount": 500000,
  "currency": "IDR",
  "description": "Withdrawal to BCA account",
  "receipt_notification": {
    "email_to": [
      "budi@example.com"
    ]
  },
  "metadata": {
    "user_id": "user456",
    "withdrawal_type": "bank_transfer"
  }
}
```

### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `reference_id` | string | ✅ | Unique ID for tracking (max 50 chars) | `"withdrawal_user123_1673000000"` |
| `channel_code` | string | ✅ | Channel code with ID_ prefix | `"ID_DANA"` |
| `channel_properties` | object | ✅ | Account information | `{...}` |
| `channel_properties.account_holder_name` | string | ✅ | Account holder full name | `"AZIZ RAHMAN"` |
| `channel_properties.account_number` | string | ✅ | Phone (e-wallet) or account (bank) | `"628118748177"` |
| `amount` | number | ✅ | Amount in smallest currency unit | `100000` |
| `currency` | string | ✅ | Currency code (IDR for Indonesia) | `"IDR"` |
| `description` | string | ❌ | Description shown to recipient | `"Withdrawal"` |
| `receipt_notification` | object | ❌ | Email receipts for transaction | `{...}` |
| `receipt_notification.email_to` | array | ❌ | Email addresses (max 3) | `["user@example.com"]` |
| `metadata` | object | ❌ | Custom data for tracking | `{...}` |

### Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Authorization` | ✅ | Basic auth with API key | `"Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo="` |
| `Content-Type` | ✅ | Must be JSON | `"application/json"` |
| `Idempotency-Key` | ✅ | Prevent duplicate payouts | `"withdrawal_user123_1673000000"` |

### ✅ Success Response (200 OK)

```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_category": "EWALLET",
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal to DANA wallet",
  "status": "ACCEPTED",
  "created": "2026-01-06T10:00:00.000Z",
  "updated": "2026-01-06T10:00:00.000Z",
  "estimated_arrival_time": "2026-01-06T10:15:00.000Z",
  "business_id": "5f1234567890abcdef123456",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  },
  "metadata": {
    "user_id": "user123",
    "withdrawal_type": "instant",
    "created_at": "2026-01-06T10:00:00Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Xendit's unique payout ID (use for tracking) |
| `reference_id` | string | Your reference ID (echo back) |
| `channel_code` | string | Channel used (echo back) |
| `channel_category` | string | `EWALLET` or `BANK` |
| `amount` | number | Amount in smallest unit |
| `currency` | string | Currency (IDR) |
| `description` | string | Description (echo back) |
| `status` | string | Current status: `ACCEPTED`, `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| `created` | string | Creation timestamp (ISO 8601) |
| `updated` | string | Last update timestamp (ISO 8601) |
| `estimated_arrival_time` | string | When funds should arrive |
| `business_id` | string | Your Xendit business ID |
| `channel_properties` | object | Account info used for payout |
| `metadata` | object | Your metadata (echo back) |
| `failure_code` | string | Error code if payout failed |
| `failure_reason` | string | Human-readable failure reason |

### Status Values

```
ACCEPTED    → Request accepted, processing started
PENDING     → Waiting in queue
PROCESSING  → Currently being processed
SUCCEEDED   → ✅ Successfully completed
FAILED      → ❌ Transfer failed
CANCELLED   → ❌ Payout cancelled by user
REVERSED    → ❌ Completed but later reversed
```

### ❌ Error Responses

#### 400 - Insufficient Balance
```json
{
  "error_code": "INSUFFICIENT_BALANCE",
  "message": "Your account does not have sufficient balance for this payout"
}
```

#### 400 - Amount Below Minimum
```json
{
  "error_code": "AMOUNT_BELOW_MINIMUM",
  "message": "Amount must be at least IDR 1,000 for this channel. Minimum is: 1000"
}
```

#### 400 - Amount Exceeds Maximum
```json
{
  "error_code": "AMOUNT_EXCEEDS_MAXIMUM",
  "message": "Amount must not exceed IDR 50,000,000 for this channel. Maximum is: 50000000"
}
```

#### 400 - Invalid Channel Code
```json
{
  "error_code": "CHANNEL_CODE_NOT_SUPPORTED",
  "message": "Channel code ID_INVALID is not supported"
}
```

#### 400 - Invalid Account Number
```json
{
  "error_code": "RECIPIENT_ACCOUNT_NUMBER_ERROR",
  "message": "The recipient account number is invalid or does not exist"
}
```

#### 409 - Duplicate Payout
```json
{
  "error_code": "DUPLICATE_ERROR",
  "message": "A payout with this idempotency key already exists. If you meant to execute a different request, please use another idempotency key."
}
```

#### 429 - Rate Limited
```json
{
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

#### 500 - Server Error
```json
{
  "error_code": "SERVER_ERROR",
  "message": "An error occurred processing your request. Please try again later."
}
```

---

## GET PAYOUT STATUS ENDPOINT

### Endpoint Details
```
Method:  GET
URL:     https://api.xendit.co/v2/payouts/{payout_id}
Auth:    Basic HTTP Authentication
```

### Request Example

```http
GET /v2/payouts/disb-1705048000000 HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
```

### Success Response (200 OK)

```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_category": "EWALLET",
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal to DANA wallet",
  "status": "SUCCEEDED",
  "created": "2026-01-06T10:00:00.000Z",
  "updated": "2026-01-06T10:05:30.000Z",
  "estimated_arrival_time": "2026-01-06T10:15:00.000Z",
  "business_id": "5f1234567890abcdef123456",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  }
}
```

### Failure Response Example (200 OK, but status is FAILED)

```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_category": "EWALLET",
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal to DANA wallet",
  "status": "FAILED",
  "created": "2026-01-06T10:00:00.000Z",
  "updated": "2026-01-06T10:05:30.000Z",
  "estimated_arrival_time": "2026-01-06T10:15:00.000Z",
  "failure_code": "INVALID_DESTINATION",
  "failure_reason": "The recipient account does not exist",
  "business_id": "5f1234567890abcdef123456",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  }
}
```

---

## CANCEL PAYOUT ENDPOINT

### Endpoint Details
```
Method:  POST
URL:     https://api.xendit.co/v2/payouts/{payout_id}/cancel
Auth:    Basic HTTP Authentication
```

### Request Example

```http
POST /v2/payouts/disb-1705048000000/cancel HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
Content-Type: application/json
Content-Length: 0
```

### Success Response (200 OK)

```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "status": "CANCELLED",
  "created": "2026-01-06T10:00:00.000Z",
  "updated": "2026-01-06T10:01:00.000Z",
  "amount": 100000,
  "currency": "IDR"
}
```

### ❌ Error: Cannot Cancel (Not ACCEPTED)

```json
{
  "error_code": "PAYOUT_NOT_CANCELLABLE",
  "message": "Payout cannot be cancelled because it is not in ACCEPTED status. Current status: SUCCEEDED"
}
```

---

## LIST PAYOUTS ENDPOINT

### Endpoint Details
```
Method:  GET
URL:     https://api.xendit.co/v2/payouts?reference_id=...&limit=...
Auth:    Basic HTTP Authentication
```

### Request Example

```http
GET /v2/payouts?reference_id=withdrawal_user123_1673000000&limit=10 HTTP/1.1
Host: api.xendit.co
Authorization: Basic eG5kX2RldmVsb3BtZW50X2FiYzEyMzo=
```

### Query Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `reference_id` | string | - | Filter by reference ID | `"withdrawal_user123"` |
| `limit` | number | 50 | Number of results (1-100) | `20` |
| `after_id` | string | - | For pagination | `"disb-123"` |
| `before_id` | string | - | For pagination | `"disb-456"` |

### Success Response (200 OK)

```json
[
  {
    "id": "disb-1705048000000",
    "reference_id": "withdrawal_user123_1673000000",
    "channel_code": "ID_DANA",
    "channel_category": "EWALLET",
    "amount": 100000,
    "currency": "IDR",
    "status": "SUCCEEDED",
    "created": "2026-01-06T10:00:00.000Z",
    "updated": "2026-01-06T10:05:30.000Z",
    "channel_properties": {
      "account_holder_name": "AZIZ RAHMAN",
      "account_number": "628118748177"
    }
  },
  {
    "id": "disb-1705047000000",
    "reference_id": "withdrawal_user123_1672900000",
    "channel_code": "ID_DANA",
    "channel_category": "EWALLET",
    "amount": 50000,
    "currency": "IDR",
    "status": "SUCCEEDED",
    "created": "2026-01-05T10:00:00.000Z",
    "updated": "2026-01-05T10:05:30.000Z",
    "channel_properties": {
      "account_holder_name": "AZIZ RAHMAN",
      "account_number": "628118748177"
    }
  }
]
```

---

## WEBHOOK ENDPOINT

### Webhook Details
```
Method:  POST
URL:     Your configured webhook URL
Auth:    Bearer token in X-Callback-Token header
```

### Your Webhook Implementation

```typescript
// /api/webhooks/xendit/payout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const callbackToken = request.headers.get('x-callback-token')
    
    // Verify signature
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
    const signature = crypto
      .createHmac('sha256', webhookToken)
      .update(JSON.stringify(body))
      .digest('hex')
    
    if (signature !== callbackToken) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Process webhook
    // ...
    
    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

### Webhook Request Example - Succeeded

```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_category": "EWALLET",
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal to DANA wallet",
  "status": "SUCCEEDED",
  "created": "2026-01-06T10:00:00.000Z",
  "updated": "2026-01-06T10:05:30.000Z",
  "estimated_arrival_time": "2026-01-06T10:15:00.000Z",
  "business_id": "5f1234567890abcdef123456",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  },
  "metadata": {
    "user_id": "user123",
    "withdrawal_type": "instant"
  }
}
```

### Webhook Request Example - Failed

```json
{
  "id": "disb-1705048000000",
  "reference_id": "withdrawal_user123_1673000000",
  "channel_code": "ID_DANA",
  "channel_category": "EWALLET",
  "amount": 100000,
  "currency": "IDR",
  "description": "Withdrawal to DANA wallet",
  "status": "FAILED",
  "created": "2026-01-06T10:00:00.000Z",
  "updated": "2026-01-06T10:05:30.000Z",
  "failure_code": "INVALID_DESTINATION",
  "failure_reason": "The recipient account does not exist",
  "business_id": "5f1234567890abcdef123456",
  "channel_properties": {
    "account_holder_name": "AZIZ RAHMAN",
    "account_number": "628118748177"
  }
}
```

---

## RESPONSE CODES SUMMARY

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Success | Process response data |
| 400 | ❌ Bad Request | Check parameters, retry with fixes |
| 401 | ❌ Unauthorized | Verify API key and authentication |
| 409 | ❌ Conflict | Use different reference ID or Idempotency-Key |
| 429 | ⚠️ Rate Limited | Wait and retry after specified time |
| 500 | ❌ Server Error | Retry after 1-3 hours |
| 503 | ⚠️ Service Unavailable | Retry after longer interval |

### Error Code Categories

**Validation Errors (400):**
- `VALIDATION_ERROR` - Invalid parameters
- `CHANNEL_CODE_NOT_SUPPORTED` - Invalid channel code
- `INVALID_PARAMETER` - Incorrect field format
- `AMOUNT_BELOW_MINIMUM` - Amount too small
- `AMOUNT_EXCEEDS_MAXIMUM` - Amount too large
- `RECIPIENT_ACCOUNT_NUMBER_ERROR` - Invalid account number

**Account Errors (400):**
- `INSUFFICIENT_BALANCE` - Not enough funds
- `INVALID_DESTINATION` - Account doesn't exist

**Duplicate/Conflict (409):**
- `DUPLICATE_ERROR` - Same idempotency key used

**Authentication (401):**
- `UNAUTHORIZED` - Invalid API key

**Server Errors (500+):**
- `SERVICE_ERROR` - Temporary service issue
- `SERVER_ERROR` - Unexpected error

---

## CURL COMMAND TEMPLATES

### Account Validation
```bash
curl -X POST https://api.xendit.co/v1/account_validation \
  -H "Authorization: Basic YOUR_BASE64_KEY:" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_category": "EWALLET",
    "channel_code": "ID_DANA",
    "account_holder": {
      "phone_number": "+628118748177"
    }
  }'
```

### Create Payout
```bash
curl -X POST https://api.xendit.co/v2/payouts \
  -H "Authorization: Basic YOUR_BASE64_KEY:" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: withdrawal_$(date +%s)" \
  -d '{
    "reference_id": "withdrawal_user_'$(date +%s)'",
    "channel_code": "ID_DANA",
    "channel_properties": {
      "account_holder_name": "TEST NAME",
      "account_number": "628118748177"
    },
    "amount": 100000,
    "currency": "IDR",
    "description": "Test withdrawal"
  }'
```

### Get Payout Status
```bash
curl -X GET https://api.xendit.co/v2/payouts/disb-1705048000000 \
  -H "Authorization: Basic YOUR_BASE64_KEY:"
```

---

## RESPONSE FIELD DEFAULTS

| Field | Default if Missing |
|-------|-------------------|
| `description` | Not included |
| `metadata` | Empty object `{}` |
| `receipt_notification` | Not included |
| `channel_properties.payout_code` | Only in bank transfers |
| `failure_code` | Not included if successful |
| `failure_reason` | Not included if successful |

---

**Last Updated:** 6 Januari 2026  
**Version:** 1.0 (Complete)
