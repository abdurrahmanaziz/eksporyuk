const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testLogoInEmail() {
  try {
    console.log('🧪 Testing Logo in Email Generation\n')
    console.log('='.repeat(60))
    
    // Simulate getBrandConfig logic
    const settings = await prisma.settings.findFirst()
    
    const DEFAULT_LOGO = 'https://via.placeholder.com/150x60/3B82F6/FFFFFF?text=EksporYuk'
    
    let logoUrl = settings?.siteLogo || DEFAULT_LOGO
    
    console.log('\n📋 Step 1: Get logo from database')
    console.log(`   Database siteLogo: ${settings?.siteLogo || '(not set)'}`)
    
    // Check if logo needs conversion
    if (logoUrl && logoUrl.startsWith('/')) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.eksporyuk.com'
      const oldUrl = logoUrl
      logoUrl = `${appUrl}${logoUrl}`
      console.log('\n🔄 Step 2: Convert relative to absolute')
      console.log(`   From: ${oldUrl}`)
      console.log(`   To: ${logoUrl}`)
    } else {
      console.log('\n✅ Step 2: Logo already absolute URL')
      console.log(`   ${logoUrl}`)
    }
    
    // Check if localhost
    if (logoUrl && (logoUrl.includes('localhost') || logoUrl.startsWith('http://localhost'))) {
      console.log('\n⚠️  Step 3: Logo contains localhost, using fallback')
      logoUrl = DEFAULT_LOGO
      console.log(`   Fallback to: ${logoUrl}`)
    } else {
      console.log('\n✅ Step 3: Logo URL is accessible')
    }
    
    console.log('\n📸 Final Logo URL:')
    console.log(`   ${logoUrl}`)
    
    // Check accessibility
    console.log('\n🔍 Accessibility Check:')
    const isHttps = logoUrl.startsWith('https://')
    const isHttp = logoUrl.startsWith('http://')
    const isRelative = logoUrl.startsWith('/')
    const isLocalhost = logoUrl.includes('localhost')
    
    console.log(`   ✓ Is HTTPS: ${isHttps ? '✅' : '❌'}`)
    console.log(`   ✓ Is HTTP: ${isHttp ? (isLocalhost ? '⚠️  (localhost)' : '✅') : '❌'}`)
    console.log(`   ✓ Is Relative: ${isRelative ? '❌' : '✅'}`)
    console.log(`   ✓ Is Localhost: ${isLocalhost ? '❌' : '✅'}`)
    
    const isAccessible = (isHttps || (isHttp && !isLocalhost)) && !isRelative
    
    console.log(`\n${isAccessible ? '✅' : '❌'} Logo is ${isAccessible ? 'ACCESSIBLE' : 'NOT ACCESSIBLE'} from email clients`)
    
    // Generate sample email HTML
    const brandConfig = {
      name: settings?.emailFooterCompany || 'EksporYuk',
      logoUrl: logoUrl,
      tagline: settings?.emailFooterText || 'Platform pembelajaran ekspor',
      supportEmail: settings?.emailFooterEmail || 'support@eksporyuk.com',
      address: settings?.emailFooterAddress || 'Jakarta'
    }
    
    console.log('\n📧 Sample Email HTML:')
    console.log('='.repeat(60))
    
    const sampleHTML = `
<!DOCTYPE html>
<html>
<head><title>Test Email</title></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
  <table style="max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px; border-radius: 12px;">
    <tr>
      <td align="center">
        <!-- LOGO HERE -->
        <img src="${brandConfig.logoUrl}" 
             alt="${brandConfig.name}" 
             style="max-height: 60px; width: auto; display: block; margin-bottom: 20px;" />
        
        <h1 style="color: #1e3a8a; margin: 16px 0 8px;">${brandConfig.name}</h1>
        <p style="color: #64748b; margin: 0 0 24px;">${brandConfig.tagline}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; background: white; border-radius: 8px;">
        <p style="color: #334155; line-height: 1.6;">
          Halo Test User,<br/><br/>
          Terima kasih telah bergabung dengan EksporYuk.
        </p>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top: 30px;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          ${brandConfig.name} • ${brandConfig.address}<br/>
          ${brandConfig.supportEmail}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`
    
    console.log(sampleHTML)
    console.log('\n='.repeat(60))
    
    console.log('\n✅ RESULT:')
    console.log(`   Logo URL in <img> tag: ${brandConfig.logoUrl}`)
    console.log(`   Can be loaded by email clients: ${isAccessible ? 'YES ✅' : 'NO ❌'}`)
    
    if (!isAccessible) {
      console.log('\n⚠️  ACTION REQUIRED:')
      console.log('   1. Upload logo ke CDN (Cloudinary, ImgBB, AWS S3)')
      console.log('   2. Update Settings.siteLogo dengan URL CDN')
      console.log('   3. Atau gunakan placeholder default sementara')
    } else {
      console.log('\n✨ Logo siap digunakan di email!')
      console.log('   Test dengan mengirim email dari /admin/branded-templates')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testLogoInEmail()
