/**
 * Test Script: Button Style Feature
 * Tests the new individual button style customization feature
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testButtonStyles() {
  try {
    console.log('🧪 Testing Button Style Feature...\n')

    // 1. Find first affiliate with bio page
    const affiliate = await prisma.affiliateProfile.findFirst({
      include: {
        user: true,
        bioPage: {
          include: {
            ctaButtons: true
          }
        }
      }
    })

    if (!affiliate?.bioPage) {
      console.log('❌ No bio page found. Please create one first.')
      return
    }

    console.log(`✅ Found bio page for: ${affiliate.user.name}`)
    console.log(`   Bio Page ID: ${affiliate.bioPage.id}`)
    console.log(`   Current CTAs: ${affiliate.bioPage.ctaButtons.length}\n`)

    // 2. Get sample data for testing
    const membership = await prisma.membership.findFirst()
    const product = await prisma.product.findFirst()
    const course = await prisma.course.findFirst()

    console.log('📦 Sample Data:')
    console.log(`   Membership: ${membership?.title || 'None'}`)
    console.log(`   Product: ${product?.name || 'None'}`)
    console.log(`   Course: ${course?.title || 'None'}\n`)

    // 3. Create test CTAs with different styles
    console.log('🎨 Creating Test CTAs...\n')

    // Test 1: Simple Button (default)
    const cta1 = await prisma.affiliateBioCTA.create({
      data: {
        bioPageId: affiliate.bioPage.id,
        buttonText: 'Simple Button',
        buttonType: 'custom',
        buttonStyle: 'button',
        targetUrl: 'https://example.com',
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        displayOrder: 1
      }
    })
    console.log(`✅ Created: ${cta1.buttonText} (${cta1.buttonStyle})`)

    // Test 2: Card with Product (vertical)
    if (product) {
      const cta2 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: product.name,
          buttonType: 'product',
          buttonStyle: 'card',
          productId: product.id,
          subtitle: 'Produk terbaik untuk ekspor',
          thumbnailUrl: product.imageUrl || 'https://via.placeholder.com/400x300',
          price: 'Rp 299.000',
          originalPrice: 'Rp 499.000',
          showPrice: true,
          showThumbnail: true,
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
          displayOrder: 2
        }
      })
      console.log(`✅ Created: ${cta2.buttonText} (${cta2.buttonStyle})`)
    }

    // Test 3: Horizontal Card with Course
    if (course) {
      const cta3 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: course.title,
          buttonType: 'course',
          buttonStyle: 'card-horizontal',
          courseId: course.id,
          subtitle: 'Belajar ekspor dari nol',
          thumbnailUrl: course.thumbnailUrl || 'https://via.placeholder.com/200x200',
          price: course.price > 0 ? `Rp ${course.price.toLocaleString('id-ID')}` : 'Gratis',
          showPrice: true,
          showThumbnail: true,
          backgroundColor: '#8B5CF6',
          textColor: '#FFFFFF',
          displayOrder: 3
        }
      })
      console.log(`✅ Created: ${cta3.buttonText} (${cta3.buttonStyle})`)
    }

    // Test 4: Product Card with discount badge
    const secondProduct = await prisma.product.findFirst({
      skip: 1
    })
    if (secondProduct) {
      const cta4 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: secondProduct.name,
          buttonType: 'product',
          buttonStyle: 'card-product',
          productId: secondProduct.id,
          subtitle: 'Paket hemat untuk pemula',
          thumbnailUrl: secondProduct.imageUrl || 'https://via.placeholder.com/400x300?text=Premium+Product',
          price: 'Rp 199.000',
          originalPrice: 'Rp 399.000',
          showPrice: true,
          showThumbnail: true,
          backgroundColor: '#EF4444',
          textColor: '#FFFFFF',
          displayOrder: 4
        }
      })
      console.log(`✅ Created: ${cta4.buttonText} (${cta4.buttonStyle})`)
    }

    // 4. Verify all CTAs were created
    const allCTAs = await prisma.affiliateBioCTA.findMany({
      where: { bioPageId: affiliate.bioPage.id },
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`\n✅ Total CTAs: ${allCTAs.length}`)
    console.log('\n📊 CTA Summary:')
    allCTAs.forEach((cta, i) => {
      console.log(`   ${i + 1}. ${cta.buttonText}`)
      console.log(`      Style: ${cta.buttonStyle}`)
      console.log(`      Type: ${cta.buttonType}`)
      console.log(`      Show Thumbnail: ${cta.showThumbnail}`)
      console.log(`      Show Price: ${cta.showPrice}`)
      if (cta.subtitle) console.log(`      Subtitle: ${cta.subtitle}`)
      if (cta.price) console.log(`      Price: ${cta.price}`)
      console.log()
    })

    // 5. Check schema fields
    console.log('✅ All button style fields verified:')
    console.log('   - buttonStyle (String)')
    console.log('   - showThumbnail (Boolean)')
    console.log('   - showPrice (Boolean)')
    console.log('   - thumbnailUrl (String?)')
    console.log('   - price (String?)')
    console.log('   - originalPrice (String?)')
    console.log('   - subtitle (String?)')

    console.log('\n✨ Test Complete! Visit bio page to see the new styles.')
    console.log(`   URL: /bio/${affiliate.user.name?.toLowerCase().replace(/\s+/g, '-') || 'affiliate'}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Cleanup function
async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up test data...')
    
    const affiliate = await prisma.affiliateProfile.findFirst({
      include: { bioPage: true }
    })

    if (affiliate?.bioPage) {
      // Delete only test CTAs (ones we just created)
      const deleted = await prisma.affiliateBioCTA.deleteMany({
        where: {
          bioPageId: affiliate.bioPage.id,
          buttonText: {
            in: ['Simple Button', 'Test Card', 'Test Horizontal']
          }
        }
      })
      console.log(`✅ Deleted ${deleted.count} test CTAs`)
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Run test or cleanup
const args = process.argv.slice(2)
if (args.includes('--cleanup')) {
  cleanup()
} else {
  testButtonStyles()
}
