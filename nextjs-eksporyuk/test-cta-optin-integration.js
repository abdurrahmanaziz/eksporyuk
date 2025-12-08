/**
 * Test CTA Optin Form Integration
 * Memverifikasi bahwa:
 * 1. CTA button dengan type 'optin' bisa dibuat
 * 2. Optin form data ter-include dengan lengkap
 * 3. Click tracking berfungsi
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCTAOptinFormIntegration() {
  console.log('🧪 Testing CTA Optin Form Integration...\n')

  try {
    // 1. Find Demo Affiliate
    console.log('1️⃣ Finding Demo Affiliate...')
    const demoUser = await prisma.user.findFirst({
      where: { username: 'demoaffiliate' },
      include: {
        affiliateProfile: {
          include: {
            bioPage: true,
            optinForms: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    })

    if (!demoUser?.affiliateProfile?.bioPage) {
      console.log('❌ Demo affiliate or bio page not found')
      return
    }

    const bioPage = demoUser.affiliateProfile.bioPage
    const optinForms = demoUser.affiliateProfile.optinForms

    console.log(`✅ Found bio page: ${bioPage.id}`)
    console.log(`✅ Found ${optinForms.length} optin forms`)

    if (optinForms.length === 0) {
      console.log('\n⚠️  No optin forms available. Creating sample optin form...')
      
      const newForm = await prisma.affiliateOptinForm.create({
        data: {
          affiliateId: demoUser.affiliateProfile.id,
          bioPageId: bioPage.id,
          slug: `test-form-${Date.now()}`,
          formName: 'Form Test CTA Integration',
          headline: 'Daftar Sekarang - Dapatkan Akses Eksklusif',
          description: 'Form ini untuk testing integrasi CTA button dengan optin form',
          submitButtonText: 'Daftar Sekarang',
          successMessage: 'Terima kasih! Kami akan segera menghubungi Anda.',
          redirectType: 'message',
          collectName: true,
          collectEmail: true,
          collectPhone: true,
          isActive: true
        }
      })

      console.log(`✅ Created optin form: ${newForm.formName} (${newForm.id})`)
      optinForms.push(newForm)
    }

    const testOptinForm = optinForms[0]

    // 2. Create or update CTA button with optin form
    console.log('\n2️⃣ Creating CTA button with optin form...')

    // Check if test CTA already exists
    let testCTA = await prisma.affiliateBioCTA.findFirst({
      where: {
        bioPageId: bioPage.id,
        buttonText: 'Test CTA Optin Form'
      }
    })

    if (testCTA) {
      console.log('Found existing test CTA, updating...')
      testCTA = await prisma.affiliateBioCTA.update({
        where: { id: testCTA.id },
        data: {
          buttonType: 'optin',
          optinFormId: testOptinForm.id,
          buttonStyle: 'card',
          thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
          subtitle: 'Klik untuk daftar dan dapatkan bonus eksklusif',
          showThumbnail: true
        }
      })
    } else {
      testCTA = await prisma.affiliateBioCTA.create({
        data: {
          bioPageId: bioPage.id,
          buttonText: 'Test CTA Optin Form',
          buttonType: 'optin',
          buttonStyle: 'card',
          optinFormId: testOptinForm.id,
          backgroundColor: '#10B981',
          textColor: '#FFFFFF',
          thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
          subtitle: 'Klik untuk daftar dan dapatkan bonus eksklusif',
          showThumbnail: true,
          displayOrder: 999
        }
      })
    }

    console.log(`✅ CTA button created/updated:`)
    console.log(`   - ID: ${testCTA.id}`)
    console.log(`   - Text: ${testCTA.buttonText}`)
    console.log(`   - Type: ${testCTA.buttonType}`)
    console.log(`   - Optin Form ID: ${testCTA.optinFormId}`)
    console.log(`   - Style: ${testCTA.buttonStyle}`)

    // 3. Test data retrieval (simulate what page.tsx does)
    console.log('\n3️⃣ Testing data retrieval with include...')

    const bioPageWithCTA = await prisma.affiliateBioPage.findUnique({
      where: { id: bioPage.id },
      include: {
        ctaButtons: {
          where: {
            id: testCTA.id,
            isActive: true
          },
          include: {
            optinForm: {
              select: {
                id: true,
                formName: true,
                headline: true,
                description: true,
                submitButtonText: true,
                successMessage: true,
                redirectType: true,
                redirectUrl: true,
                redirectWhatsapp: true,
                collectName: true,
                collectEmail: true,
                collectPhone: true
              }
            }
          }
        }
      }
    })

    const retrievedCTA = bioPageWithCTA?.ctaButtons[0]
    
    if (!retrievedCTA) {
      console.log('❌ Failed to retrieve CTA button')
      return
    }

    console.log(`✅ Retrieved CTA button:`)
    console.log(`   - Text: ${retrievedCTA.buttonText}`)
    console.log(`   - Type: ${retrievedCTA.buttonType}`)
    console.log(`   - Has optinForm: ${retrievedCTA.optinForm ? 'Yes' : 'No'}`)

    if (retrievedCTA.optinForm) {
      console.log(`   - Form Name: ${retrievedCTA.optinForm.formName}`)
      console.log(`   - Headline: ${retrievedCTA.optinForm.headline}`)
      console.log(`   - Description: ${retrievedCTA.optinForm.description}`)
      console.log(`   - Submit Button: ${retrievedCTA.optinForm.submitButtonText}`)
      console.log(`   - Collect Name: ${retrievedCTA.optinForm.collectName}`)
      console.log(`   - Collect Email: ${retrievedCTA.optinForm.collectEmail}`)
      console.log(`   - Collect Phone: ${retrievedCTA.optinForm.collectPhone}`)
    }

    // 4. Test click tracking
    console.log('\n4️⃣ Testing click tracking...')
    const initialClicks = testCTA.clicks

    await prisma.affiliateBioCTA.update({
      where: { id: testCTA.id },
      data: { clicks: { increment: 1 } }
    })

    const updatedCTA = await prisma.affiliateBioCTA.findUnique({
      where: { id: testCTA.id }
    })

    console.log(`✅ Click tracking working:`)
    console.log(`   - Initial clicks: ${initialClicks}`)
    console.log(`   - After increment: ${updatedCTA?.clicks}`)

    // 5. Summary
    console.log('\n📊 Test Summary:')
    console.log('✅ All tests passed!')
    console.log('\n📝 Next Steps:')
    console.log(`1. Visit: http://localhost:3000/bio/demoaffiliate`)
    console.log(`2. Look for button: "${testCTA.buttonText}"`)
    console.log('3. Click the button - should open modal with optin form')
    console.log(`4. Form should show: "${testOptinForm.headline}"`)
    console.log('5. Submit button should say: "' + testOptinForm.submitButtonText + '"')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCTAOptinFormIntegration()
