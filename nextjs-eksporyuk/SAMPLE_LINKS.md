# 🎯 Sample Membership - Complete Link Reference

## ✅ SAMPLE DATA CREATED

**Membership:** Pro Membership  
**Slug:** `pro`  
**Coupon:** `WELCOME20` (20% off)

---

## 🔗 ALL LINKS (Ready to Test)

### **1. Admin Panel**
```
http://localhost:3000/admin/membership-plans
```
Login sebagai admin untuk manage membership plans.

---

### **2. Checkout Page**
```
http://localhost:3000/checkout/pro
```
Public page - user bisa langsung checkout (register otomatis).

---

### **3. API Endpoints**

#### Get Plan Detail:
```
GET http://localhost:3000/api/membership-plans/pro
```

#### Validate Coupon:
```
POST http://localhost:3000/api/coupons/validate
Body: {"code":"WELCOME20","planId":"<ID>"}
```

#### Process Checkout:
```
POST http://localhost:3000/api/checkout/membership
Body: {"planId":"<ID>","priceOption":{...},"couponCode":"WELCOME20","finalPrice":550666}
```

---

## 💳 TEST CHECKOUT STEPS

1. Buka: `http://localhost:3000/checkout/pro`
2. Pilih paket: **6 Bulan** (Paling Laris)
3. Input kupon: `WELCOME20`
4. Isi data:
   - Nama: Test User
   - Email: test@example.com
   - WhatsApp: 081234567890
   - Password: testpass123
5. Klik "Beli - Rp 550.666"

---

## 📊 PRICING SUMMARY

| Paket | Harga | Per Bulan | Badge | Benefits |
|-------|-------|-----------|-------|----------|
| 1 Bulan | Rp 179.000 | Rp 179.000 | - | 5 items |
| 3 Bulan | Rp 456.333 | Rp 152.111 | Hemat 15% | 7 items |
| **6 Bulan ⭐** | **Rp 688.333** | **Rp 114.722** | **Hemat 35%** | **10 items** |
| 12 Bulan | Rp 980.000 | Rp 81.667 | Hemat 54% | 11 items |

**Dengan kupon WELCOME20:**
- Original: Rp 688.333
- Diskon (20%): -Rp 137.667
- **Final: Rp 550.666**

---

## 🎟️ COUPON INFO

**Code:** `WELCOME20`  
**Discount:** 20%  
**Valid Until:** 23 Dec 2025  
**Usage:** 0/100

---

## ✅ QUICK START

1. **Login** sebagai admin
2. **Visit** admin panel: `http://localhost:3000/admin/membership-plans`
3. **View** "Pro Membership" dengan 4 pricing options
4. **Open** checkout page: `http://localhost:3000/checkout/pro`
5. **Test** full checkout flow dengan kupon

---

**Status:** ✅ Ready for Testing  
**Created:** 23 November 2025
