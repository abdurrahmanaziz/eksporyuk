# 🚀 Implementation Plan - Priority 1 Features

## Status: IN PROGRESS
**Started:** November 26, 2025
**Target Completion:** 3-4 days

---

## ✅ Phase 1: Membership Checkout System (Day 1-2)

### 1.1 Checkout Pages
- [ ] `/membership/[slug]` - Single membership checkout
- [ ] `/checkout/compare` - Multiple plans comparison
- [ ] `/checkout/all` - All-in-one checkout page
- [ ] Auto-detect user authentication
- [ ] Registration form for guests
- [ ] Coupon code integration (auto-apply from affiliate links)

### 1.2 Payment Integration
- [ ] Xendit webhook setup (`/api/webhooks/xendit`)
- [ ] Payment status tracking
- [ ] Transaction creation logic
- [ ] Auto-activate membership on SUCCESS
- [ ] Auto-join groups on activation
- [ ] Auto-enroll courses on activation
- [ ] Grant products on activation

### 1.3 Revenue Split System
- [ ] Calculate affiliate commission (dari membership.affiliateCommissionRate)
- [ ] Calculate company fee (15%)
- [ ] Split remaining 60/40 untuk Founder/CoFounder
- [ ] Update wallet balances (Founder, CoFounder, Affiliate)
- [ ] Create WalletTransaction records
- [ ] Create PendingRevenue records for approval

### 1.4 Sales Dashboard
- [ ] `/admin/sales` page
- [ ] Display format: Invoice, Date, Buyer, Product, Affiliate, Follow-up Status
- [ ] Filter by date range, product type, affiliate
- [ ] Export to CSV
- [ ] Detail modal with full transaction info
- [ ] Resend notification button

### 1.5 Follow-up Automation
- [ ] Cron job untuk execute reminders (`/api/cron/reminders`)
- [ ] Schedule reminders setelah purchase
- [ ] Multi-channel sending (Email, WhatsApp, Push, In-App)
- [ ] Track delivery status (sent, delivered, opened, clicked)

---

## 🔄 Phase 2: Affiliate Dashboard Enhancement (Day 2-3)

### 2.1 Short Link Generator UI
- [ ] `/affiliate/links` page (upgrade existing)
- [ ] Form: Target Type (Membership/Product/Course), Target Item, Link Type
- [ ] Multi-domain selection (admin configures domains)
- [ ] Username-based short links (link.eksporyuk.com/username)
- [ ] QR Code generator
- [ ] Copy to clipboard button
- [ ] Social share buttons

### 2.2 Statistics Dashboard
- [ ] Real-time click tracking chart
- [ ] Conversion funnel visualization
- [ ] Revenue by source (membership/product/course)
- [ ] Top performing links
- [ ] Tier progress indicator

### 2.3 Tier & Commission Management
- [ ] `/affiliate/tier` page
- [ ] Display current tier (Bronze/Silver/Gold)
- [ ] Requirements for next tier
- [ ] Commission rate per tier
- [ ] Challenges & leaderboard

### 2.4 Marketing Kit
- [ ] `/affiliate/marketing-kit` page
- [ ] Banner images (ready-to-download)
- [ ] Copywriting templates
- [ ] Email templates
- [ ] WhatsApp message templates
- [ ] Social media captions

### 2.5 Payout System
- [ ] `/affiliate/payouts` page
- [ ] Request payout form (min amount)
- [ ] Bank account details
- [ ] Payout history
- [ ] Status tracking (Pending/Approved/Paid)
- [ ] Admin approval interface

---

## 🛍️ Phase 3: Product Checkout System (Day 3-4)

### 3.1 Product Checkout Flow
- [ ] `/product/[slug]` page - Product detail + checkout
- [ ] Similar flow to membership (auth check, registration, payment)
- [ ] Xendit integration (reuse webhook)
- [ ] Auto-grant product access
- [ ] Auto-join product groups
- [ ] Auto-enroll product courses

### 3.2 Product Purchase Automation
- [ ] Create UserProduct record
- [ ] Grant access to all product items
- [ ] Trigger welcome email
- [ ] Trigger WhatsApp notification
- [ ] Schedule follow-up sequence

### 3.3 Integration Points
- [ ] Revenue split (sama seperti membership)
- [ ] Wallet updates
- [ ] Affiliate commission tracking
- [ ] Sales dashboard integration

---

## 🧪 Phase 4: Testing & Integration (Day 4)

### 4.1 Cross-role Testing
- [ ] Test as Admin (create plans, view sales)
- [ ] Test as Affiliate (generate links, track stats)
- [ ] Test as Founder (check revenue split)
- [ ] Test as Member (purchase, access content)

### 4.2 Payment Testing
- [ ] Test Xendit sandbox
- [ ] Test SUCCESS callback
- [ ] Test FAILED callback
- [ ] Test EXPIRED callback
- [ ] Test duplicate payments

### 4.3 Revenue Split Validation
- [ ] Verify affiliate commission calculation
- [ ] Verify company fee (15%)
- [ ] Verify Founder/CoFounder split (60/40)
- [ ] Verify wallet balance updates
- [ ] Verify PendingRevenue approval flow

### 4.4 Security Audit
- [ ] Check authentication on all routes
- [ ] Validate role-based access
- [ ] Sanitize user inputs
- [ ] Protect API endpoints
- [ ] Rate limiting on webhooks

---

## 📝 Implementation Notes

**Critical Rules:**
1. ❌ NEVER delete existing features
2. ✅ ALWAYS check PRD.md before coding
3. ✅ Full integration: Database + API + UI + Permissions
4. ✅ Cross-role compatibility testing
5. ✅ Zero error tolerance

**Technology Stack:**
- Frontend: Next.js 14 App Router, React Server Components, Tailwind CSS
- Backend: Next.js API Routes, Prisma ORM, SQLite (dev)
- Payment: Xendit API
- Notifications: Mailketing (Email), Starsender (WhatsApp), OneSignal (Push), Pusher (In-App)
- Authentication: NextAuth.js

**Database Models Used:**
- Membership, UserMembership, MembershipProduct, MembershipReminder
- Product, UserProduct, ProductCourse
- Transaction, WalletTransaction, PendingRevenue
- AffiliateProfile, AffiliateLink, AffiliateCommission
- Wallet, Payout, PayoutRequest
- User, UserRole

**Next Steps:**
1. Start with Checkout Pages (Phase 1.1)
2. Implement Xendit Integration (Phase 1.2)
3. Build Revenue Split Logic (Phase 1.3)
4. Create Sales Dashboard (Phase 1.4)
5. Setup Follow-up Automation (Phase 1.5)

---

**Last Updated:** November 26, 2025
**Status:** Ready to implement Phase 1.1
