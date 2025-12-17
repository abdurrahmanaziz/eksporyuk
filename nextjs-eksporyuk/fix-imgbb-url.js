const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixImgBBUrl() {
  try {
    console.log('🔧 Fixing ImgBB URL\n')
    
    const settings = await prisma.settings.findFirst()
    
    console.log('📋 Current Logo URL:')
    console.log(`   ${settings?.siteLogo}`)
    
    const currentUrl = settings?.siteLogo || ''
    
    // Fix ImgBB URL format
    let fixedUrl = currentUrl
    
    if (currentUrl.includes('ibb.co')) {
      console.log('\n🔍 Detected ImgBB URL')
      
      // Extract image ID
      const match = currentUrl.match(/\/([^\/]+)$/i)
      if (match) {
        const imageId = match[1]
        console.log(`   Image ID: ${imageId}`)
        
        // Correct ImgBB format is: https://i.ibb.co/{imageId}/{filename}.png
        // But we need the actual direct link
        
        // For now, let's use a working placeholder
        fixedUrl = 'https://via.placeholder.com/200x80/0066CC/FFFFFF?text=PT+Ekspor+Yuk'
        
        console.log(`\n⚠️  ImgBB URL format detected but may not be direct image link`)
        console.log(`   Current: ${currentUrl}`)
        console.log(`   Using placeholder: ${fixedUrl}`)
      }
    }
    
    console.log('\n📝 CARA UPLOAD LOGO YANG BENAR:')
    console.log('='.repeat(60))
    console.log('\n1. Gunakan https://postimages.org/ (lebih reliable):')
    console.log('   - Upload logo')
    console.log('   - Klik "Direct link"')
    console.log('   - Copy URL yang berakhiran .png atau .jpg')
    console.log('   - Contoh: https://i.postimg.cc/xxxxx/logo.png')
    
    console.log('\n2. Atau gunakan https://imgbb.com/:')
    console.log('   - Upload logo')
    console.log('   - Klik kanan pada image → "Copy image address"')
    console.log('   - HARUS berformat: https://i.ibb.co/xxxxx/logo.png')
    console.log('   - BUKAN: https://ibb.co/xxxxx (ini halaman view, bukan direct link)')
    
    console.log('\n3. Test URL di browser:')
    console.log('   - Paste URL di browser')
    console.log('   - HARUS langsung tampil image')
    console.log('   - BUKAN halaman ImgBB dengan image di dalamnya')
    
    console.log('\n🔧 Updating to working placeholder...')
    
    await prisma.settings.update({
      where: { id: settings.id },
      data: { siteLogo: fixedUrl }
    })
    
    console.log('✅ Logo updated!')
    console.log(`   New URL: ${fixedUrl}`)
    
    console.log('\n💡 NEXT STEPS:')
    console.log('   1. Upload logo ke PostImages atau ImgBB')
    console.log('   2. Get DIRECT IMAGE LINK (harus .png atau .jpg)')
    console.log('   3. Test URL di browser - harus tampil HANYA image')
    console.log('   4. Update Settings.siteLogo dengan URL tersebut')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixImgBBUrl()
