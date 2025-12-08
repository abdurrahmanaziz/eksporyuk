# 🚀 Short Link System - Quick Start Guide

## ⚡ Quick Setup (5 Minutes)

### 1. Setup Database & Domains
```bash
cd nextjs-eksporyuk

# Push schema changes
npx prisma db push
npx prisma generate

# Create default domains
node setup-short-link-domains.js
```

### 2. Configure DNS (External - Your Domain Provider)
Add CNAME record:
```
Type: CNAME
Name: link
Value: eksporyuk.com
TTL: 3600
```

### 3. Verify in Admin Panel
1. Go to `/admin/short-link-domains`
2. Click Edit on "Link EksporYuk"
3. Check ✅ "Verified"
4. Save

### 4. Create First Short Link (As Affiliate)
1. Go to `/affiliate/short-links`
2. Click "Create Short Link"
3. Enter username (e.g., "dinda")
4. Select target (membership/product/course)
5. Click Create

**Done!** Your short link is ready: `https://link.eksporyuk.com/dinda`

---

## 📋 File Structure

```
nextjs-eksporyuk/
├── prisma/
│   └── schema.prisma                    # ✅ Updated with ShortLink models
│
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── short-link-domains/
│   │   │       └── page.tsx             # ✅ Admin domain management UI
│   │   │
│   │   ├── affiliate/
│   │   │   └── short-links/
│   │   │       └── page.tsx             # ✅ Affiliate short link creator
│   │   │
│   │   ├── go/
│   │   │   └── [username]/
│   │   │       └── [[...slug]]/
│   │   │           └── route.ts         # ✅ Redirect handler
│   │   │
│   │   └── api/
│   │       ├── admin/
│   │       │   └── short-link-domains/
│   │       │       ├── route.ts         # ✅ GET, POST domains
│   │       │       └── [id]/
│   │       │           └── route.ts     # ✅ PATCH, DELETE domain
│   │       │
│   │       └── affiliate/
│   │           └── short-links/
│   │               ├── route.ts         # ✅ GET, POST short links
│   │               ├── domains/
│   │               │   └── route.ts     # ✅ GET available domains
│   │               └── check-username/
│   │                   └── route.ts     # ✅ Check availability
│   │
│   └── lib/
│       └── prisma.ts                    # Database client
│
├── setup-short-link-domains.js         # ✅ Setup script
├── SHORT_LINK_DOCUMENTATION.md          # ✅ Complete docs
└── SHORT_LINK_QUICK_START.md           # ✅ This file
```

---

## 🔑 Key URLs

### Admin:
- Domain Management: `/admin/short-link-domains`

### Affiliate:
- Short Link Creator: `/affiliate/short-links`
- My Short Links: `/affiliate/short-links`

### Public:
- Short Link Redirect: `/go/{username}` or `/go/{username}/{slug}`
- Example: `https://link.eksporyuk.com/dinda`

---

## 📊 Database Models

### ShortLinkDomain
```typescript
{
  id: string
  domain: string              // "link.eksporyuk.com"
  displayName: string         // "Link EksporYuk"
  isActive: boolean
  isDefault: boolean
  isVerified: boolean
  dnsType: string            // "CNAME" or "A"
  dnsTarget: string
  totalLinks: number
  totalClicks: number
}
```

### AffiliateShortLink
```typescript
{
  id: string
  affiliateId: string
  domainId: string
  username: string           // "dinda"
  slug?: string             // "paket-premium"
  fullShortUrl: string      // Complete URL
  targetType: string        // "product", "course", "membership", "custom"
  targetId?: string
  targetUrl?: string        // For custom type
  couponCode?: string
  clicks: number
  conversions: number
  isActive: boolean
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Membership Promotion
```typescript
// Affiliate creates short link
Domain: link.eksporyuk.com
Username: dinda
Target: membership (ID: mem_123)
Coupon: SAVE20

// Result
URL: https://link.eksporyuk.com/dinda
Redirects to: /checkout?type=membership&id=mem_123&ref=DINDA123&coupon=SAVE20
```

### Use Case 2: Product Campaign
```typescript
Domain: link.eksporyuk.com
Username: dinda
Slug: paket-starter
Target: product (ID: prod_456)

// Result
URL: https://link.eksporyuk.com/dinda/paket-starter
Redirects to: /checkout?type=product&id=prod_456&ref=DINDA123
```

### Use Case 3: Custom Landing Page
```typescript
Domain: link.eksporyuk.com
Username: dinda
Target: custom
URL: https://kelaseksporyuk.com/special-offer

// Result
URL: https://link.eksporyuk.com/dinda
Redirects to: https://kelaseksporyuk.com/special-offer
+ Sets affiliate cookie
```

---

## 🔧 API Quick Reference

### Create Short Link (Affiliate)
```bash
curl -X POST /api/affiliate/short-links \
  -H "Content-Type: application/json" \
  -d '{
    "domainId": "domain_123",
    "username": "dinda",
    "targetType": "membership",
    "targetId": "mem_456"
  }'
```

### Check Username Availability
```bash
curl /api/affiliate/short-links/check-username?username=dinda&domainId=domain_123
```

### Create Domain (Admin)
```bash
curl -X POST /api/admin/short-link-domains \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "link.eksporyuk.com",
    "displayName": "Link EksporYuk",
    "isActive": true,
    "isDefault": true,
    "dnsType": "CNAME",
    "dnsTarget": "eksporyuk.com"
  }'
```

---

## 🎨 UI Components Usage

### Admin Panel Component
```tsx
// Navigate to: /admin/short-link-domains
// Features:
// - List all domains
// - Add new domain
// - Edit domain settings
// - Delete unused domains
// - View statistics
```

### Affiliate Dashboard Component
```tsx
// Navigate to: /affiliate/short-links
// Features:
// - View my short links
// - Create new short link
// - Real-time username checker
// - Copy link to clipboard
// - View click/conversion stats
```

---

## 📱 Testing Checklist

### Admin Testing:
- [ ] Create new domain
- [ ] Set as default
- [ ] Edit DNS settings
- [ ] Mark as verified
- [ ] View domain statistics
- [ ] Delete unused domain

### Affiliate Testing:
- [ ] View available domains
- [ ] Check username availability
- [ ] Create short link
- [ ] Copy link to clipboard
- [ ] View link statistics
- [ ] Test with different target types

### Redirect Testing:
- [ ] Click short link
- [ ] Verify correct redirect
- [ ] Check affiliate ref in URL
- [ ] Verify coupon auto-apply
- [ ] Check cookie is set
- [ ] Verify click tracking

---

## 🐛 Common Issues & Solutions

### Issue: "Domain not found"
**Solution:** Make sure domain is active and verified in admin panel.

### Issue: "Username already taken"
**Solution:** Try different username or add a slug path.

### Issue: Short link not redirecting
**Solution:** 
1. Check DNS propagation (use https://dnschecker.org)
2. Verify domain is marked as verified
3. Check short link is active

### Issue: Clicks not tracking
**Solution:**
1. Check database connection
2. Verify tracking code in redirect handler
3. Test in incognito mode to avoid caching

---

## 💡 Pro Tips

### For Affiliates:
1. **Use Your Brand Name** - Make it memorable
2. **Add Specific Slugs** - `/dinda/offer-november` better than just `/dinda`
3. **Test Links Regularly** - Ensure they work before sharing
4. **Monitor Performance** - Track which links convert best

### For Admins:
1. **Verify DNS First** - Test thoroughly before marking as verified
2. **Set Clear Instructions** - Help affiliates understand DNS setup
3. **Monitor Stats** - Keep eye on domain performance
4. **Regular Cleanup** - Remove expired or unused links

---

## 📚 Resources

- Complete Documentation: `SHORT_LINK_DOCUMENTATION.md`
- PRD Reference: `prd.md` (Section: Affiliate System & Short link)
- Setup Script: `setup-short-link-domains.js`
- Database Schema: `prisma/schema.prisma`

---

## 🎉 Success Checklist

After setup, you should have:
- ✅ 3 domains in database (link, go, eks.link)
- ✅ DNS configured for at least one domain
- ✅ Admin can manage domains at `/admin/short-link-domains`
- ✅ Affiliates can create links at `/affiliate/short-links`
- ✅ Short links redirect correctly
- ✅ Tracking is working (clicks, conversions)
- ✅ Affiliate cookies are set properly

---

**Need Help?** 
- Check full documentation: `SHORT_LINK_DOCUMENTATION.md`
- Review API responses for error details
- Check browser console for client-side issues
- Review server logs for backend errors

**Last Updated**: November 21, 2024
