const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testFontSizeDisplay() {
  try {
    console.log('🔍 Checking CTA buttons font size settings...\n')

    const ctas = await prisma.affiliateBioCTA.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        buttonText: true,
        buttonStyle: true,
        titleSize: true,
        subtitleSize: true,
        buttonTextSize: true
      },
      orderBy: {
        displayOrder: 'asc'
      }
    })

    console.log(`Found ${ctas.length} active CTA buttons:\n`)

    ctas.forEach((cta, index) => {
      console.log(`${index + 1}. ${cta.buttonText}`)
      console.log(`   Style: ${cta.buttonStyle}`)
      console.log(`   Title Size: ${cta.titleSize}`)
      console.log(`   Subtitle Size: ${cta.subtitleSize}`)
      console.log(`   Button Text Size: ${cta.buttonTextSize}`)
      console.log('')
    })

    // Test update one CTA to different sizes
    if (ctas.length > 0) {
      const firstCta = ctas[0]
      console.log(`\n📝 Testing update on: ${firstCta.buttonText}`)
      console.log('   Changing to: Title=lg, Subtitle=base, Button=base\n')

      await prisma.affiliateBioCTA.update({
        where: { id: firstCta.id },
        data: {
          titleSize: 'lg',
          subtitleSize: 'base',
          buttonTextSize: 'base'
        }
      })

      const updated = await prisma.affiliateBioCTA.findUnique({
        where: { id: firstCta.id },
        select: {
          buttonText: true,
          titleSize: true,
          subtitleSize: true,
          buttonTextSize: true
        }
      })

      console.log('✅ Update successful!')
      console.log(`   ${updated.buttonText}:`)
      console.log(`   - Title: ${updated.titleSize}`)
      console.log(`   - Subtitle: ${updated.subtitleSize}`)
      console.log(`   - Button: ${updated.buttonTextSize}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFontSizeDisplay()
