const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Check existing products and add sample if needed
 */
async function checkAndCreateProducts() {
  console.log('\n🔍 Checking existing products...')
  
  const existingProducts = await prisma.product.findMany()
  console.log(`Found ${existingProducts.length} existing products`)
  
  if (existingProducts.length > 0) {
    console.log('\n✅ Products already exist:')
    existingProducts.forEach(p => {
      console.log(`   - ${p.name} (${p.slug || 'NO SLUG'})`)
    })
    return
  }
  
  console.log('\n📦 Creating sample products...')
  
  // Get an admin user to be the creator
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })
  
  if (!adminUser) {
    console.log('❌ No admin user found. Please create an admin user first.')
    return
  }
  
  const sampleProducts = [
    {
      name: 'Paket Starter Export',
      slug: 'paket-starter-export',
      description: 'Paket lengkap untuk memulai bisnis ekspor dari nol. Termasuk template dokumen ekspor, akses ke database buyer, dan konsultasi 1-on-1.',
      shortDescription: 'Starter pack untuk pemula ekspor',
      price: 1500000,
      originalPrice: 2500000,
      category: 'Export Package',
      salesPageUrl: 'https://kelaseksporyuk.com/paket-starter',
      isActive: true,
      isFeatured: true,
      creatorId: adminUser.id,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 30,
    },
    {
      name: 'Template Dokumen Ekspor Lengkap',
      slug: 'template-dokumen-ekspor',
      description: 'Kumpulan template dokumen ekspor yang lengkap dan siap pakai: Invoice, Packing List, Bill of Lading, Certificate of Origin, dan lainnya.',
      shortDescription: 'Template dokumen ekspor profesional',
      price: 500000,
      originalPrice: 750000,
      category: 'Templates',
      salesPageUrl: 'https://kelaseksporyuk.com/template-dokumen',
      isActive: true,
      creatorId: adminUser.id,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 25,
    },
    {
      name: 'Database Buyer Premium',
      slug: 'database-buyer-premium',
      description: 'Akses lifetime ke database buyer internasional dengan informasi kontak terverifikasi. Update rutin setiap bulan dengan buyer baru.',
      shortDescription: 'Database buyer internasional terverifikasi',
      price: 2000000,
      originalPrice: 3000000,
      category: 'Database',
      salesPageUrl: 'https://kelaseksporyuk.com/database-buyer',
      isActive: true,
      isFeatured: true,
      creatorId: adminUser.id,
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 35,
    },
  ]
  
  for (const productData of sampleProducts) {
    const product = await prisma.product.create({
      data: productData
    })
    console.log(`✅ Created: ${product.name} → ${product.slug}`)
  }
  
  console.log(`\n✨ Created ${sampleProducts.length} sample products`)
}

async function main() {
  try {
    await checkAndCreateProducts()
    
    // Show all links
    console.log('\n' + '='.repeat(70))
    console.log('📋 FINAL SUMMARY - ALL LINKS')
    console.log('='.repeat(70))
    
    const products = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, salesPageUrl: true, price: true }
    })
    
    console.log('\n🛍️  PRODUCTS (' + products.length + ')')
    console.log('-'.repeat(70))
    if (products.length === 0) {
      console.log('   No products found.')
    } else {
      products.forEach(p => {
        console.log(`\n📦 ${p.name}`)
        console.log(`   Price: Rp ${p.price.toLocaleString('id-ID')}`)
        console.log(`   Slug: ${p.slug || 'NO SLUG'}`)
        if (p.slug) {
          console.log(`   Internal: /products/${p.slug}`)
          console.log(`   Checkout: /checkout?type=product&id=${p.id}`)
        }
        if (p.salesPageUrl) {
          console.log(`   Salespage: ${p.salesPageUrl}`)
        }
      })
    }
    
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, slug: true, price: true }
    })
    
    console.log('\n\n📚 COURSES (' + courses.length + ')')
    console.log('-'.repeat(70))
    courses.forEach(c => {
      console.log(`\n🎓 ${c.title}`)
      console.log(`   Price: Rp ${c.price.toLocaleString('id-ID')}`)
      console.log(`   Slug: ${c.slug || 'NO SLUG'}`)
      if (c.slug) {
        console.log(`   Internal: /courses/${c.slug}`)
        console.log(`   Checkout: /checkout?type=course&id=${c.id}`)
      }
    })
    
    const memberships = await prisma.membership.findMany({
      select: { id: true, name: true, slug: true, salesPageUrl: true, price: true }
    })
    
    console.log('\n\n💎 MEMBERSHIPS (' + memberships.length + ')')
    console.log('-'.repeat(70))
    memberships.forEach(m => {
      console.log(`\n👑 ${m.name}`)
      console.log(`   Price: Rp ${m.price.toLocaleString('id-ID')}`)
      console.log(`   Slug: ${m.slug || 'NO SLUG'}`)
      if (m.slug) {
        console.log(`   Internal: /membership/${m.slug}`)
        console.log(`   Checkout: /checkout?type=membership&id=${m.id}`)
      }
      if (m.salesPageUrl) {
        console.log(`   Salespage: ${m.salesPageUrl}`)
      }
    })
    
    console.log('\n' + '='.repeat(70))
    console.log('✅ Summary:')
    console.log(`   - Products: ${products.length}`)
    console.log(`   - Courses: ${courses.length}`)
    console.log(`   - Memberships: ${memberships.length}`)
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
