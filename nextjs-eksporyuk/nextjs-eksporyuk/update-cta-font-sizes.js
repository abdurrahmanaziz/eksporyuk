const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateCTAFontSizes() {
  try {
    console.log('🔄 Updating all CTA buttons with default font sizes...')

    const result = await prisma.affiliateBioCTA.updateMany({
      data: {
        titleSize: 'sm',
        subtitleSize: 'xs',
        buttonTextSize: 'sm'
      }
    })

    console.log(`✅ Updated ${result.count} CTA buttons with default font sizes`)
    console.log('   - titleSize: sm')
    console.log('   - subtitleSize: xs')
    console.log('   - buttonTextSize: sm')

  } catch (error) {
    console.error('❌ Error updating CTA font sizes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCTAFontSizes()
