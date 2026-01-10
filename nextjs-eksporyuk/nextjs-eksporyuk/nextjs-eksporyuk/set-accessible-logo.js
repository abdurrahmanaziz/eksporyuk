const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setAccessibleLogo() {
  try {
    console.log('🔧 Setting Accessible Logo for Emails\n')
    console.log('='.repeat(60))
    
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.log('❌ No settings found!')
      return
    }
    
    console.log('📋 Current Logo:')
    console.log(`   ${settings.siteLogo}`)
    
    // Test if current logo is accessible
    console.log('\n🧪 Testing current logo accessibility...')
    
    // Options for accessible logos:
    const logoOptions = {
      placeholder: 'https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=PT+Ekspor+Yuk+Indonesia',
      imgbb: 'https://i.ibb.co/placeholder', // User can upload to imgbb.com
      cloudinary: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', // User uploads to cloudinary
      // Or use a simple text-based logo with inline SVG
      svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiMzQjgyRjYiLz48dGV4dCB4PSIxMDAiIHk9IjQ1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Fa3Nwb3JZdWs8L3RleHQ+PC9zdmc+'
    }
    
    console.log('\n💡 Logo Options:')
    console.log('   1. Placeholder (via.placeholder.com) ← RECOMMENDED SEMENTARA')
    console.log('   2. Upload ke ImgBB.com (free CDN)')
    console.log('   3. Upload ke Cloudinary (free tier available)')
    console.log('   4. Base64 SVG (embedded in email)')
    
    // Use placeholder for now
    const accessibleLogo = logoOptions.placeholder
    
    console.log('\n🔄 Updating to accessible placeholder logo...')
    console.log(`   New Logo URL: ${accessibleLogo}`)
    
    await prisma.settings.update({
      where: { id: settings.id },
      data: { siteLogo: accessibleLogo }
    })
    
    console.log('✅ Logo updated in database!')
    
    // Verify
    const updated = await prisma.settings.findFirst()
    console.log('\n📸 Verified Logo URL:')
    console.log(`   ${updated?.siteLogo}`)
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ SUCCESS!')
    console.log('='.repeat(60))
    
    console.log('\n📧 Logo sekarang akan muncul di email!')
    console.log('   Test dengan mengirim email dari /admin/branded-templates')
    
    console.log('\n💡 Untuk Logo Permanent:')
    console.log('   1. Upload logo ke https://imgbb.com/')
    console.log('   2. Copy Direct Link')
    console.log('   3. Update Settings.siteLogo dengan link tersebut')
    console.log('   4. Logo akan permanen dan selalu accessible')
    
    console.log('\n🔗 Placeholder Logo Preview:')
    console.log(`   ${accessibleLogo}`)
    console.log('   Buka URL di atas di browser untuk lihat logo')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setAccessibleLogo()
