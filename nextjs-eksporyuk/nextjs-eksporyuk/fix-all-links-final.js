const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function generateUniqueSlug(baseSlug, model, existingId = null) {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
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

async function fixMissingMembershipSlugs() {
  console.log('\n🔍 Checking memberships without slug...')
  
  const memberships = await prisma.membership.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    }
  })
  
  console.log(`Found ${memberships.length} memberships without slug`)
  
  for (const membership of memberships) {
    const baseSlug = generateSlug(membership.name)
    const uniqueSlug = await generateUniqueSlug(baseSlug, 'membership', membership.id)
    
    await prisma.membership.update({
      where: { id: membership.id },
      data: { slug: uniqueSlug }
    })
    
    console.log(`✅ Membership: "${membership.name}" → ${uniqueSlug}`)
  }
  
  console.log(`\n✨ Updated ${memberships.length} memberships`)
}

async function main() {
  try {
    await fixMissingMembershipSlugs()
    
    // Show final summary
    console.log('\n' + '='.repeat(70))
    console.log('📋 FINAL COMPLETE SUMMARY')
    console.log('='.repeat(70))
    
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, salesPageUrl: true, price: true }
    })
    
    console.log('\n🛍️  PRODUCTS (' + products.length + ')')
    console.log('-'.repeat(70))
    products.forEach(p => {
      console.log(`\n📦 ${p.name}`)
      console.log(`   Price: Rp ${p.price.toLocaleString('id-ID')}`)
      console.log(`   Slug: ${p.slug}`)
      console.log(`   Internal: /products/${p.slug}`)
      console.log(`   Checkout: /checkout?type=product&id=${p.id}`)
      if (p.salesPageUrl) {
        console.log(`   Salespage: ${p.salesPageUrl}`)
      }
    })
    
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, slug: true, price: true }
    })
    
    console.log('\n\n📚 COURSES (' + courses.length + ')')
    console.log('-'.repeat(70))
    courses.forEach(c => {
      console.log(`\n🎓 ${c.title}`)
      console.log(`   Price: Rp ${c.price.toLocaleString('id-ID')}`)
      console.log(`   Slug: ${c.slug}`)
      console.log(`   Internal: /courses/${c.slug}`)
      console.log(`   Checkout: /checkout?type=course&id=${c.id}`)
    })
    
    const memberships = await prisma.membership.findMany({
      select: { id: true, name: true, slug: true, salesPageUrl: true, price: true }
    })
    
    console.log('\n\n💎 MEMBERSHIPS (' + memberships.length + ')')
    console.log('-'.repeat(70))
    memberships.forEach(m => {
      console.log(`\n👑 ${m.name}`)
      console.log(`   Price: Rp ${m.price.toLocaleString('id-ID')}`)
      console.log(`   Slug: ${m.slug}`)
      console.log(`   Internal: /membership/${m.slug}`)
      console.log(`   Checkout: /checkout?type=membership&id=${m.id}`)
      if (m.salesPageUrl) {
        console.log(`   Salespage: ${m.salesPageUrl}`)
      }
    })
    
    console.log('\n' + '='.repeat(70))
    console.log('✅ ALL DONE! Summary:')
    console.log(`   - Products: ${products.length} (${products.length} with slug)`)
    console.log(`   - Courses: ${courses.length} (${courses.length} with slug)`)
    console.log(`   - Memberships: ${memberships.length} (${memberships.length} with slug)`)
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
