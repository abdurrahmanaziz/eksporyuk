# Slug Utils - Usage Examples

## Installation
The slug utilities are located in `src/lib/slug-utils.ts` and can be imported throughout the application.

## Import
```typescript
import {
  generateSlug,
  generateUniqueSlug,
  createUniqueSlug,
  buildItemUrl,
  buildCheckoutUrl,
  buildAffiliateLink,
  isValidSlug,
  getBySlugOrId
} from '@/lib/slug-utils'
```

## Basic Usage

### 1. Generate Simple Slug
Convert any text to URL-friendly slug:

```typescript
import { generateSlug } from '@/lib/slug-utils'

const slug1 = generateSlug("Paket Starter Export")
// Result: "paket-starter-export"

const slug2 = generateSlug("BONUS: Marketing Digital!")
// Result: "bonus-marketing-digital"

const slug3 = generateSlug("Kelas Ekspor 101")
// Result: "kelas-ekspor-101"
```

### 2. Generate Unique Slug
Ensure slug is unique in database:

```typescript
import { generateUniqueSlug } from '@/lib/slug-utils'

// First call - slug is available
const slug1 = await generateUniqueSlug("paket-starter", "product")
// Result: "paket-starter"

// Second call - slug already exists
const slug2 = await generateUniqueSlug("paket-starter", "product")
// Result: "paket-starter-1"

// Third call
const slug3 = await generateUniqueSlug("paket-starter", "product")
// Result: "paket-starter-2"
```

### 3. Create Unique Slug from Text
Combines generation and uniqueness check:

```typescript
import { createUniqueSlug } from '@/lib/slug-utils'

// One-step slug creation
const slug = await createUniqueSlug("New Product Name", "product")
// Result: "new-product-name" (or "new-product-name-1" if exists)
```

## API Route Examples

### Create Product with Auto-Slug

```typescript
// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUniqueSlug } from '@/lib/slug-utils'

export async function POST(req: NextRequest) {
  const { name, description, price } = await req.json()
  
  // Auto-generate unique slug
  const slug = await createUniqueSlug(name, 'product')
  
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      creatorId: userId // from session
    }
  })
  
  return NextResponse.json({ product })
}
```

### Update Product - Regenerate Slug if Name Changes

```typescript
// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUniqueSlug } from '@/lib/slug-utils'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { name, description, price } = await req.json()
  
  const existingProduct = await prisma.product.findUnique({
    where: { id: params.id }
  })
  
  // Regenerate slug if name changed
  let slug = existingProduct?.slug
  if (name && name !== existingProduct?.name) {
    slug = await createUniqueSlug(name, 'product', params.id)
  }
  
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name,
      slug,
      description,
      price
    }
  })
  
  return NextResponse.json({ product })
}
```

### Get Product by Slug

```typescript
// src/app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getBySlugOrId } from '@/lib/slug-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Works with both slug and ID
  const product = await getBySlugOrId(params.slug, 'product')
  
  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ product })
}
```

## Frontend Component Examples

### Product Card with Slug Link

```tsx
// components/ProductCard.tsx
import Link from 'next/link'
import { buildItemUrl } from '@/lib/slug-utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    thumbnail?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const productUrl = buildItemUrl('product', product.slug)
  
  return (
    <div className="product-card">
      <Link href={productUrl}>
        <img src={product.thumbnail} alt={product.name} />
        <h3>{product.name}</h3>
        <p>Rp {product.price.toLocaleString('id-ID')}</p>
      </Link>
    </div>
  )
}
```

### Buy Button with Checkout URL

```tsx
// components/BuyButton.tsx
import { buildCheckoutUrl } from '@/lib/slug-utils'

interface BuyButtonProps {
  type: 'product' | 'course' | 'membership'
  itemId: string
  itemName: string
}

export function BuyButton({ type, itemId, itemName }: BuyButtonProps) {
  const checkoutUrl = buildCheckoutUrl(type, itemId)
  
  return (
    <a 
      href={checkoutUrl}
      className="btn btn-primary"
    >
      Beli {itemName}
    </a>
  )
}
```

### Affiliate Share Button

```tsx
// components/AffiliateShareButton.tsx
import { buildAffiliateLink } from '@/lib/slug-utils'
import { useSession } from 'next-auth/react'

interface ShareButtonProps {
  itemType: 'product' | 'course' | 'membership'
  itemSlug: string
}

export function AffiliateShareButton({ itemType, itemSlug }: ShareButtonProps) {
  const { data: session } = useSession()
  const affiliateCode = session?.user?.affiliateCode
  
  if (!affiliateCode) return null
  
  const affiliateUrl = buildAffiliateLink(affiliateCode, itemType, itemSlug)
  
  const copyLink = () => {
    navigator.clipboard.writeText(affiliateUrl)
    alert('Link copied!')
  }
  
  return (
    <button onClick={copyLink} className="btn-share">
      📋 Copy Affiliate Link
    </button>
  )
}
```

## Page Examples

### Product Detail Page with Slug

```tsx
// src/app/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getBySlugOrId, buildCheckoutUrl } from '@/lib/slug-utils'

interface ProductPageProps {
  params: { slug: string }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getBySlugOrId(params.slug, 'product')
  
  if (!product) {
    notFound()
  }
  
  const checkoutUrl = buildCheckoutUrl('product', product.id)
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Rp {product.price.toLocaleString('id-ID')}</p>
      
      <a href={checkoutUrl} className="btn-buy">
        Beli Sekarang
      </a>
    </div>
  )
}

// Generate static params for all products
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true }
  })
  
  return products.map(p => ({
    slug: p.slug
  }))
}
```

### Course Detail Page

```tsx
// src/app/courses/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getBySlugOrId } from '@/lib/slug-utils'

export default async function CoursePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const course = await getBySlugOrId(params.slug, 'course')
  
  if (!course) {
    notFound()
  }
  
  return (
    <div>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      {/* Course content */}
    </div>
  )
}
```

## Validation Examples

### Check if Slug is Valid

```typescript
import { isValidSlug } from '@/lib/slug-utils'

const slug1 = "paket-starter-export"
console.log(isValidSlug(slug1)) // true

const slug2 = "Paket Starter"
console.log(isValidSlug(slug2)) // false - has spaces and uppercase

const slug3 = "paket@starter"
console.log(isValidSlug(slug3)) // false - has special characters
```

### Validate Before Creating

```typescript
import { isValidSlug, createUniqueSlug } from '@/lib/slug-utils'

async function createProductWithCustomSlug(name: string, customSlug?: string) {
  let finalSlug: string
  
  if (customSlug) {
    if (!isValidSlug(customSlug)) {
      throw new Error('Invalid slug format')
    }
    finalSlug = await generateUniqueSlug(customSlug, 'product')
  } else {
    finalSlug = await createUniqueSlug(name, 'product')
  }
  
  return prisma.product.create({
    data: {
      name,
      slug: finalSlug,
      // ... other fields
    }
  })
}
```

## URL Building Examples

### Build Various URLs

```typescript
import { 
  buildItemUrl, 
  buildCheckoutUrl, 
  buildAffiliateLink 
} from '@/lib/slug-utils'

// Product URLs
const productPage = buildItemUrl('product', 'paket-starter-export')
// "http://localhost:3000/products/paket-starter-export"

const productCheckout = buildCheckoutUrl('product', 'abc123')
// "http://localhost:3000/checkout?type=product&id=abc123"

const productAffiliate = buildAffiliateLink('dinda', 'product', 'paket-starter-export')
// "http://localhost:3000/go/dinda/paket-starter-export"

// Course URLs
const coursePage = buildItemUrl('course', 'dasar-ekspor')
const courseCheckout = buildCheckoutUrl('course', 'xyz789')
const courseAffiliate = buildAffiliateLink('dinda', 'course', 'dasar-ekspor')

// Membership URLs
const membershipPage = buildItemUrl('membership', 'vip')
const membershipCheckout = buildCheckoutUrl('membership', 'def456')
const membershipAffiliate = buildAffiliateLink('dinda', 'membership', 'vip')
```

### With Custom Base URL

```typescript
const productionUrl = buildItemUrl(
  'product', 
  'paket-starter', 
  'https://eksporyuk.com'
)
// "https://eksporyuk.com/products/paket-starter"
```

## Migration/Seeding Examples

### Add Slugs to Existing Data

```typescript
// scripts/add-slugs.ts
import { PrismaClient } from '@prisma/client'
import { createUniqueSlug } from '@/lib/slug-utils'

const prisma = new PrismaClient()

async function addSlugsToProducts() {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    }
  })
  
  for (const product of products) {
    const slug = await createUniqueSlug(product.name, 'product', product.id)
    
    await prisma.product.update({
      where: { id: product.id },
      data: { slug }
    })
    
    console.log(`✅ ${product.name} → ${slug}`)
  }
}

addSlugsToProducts()
```

## Best Practices

### 1. Always Generate Unique Slugs
✅ Good:
```typescript
const slug = await createUniqueSlug(name, 'product')
```

❌ Bad:
```typescript
const slug = generateSlug(name) // Might not be unique!
```

### 2. Handle Slug Updates Carefully
```typescript
// Only regenerate slug if name changes
if (name !== existingProduct.name) {
  slug = await createUniqueSlug(name, 'product', productId)
}
```

### 3. Use getBySlugOrId for Flexibility
```typescript
// Works with both slug and ID
const item = await getBySlugOrId(identifier, 'product')
```

### 4. Validate Custom Slugs
```typescript
if (customSlug && !isValidSlug(customSlug)) {
  throw new Error('Invalid slug format')
}
```

## TypeScript Types

```typescript
type ItemType = 'product' | 'course' | 'membership'

interface SlugOptions {
  existingId?: string
}

interface UrlOptions {
  baseUrl?: string
}
```

## Testing

### Unit Tests Example

```typescript
import { generateSlug, isValidSlug } from '@/lib/slug-utils'

describe('Slug Utils', () => {
  test('generateSlug converts text correctly', () => {
    expect(generateSlug('Paket Starter')).toBe('paket-starter')
    expect(generateSlug('BONUS: Test!')).toBe('bonus-test')
  })
  
  test('isValidSlug validates format', () => {
    expect(isValidSlug('valid-slug')).toBe(true)
    expect(isValidSlug('Invalid Slug')).toBe(false)
    expect(isValidSlug('invalid@slug')).toBe(false)
  })
})
```

---

**Last Updated**: November 21, 2024
