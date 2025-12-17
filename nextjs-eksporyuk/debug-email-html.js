const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')

// Simulate getEmailSettings
async function getEmailSettings() {
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
}

// Simulate getBrandConfig
async function getBrandConfig() {
  const settings = await getEmailSettings()
  
  const DEFAULT_BRAND_CONFIG = {
    name: 'EksporYuk',
    tagline: 'Platform Pembelajaran & Komunitas Ekspor Terbaik di Indonesia',
    logoUrl: 'https://via.placeholder.com/150x60/3B82F6/FFFFFF?text=EksporYuk',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    buttonBg: '#3B82F6',
    buttonText: '#FFFFFF',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    supportEmail: 'support@eksporyuk.com',
    supportPhone: '+62 812-3456-7890',
    website: 'https://eksporyuk.com',
    address: 'Jakarta, Indonesia',
    copyrightText: 'EksporYuk. All rights reserved.',
  }
  
  if (settings) {
    let logoUrl = settings.siteLogo || DEFAULT_BRAND_CONFIG.logoUrl
    
    // If logo is relative path, convert to absolute URL
    if (logoUrl && logoUrl.startsWith('/')) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.eksporyuk.com'
      logoUrl = `${appUrl}${logoUrl}`
    }
    
    // If logo is localhost, use default
    if (logoUrl && (logoUrl.includes('localhost') || logoUrl.startsWith('http://localhost'))) {
      console.warn('[BrandConfig] Logo URL contains localhost, using default logo')
      logoUrl = DEFAULT_BRAND_CONFIG.logoUrl
    }
    
    return {
      name: settings.emailFooterCompany || DEFAULT_BRAND_CONFIG.name,
      tagline: settings.emailFooterText || DEFAULT_BRAND_CONFIG.tagline,
      logoUrl: logoUrl,
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
    }
  }
  
  return DEFAULT_BRAND_CONFIG
}

async function debugEmailGeneration() {
  try {
    console.log('🔍 DEBUGGING EMAIL GENERATION\n')
    console.log('='.repeat(70))
    
    // Get brand config
    const brandConfig = await getBrandConfig()
    
    console.log('\n📋 BRAND CONFIG:')
    console.log(JSON.stringify(brandConfig, null, 2))
    
    console.log('\n🖼️  LOGO URL:')
    console.log(`   ${brandConfig.logoUrl}`)
    console.log(`   Length: ${brandConfig.logoUrl.length} characters`)
    console.log(`   Starts with https:// ? ${brandConfig.logoUrl.startsWith('https://')}`)
    
    // Generate HTML
    const design = {
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      containerBg: '#f8fafc',
      textColor: '#1e3a8a'
    }
    
    const emailHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="margin: 0; padding: 0; background: ${design.background}; font-family: Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: ${design.containerBg}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 30px 20px; background-color: ${design.containerBg};">
              <img src="${brandConfig.logoUrl}" alt="${brandConfig.name}" style="max-height: 60px; width: auto; display: block; margin: 0 auto;" />
              <h1 style="margin: 16px 0 0; color: ${design.textColor}; font-size: 24px; font-weight: 600;">${brandConfig.name}</h1>
              <p style="margin: 8px 0 0; color: ${design.textColor}; font-size: 14px; opacity: 0.7;">${brandConfig.tagline}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px;">
              <div style="color: ${design.textColor};">
                <p style="margin: 0 0 16px 0; color: ${design.textColor}; font-size: 16px; line-height: 1.6;">Halo John Doe (Test),</p>
                <p style="margin: 0 0 16px 0; color: ${design.textColor}; font-size: 16px; line-height: 1.6;">Terima kasih atas pembayaran Anda sebesar Rp 199.000 untuk paket Premium (Test).</p>
                <p style="margin: 0 0 16px 0; color: ${design.textColor}; font-size: 16px; line-height: 1.6;">Nomor Invoice: TEST-001</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://app.eksporyuk.com/dashboard" style="display: inline-block; padding: 16px 32px; background-color: ${brandConfig.buttonBg}; color: ${brandConfig.buttonText}; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">
                  Akses Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
              <div style="text-align: center;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 600;">
                  ${brandConfig.name}
                </p>
                <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  ${brandConfig.address}<br/>
                  Email: <a href="mailto:${brandConfig.supportEmail}" style="color: ${brandConfig.primaryColor}; text-decoration: none;">${brandConfig.supportEmail}</a><br/>
                  Phone: ${brandConfig.supportPhone}
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                  © 2024 ${brandConfig.copyrightText}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
    
    // Save to file
    const filename = 'test-email-output.html'
    fs.writeFileSync(filename, emailHTML)
    
    console.log('\n✅ Email HTML generated and saved to:', filename)
    console.log('\n📧 IMG TAG IN HTML:')
    
    const imgTagMatch = emailHTML.match(/<img[^>]*src="([^"]*)"[^>]*>/i)
    if (imgTagMatch) {
      console.log('   Full tag:', imgTagMatch[0])
      console.log('   Logo URL:', imgTagMatch[1])
    }
    
    console.log('\n='.repeat(70))
    console.log('✅ DEBUG COMPLETE')
    console.log('='.repeat(70))
    
    console.log('\n📝 Summary:')
    console.log(`   1. Logo URL in database: ${brandConfig.logoUrl}`)
    console.log(`   2. Logo URL in HTML: ${imgTagMatch ? imgTagMatch[1] : 'NOT FOUND'}`)
    console.log(`   3. Logo URL matches: ${imgTagMatch && imgTagMatch[1] === brandConfig.logoUrl ? 'YES ✅' : 'NO ❌'}`)
    
    console.log('\n🔍 Check the file:', filename)
    console.log('   Open it in browser to see the email preview')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

debugEmailGeneration()
