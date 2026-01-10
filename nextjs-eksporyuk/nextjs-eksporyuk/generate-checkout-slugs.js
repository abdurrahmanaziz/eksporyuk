const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateCheckoutSlug(name) {
  const baseSlug = generateSlug(name)
  return `beli-${baseSlug}`
}

async function generateCheckoutSlugs() {
  console.log('🔄 Generating checkout slugs for memberships, products, and courses...\n')

  try {
    // Memberships
    const memberships = await prisma.membership.findMany({
      where: {
        OR: [
          { checkoutSlug: null },
          { checkoutSlug: '' }
        ]
      }
    })

    console.log(`📦 Found ${memberships.length} memberships without checkout slug`)

    for (const membership of memberships) {
      const checkoutSlug = generateCheckoutSlug(membership.name)
      
      try {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { 
            checkoutSlug,
            // Also generate slug if missing
            ...((!membership.slug || membership.slug === '') && { 
              slug: generateSlug(membership.name) 
            })
          }
        })
        console.log(`  ✅ ${membership.name} → ${checkoutSlug}`)
      } catch (err) {
        console.log(`  ⚠️  ${membership.name} → ${checkoutSlug} (slug exists, trying with ID)`)
        // If slug exists, append ID
        const uniqueSlug = `${checkoutSlug}-${membership.id.slice(-6)}`
        await prisma.membership.update({
          where: { id: membership.id },
          data: { 
            checkoutSlug: uniqueSlug,
            ...((!membership.slug || membership.slug === '') && { 
              slug: `${generateSlug(membership.name)}-${membership.id.slice(-6)}` 
            })
          }
        })
        console.log(`  ✅ ${membership.name} → ${uniqueSlug}`)
      }
    }

    // Products
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { checkoutSlug: null },
          { checkoutSlug: '' }
        ]
      }
    })

    console.log(`\n📦 Found ${products.length} products without checkout slug`)

    for (const product of products) {
      const checkoutSlug = generateCheckoutSlug(product.name)
      
      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            checkoutSlug,
            ...((!product.slug || product.slug === '') && { 
              slug: generateSlug(product.name) 
            })
          }
        })
        console.log(`  ✅ ${product.name} → ${checkoutSlug}`)
      } catch (err) {
        const uniqueSlug = `${checkoutSlug}-${product.id.slice(-6)}`
        await prisma.product.update({
          where: { id: product.id },
          data: { 
            checkoutSlug: uniqueSlug,
            ...((!product.slug || product.slug === '') && { 
              slug: `${generateSlug(product.name)}-${product.id.slice(-6)}` 
            })
          }
        })
        console.log(`  ✅ ${product.name} → ${uniqueSlug}`)
      }
    }

    // Courses
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { checkoutSlug: null },
          { checkoutSlug: '' }
        ]
      }
    })

    console.log(`\n📦 Found ${courses.length} courses without checkout slug`)

    for (const course of courses) {
      const checkoutSlug = generateCheckoutSlug(course.title)
      
      try {
        await prisma.course.update({
          where: { id: course.id },
          data: { 
            checkoutSlug,
            ...((!course.slug || course.slug === '') && { 
              slug: generateSlug(course.title) 
            })
          }
        })
        console.log(`  ✅ ${course.title} → ${checkoutSlug}`)
      } catch (err) {
        const uniqueSlug = `${checkoutSlug}-${course.id.slice(-6)}`
        await prisma.course.update({
          where: { id: course.id },
          data: { 
            checkoutSlug: uniqueSlug,
            ...((!course.slug || course.slug === '') && { 
              slug: `${generateSlug(course.title)}-${course.id.slice(-6)}` 
            })
          }
        })
        console.log(`  ✅ ${course.title} → ${uniqueSlug}`)
      }
    }

    console.log('\n✅ All checkout slugs generated successfully!')
  } catch (error) {
    console.error('❌ Error generating checkout slugs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateCheckoutSlugs()
