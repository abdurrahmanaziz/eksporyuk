/**
 * Test: Edit CTA Button Functionality
 * This script tests updating existing CTA buttons
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testEditCTA() {
  try {
    console.log('🧪 Testing Edit CTA Button Functionality...\n')

    // 1. Find first affiliate with CTAs
    const affiliate = await prisma.affiliateProfile.findFirst({
      include: {
        user: true,
        bioPage: {
          include: {
            ctaButtons: {
              orderBy: { displayOrder: 'asc' },
              take: 3
            }
          }
        }
      }
    })

    if (!affiliate?.bioPage?.ctaButtons?.length) {
      console.log('❌ No CTA buttons found to test')
      return
    }

    console.log(`✅ Found ${affiliate.bioPage.ctaButtons.length} CTA buttons\n`)

    // 2. Test editing first CTA (change style from button to card)
    const firstCTA = affiliate.bioPage.ctaButtons[0]
    console.log('📝 Test 1: Change Simple Button to Card')
    console.log(`   Before:`)
    console.log(`     Text: ${firstCTA.buttonText}`)
    console.log(`     Style: ${firstCTA.buttonStyle}`)
    console.log(`     Thumbnail: ${firstCTA.thumbnailUrl || 'none'}`)
    console.log(`     Price: ${firstCTA.price || 'none'}`)

    const updated1 = await prisma.affiliateBioCTA.update({
      where: { id: firstCTA.id },
      data: {
        buttonStyle: 'card',
        subtitle: 'Akses eksklusif ke semua fitur premium',
        thumbnailUrl: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=400',
        price: 'Rp 299.000',
        originalPrice: 'Rp 499.000',
        showPrice: true,
        showThumbnail: true
      }
    })

    console.log(`   After:`)
    console.log(`     Text: ${updated1.buttonText}`)
    console.log(`     Style: ${updated1.buttonStyle}`)
    console.log(`     Thumbnail: ${updated1.thumbnailUrl}`)
    console.log(`     Price: ${updated1.price}`)
    console.log(`     Show Thumbnail: ${updated1.showThumbnail}`)
    console.log(`     Show Price: ${updated1.showPrice}`)
    console.log('   ✅ SUCCESS!\n')

    // 3. Test editing second CTA (change card to card-horizontal)
    if (affiliate.bioPage.ctaButtons[1]) {
      const secondCTA = affiliate.bioPage.ctaButtons[1]
      console.log('📝 Test 2: Change Card to Card Horizontal')
      console.log(`   Before:`)
      console.log(`     Text: ${secondCTA.buttonText}`)
      console.log(`     Style: ${secondCTA.buttonStyle}`)

      const updated2 = await prisma.affiliateBioCTA.update({
        where: { id: secondCTA.id },
        data: {
          buttonStyle: 'card-horizontal',
          subtitle: 'Paket lengkap dengan bonus eksklusif'
        }
      })

      console.log(`   After:`)
      console.log(`     Text: ${updated2.buttonText}`)
      console.log(`     Style: ${updated2.buttonStyle}`)
      console.log(`     Subtitle: ${updated2.subtitle}`)
      console.log('   ✅ SUCCESS!\n')
    }

    // 4. Test editing third CTA (update price and colors)
    if (affiliate.bioPage.ctaButtons[2]) {
      const thirdCTA = affiliate.bioPage.ctaButtons[2]
      console.log('📝 Test 3: Update Price and Colors')
      console.log(`   Before:`)
      console.log(`     Price: ${thirdCTA.price || 'none'}`)
      console.log(`     BG Color: ${thirdCTA.backgroundColor}`)

      const updated3 = await prisma.affiliateBioCTA.update({
        where: { id: thirdCTA.id },
        data: {
          price: 'Rp 199.000',
          originalPrice: 'Rp 399.000',
          backgroundColor: '#EC4899',
          textColor: '#FFFFFF',
          showPrice: true
        }
      })

      console.log(`   After:`)
      console.log(`     Price: ${updated3.price}`)
      console.log(`     Original Price: ${updated3.originalPrice}`)
      console.log(`     BG Color: ${updated3.backgroundColor}`)
      console.log(`     Show Price: ${updated3.showPrice}`)
      console.log('   ✅ SUCCESS!\n')
    }

    // 5. Verify all updates
    const verifyAllCTAs = await prisma.affiliateBioCTA.findMany({
      where: { bioPageId: affiliate.bioPage.id },
      orderBy: { displayOrder: 'asc' }
    })

    console.log('📊 Final State of All CTAs:')
    verifyAllCTAs.forEach((cta, i) => {
      console.log(`\n   ${i + 1}. ${cta.buttonText}`)
      console.log(`      Style: ${cta.buttonStyle}`)
      console.log(`      Type: ${cta.buttonType}`)
      if (cta.subtitle) console.log(`      Subtitle: ${cta.subtitle}`)
      if (cta.thumbnailUrl) console.log(`      Image: ${cta.thumbnailUrl.substring(0, 50)}...`)
      if (cta.price) console.log(`      Price: ${cta.price}`)
      if (cta.originalPrice) console.log(`      Original: ${cta.originalPrice}`)
      console.log(`      Show Image: ${cta.showThumbnail}`)
      console.log(`      Show Price: ${cta.showPrice}`)
      console.log(`      Colors: BG ${cta.backgroundColor} / Text ${cta.textColor}`)
    })

    console.log('\n✅ All edit operations completed successfully!')
    console.log('\n💡 Next Steps:')
    console.log('   1. Visit /affiliate/bio in browser')
    console.log('   2. Click edit on any CTA button')
    console.log('   3. Change the style dropdown')
    console.log('   4. Update fields')
    console.log('   5. Click "Simpan"')
    console.log('   6. Verify changes saved correctly')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testEditCTA()
