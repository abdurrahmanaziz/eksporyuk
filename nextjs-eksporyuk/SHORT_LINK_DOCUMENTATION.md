# 🔗 Short Link System for Affiliates - Complete Documentation

## Overview
Sistem short link affiliate yang powerful memungkinkan affiliate membuat link pendek yang mudah diingat seperti `link.eksporyuk.com/dinda` untuk mempromosikan produk, kelas, atau membership dengan tracking lengkap.

---

## 🎯 Features

### For Affiliates:
- ✅ Create custom short links with username (e.g., `link.eksporyuk.com/dinda`)
- ✅ Choose from multiple available domains
- ✅ Real-time username availability check
- ✅ Add optional path for specific offers (e.g., `/dinda/paket-premium`)
- ✅ Auto-apply coupon codes
- ✅ Full tracking: clicks, conversions, conversion rate
- ✅ Link to products, courses, memberships, or custom URLs

### For Admins:
- ✅ Manage multiple short link domains
- ✅ Configure DNS settings and instructions
- ✅ Set default domain
- ✅ Track domain-level statistics
- ✅ Verify DNS configuration
- ✅ Activate/deactivate domains

---

## 📊 Database Schema

### ShortLinkDomain
Manages domains that affiliates can use for short links.

```prisma
model ShortLinkDomain {
  id              String   @id @default(cuid())
  domain          String   @unique // e.g., "link.eksporyuk.com"
  displayName     String   // e.g., "Link EksporYuk"
  
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  isVerified      Boolean  @default(false) // DNS verified
  
  // DNS Configuration
  dnsType         String?  // CNAME, A Record
  dnsTarget       String?  // Where it should point
  dnsInstructions String?  // Setup instructions
  
  // Stats
  totalLinks      Int      @default(0)
  totalClicks     Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  shortLinks      AffiliateShortLink[]
}
```

### AffiliateShortLink
Individual short links created by affiliates.

```prisma
model AffiliateShortLink {
  id              String            @id @default(cuid())
  
  affiliateId     String
  affiliate       AffiliateProfile  @relation(...)
  
  domainId        String
  domain          ShortLinkDomain   @relation(...)
  
  // Short URL components
  username        String            // e.g., "dinda"
  slug            String?           // Optional: "paket-premium"
  
  // Target
  targetType      String            // "product", "course", "membership", "custom"
  targetId        String?           
  targetUrl       String?           // For custom URLs
  
  fullShortUrl    String            // Complete URL
  
  // Tracking
  affiliateLinkId String?
  couponCode      String?
  clicks          Int               @default(0)
  conversions     Int               @default(0)
  
  isActive        Boolean           @default(true)
  expiresAt       DateTime?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}
```

### AffiliateProfile Updates
```prisma
model AffiliateProfile {
  // ... existing fields
  shortLinkUsername String? @unique // Primary username for short links
  shortLinks        AffiliateShortLink[]
}
```

---

## 🔧 API Endpoints

### Admin APIs

#### 1. Get All Domains
```http
GET /api/admin/short-link-domains
Authorization: Required (ADMIN)
```

**Response:**
```json
{
  "domains": [
    {
      "id": "domain_123",
      "domain": "link.eksporyuk.com",
      "displayName": "Link EksporYuk",
      "isActive": true,
      "isDefault": true,
      "isVerified": true,
      "totalLinks": 45,
      "totalClicks": 1230,
      "_count": {
        "shortLinks": 45
      }
    }
  ]
}
```

#### 2. Create Domain
```http
POST /api/admin/short-link-domains
Authorization: Required (ADMIN)
Content-Type: application/json
```

**Body:**
```json
{
  "domain": "link.eksporyuk.com",
  "displayName": "Link EksporYuk",
  "isActive": true,
  "isDefault": true,
  "dnsType": "CNAME",
  "dnsTarget": "eksporyuk.com",
  "dnsInstructions": "Setup CNAME..."
}
```

#### 3. Update Domain
```http
PATCH /api/admin/short-link-domains/[id]
Authorization: Required (ADMIN)
```

#### 4. Delete Domain
```http
DELETE /api/admin/short-link-domains/[id]
Authorization: Required (ADMIN)
```
Note: Cannot delete domain with active links.

### Affiliate APIs

#### 5. Get Available Domains
```http
GET /api/affiliate/short-links/domains
Authorization: Required
```

**Response:**
```json
{
  "domains": [
    {
      "id": "domain_123",
      "domain": "link.eksporyuk.com",
      "displayName": "Link EksporYuk",
      "isDefault": true,
      "totalLinks": 45,
      "totalClicks": 1230
    }
  ]
}
```

#### 6. Check Username Availability
```http
GET /api/affiliate/short-links/check-username?username=dinda&domainId=domain_123&slug=
Authorization: Required
```

**Response:**
```json
{
  "available": true
}
```
or
```json
{
  "available": false,
  "reason": "This short link is already taken"
}
```

#### 7. Get My Short Links
```http
GET /api/affiliate/short-links
Authorization: Required
```

**Response:**
```json
{
  "shortLinks": [
    {
      "id": "link_123",
      "username": "dinda",
      "slug": null,
      "fullShortUrl": "https://link.eksporyuk.com/dinda",
      "targetType": "membership",
      "targetId": "mem_456",
      "clicks": 150,
      "conversions": 12,
      "isActive": true,
      "domain": {
        "domain": "link.eksporyuk.com",
        "displayName": "Link EksporYuk"
      }
    }
  ]
}
```

#### 8. Create Short Link
```http
POST /api/affiliate/short-links
Authorization: Required
Content-Type: application/json
```

**Body:**
```json
{
  "domainId": "domain_123",
  "username": "dinda",
  "slug": "paket-premium",
  "targetType": "membership",
  "targetId": "mem_456",
  "couponCode": "DISCOUNT20"
}
```

### Redirect Handler

#### 9. Short Link Redirect
```http
GET /go/[username] or /go/[username]/[slug]
```

**Flow:**
1. Lookup short link in database
2. Build target URL with affiliate code
3. Track click (IP, user agent, referrer)
4. Update statistics
5. Set affiliate cookie (30 days)
6. Redirect to target URL

**Example:**
```
https://link.eksporyuk.com/dinda
→ Redirects to: https://eksporyuk.com/checkout?type=membership&id=mem_456&ref=DINDA123
→ Sets cookie: affiliate_ref=DINDA123
```

---

## 🚀 Setup Guide

### Step 1: Run Schema Migration
```bash
cd nextjs-eksporyuk
npx prisma db push
npx prisma generate
```

### Step 2: Setup Default Domains
```bash
node setup-short-link-domains.js
```

This creates 3 default domains:
- `link.eksporyuk.com` (Default, Active, Verified)
- `go.eksporyuk.com` (Active, Not Verified)
- `eks.link` (Inactive, Not Verified)

### Step 3: Configure DNS

For `link.eksporyuk.com`:
```
Type: CNAME
Name: link
Value: eksporyuk.com (or your main domain)
TTL: 3600
```

For `go.eksporyuk.com`:
```
Type: CNAME
Name: go
Value: eksporyuk.com
TTL: 3600
```

For custom domains (like `eks.link`):
```
Type: A
Name: @
Value: Your server IP
TTL: 3600
```

### Step 4: Verify DNS
After DNS propagation (24-48 hours):
1. Go to Admin Panel → Short Link Domains
2. Edit domain
3. Check "Verified" checkbox
4. Save

### Step 5: Test Short Link
1. Login as affiliate
2. Go to Affiliate Dashboard → Short Links
3. Create a new short link
4. Test the URL in browser
5. Check tracking stats

---

## 💡 Usage Examples

### Example 1: Basic Short Link
```
Username: dinda
Domain: link.eksporyuk.com
Target: Membership (ID: mem_123)

Result: https://link.eksporyuk.com/dinda
→ Redirects to checkout with affiliate ref
```

### Example 2: Short Link with Path
```
Username: dinda
Slug: paket-premium
Domain: link.eksporyuk.com
Target: Membership (ID: mem_123)

Result: https://link.eksporyuk.com/dinda/paket-premium
→ More specific and professional
```

### Example 3: Short Link with Coupon
```
Username: dinda
Domain: link.eksporyuk.com
Target: Product (ID: prod_456)
Coupon: DISCOUNT20

Result: https://link.eksporyuk.com/dinda
→ Redirects to: /checkout?type=product&id=prod_456&ref=DINDA123&coupon=DISCOUNT20
```

### Example 4: Custom URL
```
Username: dinda
Domain: link.eksporyuk.com
Target Type: custom
Target URL: https://kelaseksporyuk.com/landing-page

Result: https://link.eksporyuk.com/dinda
→ Redirects to custom URL with affiliate cookie
```

---

## 📱 UI Components

### Admin Panel: `/admin/short-link-domains`
- Domain list with stats
- Add/Edit/Delete domains
- DNS configuration form
- Verification status
- Domain statistics

**Features:**
- Create new domains
- Set default domain
- Configure DNS settings
- View link count per domain
- Delete unused domains

### Affiliate Dashboard: `/affiliate/short-links`
- My short links list
- Create short link modal
- Real-time username checker
- URL preview
- Click/conversion stats
- Copy to clipboard button

**Features:**
- Choose domain from available list
- Username availability check (live)
- Optional path/slug
- Target selection (product/course/membership/custom)
- Coupon code integration
- One-click copy

---

## 🔍 Tracking & Analytics

### Metrics Tracked:
1. **Click Tracking**
   - IP address
   - User agent
   - Referrer
   - Timestamp

2. **Conversion Tracking**
   - Linked to AffiliateClick
   - Updated when purchase completed
   - Conversion rate calculation

3. **Statistics**
   - Per short link: clicks, conversions
   - Per domain: total links, total clicks
   - Per affiliate: total clicks, total earnings

### Data Flow:
```
User clicks short link
  ↓
/go/[username] handler
  ↓
Lookup short link → Track click → Update stats
  ↓
Set affiliate cookie (30 days)
  ↓
Redirect to target URL with ?ref=CODE
  ↓
User completes purchase
  ↓
Checkout detects affiliate ref
  ↓
Create AffiliateConversion
  ↓
Update conversion stats
```

---

## 🎨 Best Practices

### For Affiliates:
1. **Choose Memorable Username**
   - Use your name or brand
   - Keep it short (3-12 chars)
   - Use lowercase only

2. **Use Descriptive Slugs**
   - `/dinda/paket-premium` better than `/dinda`
   - Helps track specific campaigns
   - More professional looking

3. **Test Your Links**
   - Always test after creation
   - Check redirect destination
   - Verify coupon auto-apply

4. **Track Performance**
   - Monitor click-through rates
   - Test different URLs
   - Optimize based on data

### For Admins:
1. **Verify DNS Before Activating**
   - Test domain accessibility
   - Check SSL certificate
   - Verify redirects work

2. **Set Clear DNS Instructions**
   - Provide exact records
   - Include screenshots
   - Document TTL settings

3. **Monitor Domain Health**
   - Check verification status
   - Review click statistics
   - Deactivate broken domains

4. **Regular Cleanup**
   - Remove expired links
   - Archive inactive domains
   - Optimize database

---

## 🔒 Security Considerations

1. **Username Validation**
   - Only lowercase, numbers, hyphens
   - Minimum 3 characters
   - Uniqueness per domain+slug

2. **Rate Limiting**
   - Limit link creation per affiliate
   - Prevent spam/abuse
   - Monitor suspicious activity

3. **DNS Security**
   - Use HTTPS only
   - Verify SSL certificates
   - Monitor DNS changes

4. **Click Fraud Prevention**
   - Track IP addresses
   - Detect bot traffic
   - Validate conversions

---

## 🐛 Troubleshooting

### Short Link Not Working
1. Check domain is active and verified
2. Verify DNS propagation
3. Test direct URL access
4. Check short link status

### Username Not Available
1. Try different username
2. Add path/slug for uniqueness
3. Choose different domain

### Clicks Not Tracking
1. Check short link is active
2. Verify tracking code
3. Review error logs
4. Test in incognito mode

### Redirects to Wrong URL
1. Verify target type and ID
2. Check custom URL format
3. Test affiliate link association

---

## 📊 Reports & Analytics

### Available Reports:
1. **Top Performing Links**
   - Sorted by clicks
   - Sorted by conversions
   - Sorted by conversion rate

2. **Domain Performance**
   - Links per domain
   - Clicks per domain
   - Conversion rates

3. **Affiliate Leaderboard**
   - Top affiliates by short link clicks
   - Best converting links
   - Most active domains

---

## 🚀 Future Enhancements

### Planned Features:
- [ ] QR Code generation for short links
- [ ] Link expiration dates
- [ ] A/B testing for different URLs
- [ ] Advanced analytics dashboard
- [ ] Bulk link creation
- [ ] Link groups/categories
- [ ] Custom branded domains per affiliate
- [ ] Link preview cards (Open Graph)
- [ ] Mobile app integration
- [ ] CSV export of stats

---

## 📝 Summary

### System Components:
✅ Database schema (ShortLinkDomain, AffiliateShortLink)
✅ Admin API (CRUD domains)
✅ Affiliate API (Create, list, check availability)
✅ Redirect handler (/go/[username])
✅ Admin UI (Domain management)
✅ Affiliate UI (Short link creator)
✅ Tracking system (Clicks, conversions)
✅ Setup script (Default domains)
✅ Complete documentation

### Ready to Use:
- Run `node setup-short-link-domains.js`
- Configure DNS for domains
- Admin marks domains as verified
- Affiliates can create short links
- Full tracking operational

---

**Last Updated**: November 21, 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
