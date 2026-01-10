# Bank Account Validation Integration Guide

## ✅ SUDAH SELESAI (Backend)

### 1. Database Model
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
  
  @@index([userId])
  @@index([accountNumber])
  @@index([createdAt])
}
```

### 2. API Endpoint
**POST** `/api/affiliate/validate-bank-account`

**Request:**
```json
{
  "bankName": "BCA",
  "accountNumber": "5530467850"
}
```

**Success Response:**
```json
{
  "success": true,
  "accountHolderName": "ABDURRAHMAN AZIZ",
  "bankCode": "BCA",
  "accountNumber": "5530467850",
  "isValid": true,
  "validationId": "clxxxxx"
}
```

**Error Response:**
```json
{
  "error": "Nomor rekening tidak valid"
}
```

### 3. Features
- ✅ Auto-fetch account holder name from Xendit
- ✅ Validate account exists
- ✅ Database logging (success + failures)
- ✅ IP address + user agent tracking
- ✅ Error handling for invalid/not found accounts

---

## 🔧 PERLU INTEGRASI (Frontend)

### Step 1: Add Validation Function

Tambahkan di `src/app/(dashboard)/affiliate/wallet/page.tsx`:

```typescript
const [bankValidation, setBankValidation] = useState({
  isValidating: false,
  isValid: false,
  accountHolderName: '',
  validationId: ''
})

const validateBankAccount = async () => {
  if (!withdrawForm.bankName || !withdrawForm.accountNumber) {
    toast.error('Pilih bank dan masukkan nomor rekening terlebih dahulu')
    return
  }

  setBankValidation({ ...bankValidation, isValidating: true })

  try {
    const response = await fetch('/api/affiliate/validate-bank-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName: withdrawForm.bankName,
        accountNumber: withdrawForm.accountNumber
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      setBankValidation({
        isValidating: false,
        isValid: true,
        accountHolderName: data.accountHolderName,
        validationId: data.validationId
      })

      // Auto-fill account name
      setWithdrawForm({
        ...withdrawForm,
        accountName: data.accountHolderName
      })

      toast.success(`✅ Rekening tervalidasi: ${data.accountHolderName}`)
    } else {
      setBankValidation({
        isValidating: false,
        isValid: false,
        accountHolderName: '',
        validationId: ''
      })
      toast.error(data.error || 'Gagal validasi rekening')
    }
  } catch (error) {
    setBankValidation({
      isValidating: false,
      isValid: false,
      accountHolderName: '',
      validationId: ''
    })
    toast.error('Terjadi kesalahan saat validasi')
  }
}
```

### Step 2: Update UI

Tambahkan tombol "Cek Rekening" setelah input nomor rekening:

```tsx
{/* Nomor Rekening */}
<div>
  <Label htmlFor="accountNumber">Nomor Rekening *</Label>
  <div className="flex gap-2">
    <Input
      id="accountNumber"
      type="text"
      placeholder="Contoh: 5530467850"
      value={withdrawForm.accountNumber}
      onChange={(e) => {
        setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })
        // Reset validation saat nomor berubah
        setBankValidation({
          isValidating: false,
          isValid: false,
          accountHolderName: '',
          validationId: ''
        })
      }}
      required
      className="flex-1"
    />
    <Button
      type="button"
      onClick={validateBankAccount}
      disabled={!withdrawForm.bankName || !withdrawForm.accountNumber || bankValidation.isValidating}
      variant="outline"
    >
      {bankValidation.isValidating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Validasi...
        </>
      ) : (
        'Cek Rekening'
      )}
    </Button>
  </div>
  
  {/* Validation Result */}
  {bankValidation.isValid && bankValidation.accountHolderName && (
    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
      <p className="text-sm text-green-800">
        ✅ <strong>Rekening Valid</strong>
      </p>
      <p className="text-sm text-green-700 font-medium mt-1">
        Nama Pemilik: {bankValidation.accountHolderName}
      </p>
    </div>
  )}
</div>

{/* Nama Pemilik Rekening - READ ONLY setelah validasi */}
<div>
  <Label htmlFor="accountName">Nama Pemilik Rekening *</Label>
  <Input
    id="accountName"
    type="text"
    placeholder={bankValidation.isValid ? "Terisi otomatis dari validasi" : "Akan terisi otomatis setelah validasi"}
    value={withdrawForm.accountName}
    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
    required
    disabled={bankValidation.isValid} // Disable jika sudah tervalidasi
    className={bankValidation.isValid ? "bg-gray-100" : ""}
  />
  {bankValidation.isValid && (
    <p className="text-xs text-gray-500 mt-1">
      Nama diambil dari sistem bank, tidak bisa diubah
    </p>
  )}
</div>
```

### Step 3: Validation Before Withdrawal

Update handleWithdraw untuk enforce validation:

```typescript
const handleWithdraw = async () => {
  // ... existing validations ...

  // WAJIB validasi rekening dulu
  if (withdrawType === 'instant' && !bankValidation.isValid) {
    toast.error('Harap validasi rekening bank terlebih dahulu')
    return
  }

  // Rest of withdrawal logic...
}
```

---

## 🎯 User Flow

1. User pilih bank (BCA, BNI, etc.)
2. User input nomor rekening
3. **User klik "Cek Rekening"**
4. **Sistem validasi via Xendit API**
5. **Nama pemilik muncul otomatis** ✅
6. User confirm & input PIN
7. Proses withdrawal

---

## 📊 Database Tracking

Setiap validasi tercatat di database:

```sql
SELECT * FROM "BankAccountValidation" 
WHERE "userId" = 'user_id_here'
ORDER BY "createdAt" DESC;
```

Bisa digunakan untuk:
- Audit trail
- Detect fraud attempts
- Analytics bank usage
- User behavior tracking

---

## 🔐 Security

- ✅ IP address logged
- ✅ User agent logged
- ✅ Session-based auth
- ✅ Rate limiting (via Vercel)
- ✅ Error masking (tidak expose internal errors)

