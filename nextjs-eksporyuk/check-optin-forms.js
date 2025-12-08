/**
 * Check Optin Forms in Database
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkOptinForms() {
  console.log('🔍 Checking Optin Forms in Database...\n')

  try {
    // Find demo affiliate
    const demoUser = await prisma.user.findFirst({
      where: { username: 'demoaffiliate' },
      include: {
        affiliateProfile: {
          include: {
            optinForms: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    })

    if (!demoUser?.affiliateProfile) {
      console.log('❌ Demo affiliate not found')
      return
    }

    const optinForms = demoUser.affiliateProfile.optinForms

    console.log(`✅ Found ${optinForms.length} optin forms for demoaffiliate\n`)

    if (optinForms.length === 0) {
      console.log('⚠️  No optin forms found. Creating sample...\n')

      const newForm = await prisma.affiliateOptinForm.create({
        data: {
          affiliateId: demoUser.affiliateProfile.id,
          bioPageId: demoUser.affiliateProfile.bioPage?.id,
          slug: `sample-form-${Date.now()}`,
          formName: 'Sample Optin Form',
          headline: 'Daftar Sekarang - Dapatkan Bonus Eksklusif',
          description: 'Isi form ini untuk mendapatkan akses penuh ke webinar gratis',
          submitButtonText: 'Daftar Sekarang',
          successMessage: 'Terima kasih! Kami akan segera menghubungi Anda.',
          redirectType: 'message',
          collectName: true,
          collectEmail: true,
          collectPhone: true,
          isActive: true
        }
      })

      console.log('✅ Created sample optin form:')
      console.log(`   ID: ${newForm.id}`)
      console.log(`   Name: ${newForm.formName}`)
      console.log(`   Slug: ${newForm.slug}\n`)
    } else {
      console.log('📋 Optin Forms List:\n')
      optinForms.forEach((form, index) => {
        console.log(`${index + 1}. ${form.formName}`)
        console.log(`   ID: ${form.id}`)
        console.log(`   Slug: ${form.slug}`)
        console.log(`   Active: ${form.isActive ? '✅' : '❌'}`)
        console.log(`   Submissions: ${form.submissionCount}`)
        console.log(`   Collect: Name=${form.collectName}, Email=${form.collectEmail}, Phone=${form.collectPhone}`)
        console.log('')
      })
    }

    // Test API format
    console.log('\n📡 Simulating API Response Format:\n')
    const apiResponse = {
      optinForms: optinForms
    }
    console.log(JSON.stringify(apiResponse, null, 2))

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOptinForms()
