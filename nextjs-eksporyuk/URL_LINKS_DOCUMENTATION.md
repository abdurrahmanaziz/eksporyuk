# URL & Link Structure Documentation

## Overview
Semua **Products**, **Courses**, dan **Memberships** sekarang memiliki sistem link yang lengkap dengan slug URL-friendly.

## URL Structure

### 1. Products (3 produk)
| Nama Produk | Slug | Internal URL | Checkout URL | Salespage |
|------------|------|--------------|--------------|-----------|
| Paket Starter Export | `paket-starter-export` | `/products/paket-starter-export` | `/checkout?type=product&id=cmi8t0uml0001umcw6ji02ye6` | https://kelaseksporyuk.com/paket-starter |
| Template Dokumen Ekspor Lengkap | `template-dokumen-ekspor` | `/products/template-dokumen-ekspor` | `/checkout?type=product&id=cmi8t0umu0003umcwkuh8cnn5` | https://kelaseksporyuk.com/template-dokumen |
| Database Buyer Premium | `database-buyer-premium` | `/products/database-buyer-premium` | `/checkout?type=product&id=cmi8t0umz0005umcwtmf0xz3r` | https://kelaseksporyuk.com/database-buyer |

### 2. Courses (4 kelas)
| Nama Course | Slug | Internal URL | Checkout URL |
|------------|------|--------------|--------------|
| Dasar-dasar Ekspor untuk Pemula | `dasar-dasar-ekspor-untuk-pemula` | `/courses/dasar-dasar-ekspor-untuk-pemula` | `/checkout?type=course&id=sample-course-basic` |
| Strategi Ekspor untuk Scale Business | `strategi-ekspor-untuk-scale-business` | `/courses/strategi-ekspor-untuk-scale-business` | `/checkout?type=course&id=sample-course-intermediate` |
| Export Mastery: Legal & Compliance | `export-mastery-legal-compliance` | `/courses/export-mastery-legal-compliance` | `/checkout?type=course&id=sample-course-advanced` |
| BONUS: Marketing Digital untuk Eksportir | `bonus-marketing-digital-untuk-eksportir` | `/courses/bonus-marketing-digital-untuk-eksportir` | `/checkout?type=course&id=sample-course-bonus` |

### 3. Memberships (11 paket)
| Nama Membership | Slug | Internal URL | Checkout URL | Salespage |
|----------------|------|--------------|--------------|-----------|
| Paket Lifetime | `paket-lifetime` | `/membership/paket-lifetime` | `/checkout?type=membership&id=cmi65ho5d0000um7wi7sruvb3` | https://kelaseksporyuk.com |
| 6 Bulan | `6-bulan` | `/membership/6-bulan` | `/checkout?type=membership&id=cmi65ho5m0001um7wz89n600e` | - |
| 12 Bulan | `12-bulan` | `/membership/12-bulan` | `/checkout?type=membership&id=cmi65ho5v0002um7wa8rljrsw` | - |
| Membership Basic | `basic` | `/membership/basic` | `/checkout?type=membership&id=sample-membership-basic` | - |
| Membership PRO | `pro` | `/membership/pro` | `/checkout?type=membership&id=sample-membership-pro` | - |
| Membership VIP | `vip` | `/membership/vip` | `/checkout?type=membership&id=sample-membership-vip` | - |

## Database Schema Changes

### Course Model - Added Slug Field
```prisma
model Course {
  id              String        @id @default(cuid())
  mentorId        String
  mentor          MentorProfile @relation(fields: [mentorId], references: [id])
  
  title           String
  slug            String?       @unique // ✅ NEW: URL-friendly identifier
  description     String
  // ... other fields
}
```

### Product Model - Slug Already Exists
```prisma
model Product {
  id              String   @id @default(cuid())
  creatorId       String
  creator         User     @relation("ProductCreator", fields: [creatorId], references: [id])
  
  name            String
  slug            String?  @unique // ✅ Already has slug
  description     String
  // ... other fields
}
```

### Membership Model - Slug Already Exists
```prisma
model Membership {
  id              String              @id @default(cuid())
  name            String
  slug            String?             @unique // ✅ Already has slug
  description     String
  // ... other fields
}
```

## Slug Generation Rules

### Automatic Slug Generation
Slugs are automatically generated from the item name:
- Convert to lowercase
- Remove special characters
- Replace spaces with hyphens
- Ensure uniqueness (append number if duplicate)

**Examples:**
- "Paket Starter Export" → `paket-starter-export`
- "BONUS: Marketing Digital" → `bonus-marketing-digital-untuk-eksportir`
- "6 Bulan" → `6-bulan`

### Uniqueness Guarantee
If a slug already exists, a number is appended:
- `paket-starter-export` (original)
- `paket-starter-export-1` (first duplicate)
- `paket-starter-export-2` (second duplicate)

## URL Patterns

### Internal Detail Pages
```
/products/{slug}           → Product detail page
/courses/{slug}            → Course detail page
/membership/{slug}         → Membership detail page
```

### Checkout URLs
```
/checkout?type=product&id={productId}
/checkout?type=course&id={courseId}
/checkout?type=membership&id={membershipId}
```

### External Salespages
Products and Memberships can have external salespage URLs:
```
salesPageUrl: "https://kelaseksporyuk.com/paket-starter"
```

## Affiliate Links
Affiliate dapat membuat link dengan slug:
```
/go/{affiliateCode}/{productSlug}
/go/{affiliateCode}/{courseSlug}
/go/{affiliateCode}/{membershipSlug}
```

## Scripts Created

### 1. `generate-product-course-slugs.js`
Generate slug untuk Products dan Courses yang belum ada slug.

**Usage:**
```bash
node generate-product-course-slugs.js
```

**Features:**
- Check existing slugs
- Generate missing slugs
- Ensure uniqueness
- Show summary with all links

### 2. `setup-products-with-links.js`
Create sample products dengan slug dan salespage URL.

**Usage:**
```bash
node setup-products-with-links.js
```

**Features:**
- Check if products exist
- Create 3 sample products if empty
- Generate slugs automatically
- Show complete summary

### 3. `fix-all-links-final.js`
Fix semua missing slugs untuk Products, Courses, dan Memberships.

**Usage:**
```bash
node fix-all-links-final.js
```

**Features:**
- Fix missing membership slugs
- Generate unique slugs
- Show complete summary of all links

## Migration History

### Step 1: Add slug to Course model
```bash
# Edit prisma/schema.prisma - add slug field to Course
npx prisma db push --accept-data-loss
npx prisma generate
```

### Step 2: Generate slugs for all items
```bash
node generate-product-course-slugs.js
```

### Step 3: Create sample products
```bash
node setup-products-with-links.js
```

### Step 4: Fix missing membership slugs
```bash
node fix-all-links-final.js
```

## API Integration

### Get by Slug (Recommended)
```typescript
// Product
const product = await prisma.product.findUnique({
  where: { slug: 'paket-starter-export' }
})

// Course
const course = await prisma.course.findUnique({
  where: { slug: 'dasar-dasar-ekspor-untuk-pemula' }
})

// Membership
const membership = await prisma.membership.findUnique({
  where: { slug: 'paket-lifetime' }
})
```

### Create with Auto-Slug
```typescript
import { generateSlug, generateUniqueSlug } from '@/lib/slug-utils'

// When creating new product
const baseSlug = generateSlug(productName)
const uniqueSlug = await generateUniqueSlug(baseSlug, 'product')

const product = await prisma.product.create({
  data: {
    name: productName,
    slug: uniqueSlug,
    // ... other fields
  }
})
```

## Testing

### Verify All Links Work
```bash
# Check all links in one command
node fix-all-links-final.js

# Expected output:
# ✅ Products: 3 (3 with slug)
# ✅ Courses: 4 (4 with slug)
# ✅ Memberships: 11 (11 with slug)
```

### Manual Testing
1. Visit `/products/paket-starter-export`
2. Visit `/courses/dasar-dasar-ekspor-untuk-pemula`
3. Visit `/membership/paket-lifetime`
4. Test checkout: `/checkout?type=product&id={productId}`

## Best Practices

### 1. Always Use Slugs for URLs
✅ Good:
```typescript
<Link href={`/products/${product.slug}`}>
```

❌ Bad:
```typescript
<Link href={`/products/${product.id}`}>
```

### 2. Fallback to ID if No Slug
```typescript
const productUrl = product.slug 
  ? `/products/${product.slug}` 
  : `/products?id=${product.id}`
```

### 3. SEO-Friendly Slugs
- Keep slugs short and descriptive
- Use keywords when possible
- Avoid numbers unless necessary

### 4. Handle Slug Changes
If you need to change a slug, implement redirects:
```typescript
// In Next.js middleware or API route
if (oldSlug) {
  return redirect(`/products/${newSlug}`, 301)
}
```

## Summary

✅ **Status**: All products, courses, and memberships now have URL slugs
✅ **Total Links**: 18 items (3 products + 4 courses + 11 memberships)
✅ **Database**: Schema updated with Course.slug field
✅ **Scripts**: 3 utility scripts for maintenance
✅ **Documentation**: Complete URL structure guide

---

**Last Updated**: November 21, 2024
**Version**: 1.0.0
