const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCTAUpdate() {
  try {
    console.log('🧪 Testing CTA Update via API simulation...\n')

    // Get first CTA
    const cta = await prisma.affiliateBioCTA.findFirst({
      where: { buttonText: 'Membership Ekspor Pemula' }
    })

    if (!cta) {
      console.log('❌ CTA not found')
      return
    }

    console.log('Original CTA:')
    console.log(`- Title: ${cta.buttonText}`)
    console.log(`- Style: ${cta.buttonStyle}`)
    console.log(`- Title Size: ${cta.titleSize}`)
    console.log(`- Subtitle Size: ${cta.subtitleSize}`)
    console.log(`- Button Text Size: ${cta.buttonTextSize}\n`)

    // Simulate API update
    const updateData = {
      titleSize: 'xl',
      subtitleSize: 'lg',
      buttonTextSize: 'lg'
    }

    console.log('Updating to:')
    console.log(`- Title Size: ${updateData.titleSize}`)
    console.log(`- Subtitle Size: ${updateData.subtitleSize}`)
    console.log(`- Button Text Size: ${updateData.buttonTextSize}\n`)

    const updated = await prisma.affiliateBioCTA.update({
      where: { id: cta.id },
      data: updateData
    })

    console.log('✅ Update successful!')
    console.log('\nVerification:')
    console.log(`- Title Size: ${updated.titleSize}`)
    console.log(`- Subtitle Size: ${updated.subtitleSize}`)
    console.log(`- Button Text Size: ${updated.buttonTextSize}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCTAUpdate()
