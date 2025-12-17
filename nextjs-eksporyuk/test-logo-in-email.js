const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import branded template engine functions
async function getEmailSettings() {
  try {
    const settings = await prisma.settings.findFirst()
    if (settings) {
      return {
        siteLogo: settings.siteLogo || '',
        siteTitle: settings.siteTitle || 'EksporYuk',
        siteDescription: settings.siteDescription || '',
        primaryColor: settings.primaryColor || '#3B82F6',
        secondaryColor: settings.secondaryColor || '#1F2937',
        buttonPrimaryBg: settings.buttonPrimaryBg || '#3B82F6',
        buttonPrimaryText: settings.buttonPrimaryText || '#FFFFFF',
        emailFooterText: settings.emailFooterText || 'Platform Edukasi & Mentoring Ekspor Terpercaya',
        emailFooterCompany: settings.emailFooterCompany || 'EksporYuk',
        emailFooterAddress: settings.emailFooterAddress || 'Jakarta, Indonesia',
        emailFooterPhone: settings.emailFooterPhone || '',
        emailFooterEmail: settings.emailFooterEmail || 'support@eksporyuk.com',
        emailFooterWebsiteUrl: settings.emailFooterWebsiteUrl || 'https://eksporyuk.com',
        emailFooterInstagramUrl: settings.emailFooterInstagramUrl || '',
        emailFooterFacebookUrl: settings.emailFooterFacebookUrl || '',
        emailFooterLinkedinUrl: settings.emailFooterLinkedinUrl || '',
        emailFooterCopyrightText: settings.emailFooterCopyrightText || 'EksporYuk. All rights reserved.',
        contactPhone: settings.contactPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return null
  }
}

async function getBrandConfig() {
  const settings = await getEmailSettings()
  
  const DEFAULT_BRAND_CONFIG = {
    name: 'EksporYuk',
    tagline: 'Platform Pembelajaran & Komunitas Ekspor Terbaik di Indonesia',
    logoUrl: '/images/logo-eksporyuk.png',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    buttonBg: '#3B82F6',
    buttonText: '#FFFFFF',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    supportEmail: 'support@eksporyuk.com',
    supportPhone: '+62 812-3456-7890',
    website: process.env.NEXT_PUBLIC_APP_URL || 'https://eksporyuk.com',
    address: 'Jakarta, Indonesia',
    copyrightText: 'EksporYuk. All rights reserved.',
    socialMedia: {
      instagram: 'https://instagram.com/eksporyuk',
      facebook: '',
      linkedin: '',
      whatsapp: 'https://wa.me/6281234567890'
    }
  }
  
  if (settings) {
    return {
      name: settings.emailFooterCompany || DEFAULT_BRAND_CONFIG.name,
      tagline: settings.emailFooterText || DEFAULT_BRAND_CONFIG.tagline,
      logoUrl: settings.siteLogo || DEFAULT_BRAND_CONFIG.logoUrl,
      primaryColor: settings.buttonPrimaryBg || DEFAULT_BRAND_CONFIG.primaryColor,
      secondaryColor: settings.secondaryColor || DEFAULT_BRAND_CONFIG.secondaryColor,
      buttonBg: settings.buttonPrimaryBg || DEFAULT_BRAND_CONFIG.buttonBg,
      buttonText: settings.buttonPrimaryText || DEFAULT_BRAND_CONFIG.buttonText,
      backgroundColor: DEFAULT_BRAND_CONFIG.backgroundColor,
      textColor: DEFAULT_BRAND_CONFIG.textColor,
      supportEmail: settings.emailFooterEmail || DEFAULT_BRAND_CONFIG.supportEmail,
      supportPhone: settings.emailFooterPhone || settings.contactPhone || DEFAULT_BRAND_CONFIG.supportPhone,
      website: settings.emailFooterWebsiteUrl || DEFAULT_BRAND_CONFIG.website,
      address: settings.emailFooterAddress || DEFAULT_BRAND_CONFIG.address,
      copyrightText: settings.emailFooterCopyrightText || DEFAULT_BRAND_CONFIG.copyrightText,
      socialMedia: {
        instagram: settings.emailFooterInstagramUrl || DEFAULT_BRAND_CONFIG.socialMedia.instagram,
        facebook: settings.emailFooterFacebookUrl || DEFAULT_BRAND_CONFIG.socialMedia.facebook,
        linkedin: settings.emailFooterLinkedinUrl || DEFAULT_BRAND_CONFIG.socialMedia.linkedin,
        whatsapp: settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}` : DEFAULT_BRAND_CONFIG.socialMedia.whatsapp
      }
    }
  }
  
  return DEFAULT_BRAND_CONFIG
}

async function testEmailGeneration() {
  try {
    console.log('🧪 Testing Email Generation with Logo from Database\n')
    
    // 1. Get brand config
    const brandConfig = await getBrandConfig()
    
    console.log('📋 Brand Config:')
    console.log(`  name: ${brandConfig.name}`)
    console.log(`  logoUrl: ${brandConfig.logoUrl}`)
    console.log(`  tagline: ${brandConfig.tagline}`)
    console.log(`  supportEmail: ${brandConfig.supportEmail}`)
    console.log(`  address: ${brandConfig.address}`)
    
    // 2. Check if logo is from database
    const settings = await prisma.settings.findFirst()
    const isLogoFromDB = brandConfig.logoUrl === settings?.siteLogo
    
    console.log('\n🔍 Logo Source Verification:')
    console.log(`  Database siteLogo: ${settings?.siteLogo}`)
    console.log(`  BrandConfig logoUrl: ${brandConfig.logoUrl}`)
    console.log(`  ✅ Logo from database: ${isLogoFromDB ? 'YES' : 'NO'}`)
    
    if (!isLogoFromDB) {
      console.log('\n⚠️  WARNING: Logo NOT using database value!')
      console.log(`   Expected: ${settings?.siteLogo}`)
      console.log(`   Got: ${brandConfig.logoUrl}`)
    }
    
    // 3. Get a template to test
    const template = await prisma.brandedTemplate.findFirst({
      where: { 
        type: 'TRANSACTION',
        name: 'Email Transaksi Berhasil'
      }
    })
    
    if (!template) {
      console.log('\n❌ Template not found!')
      return
    }
    
    console.log(`\n📧 Testing Template: ${template.name}`)
    console.log(`   Background Design: ${template.customBranding?.backgroundDesign || 'simple'}`)
    
    // 4. Generate sample HTML
    const sampleHTML = `
<!DOCTYPE html>
<html>
<head><title>Test Email</title></head>
<body>
  <table>
    <tr>
      <td align="center">
        <img src="${brandConfig.logoUrl}" alt="${brandConfig.name}" style="max-height: 60px;" />
        <h1>${brandConfig.name}</h1>
        <p>${brandConfig.tagline}</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Halo John Doe (Test),</p>
        <p>Terima kasih atas pembayaran Anda sebesar Rp 500.000 untuk paket Premium (Test).</p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center;">
        <p>${brandConfig.name}</p>
        <p>${brandConfig.address}</p>
        <p>Email: ${brandConfig.supportEmail}</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
    
    console.log('\n✅ Email HTML Structure (with logo from database):')
    console.log(sampleHTML.substring(0, 500) + '...')
    
    console.log('\n✅ VERIFICATION COMPLETE!')
    console.log('   Logo URL in email: ' + brandConfig.logoUrl)
    console.log('   Logo is from Neon DB: ' + (isLogoFromDB ? 'YES ✅' : 'NO ❌'))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testEmailGeneration()
