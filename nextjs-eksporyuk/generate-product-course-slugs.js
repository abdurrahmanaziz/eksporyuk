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

async function generateProductSlugs() {
  console.log('\n🔍 Checking Products...')
  
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    }
  })
  
  console.log(`Found ${products.length} products without slug`)
  
  for (const product of products) {
    const baseSlug = generateSlug(product.name)
    const uniqueSlug = await generateUniqueSlug(baseSlug, 'product', product.id)
    
    await prisma.product.update({
      where: { id: product.id },
      data: { slug: uniqueSlug }
    })
    
    console.log(`✅ Product: "${product.name}" → ${uniqueSlug}`)
  }
  
  console.log(`\n✨ Updated ${products.length} products`)
}

async function generateCourseSlugs() {
  console.log('\n🔍 Checking Courses...')
  
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    }
  })
  
  console.log(`Found ${courses.length} courses without slug`)
  
  for (const course of courses) {
    const baseSlug = generateSlug(course.title)
    const uniqueSlug = await generateUniqueSlug(baseSlug, 'course', course.id)
    
    await prisma.course.update({
      where: { id: course.id },
      data: { slug: uniqueSlug }
    })
    
    console.log(`✅ Course: "${course.title}" → ${uniqueSlug}`)
  }
  
  console.log(`\n✨ Updated ${courses.length} courses`)
}

async function showAllLinks() {
  console.log('\n' + '='.repeat(70))
  console.log('📋 SUMMARY OF ALL LINKS')
  console.log('='.repeat(70))
  
  // Products
  const products = await prisma.product.findMany({
    where: { slug: { not: null } },
    select: { id: true, name: true, slug: true, salesPageUrl: true }
  })
  
  console.log('\n🛍️  PRODUCTS (' + products.length + ')')
  console.log('-'.repeat(70))
  products.forEach(p => {
    console.log(`\n📦 ${p.name}`)
    console.log(`   Slug: ${p.slug}`)
    console.log(`   Internal: /products/${p.slug}`)
    console.log(`   Checkout: /checkout?type=product&id=${p.id}`)
    if (p.salesPageUrl) {
      console.log(`   Salespage: ${p.salesPageUrl}`)
    }
  })
  
  // Courses
  const courses = await prisma.course.findMany({
    where: { slug: { not: null } },
    select: { id: true, title: true, slug: true }
  })
  
  console.log('\n\n📚 COURSES (' + courses.length + ')')
  console.log('-'.repeat(70))
  courses.forEach(c => {
    console.log(`\n🎓 ${c.title}`)
    console.log(`   Slug: ${c.slug}`)
    console.log(`   Internal: /courses/${c.slug}`)
    console.log(`   Checkout: /checkout?type=course&id=${c.id}`)
  })
  
  // Memberships
  const memberships = await prisma.membership.findMany({
    where: { slug: { not: null } },
    select: { id: true, name: true, slug: true, salesPageUrl: true }
  })
  
  console.log('\n\n💎 MEMBERSHIPS (' + memberships.length + ')')
  console.log('-'.repeat(70))
  memberships.forEach(m => {
    console.log(`\n👑 ${m.name}`)
    console.log(`   Slug: ${m.slug}`)
    console.log(`   Internal: /membership/${m.slug}`)
    console.log(`   Checkout: /checkout?type=membership&id=${m.id}`)
    if (m.salesPageUrl) {
      console.log(`   Salespage: ${m.salesPageUrl}`)
    }
  })
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ Total Links Generated:')
  console.log(`   - Products: ${products.length}`)
  console.log(`   - Courses: ${courses.length}`)
  console.log(`   - Memberships: ${memberships.length}`)
  console.log('='.repeat(70) + '\n')
}

async function main() {
  try {
    console.log('🚀 Generating slugs for Products and Courses...')
    
    await generateProductSlugs()
    await generateCourseSlugs()
    
    await showAllLinks()
    
    console.log('✅ All done! Slugs have been generated successfully.\n')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
