const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function updateLogoInteractive() {
  try {
    console.log('🎨 UPDATE LOGO UNTUK EMAIL')
    console.log('='.repeat(60))
    
    const settings = await prisma.settings.findFirst()
    
    console.log('\n📋 Logo saat ini:')
    console.log(`   ${settings?.siteLogo}`)
    
    console.log('\n💡 Panduan Upload Logo:')
    console.log('   1. Upload ke https://postimages.org/')
    console.log('   2. Pilih "Direct link"')
    console.log('   3. Copy URL (harus berakhiran .png atau .jpg)')
    console.log('   4. Paste di sini')
    
    console.log('\n📝 Format yang benar:')
    console.log('   ✅ https://i.postimg.cc/xxxxx/logo.png')
    console.log('   ✅ https://i.ibb.co/xxxxx/logo.png')
    console.log('   ❌ https://ibb.co/xxxxx (SALAH - ini halaman view)')
    
    const newLogoUrl = await question('\n🔗 Paste direct image link logo: ')
    
    if (!newLogoUrl || newLogoUrl.trim() === '') {
      console.log('❌ URL tidak boleh kosong!')
      rl.close()
      await prisma.$disconnect()
      return
    }
    
    const trimmedUrl = newLogoUrl.trim()
    
    // Validate URL
    console.log('\n🔍 Validating URL...')
    
    const validations = {
      'Starts with https://': trimmedUrl.startsWith('https://'),
      'Is valid URL': /^https?:\/\/.+/.test(trimmedUrl),
      'Ends with image extension': /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(trimmedUrl) || trimmedUrl.includes('placeholder'),
      'Not a page URL': !trimmedUrl.match(/ibb\.co\/[^\/]+$/) && !trimmedUrl.includes('postimages.org/') || trimmedUrl.includes('/'),
    }
    
    console.log('')
    let allValid = true
    for (const [check, result] of Object.entries(validations)) {
      console.log(`   ${result ? '✅' : '❌'} ${check}`)
      if (!result) allValid = false
    }
    
    if (!allValid) {
      console.log('\n⚠️  WARNING: URL mungkin tidak valid!')
      const proceed = await question('\nLanjutkan update? (y/n): ')
      if (proceed.toLowerCase() !== 'y') {
        console.log('❌ Update dibatalkan')
        rl.close()
        await prisma.$disconnect()
        return
      }
    }
    
    // Update
    console.log('\n🔄 Updating logo...')
    
    await prisma.settings.update({
      where: { id: settings.id },
      data: { siteLogo: trimmedUrl }
    })
    
    console.log('✅ Logo berhasil diupdate!')
    console.log(`   New URL: ${trimmedUrl}`)
    
    // Verify
    const updated = await prisma.settings.findFirst()
    console.log('\n✅ Verified in database:')
    console.log(`   ${updated?.siteLogo}`)
    
    console.log('\n🧪 Test logo:')
    console.log(`   1. Buka URL di browser: ${trimmedUrl}`)
    console.log(`   2. Harus tampil HANYA image`)
    console.log(`   3. Test send email dari /admin/branded-templates`)
    
    rl.close()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    rl.close()
  } finally {
    await prisma.$disconnect()
  }
}

updateLogoInteractive()
