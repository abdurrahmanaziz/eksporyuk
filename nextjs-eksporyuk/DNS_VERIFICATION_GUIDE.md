# 📋 DNS Verification Guide untuk Admin

## Cara Admin Verifikasi Domain di Cloudflare

Setelah admin membuat domain di `/admin/short-links`, ada 2 cara untuk verifikasi:

---

## **Metode 1: Automatic Verification (Recommended) ✅**

### Langkah-langkah:

1. **Buat Domain** di `/admin/short-links`
   - Domain: `link.eksporyuk.com`
   - Display Name: `Link EksporYuk`
   - DNS Type: `CNAME`
   - DNS Target: `eksporyuk.com`

2. **Setup di Cloudflare Dashboard**
   - Log in ke Cloudflare
   - Pilih domain `eksporyuk.com`
   - Go to **DNS Records**
   - Click **Add Record**
   - Pilih tipe: **CNAME**
   - Name: `link` (untuk link.eksporyuk.com)
   - Target: `eksporyuk.com`
   - Status: **Proxied** (orange cloud) atau **DNS only** (gray cloud)
   - Click **Save**
   - **Tunggu 5-10 menit** untuk DNS propagation

3. **Verify di Admin Panel**
   - Buka `/admin/short-links`
   - Cari domain yang baru dibuat
   - Klik tombol **"Verify DNS"** (berwarna biru)
   - Tunggu sebentar sampai sistem check DNS record
   - Jika berhasil: ✅ **Domain marked as verified!**
   - Jika gagal: Tunggu 5 menit lagi dan coba ulangi

### Yang Terjadi Saat Verify:
System akan:
1. Lookup DNS record untuk `link.eksporyuk.com`
2. Check apakah CNAME-nya sesuai dengan target (`eksporyuk.com`)
3. Jika match → Auto-mark sebagai verified
4. Jika tidak match → Tampilkan error dengan detail actual DNS record

---

## **Metode 2: Manual Force Verification**

Gunakan jika:
- Automatic verification timeout
- DNS sudah setup tapi system belum detect
- Sudah verify di server lain tapi belum di system

### Langkah-langkah:

1. Setup DNS di Cloudflare (sama seperti Metode 1)

2. Di Admin Panel (`/admin/short-links`):
   - Klik tombol **"Verify DNS"** (biru)
   - Tunggu automatic verification
   - **Jika gagal**, klik tombol kecil **"Force"** di sebelahnya
   - Confirm dialog yang muncul
   - System akan mark domain sebagai verified tanpa check DNS

⚠️ **Warning**: Gunakan force verification hanya jika Anda sudah 100% yakin DNS sudah di-setup di Cloudflare!

---

## **API Reference untuk Verification**

### Automatic Verify
```bash
POST /api/admin/short-link-domains/{id}/verify
Content-Type: application/json

{
  "force": false
}

Response (Success):
{
  "success": true,
  "verified": true,
  "message": "DNS record verified successfully",
  "dnsCheck": {
    "expected": {
      "type": "CNAME",
      "value": "eksporyuk.com"
    },
    "actual": [
      {
        "type": "CNAME",
        "value": "eksporyuk.com."
      }
    ],
    "isValid": true
  }
}

Response (Failed):
{
  "success": false,
  "verified": false,
  "message": "CNAME record not found in DNS",
  "dnsCheck": {
    "expected": {...},
    "actual": [],
    "isValid": false
  }
}
```

### Manual Force Verify
```bash
POST /api/admin/short-link-domains/{id}/verify
Content-Type: application/json

{
  "force": true
}

Response:
{
  "success": true,
  "verified": true,
  "message": "Domain marked as verified (manual verification)",
  "domain": {
    "id": "...",
    "domain": "link.eksporyuk.com",
    "isVerified": true,
    ...
  }
}
```

### Get Verification Status
```bash
GET /api/admin/short-link-domains/{id}/verify

Response:
{
  "domain": "link.eksporyuk.com",
  "isVerified": false,
  "dnsRequired": {
    "type": "CNAME",
    "value": "eksporyuk.com",
    "instructions": "Add a CNAME record:\nName: link.eksporyuk.com\nTarget: eksporyuk.com"
  }
}
```

---

## **Troubleshooting DNS Verification**

### ❌ Error: "CNAME record not found in DNS"

**Penyebab:**
- DNS record belum di-setup di Cloudflare
- DNS propagation masih berlangsung
- Typo di domain atau target

**Solusi:**
1. Double-check domain dan target di Cloudflare:
   - Name: `link` (bukan `link.eksporyuk.com`)
   - Target: `eksporyuk.com` (harus exact match)
2. Tunggu 5-10 menit untuk DNS propagation
3. Test secara manual dengan command:
   ```bash
   nslookup link.eksporyuk.com
   # atau
   dig link.eksporyuk.com CNAME
   ```
   Lihat output apakah CNAME ada dan correct

---

### ❌ Error: "A record not found in DNS"

**Penyebab:**
- DNS Type diset ke "A" tapi belum di-setup
- A record tidak sesuai dengan expected value

**Solusi:**
1. Setup A record di Cloudflare:
   - Name: `form` (untuk form.eksporyuk.com)
   - Type: A
   - Value: IP address server Anda
2. Tunggu DNS propagation
3. Klik Verify DNS lagi

---

### ❌ Error: "TXT record not found in DNS"

**Penyebab:**
- TXT record belum di-setup
- Biasanya untuk verification khusus atau email validation

**Solusi:**
1. Setup TXT record di Cloudflare:
   - Name: `_verification` atau sesuai instruksi
   - Type: TXT
   - Value: `expectedValue` dari dnsTarget
2. Tunggu propagation (bisa 10-30 menit untuk TXT)
3. Klik Verify DNS

---

### ⏳ DNS Verification Timeout

**Penyebab:**
- Network latency
- Cloudflare DNS nameserver belum update
- Local DNS cache masih stale

**Solusi:**
1. Tunggu 5 menit
2. Flush local DNS cache:
   ```bash
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemctl restart systemd-resolved
   
   # Windows
   ipconfig /flushdns
   ```
3. Coba Verify DNS lagi
4. Jika masih gagal, gunakan **Force Verification**

---

### ✅ DNS Verified Tapi Domain Masih "Not Verified" di Panel

**Penyebab:**
- Browser cache
- Page belum refresh

**Solusi:**
1. Refresh page (`Ctrl+R` atau `Cmd+R`)
2. Clear browser cache
3. Buka tab baru dan navigate ke `/admin/short-links`

---

## **Best Practices**

### ✅ DO:
- ✓ Verify DNS setelah setup di Cloudflare
- ✓ Tunggu full DNS propagation sebelum verify
- ✓ Use automatic verify dulu sebelum force
- ✓ Test dengan `nslookup` atau `dig` sebelum verify
- ✓ Keep DNS records simple (standardized)

### ❌ DON'T:
- ✗ Jangan force verify tanpa DNS setup
- ✗ Jangan pakai subdomain berlapis (link.mail.eksporyuk.com)
- ✗ Jangan change DNS target setelah verify (akan unverify)
- ✗ Jangan delete DNS record setelah verify
- ✗ Jangan verify multiple domains dengan same target

---

## **Testing DNS Verification Secara Manual**

### Test CNAME Record
```bash
# Test apakah CNAME setup correctly
nslookup -type=CNAME link.eksporyuk.com

# Output yang diharapkan:
# link.eksporyuk.com  canonical name = eksporyuk.com.
# eksporyuk.com  canonical name = cname.vercel.app.

# Atau dengan dig (lebih detail):
dig link.eksporyuk.com CNAME
```

### Test A Record
```bash
# Test apakah A record setup correctly
nslookup -type=A form.eksporyuk.com

# Output yang diharapkan:
# form.eksporyuk.com   A   123.45.67.89

# Atau dengan dig:
dig form.eksporyuk.com A
```

### Test dengan Online Tools
Gunakan online DNS lookup tools:
- https://mxtoolbox.com/
- https://dns.google/
- https://www.digwebinterface.com/

---

## **Common DNS Configurations**

### Configuration untuk CNAME (Recommended)
```
Type: CNAME
Name: link (untuk link.eksporyuk.com)
Target: eksporyuk.com
TTL: Auto (Cloudflare akan auto-set)
Proxy: Proxied (orange) atau DNS only (gray) - keduanya OK untuk short links
```

### Configuration untuk A Record
```
Type: A
Name: form (untuk form.eksporyuk.com)
Value: Your server IP (e.g., 123.45.67.89)
TTL: Auto
Proxy: DNS only (gray cloud) - important untuk A record
```

### Configuration untuk Subdomain Berlapis
```
DON'T DO THIS! ❌
Name: link.affiliate (untuk link.affiliate.eksporyuk.com)
Lebih kompleks, sering ada issue

INSTEAD, DO THIS ✅
Buat domain terpisah:
Name: linkaffiliate (untuk linkaffiliate.eksporyuk.com)
```

---

## **Admin Panel Verification Flow**

```
┌─────────────────────────────────────┐
│  Admin buat domain di panel          │
│  - Domain: link.eksporyuk.com        │
│  - Target: eksporyuk.com             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Admin setup di Cloudflare           │
│  - Type: CNAME                       │
│  - Name: link                        │
│  - Target: eksporyuk.com             │
└──────────────┬──────────────────────┘
               │
               ▼ (Tunggu 5-10 menit)
┌─────────────────────────────────────┐
│  Admin klik "Verify DNS" di panel    │
└──────────────┬──────────────────────┘
               │
               ├─── ✅ CNAME Found ──────┐
               │                          │
               └─── ❌ Not Found ────┐    │
                    Tunggu, retry    │    │
                                     │    ▼
                                 ┌──────────────────┐
                                 │ Domain Verified! │
                                 │ isVerified=true  │
                                 └──────────────────┘
```

---

## **Support Commands**

Jika admin perlu debug:

```bash
# Check specific domain DNS record
nslookup link.eksporyuk.com

# Check all DNS records untuk domain
dig link.eksporyuk.com

# Check DNS propagation globally
# Visit: https://dnschecker.org/

# Clear local DNS cache dan retry (macOS)
sudo dscacheutil -flushcache

# Test dengan curl (check redirect)
curl -I link.eksporyuk.com
```

---

## **Setelah Domain Verified**

Setelah domain verified:
1. ✅ Domain bisa digunakan untuk create affiliate short links
2. ✅ Redirect akan work: `link.eksporyuk.com/username` → actual URL
3. ✅ Click tracking akan tercatat
4. ✅ Statistics akan accurate

Tidak verified domain tetap bisa create short links tapi:
- ⚠️ Redirect mungkin tidak work
- ⚠️ Click tracking mungkin tidak akurat
- ⚠️ Better untuk verify dulu sebelum production

---

**Last Updated:** 29 December 2025  
**Version:** 1.0 (with Automatic DNS Verification)
