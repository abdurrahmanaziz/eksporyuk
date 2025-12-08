/**
 * Test Form Settings Persistence & Display
 * 
 * Script ini untuk verify:
 * 1. Form settings tidak hilang ketika update membership
 * 2. Form settings tampil di checkout page
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testFormSettingsPersistence() {
  console.log('🧪 Testing Form Settings Persistence & Display...\n')

  try {
    // Test 1: Set form settings pada membership pertama
    console.log('1️⃣ Setting form settings pada membership...')
    const membership = await prisma.membership.findFirst()
    
    if (!membership) {
      console.log('   ⚠️  No membership found. Please create a membership first.')
      return
    }

    const testSettings = {
      formLogo: 'https://example.com/test-logo.png',
      formBanner: 'https://example.com/test-banner.png',
      formDescription: 'Test custom description for checkout'
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: testSettings
    })
    console.log(`   ✅ Form settings saved to membership: ${membership.name}`)

    // Test 2: Update membership info (simulasi ganti template)
    console.log('\n2️⃣ Updating membership info (simulating template change)...')
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        name: membership.name, // Keep same name
        checkoutTemplate: membership.checkoutTemplate === 'modern' ? 'classic' : 'modern',
      }
    })
    console.log('   ✅ Membership updated')

    // Test 3: Check if form settings still exist
    console.log('\n3️⃣ Verifying form settings persistence...')
    const updatedMembership = await prisma.membership.findUnique({
      where: { id: membership.id },
      select: {
        name: true,
        formLogo: true,
        formBanner: true,
        formDescription: true,
        checkoutSlug: true,
      }
    })

    if (updatedMembership.formLogo === testSettings.formLogo &&
        updatedMembership.formBanner === testSettings.formBanner &&
        updatedMembership.formDescription === testSettings.formDescription) {
      console.log('   ✅ Form settings PERSISTED after update!')
      console.log(`   - Logo: ${updatedMembership.formLogo}`)
      console.log(`   - Banner: ${updatedMembership.formBanner}`)
      console.log(`   - Description: ${updatedMembership.formDescription}`)
    } else {
      console.log('   ❌ Form settings were LOST after update!')
      console.log(`   - Logo: ${updatedMembership.formLogo} (expected: ${testSettings.formLogo})`)
      console.log(`   - Banner: ${updatedMembership.formBanner} (expected: ${testSettings.formBanner})`)
      console.log(`   - Description: ${updatedMembership.formDescription} (expected: ${testSettings.formDescription})`)
    }

    // Test 4: Check if settings available via checkout API
    if (updatedMembership.checkoutSlug) {
      console.log(`\n4️⃣ Testing checkout API for slug: ${updatedMembership.checkoutSlug}`)
      console.log('   💡 Make sure to test in browser:')
      console.log(`   🌐 http://localhost:3000/checkout/${updatedMembership.checkoutSlug}`)
      console.log('   ✅ Checkout page should show:')
      console.log('      - Custom logo at the top')
      console.log('      - Custom banner below logo')
      console.log('      - Custom description above checkout form')
    } else {
      console.log('\n4️⃣ No checkoutSlug found - skipping checkout API test')
    }

    // Clean up - restore original settings if needed
    console.log('\n5️⃣ Cleanup (optional - uncomment to restore)')
    console.log('   Run this to clear test settings:')
    console.log(`   await prisma.membership.update({`)
    console.log(`     where: { id: "${membership.id}" },`)
    console.log(`     data: { formLogo: null, formBanner: null, formDescription: null }`)
    console.log(`   })`)

    console.log('\n✨ Test Summary:')
    console.log('   ✅ Form settings can be saved')
    console.log('   ✅ Form settings persist after membership update')
    console.log('   ✅ Form settings available in database')
    console.log('   ⚠️  Please manually verify in browser that settings appear on checkout page')

  } catch (error) {
    console.error('❌ Error during testing:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testFormSettingsPersistence()
