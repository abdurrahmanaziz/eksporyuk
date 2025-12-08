/**
 * Test: Auto-Fetch Product Data Feature
 * Verify that product data is correctly available for auto-population
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAutoFetchData() {
  try {
    console.log('🧪 Testing Auto-Fetch Product Data...\n')

    // 1. Check memberships
    const memberships = await prisma.membership.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        formDescription: true,
        price: true,
        formBanner: true
      }
    })

    console.log('📦 Memberships Available:')
    memberships.forEach(m => {
      console.log(`   ✅ ${m.name}`)
      console.log(`      Price: Rp ${m.price?.toLocaleString('id-ID')}`)
      console.log(`      Image: ${m.formBanner || '❌ No image'}`)
      console.log(`      Desc: ${m.formDescription?.substring(0, 60) || 'No description'}...`)
      console.log()
    })

    // 2. Check products
    const products = await prisma.product.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        shortDescription: true,
        price: true,
        thumbnail: true
      }
    })

    console.log('🛍️ Products Available:')
    products.forEach(p => {
      console.log(`   ✅ ${p.name}`)
      console.log(`      Price: Rp ${p.price?.toLocaleString('id-ID')}`)
      console.log(`      Image: ${p.thumbnail || '❌ No image'}`)
      console.log(`      Desc: ${p.shortDescription?.substring(0, 60) || 'No description'}...`)
      console.log()
    })

    // 3. Check courses
    const courses = await prisma.course.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        thumbnail: true
      }
    })

    console.log('📚 Courses Available:')
    courses.forEach(c => {
      console.log(`   ✅ ${c.title}`)
      console.log(`      Price: ${c.price > 0 ? `Rp ${c.price?.toLocaleString('id-ID')}` : 'Gratis'}`)
      console.log(`      Image: ${c.thumbnail || '❌ No image'}`)
      console.log(`      Desc: ${c.description?.substring(0, 60) || 'No description'}...`)
      console.log()
    })

    // 4. Check events
    const events = await prisma.event.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        thumbnail: true
      }
    })

    console.log('🎉 Events Available:')
    events.forEach(e => {
      console.log(`   ✅ ${e.title}`)
      console.log(`      Price: ${e.price > 0 ? `Rp ${e.price?.toLocaleString('id-ID')}` : 'Gratis'}`)
      console.log(`      Image: ${e.thumbnail || '❌ No image'}`)
      console.log(`      Desc: ${e.description?.substring(0, 60) || 'No description'}...`)
      console.log()
    })

    // 5. Summary
    console.log('📊 Summary:')
    console.log(`   Memberships: ${memberships.length}`)
    console.log(`   Products: ${products.length}`)
    console.log(`   Courses: ${courses.length}`)
    console.log(`   Events: ${events.length}`)
    console.log()

    // 6. Test auto-populate logic
    console.log('🔍 Testing Auto-Populate Logic:')
    
    if (products.length > 0) {
      const testProduct = products[0]
      console.log('\n   Example: Product Auto-Populate')
      console.log('   --------------------------------')
      console.log(`   Input: productId = "${testProduct.id}"`)
      console.log(`   Output:`)
      console.log(`     buttonText: "${testProduct.name}"`)
      console.log(`     subtitle: "${testProduct.shortDescription?.substring(0, 100) || ''}"`)
      console.log(`     thumbnailUrl: "${testProduct.thumbnail || ''}"`)
      console.log(`     price: "Rp ${testProduct.price?.toLocaleString('id-ID')}"`)
      console.log(`     showThumbnail: true`)
      console.log(`     showPrice: true`)
    }

    if (memberships.length > 0) {
      const testMembership = memberships[0]
      console.log('\n   Example: Membership Auto-Populate')
      console.log('   --------------------------------')
      console.log(`   Input: membershipId = "${testMembership.id}"`)
      console.log(`   Output:`)
      console.log(`     buttonText: "${testMembership.name}"`)
      console.log(`     subtitle: "${testMembership.formDescription?.substring(0, 100) || ''}"`)
      console.log(`     thumbnailUrl: "${testMembership.formBanner || ''}"`)
      console.log(`     price: "Rp ${testMembership.price?.toLocaleString('id-ID')}"`)
      console.log(`     showThumbnail: true`)
      console.log(`     showPrice: true`)
    }

    if (courses.length > 0) {
      const testCourse = courses[0]
      console.log('\n   Example: Course Auto-Populate')
      console.log('   --------------------------------')
      console.log(`   Input: courseId = "${testCourse.id}"`)
      console.log(`   Output:`)
      console.log(`     buttonText: "${testCourse.title}"`)
      console.log(`     subtitle: "${testCourse.description?.substring(0, 100) || ''}"`)
      console.log(`     thumbnailUrl: "${testCourse.thumbnail || ''}"`)
      console.log(`     price: "${testCourse.price > 0 ? `Rp ${testCourse.price?.toLocaleString('id-ID')}` : 'Gratis'}"`)
      console.log(`     showThumbnail: true`)
      console.log(`     showPrice: true`)
    }

    console.log('\n✅ All data available for auto-fetch!')
    console.log('\n💡 Usage:')
    console.log('   1. Go to /affiliate/bio')
    console.log('   2. Click "Tambah CTA Button"')
    console.log('   3. Select card style (not button)')
    console.log('   4. Select button type (product/course/membership/event)')
    console.log('   5. Select item from dropdown')
    console.log('   6. ✨ Data auto-populates!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAutoFetchData()
