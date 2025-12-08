/**
 * Test Optin Form Display Modes
 * Memverifikasi bahwa optin form bisa ditampilkan sebagai:
 * 1. Button/Modal - klik button untuk buka popup
 * 2. Inline/Embed - form langsung tampil di bio page
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testOptinDisplayModes() {
  console.log('🧪 Testing Optin Form Display Modes...\n')

  try {
    // 1. Find demo affiliate
    const demoUser = await prisma.user.findFirst({
      where: { username: 'demoaffiliate' },
      include: {
        affiliateProfile: {
          include: {
            bioPage: true,
            optinForms: { where: { isActive: true }, take: 1 }
          }
        }
      }
    })

    if (!demoUser?.affiliateProfile?.bioPage || !demoUser.affiliateProfile.optinForms[0]) {
      console.log('❌ Missing required data')
      return
    }

    const bioPage = demoUser.affiliateProfile.bioPage
    const optinForm = demoUser.affiliateProfile.optinForms[0]

    console.log(`✅ Found bio page: ${bioPage.id}`)
    console.log(`✅ Found optin form: ${optinForm.formName}\n`)

    // 2. Create/Update Button Mode CTA
    console.log('1️⃣ Creating CTA with BUTTON mode...')
    let buttonCTA = await prisma.affiliateBioCTA.findFirst({
      where: {
        bioPageId: bioPage.id,
        buttonText: 'Test Button Mode'
      }
    })

    if (buttonCTA) {
      buttonCTA = await prisma.affiliateBioCTA.update({
        where: { id: buttonCTA.id },
        data: {
          buttonType: 'optin',
          optinFormId: optinForm.id,
          optinDisplayMode: 'button',
          buttonStyle: 'card',
          backgroundColor: '#3B82F6',
          thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
          subtitle: 'Klik untuk buka form pendaftaran',
          showThumbnail: true
        }
      })
    } else {
      buttonCTA = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: bioPage.id,
          buttonText: 'Test Button Mode',
          buttonType: 'optin',
          buttonStyle: 'card',
          optinFormId: optinForm.id,
          optinDisplayMode: 'button',
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
          thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
          subtitle: 'Klik untuk buka form pendaftaran',
          showThumbnail: true,
          displayOrder: 997
        }
      })
    }

    console.log(`✅ Button mode CTA:`)
    console.log(`   - ID: ${buttonCTA.id}`)
    console.log(`   - Display Mode: ${buttonCTA.optinDisplayMode}`)
    console.log(`   - Expected behavior: Klik button → buka modal popup\n`)

    // 3. Create/Update Inline Mode CTA
    console.log('2️⃣ Creating CTA with INLINE mode...')
    let inlineCTA = await prisma.affiliateBioCTA.findFirst({
      where: {
        bioPageId: bioPage.id,
        buttonText: 'Test Inline Mode'
      }
    })

    if (inlineCTA) {
      inlineCTA = await prisma.affiliateBioCTA.update({
        where: { id: inlineCTA.id },
        data: {
          buttonType: 'optin',
          optinFormId: optinForm.id,
          optinDisplayMode: 'inline',
          buttonStyle: 'card'
        }
      })
    } else {
      inlineCTA = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: bioPage.id,
          buttonText: 'Test Inline Mode',
          buttonType: 'optin',
          buttonStyle: 'card',
          optinFormId: optinForm.id,
          optinDisplayMode: 'inline',
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
          displayOrder: 998
        }
      })
    }

    console.log(`✅ Inline mode CTA:`)
    console.log(`   - ID: ${inlineCTA.id}`)
    console.log(`   - Display Mode: ${inlineCTA.optinDisplayMode}`)
    console.log(`   - Expected behavior: Form langsung tampil di bio page\n`)

    // 4. Verify data with includes
    console.log('3️⃣ Verifying data retrieval...')
    const ctasWithForm = await prisma.affiliateBioCTA.findMany({
      where: {
        bioPageId: bioPage.id,
        buttonType: 'optin'
      },
      include: {
        optinForm: {
          select: {
            id: true,
            formName: true,
            headline: true,
            description: true,
            submitButtonText: true,
            collectName: true,
            collectEmail: true,
            collectPhone: true
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    console.log(`✅ Found ${ctasWithForm.length} optin CTAs:\n`)
    ctasWithForm.forEach((cta, index) => {
      console.log(`${index + 1}. ${cta.buttonText}`)
      console.log(`   Mode: ${cta.optinDisplayMode}`)
      console.log(`   Form: ${cta.optinForm?.formName || 'N/A'}`)
      console.log(`   Style: ${cta.buttonStyle}`)
      console.log('')
    })

    // 5. Test Summary
    console.log('📊 Test Summary:')
    console.log('✅ Database schema updated with optinDisplayMode')
    console.log('✅ Button mode CTA created (shows modal on click)')
    console.log('✅ Inline mode CTA created (form embedded in page)')
    console.log('✅ Data retrieval includes optin form details')
    console.log('\n📝 Manual Test Steps:')
    console.log('1. Open admin panel: http://localhost:3000/affiliate/bio')
    console.log('2. Edit CTA with button type = "Optin Form"')
    console.log('3. See "Mode Tampilan Form" dropdown with 2 options:')
    console.log('   - Button / Modal: Klik button untuk buka popup form')
    console.log('   - Inline / Embed: Form langsung tampil di bio page')
    console.log('4. Visit bio page: http://localhost:3000/bio/demoaffiliate')
    console.log('5. Button mode: Click button → see modal popup')
    console.log('6. Inline mode: Form already visible on page')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testOptinDisplayModes()
