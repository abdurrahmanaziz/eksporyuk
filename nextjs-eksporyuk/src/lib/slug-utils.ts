import { prisma } from '@/lib/prisma'

/**
 * Generate URL-friendly slug from text
 * 
 * @param text - The text to convert to slug
 * @returns URL-friendly slug
 * 
 * @example
 * generateSlug("Paket Starter Export") // "paket-starter-export"
 * generateSlug("BONUS: Marketing Digital!") // "bonus-marketing-digital"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending number if needed
 * 
 * @param baseSlug - The base slug to check
 * @param model - The Prisma model name ('product', 'course', 'membership')
 * @param existingId - Optional ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 * 
 * @example
 * await generateUniqueSlug("paket-starter", "product") // "paket-starter"
 * await generateUniqueSlug("paket-starter", "product") // "paket-starter-1" (if first exists)
 */
export async function generateUniqueSlug(
  baseSlug: string,
  model: 'product' | 'course' | 'membership',
  existingId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    // @ts-ignore - Dynamic model access
    const existing = await prisma[model].findFirst({
      where: {
        slug,
        ...(existingId ? { id: { not: existingId } } : {})
      }
    })
    
    if (!existing) {
      return slug
    }
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Generate and ensure unique slug from text
 * Combines generateSlug and generateUniqueSlug in one call
 * 
 * @param text - The text to convert to unique slug
 * @param model - The Prisma model name
 * @param existingId - Optional ID to exclude from uniqueness check
 * @returns Unique URL-friendly slug
 * 
 * @example
 * await createUniqueSlug("New Product Name", "product") // "new-product-name"
 */
export async function createUniqueSlug(
  text: string,
  model: 'product' | 'course' | 'membership',
  existingId?: string
): Promise<string> {
  const baseSlug = generateSlug(text)
  return generateUniqueSlug(baseSlug, model, existingId)
}

/**
 * Build full URLs for products, courses, memberships
 * 
 * @param type - Type of item
 * @param slug - The slug
 * @param baseUrl - Optional base URL (defaults to current domain)
 * @returns Full URL
 * 
 * @example
 * buildItemUrl("product", "paket-starter") // "https://domain.com/products/paket-starter"
 * buildItemUrl("course", "dasar-ekspor") // "https://domain.com/courses/dasar-ekspor"
 * buildItemUrl("membership", "vip") // "https://domain.com/membership/vip"
 */
export function buildItemUrl(
  type: 'product' | 'course' | 'membership',
  slug: string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const paths = {
    product: 'products',
    course: 'courses',
    membership: 'membership'
  }
  
  return `${base}/${paths[type]}/${slug}`
}

/**
 * Build checkout URL
 * 
 * @param type - Type of item
 * @param id - The item ID
 * @param baseUrl - Optional base URL
 * @returns Checkout URL
 * 
 * @example
 * buildCheckoutUrl("product", "abc123") // "https://domain.com/checkout?type=product&id=abc123"
 */
export function buildCheckoutUrl(
  type: 'product' | 'course' | 'membership',
  id: string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return `${base}/checkout?type=${type}&id=${id}`
}

/**
 * Build affiliate link with slug
 * 
 * @param affiliateCode - Affiliate code or shortLink
 * @param itemType - Type of item
 * @param itemSlug - The item slug
 * @param baseUrl - Optional base URL
 * @returns Affiliate link
 * 
 * @example
 * buildAffiliateLink("dinda", "product", "paket-starter") 
 * // "https://domain.com/go/dinda/paket-starter"
 */
export function buildAffiliateLink(
  affiliateCode: string,
  itemType: 'product' | 'course' | 'membership',
  itemSlug: string,
  baseUrl?: string
): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  return `${base}/go/${affiliateCode}/${itemSlug}`
}

/**
 * Validate slug format
 * 
 * @param slug - The slug to validate
 * @returns true if valid
 * 
 * @example
 * isValidSlug("paket-starter") // true
 * isValidSlug("Paket Starter") // false (has spaces and uppercase)
 * isValidSlug("paket@starter") // false (has special char)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Get item by slug with fallback to ID
 * 
 * @param identifier - Slug or ID
 * @param model - The Prisma model name
 * @returns Item or null
 * 
 * @example
 * await getBySlugOrId("paket-starter", "product")
 * await getBySlugOrId("abc123", "product") // Falls back to ID if not valid slug
 */
export async function getBySlugOrId<T>(
  identifier: string,
  model: 'product' | 'course' | 'membership'
): Promise<T | null> {
  const isSlug = isValidSlug(identifier)
  
  // @ts-ignore - Dynamic model access
  return prisma[model].findFirst({
    where: isSlug 
      ? { slug: identifier }
      : { id: identifier }
  })
}
