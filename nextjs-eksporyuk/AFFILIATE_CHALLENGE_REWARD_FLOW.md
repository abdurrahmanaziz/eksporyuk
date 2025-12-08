# 🏆 AFFILIATE CHALLENGE REWARD FLOW

## 📋 Alur Lengkap Sistem Challenge & Reward

### 🎯 **FASE 1: JOIN CHALLENGE (OPT-IN)**

**Affiliate Action:**
```
1. Buka /affiliate/challenges
2. Lihat challenge aktif dengan hasJoined: false
3. Klik tombol "Ikuti Challenge"
```

**System Process:**
```typescript
POST /api/affiliate/challenges
Body: { challengeId: "xxx" }

Validations:
✅ User memiliki AffiliateProfile
✅ Challenge exists dan isActive: true
✅ Challenge masih dalam periode (startDate ≤ now ≤ endDate)
✅ Belum pernah join (no existing progress)

Create:
AffiliateChallengeProgress {
  challengeId,
  affiliateId,
  currentValue: 0,
  completed: false,
  rewardClaimed: false
}

Response: { progress: {...} }
```

---

### 📈 **FASE 2: PROGRESS TRACKING (Otomatis)**

**Trigger:** Saat ada konversi/penjualan yang dikonfirmasi

**System Process:**
```typescript
// Dipanggil di purchase/payment confirmation
updateChallengeProgress({
  affiliateId,
  membershipId/productId/courseId,
  transactionAmount
})

Logic:
1. Find all joined challenges (hasJoined = true) yang:
   - isActive: true
   - startDate ≤ now ≤ endDate
   - completed: false
   - Match produk (atau semua produk jika null)

2. Untuk setiap challenge:
   - SALES_COUNT/CONVERSIONS: +1
   - REVENUE: +transactionAmount
   - NEW_CUSTOMERS: +1 (jika customer baru)
   - CLICKS: Tracked terpisah di click handler

3. Check completion:
   if (currentValue >= targetValue) {
     completed: true,
     completedAt: now
   }

4. Update AffiliateChallengeProgress
```

**Contoh:**
```
Challenge: "Flash Sale - 5 Penjualan"
- Target: SALES_COUNT = 5
- Reward: BONUS_COMMISSION Rp 150.000

Progress:
Sale 1: currentValue = 1/5 (20%)
Sale 2: currentValue = 2/5 (40%)
Sale 3: currentValue = 3/5 (60%)
Sale 4: currentValue = 4/5 (80%)
Sale 5: currentValue = 5/5 (100%) ✅ COMPLETED
```

---

### 🎁 **FASE 3: CLAIM REWARD (OTOMATIS - TANPA APPROVAL ADMIN)**

#### **A. Affiliate Melihat Challenge Complete**

**UI Display:**
```tsx
{challenge.hasJoined && 
 challenge.userProgress?.completed && 
 !challenge.userProgress?.rewardClaimed && (
  <Button onClick={() => handleClaimReward(challengeId)}>
    <Gift className="w-4 h-4 mr-2" />
    Klaim Hadiah
  </Button>
)}
```

#### **B. Affiliate Klik "Klaim Hadiah"**

**Frontend Action:**
```typescript
const handleClaimReward = async (challengeId: string) => {
  const response = await fetch(`/api/affiliate/challenges/${challengeId}/claim`, {
    method: 'POST'
  })
  
  if (response.ok) {
    toast.success('Reward berhasil diklaim!')
    fetchData() // Refresh
    setShowChallengeDetail(false)
  }
}
```

#### **C. System Process - Claim API**

**Endpoint:** `POST /api/affiliate/challenges/[id]/claim`

**Validations:**
```typescript
❌ Unauthorized → 401
❌ Affiliate profile not found → 404
❌ Challenge not found → 404
❌ Not joined challenge → 400
❌ Challenge not completed → 400
❌ Reward already claimed → 400
```

**Process berdasarkan Reward Type:**

##### **1. BONUS_COMMISSION (Komisi Bonus)**
```typescript
Transaction {
  // 1. Update Wallet
  await wallet.upsert({
    create: { 
      userId, 
      balance: rewardValue,
      totalEarnings: rewardValue 
    },
    update: { 
      balance: { increment: rewardValue },
      totalEarnings: { increment: rewardValue }
    }
  })

  // 2. Create Wallet Transaction
  await walletTransaction.create({
    walletId,
    amount: rewardValue,
    type: 'CHALLENGE_REWARD',
    description: `Reward dari challenge: ${challenge.title}`
  })

  // 3. Update Affiliate Total Earnings
  await affiliateProfile.update({
    affiliateId,
    data: { totalEarnings: { increment: rewardValue } }
  })

  // 4. Mark as Claimed
  await affiliateChallengeProgress.update({
    where: { id: progressId },
    data: {
      rewardClaimed: true,
      claimedAt: new Date()
    }
  })
}
```

**Contoh:**
```
Challenge: "Flash Sale - 5 Penjualan"
Reward: BONUS_COMMISSION Rp 150.000

Setelah Claim:
✅ Wallet balance: +Rp 150.000
✅ WalletTransaction created (type: CHALLENGE_REWARD)
✅ AffiliateProfile totalEarnings: +Rp 150.000
✅ rewardClaimed: true, claimedAt: 2025-11-29 14:30:00
```

##### **2. TIER_UPGRADE (Naik Tier)**
```typescript
Transaction {
  // 1. Upgrade Tier
  const currentTier = affiliateProfile.tier
  const newTier = Math.min(currentTier + rewardValue, 5) // Max tier 5
  
  await affiliateProfile.update({
    affiliateId,
    data: { tier: newTier }
  })

  // 2. Mark as Claimed
  await affiliateChallengeProgress.update({
    where: { id: progressId },
    data: {
      rewardClaimed: true,
      claimedAt: new Date()
    }
  })
}
```

**Contoh:**
```
Challenge: "Revenue Hunter - Rp 5 Juta"
Reward: TIER_UPGRADE +1

Affiliate Tier 2 → Claim → Tier 3
✅ Tier upgrade: 2 → 3
✅ Komisi rate increase (sesuai tier settings)
✅ rewardClaimed: true, claimedAt: 2025-11-29 14:30:00
```

##### **3. CASH_BONUS / Other**
```typescript
// Hanya mark as claimed
await affiliateChallengeProgress.update({
  where: { id: progressId },
  data: {
    rewardClaimed: true,
    claimedAt: new Date()
  }
})
```

#### **D. Response**

```typescript
{
  success: true,
  message: "Reward claimed successfully",
  rewardType: "BONUS_COMMISSION",
  rewardValue: 150000
}
```

---

### 👨‍💼 **FASE 4: ADMIN MONITORING (Passive - Read Only)**

#### **A. View All Challenges**

**Endpoint:** `GET /api/admin/affiliate/challenges`

```typescript
Response: {
  challenges: [{
    id,
    title,
    status: 'active' | 'upcoming' | 'ended',
    participantsCount,
    completedCount,
    claimedCount,  // ✅ Total yang sudah claim reward
    totalRewardsPaid  // ✅ Total reward yang sudah dibayarkan
  }]
}
```

#### **B. View Challenge Detail**

**Endpoint:** `GET /api/admin/affiliate/challenges/[id]`

```typescript
Response: {
  challenge: { ...challengeData },
  stats: {
    participantsCount: 15,      // Total yang join
    completedCount: 7,          // Total yang complete
    claimedCount: 5,            // Total yang sudah claim ✅
    totalProgressValue,         // Total progress semua participant
    averageProgress,            // Rata-rata progress
    completionRate: "46.7%"     // % yang complete
  },
  participants: [{
    rank: 1,
    affiliateId,
    userId,
    name: "John Doe",
    email: "john@example.com",
    tier: 3,
    currentValue: 7,
    progress: 140,  // 7/5 = 140% (over-achievement)
    completed: true,
    completedAt: "2025-11-25T10:30:00Z",
    rewardClaimed: true,  // ✅ Status claim
    claimedAt: "2025-11-25T14:20:00Z",  // ✅ Waktu claim
    joinedAt: "2025-11-20T08:00:00Z"
  }]
}
```

**UI Display:**
```
Participant Name: John Doe (Tier 3)
Progress: 7/5 (140%) ✅ COMPLETED
Completed: 25 Nov 2025, 10:30
Reward Status: ✅ CLAIMED (25 Nov 2025, 14:20)
```

#### **C. Admin Actions Available**

1. **Update Challenge** (Limited)
```typescript
PUT /api/admin/affiliate/challenges/[id]
Body: {
  title, description, isActive,
  membershipId, productId, courseId  // ✅ Bisa diupdate kapan saja
  
  // ❌ TIDAK bisa update jika ada participants:
  targetType, targetValue,
  rewardType, rewardValue,
  startDate, endDate
}
```

2. **Delete Challenge** (Restricted)
```typescript
DELETE /api/admin/affiliate/challenges/[id]

Validation:
❌ Cannot delete if ada completed participants
✅ Bisa delete jika hanya ada progress tapi belum ada yang complete
```

3. **Deactivate Challenge**
```typescript
PUT /api/admin/affiliate/challenges/[id]
Body: { isActive: false }

Effect:
- Challenge tidak muncul di list affiliate
- Progress tracking tetap jalan untuk yang sudah join
- Tidak bisa join baru
```

---

## 🔄 **FLOWCHART LENGKAP**

```
┌─────────────────────────────────────────────────────────────┐
│                    AFFILIATE CHALLENGE FLOW                  │
└─────────────────────────────────────────────────────────────┘

1. ADMIN CREATES CHALLENGE
   └─> AffiliatechALLENGE created (isActive: true)

2. AFFILIATE VIEWS CHALLENGES
   └─> GET /api/affiliate/challenges
       └─> hasJoined: false ❌
           └─> Show "Ikuti Challenge" button

3. AFFILIATE JOINS
   └─> POST /api/affiliate/challenges { challengeId }
       └─> AffiliateChallengeProgress created
           └─> currentValue: 0, completed: false

4. AFFILIATE MAKES SALES
   └─> Purchase confirmed
       └─> updateChallengeProgress() triggered
           └─> currentValue += increment
               └─> if (currentValue >= targetValue)
                   └─> completed: true ✅
                       └─> completedAt: now

5. AFFILIATE CLAIMS REWARD
   └─> POST /api/affiliate/challenges/[id]/claim
       └─> Validate: joined, completed, not claimed
           └─> Process based on rewardType:
               
               A. BONUS_COMMISSION
                  └─> Wallet += rewardValue
                  └─> WalletTransaction created
                  └─> AffiliateProfile totalEarnings += rewardValue
                  └─> rewardClaimed: true ✅
               
               B. TIER_UPGRADE
                  └─> AffiliateProfile tier += rewardValue
                  └─> rewardClaimed: true ✅
               
               C. CASH_BONUS
                  └─> rewardClaimed: true ✅

6. ADMIN MONITORS
   └─> GET /api/admin/affiliate/challenges/[id]
       └─> View stats: completedCount, claimedCount
           └─> View participants with claim status & timestamps
```

---

## 📊 **DATABASE STATE TRACKING**

### **AffiliateChallengeProgress Fields:**

```prisma
model AffiliateChallengeProgress {
  id            String    @id
  challengeId   String
  affiliateId   String
  currentValue  Decimal   @default(0)      // Progress value
  completed     Boolean   @default(false)  // ✅ Challenge selesai
  completedAt   DateTime?                  // ⏰ Waktu complete
  rewardClaimed Boolean   @default(false)  // ✅ Reward sudah diklaim
  claimedAt     DateTime?                  // ⏰ Waktu claim
  createdAt     DateTime                   // ⏰ Waktu join
  updatedAt     DateTime                   // ⏰ Last update
}
```

### **State Transitions:**

```
1. JOIN
   currentValue: 0
   completed: false
   completedAt: null
   rewardClaimed: false
   claimedAt: null

2. IN PROGRESS
   currentValue: 3 (dari 5)
   completed: false
   completedAt: null
   rewardClaimed: false
   claimedAt: null

3. COMPLETED
   currentValue: 5 (dari 5)
   completed: true ✅
   completedAt: "2025-11-25T10:30:00Z" ⏰
   rewardClaimed: false
   claimedAt: null

4. REWARD CLAIMED
   currentValue: 5
   completed: true ✅
   completedAt: "2025-11-25T10:30:00Z"
   rewardClaimed: true ✅
   claimedAt: "2025-11-25T14:20:00Z" ⏰
```

---

## ⚠️ **YANG BELUM ADA (Potential Improvements)**

### 1. **Admin Approval Flow** ❌
**Saat Ini:** Reward otomatis masuk wallet saat claim
**Improvement:** 
```typescript
// Add approval flow
model AffiliateChallengeProgress {
  rewardStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedBy: String?
  approvedAt: DateTime?
  rejectionReason: String?
}

Flow:
1. Affiliate claim → rewardStatus: 'PENDING'
2. Admin review → POST /api/admin/affiliate/challenges/[id]/approve
3. Approved → Process reward + rewardStatus: 'APPROVED'
4. Rejected → rewardStatus: 'REJECTED' + rejectionReason
```

### 2. **Admin Notifications** ❌
**Saat Ini:** Admin harus manual check dashboard
**Improvement:**
```typescript
// Real-time notifications
- Email/WhatsApp ke admin saat ada claim baru
- Dashboard badge count untuk pending claims
- Daily summary: X claims today, Y pending
```

### 3. **Reward History/Audit Log** ❌
**Saat Ini:** Hanya ada di WalletTransaction (untuk BONUS_COMMISSION)
**Improvement:**
```typescript
model RewardClaimLog {
  id: String
  challengeId: String
  affiliateId: String
  rewardType: String
  rewardValue: Decimal
  claimedAt: DateTime
  processedAt: DateTime
  status: 'SUCCESS' | 'FAILED'
  errorMessage: String?
}
```

### 4. **Bulk Actions** ❌
**Saat Ini:** Admin hanya bisa view per challenge
**Improvement:**
```typescript
// Admin bulk operations
POST /api/admin/affiliate/challenges/bulk-approve
POST /api/admin/affiliate/challenges/export-claims
```

### 5. **Challenge Leaderboard Real-time** ❌
**Saat Ini:** Static data saat page load
**Improvement:**
```typescript
// WebSocket updates untuk leaderboard
- Real-time ranking updates
- Live progress bars
- Achievement notifications
```

---

## ✅ **KESIMPULAN ALUR SAAT INI**

### **AFFILIATE SIDE (Complete & Working):**
✅ Opt-in join system (manual klik button)
✅ Real-time progress tracking (otomatis on sales)
✅ Self-service claim reward (langsung masuk wallet/tier)
✅ Clear UI states (join → progress → complete → claim → claimed)

### **ADMIN SIDE (Monitoring Only):**
✅ View all challenges + stats
✅ View participants + claim status
✅ Update/delete challenges (with restrictions)
❌ **NO approval flow** - rewards otomatis
❌ **NO notifications** - passive monitoring only
❌ **NO audit trail** - limited tracking

### **RECOMMENDATION:**
Untuk production yang aman, pertimbangkan untuk menambahkan:
1. **Admin approval flow** untuk reward > threshold tertentu (misal > Rp 500K)
2. **Email notifications** ke admin saat ada claim baru
3. **Audit log** untuk semua claim transactions
4. **Fraud detection** (misal: 2 claim dalam 1 menit = suspicious)

Tapi untuk MVP/testing, sistem saat ini **SUDAH LENGKAP & BERFUNGSI** dengan baik! 🎉
