# 👀 VISUAL GUIDE: DNS Verification di Admin Panel

## **Tampilan Admin Panel Sebelum & Sesudah**

### **SEBELUM: Domain Belum Verified**

```
┌─────────────────────────────────────────────────────────────┐
│                    SHORT LINK DOMAINS                        │
│                                                               │
│  Link EksporYuk                          [Add Domain]         │
│  link.eksporyuk.com                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Active │ 🔴 Not Verified                               ││
│  │                                                         ││
│  │ DNS: CNAME → eksporyuk.com                             ││
│  │                                                         ││
│  │ Short Links: 0    Clicks: 0    CTR: 0                 ││
│  │                                                         ││
│  │ Buttons (kanan):                                       ││
│  │ ┌──────────────────┐   ┌──────────────────┐            ││
│  │ │ ✓ Active         │ │ ⚠️  Verify DNS  │ ← BARU!    ││
│  │ └──────────────────┘   │ [Force] ← BARU! │            ││
│  │ ┌──────────────────┐   └──────────────────┘            ││
│  │ │ Set Default      │   ┌──────────────────┐            ││
│  │ └──────────────────┘   │ ✏️  Edit         │            ││
│  │ ┌──────────────────┐   └──────────────────┘            ││
│  │ │ 🗑️ Delete        │   ┌──────────────────┐            ││
│  │ └──────────────────┘   │ ❌ Delete (disabled)│          ││
│  │                        └──────────────────┘            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

### **SESUDAH: Domain Sudah Verified**

```
┌─────────────────────────────────────────────────────────────┐
│                    SHORT LINK DOMAINS                        │
│                                                               │
│  Link EksporYuk                          [Add Domain]         │
│  link.eksporyuk.com                                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Active │ ✅ DNS Verified                              ││
│  │                                                         ││
│  │ DNS: CNAME → eksporyuk.com                             ││
│  │                                                         ││
│  │ Short Links: 0    Clicks: 0    CTR: 0                 ││
│  │                                                         ││
│  │ Buttons (kanan):                                       ││
│  │ ┌──────────────────┐   ┌──────────────────┐            ││
│  │ │ ✓ Active         │ │ ✓ Verified       │ ← UBAH!   ││
│  │ └──────────────────┘   │ (disabled/done)  │            ││
│  │ ┌──────────────────┐   └──────────────────┘            ││
│  │ │ Set Default      │   ┌──────────────────┐            ││
│  │ └──────────────────┘   │ ✏️  Edit         │            ││
│  │ ┌──────────────────┐   └──────────────────┘            ││
│  │ │ 🗑️ Delete        │   ┌──────────────────┐            ││
│  │ └──────────────────┘   │ ❌ Delete (disabled)│          ││
│  │                        └──────────────────┘            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## **Step-by-Step: Verifikasi Domain**

### **STEP 1: Setup DNS di Cloudflare**

```
Cloudflare Dashboard
├─ Domain: eksporyuk.com
│
└─ DNS Records
   ├─ Type:   CNAME
   ├─ Name:   link        ← Subdomain saja!
   ├─ Target: eksporyuk.com
   └─ Save
   
⏳ Tunggu 5-10 menit untuk propagation
```

---

### **STEP 2: Klik "Verify DNS" di Admin Panel**

```
Admin Panel (/admin/short-links)
│
├─ Cari domain: "link.eksporyuk.com"
│
├─ Lihat status: "Not Verified"
│
├─ Klik tombol: [⚠️ Verify DNS] [Force]
│                    ↓
│            🔄 Loading...
│            Checking DNS record...
│                    ↓
```

---

### **STEP 3A: Jika DNS Benar ✅**

```
Loading selesai...

✅ DNS Record Verified!
   
System menemukan:
├─ Expected: CNAME → eksporyuk.com
├─ Actual:   CNAME → eksporyuk.com  ✓ MATCH!
│
└─ Domain automatically marked as VERIFIED!
   
Status berubah dari: ⚠️ Not Verified
                     → ✅ DNS Verified
```

---

### **STEP 3B: Jika DNS Belum Propagate ❌**

```
Loading selesai...

❌ DNS Verification Failed

Pesan: "CNAME record not found in DNS"

Opsi:
├─ Tunggu 5 menit lagi dan retry
│  └─ Klik "Verify DNS" lagi
│
└─ Sudah 100% yakin DNS setup?
   └─ Klik tombol "Force"
      ├─ Confirm dialog muncul
      ├─ Klik "Confirm"
      └─ Domain marked as VERIFIED (tanpa check DNS)
```

---

## **Button States & Behaviors**

### **"Verify DNS" Button**

#### State 1: Domain Not Verified (Blue, Clickable)
```
┌─────────────────────────────┐
│ ⚠️ Verify DNS  │ [Force]     │
└─────────────────────────────┘
   ↓ Click
   → Show loading toast
   → Do DNS lookup
   → Success → Status updated
   → Failed → Show error + Force button available
```

#### State 2: Domain Already Verified (Gray, Disabled)
```
┌─────────────────────────────┐
│ ✓ Verified (disabled)       │
└─────────────────────────────┘
   ↓ Hover
   → Show tooltip: "This domain is already verified"
   → Cannot click
```

---

### **"Force" Button**

#### State 1: Hidden (Not Shown)
```
Ketika domain verified atau automatic check berhasil
```

#### State 2: Shown (Blue, Small)
```
┌─────────────────────────────┐
│ Verify DNS │ [Force]         │
└─────────────────────────────┘
              ↓ Click
              → Confirmation dialog:
                "Force verify this domain?
                 Make sure you've set up
                 the DNS record in
                 Cloudflare first."
              
              ├─ Yes → Auto-update isVerified = true
              └─ No  → Cancel, button tetap ada
```

---

## **Toast Notifications**

### **Toast saat Verifying**
```
🔄 Checking DNS record...
   (auto-dismiss setelah success/error)
```

### **Toast jika Berhasil**
```
✅ DNS verified! Domain is now verified.
   (dismiss 3 detik, atau click X)
```

### **Toast jika Gagal**
```
❌ DNS verification failed: CNAME record not found in DNS
   (persistent, harus close manual)
```

### **Toast saat Force Verify**
```
✅ Domain marked as verified!
   (dismiss 3 detik)
```

---

## **Badge Changes**

### **Status Badge Evolution**

```
BEFORE Verification:
┌─────────────────┐
│ 🟠 Not Verified │
└─────────────────┘
│
├─ Klik "Verify DNS"
│  ├─ System check...
│  ├─ DNS found ✓
│  │
│  └─ Update badge
│
↓
AFTER Verification:
┌─────────────────┐
│ 🔵 DNS Verified │
└─────────────────┘
```

---

## **Error Messages & Solutions**

### **Error #1: CNAME Record Not Found**
```
❌ CNAME record not found in DNS

Penyebab:
├─ DNS belum di-setup di Cloudflare
├─ DNS propagation masih berlangsung
└─ Typo di domain/target

Solusi:
├─ Tunggu 5 menit dan retry
├─ Check Cloudflare DNS records
│  └─ nslookup link.eksporyuk.com
└─ Klik "Force" jika sudah yakin DNS setup
```

---

### **Error #2: Verification Timeout**
```
❌ Failed to verify DNS

Penyebab:
├─ Network latency
└─ Cloudflare DNS server delay

Solusi:
├─ Tunggu sebentar
├─ Refresh page
├─ Retry "Verify DNS"
└─ Atau gunakan "Force" button
```

---

### **Error #3: Domain Not Found**
```
❌ Domain not found

Penyebab:
└─ Domain ID tidak valid / sudah dihapus

Solusi:
└─ Refresh page, pilih domain lain
```

---

## **Network Request Flow**

### **Automatic Verification**

```
Admin UI                          API Server                   DNS Server
│                                  │                           │
├─ Click [Verify DNS]             │                           │
│                                  │                           │
├─ Fetch POST /verify              │                           │
├────────────────────────────────>│                           │
│                                  ├─ nslookup()              │
│                                  ├───────────────────────>│
│                                  │                           │
│                                  │<───────────────────────┤
│                                  │ CNAME: eksporyuk.com   │
│                                  │                           │
│                                  ├─ Compare expected vs actual
│                                  │ ├─ Expected: eksporyuk.com
│                                  │ ├─ Actual:   eksporyuk.com
│                                  │ └─ Match! ✓
│                                  │                           │
│                                  ├─ Update database
│                                  │ └─ isVerified = true
│                                  │                           │
│<────────────────────────────────┤
│ Response: {verified: true}       │
│                                  │
├─ Update UI: ✅ DNS Verified     │
│                                  │
└─ Toast: Success message          │
```

---

### **Manual Force Verification**

```
Admin UI                          API Server                   Database
│                                  │                           │
├─ Click [Force]                  │                           │
│                                  │                           │
├─ Show confirmation dialog       │                           │
├─ User confirm "Yes"             │                           │
│                                  │                           │
├─ Fetch POST /verify             │                           │
├─ {force: true}                  │                           │
├────────────────────────────────>│                           │
│                                  ├─ Skip DNS check
│                                  │                           │
│                                  ├─ Update isVerified       │
│                                  ├──────────────────────────>
│                                  │                           │
│                                  │<──────────────────────────┤
│                                  │ Updated                  │
│                                  │                           │
│<────────────────────────────────┤
│ Response: {verified: true}       │
│                                  │
├─ Update UI: ✅ Verified         │
│                                  │
└─ Toast: Verified message        │
```

---

## **Database State Changes**

### **Before Verification**
```sql
ShortLinkDomain {
  id: "a14f7a28-d195-4450-99f1-d4bd95cab450"
  domain: "link.eksporyuk.com"
  displayName: "Link EksporYuk"
  isActive: true
  isDefault: true
  isVerified: false  ← Not verified
  dnsType: "CNAME"
  dnsTarget: "eksporyuk.com"
  createdAt: "2025-12-29T01:56:22.441Z"
  updatedAt: "2025-12-29T01:56:22.427Z"
}
```

### **After Verification**
```sql
ShortLinkDomain {
  id: "a14f7a28-d195-4450-99f1-d4bd95cab450"
  domain: "link.eksporyuk.com"
  displayName: "Link EksporYuk"
  isActive: true
  isDefault: true
  isVerified: true   ← NOW VERIFIED! ✓
  dnsType: "CNAME"
  dnsTarget: "eksporyuk.com"
  createdAt: "2025-12-29T01:56:22.441Z"
  updatedAt: "2025-12-29T02:10:45.123Z"  ← Updated timestamp
}
```

---

## **Color Coding Reference**

| Color | Meaning | Button State |
|-------|---------|--------------|
| 🟢 Green | Active/Working | ✓ Active (toggle button) |
| 🔵 Blue | Action needed | ⚠️ Verify DNS (clickable) |
| 🟡 Yellow | Default | Set as Default |
| 🟠 Orange | Warning | Not Verified |
| 🔴 Red | Danger/Delete | Delete Domain |
| ⚫ Gray | Disabled | Already Verified (read-only) |

---

## **Keyboard Shortcuts**

```
(Bisa ditambah di future)

Current: None

Planned:
├─ V key: Trigger verify DNS
├─ F key: Force verify
└─ Escape: Close error/toast
```

---

## **Responsive Design**

### **Desktop (Large Screen)**
```
┌────────────────────────────────────────┐
│ Domain Info          [Buttons Column]  │
│ ├─ Display Name      ├─ Active         │
│ ├─ Domain URL        ├─ Verify DNS     │
│ ├─ DNS Config        ├─ Set Default    │
│ ├─ Statistics        ├─ Edit           │
│ └─ Created Date      └─ Delete         │
└────────────────────────────────────────┘
```

### **Mobile (Small Screen)**
```
┌─────────────────────┐
│ Domain Info         │
├─────────────────────┤
│ [Active]            │
│ [Verify DNS][Force] │
│ [Set Default]       │
│ [Edit]              │
│ [Delete]            │
└─────────────────────┘
```

---

## **Summary: What's New**

| Element | Status | Visual | Action |
|---------|--------|--------|--------|
| Verify DNS Button | ✨ NEW | 🔵 Blue | Click to auto-verify |
| Force Button | ✨ NEW | 🔵 Small | Click to force verify |
| DNS Verified Badge | ✨ NEW | ✅ Blue | Shows when verified |
| Not Verified Badge | ✨ UPDATED | 🟠 Orange | Shows when not verified |
| Toast Notifications | ✨ NEW | 📢 Modal | Feedback messages |
| Database isVerified | ✨ UPDATED | 🗄️ | Automatically updated |

---

**Visual Guide Version**: 1.0  
**Last Updated**: 29 December 2025  
**Status**: ✅ Complete
