/**
 * Update Sample CTA Buttons with Different Styles
 * This script updates existing CTA buttons to use different card styles
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateSampleButtons() {
  try {
    console.log('🎨 Updating Sample CTA Buttons with Different Styles...\n')

    // 1. Find first affiliate with bio page
    const affiliate = await prisma.affiliateProfile.findFirst({
      include: {
        user: true,
        bioPage: {
          include: {
            ctaButtons: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    })

    if (!affiliate?.bioPage) {
      console.log('❌ No bio page found')
      return
    }

    console.log(`✅ Found bio page for: ${affiliate.user.name}`)
    console.log(`   Current CTAs: ${affiliate.bioPage.ctaButtons.length}\n`)

    // 2. Delete old test buttons first
    await prisma.affiliateBioCTA.deleteMany({
      where: {
        bioPageId: affiliate.bioPage.id
      }
    })
    console.log('🗑️  Cleared existing CTAs\n')

    // 3. Get sample data
    const product1 = await prisma.product.findFirst()
    const product2 = await prisma.product.findFirst({ skip: 1 })
    const course = await prisma.course.findFirst()
    const event = await prisma.event.findFirst()
    const membership = await prisma.membership.findFirst()

    // 4. Create diverse CTA buttons
    const sampleCTAs = []

    // CTA 1: Simple Button (Default)
    if (membership) {
      const cta1 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: membership.name,
          buttonType: 'membership',
          buttonStyle: 'button',
          membershipId: membership.id,
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
          displayOrder: 1
        }
      })
      sampleCTAs.push(cta1)
      console.log(`✅ Created: ${cta1.buttonText} (style: button)`)
    }

    // CTA 2: Card Vertikal with Product
    if (product1) {
      const cta2 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: product1.name,
          buttonType: 'product',
          buttonStyle: 'card',
          productId: product1.id,
          subtitle: product1.shortDescription?.substring(0, 100) || 'Produk berkualitas untuk kebutuhan ekspor Anda',
          thumbnailUrl: product1.thumbnail || 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400',
          price: `Rp ${product1.price?.toLocaleString('id-ID')}`,
          originalPrice: `Rp ${(product1.price * 1.5).toLocaleString('id-ID')}`,
          showPrice: true,
          showThumbnail: true,
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
          displayOrder: 2
        }
      })
      sampleCTAs.push(cta2)
      console.log(`✅ Created: ${cta2.buttonText} (style: card)`)
    }

    // CTA 3: Card Horizontal with Course
    if (course) {
      const cta3 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: course.title,
          buttonType: 'course',
          buttonStyle: 'card-horizontal',
          courseId: course.id,
          subtitle: course.description?.substring(0, 100) || 'Belajar ekspor dari nol hingga mahir',
          thumbnailUrl: course.thumbnail || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400',
          price: course.price > 0 ? `Rp ${course.price.toLocaleString('id-ID')}` : 'Gratis',
          showPrice: true,
          showThumbnail: true,
          backgroundColor: '#8B5CF6',
          textColor: '#FFFFFF',
          displayOrder: 3
        }
      })
      sampleCTAs.push(cta3)
      console.log(`✅ Created: ${cta3.buttonText} (style: card-horizontal)`)
    }

    // CTA 4: Card Product with Discount
    if (product2) {
      const cta4 = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: affiliate.bioPage.id,
          buttonText: product2.name,
          buttonType: 'product',
          buttonStyle: 'card-product',
          productId: product2.id,
          subtitle: product2.shortDescription?.substring(0, 100) || 'Paket hemat untuk pemula eksportir',
          thumbnailUrl: product2.thumbnail || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
          price: `Rp ${product2.price?.toLocaleString('id-ID')}`,
          originalPrice: `Rp ${(product2.price * 2).toLocaleString('id-ID')}`,
          showPrice: true,
          showThumbnail: true,
          backgroundColor: '#EF4444',
          textColor: '#FFFFFF',
          displayOrder: 4
        }
      })
      sampleCTAs.push(cta4)
      console.log(`✅ Created: ${cta4.buttonText} (style: card-product)`)
    }

    // CTA 5: Card Vertikal without linking (custom URL style)
    const cta5 = await prisma.affiliateBioCTA.create({
      data: {
        bioPageId: affiliate.bioPage.id,
        buttonText: 'Webinar Ekspor Premium',
        buttonType: 'custom',
        buttonStyle: 'card',
        targetUrl: 'https://eksporyuk.com/webinar',
        subtitle: 'Webinar eksklusif: Cara Mencari Buyer Internasional',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
        price: 'Rp 99.000',
        showPrice: true,
        showThumbnail: true,
        backgroundColor: '#F59E0B',
        textColor: '#FFFFFF',
        displayOrder: 5
      }
    })
    sampleCTAs.push(cta5)
    console.log(`✅ Created: ${cta5.buttonText} (style: card)`)

    // CTA 6: Simple Button Custom URL
    const cta6 = await prisma.affiliateBioCTA.create({
      data: {
        bioPageId: affiliate.bioPage.id,
        buttonText: 'Download Template Gratis',
        buttonType: 'custom',
        buttonStyle: 'button',
        targetUrl: 'https://eksporyuk.com/download',
        backgroundColor: '#6366F1',
        textColor: '#FFFFFF',
        displayOrder: 6
      }
    })
    sampleCTAs.push(cta6)
    console.log(`✅ Created: ${cta6.buttonText} (style: button)`)

    // CTA 7: Card Horizontal Custom
    const cta7 = await prisma.affiliateBioCTA.create({
      data: {
        bioPageId: affiliate.bioPage.id,
        buttonText: 'Konsultasi Gratis 1-on-1',
        buttonType: 'custom',
        buttonStyle: 'card-horizontal',
        targetUrl: 'https://wa.me/628123456789',
        subtitle: 'Jadwalkan sesi konsultasi gratis dengan expert kami',
        thumbnailUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=400',
        showThumbnail: true,
        backgroundColor: '#14B8A6',
        textColor: '#FFFFFF',
        displayOrder: 7
      }
    })
    sampleCTAs.push(cta7)
    console.log(`✅ Created: ${cta7.buttonText} (style: card-horizontal)`)

    console.log(`\n✅ Created ${sampleCTAs.length} diverse CTA buttons!`)
    
    // 5. Summary
    console.log('\n📊 Style Distribution:')
    const styleCount = {
      button: sampleCTAs.filter(c => c.buttonStyle === 'button').length,
      card: sampleCTAs.filter(c => c.buttonStyle === 'card').length,
      'card-horizontal': sampleCTAs.filter(c => c.buttonStyle === 'card-horizontal').length,
      'card-product': sampleCTAs.filter(c => c.buttonStyle === 'card-product').length
    }
    console.log(`   Simple Button: ${styleCount.button}`)
    console.log(`   Card Vertikal: ${styleCount.card}`)
    console.log(`   Card Horizontal: ${styleCount['card-horizontal']}`)
    console.log(`   Card Product: ${styleCount['card-product']}`)

    console.log('\n✨ Sample buttons created successfully!')
    console.log(`\n🌐 Visit: /bio/${affiliate.user.name?.toLowerCase().replace(/\s+/g, '-') || 'demo-affiliate'}`)
    console.log('\n💡 Now you can test editing these buttons in /affiliate/bio')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSampleButtons()
