# Xendit Bank Account Validation - Implementation Reference

## 📚 Official Documentation
https://developers.xendit.co/api-reference/disbursement/bank-account-validation

---

## ✅ Correct API Endpoint

### POST `/validation/bank_account_validation`

**Base URL:** `https://api.xendit.co`

**Authentication:** Basic Auth
```
Authorization: Basic {base64(SECRET_KEY:)}
```

---

## 📤 Request Format

```json
{
  "account_number": "5520467850",
  "bank_code": "BCA"
}
```

### Important Notes:
- ✅ Use `account_number` (NOT `bank_account_number`)
- ✅ Use `bank_code` (uppercase)
- ✅ Account number as string (8-20 digits)

---

## 📥 Success Response

```json
{
  "bank_code": "BCA",
  "account_number": "5520467850",
  "account_holder_name": "ABDURRAHMAN AZIZ",
  "is_valid": true
}
```

---

## ❌ Error Responses

### Invalid Account Number
```json
{
  "error_code": "INVALID_BANK_ACCOUNT_NUMBER",
  "message": "Account number format is invalid"
}
```

### Account Not Found
```json
{
  "error_code": "BANK_ACCOUNT_NOT_FOUND",
  "message": "Bank account not found"
}
```

### Unsupported Bank
```json
{
  "error_code": "BANK_CODE_NOT_SUPPORTED",
  "message": "Bank code is not supported for validation"
}
```

---

## 🏦 Supported Bank Codes

### Major Banks (Tested & Confirmed)
- `BCA` - Bank Central Asia
- `BNI` - Bank Negara Indonesia
- `BRI` - Bank Rakyat Indonesia
- `MANDIRI` - Bank Mandiri

### Other Banks
- `PERMATA` - Bank Permata
- `CIMB` - CIMB Niaga
- `DANAMON` - Bank Danamon
- `BSI` - Bank Syariah Indonesia
- `BTN` - Bank Tabungan Negara
- `OCBC` - OCBC NISP
- `PANIN` - Bank Panin
- `MAYBANK` - Maybank Indonesia
- `BTPN` - Bank BTPN

**Note:** Not all banks support real-time validation. Some may return `BANK_CODE_NOT_SUPPORTED`.

---

## 🔍 Implementation in Eksporyuk

### File: `/src/app/api/affiliate/validate-bank-account/route.ts`

```typescript
const response = await fetch('https://api.xendit.co/validation/bank_account_validation', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    account_number: cleanAccountNumber,
    bank_code: bankCode,
  })
})
```

---

## 🚨 Common Mistakes

### ❌ Wrong Endpoint
```
/bank_account_data_requests  ← WRONG (old/deprecated)
```

### ✅ Correct Endpoint
```
/validation/bank_account_validation  ← CORRECT
```

### ❌ Wrong Payload Field
```json
{
  "bank_account_number": "xxx"  ← WRONG
}
```

### ✅ Correct Payload Field
```json
{
  "account_number": "xxx"  ← CORRECT
}
```

---

## 📊 Rate Limits

Xendit has rate limiting on validation API:
- **Limit:** 10 requests/second per account
- **Status Code:** 429 (Too Many Requests)

**Best Practice:** Implement debouncing on frontend (wait 500ms after user stops typing).

---

## 💡 Testing

### Test Account Numbers (Sandbox)
Xendit provides test account numbers for sandbox environment:

```
Bank: BCA
Account: 8800005555 → Valid (Success)
Account: 8800004444 → Invalid (Not Found)
```

### Production Testing
Use real account numbers. Xendit validates against actual bank systems.

---

## 🔐 Security

1. **Never expose SECRET_KEY** to frontend
2. **Validate on backend** only
3. **Log validation attempts** for audit trail
4. **Rate limit** user requests (max 3 validations per minute per user)

---

## 📝 Database Logging

Store all validation attempts in `BankAccountValidation` table:

```prisma
model BankAccountValidation {
  id                String   @id @default(cuid())
  userId            String
  bankName          String
  bankCode          String
  accountNumber     String
  accountHolderName String?
  isValid           Boolean  @default(false)
  validatedAt       DateTime?
  errorMessage      String?
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime @default(now())
}
```

**Purpose:**
- Audit trail
- Fraud detection
- Analytics
- Debug user issues

---

## 🎯 User Experience Flow

1. User selects bank (BCA, BNI, etc.)
2. User inputs account number
3. User clicks "Cek Rekening" button
4. **Frontend** calls `/api/affiliate/validate-bank-account`
5. **Backend** calls Xendit validation API
6. **Success:** Show green box with account holder name
7. **Error:** Show specific error message
8. User confirms withdrawal with validated account

---

## 🐛 Troubleshooting

### Issue: 404 Not Found
**Solution:** Check endpoint URL is `/validation/bank_account_validation`

### Issue: 400 Bad Request
**Solution:** Verify payload uses `account_number` not `bank_account_number`

### Issue: 401 Unauthorized
**Solution:** Check `XENDIT_SECRET_KEY` is set in environment variables

### Issue: Account Not Found (but account is valid)
**Possible Causes:**
- Bank doesn't support real-time validation
- Account number format incorrect (missing leading zeros, etc.)
- Bank system temporarily unavailable

---

## 📞 Support

Xendit Support: https://help.xendit.co
Documentation: https://developers.xendit.co

