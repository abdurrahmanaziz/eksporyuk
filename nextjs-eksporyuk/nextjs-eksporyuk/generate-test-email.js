const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateTestEmail() {
  try {
    console.log('📧 Generating Test Email with Logo from Database\n')
    
    // 1. Get template
    const templates = await prisma.brandedTemplate.findMany({
      where: { type: 'EMAIL' }
    })
    
    if (templates.length === 0) {
      console.log('❌ No templates found!')
      return
    }
    
    console.log(`✅ Found ${templates.length} templates`)
    const template = templates[0]
    
    console.log(`\n📋 Using template: ${template.name}`)
    console.log(`   Background: ${template.customBranding?.backgroundDesign || 'simple'}`)
    
    // 2. Get brand config from settings
    const settings = await prisma.settings.findFirst()
    
    const brandConfig = {
      name: settings?.emailFooterCompany || 'EksporYuk',
      tagline: settings?.emailFooterText || 'Platform pembelajaran ekspor',
      logoUrl: settings?.siteLogo || '/logo.png',
      primaryColor: settings?.buttonPrimaryBg || '#3B82F6',
      buttonBg: settings?.buttonPrimaryBg || '#3B82F6',
      buttonText: settings?.buttonPrimaryText || '#FFFFFF',
      supportEmail: settings?.emailFooterEmail || 'support@eksporyuk.com',
      supportPhone: settings?.emailFooterPhone || settings?.contactPhone || '',
      address: settings?.emailFooterAddress || 'Jakarta',
      copyrightText: settings?.emailFooterCopyrightText || 'All rights reserved',
      website: settings?.emailFooterWebsiteUrl || 'https://eksporyuk.com'
    }
    
    console.log(`\n🎨 Brand Config:`)
    console.log(`   Company: ${brandConfig.name}`)
    console.log(`   Logo URL: ${brandConfig.logoUrl}`)
    console.log(`   Email: ${brandConfig.supportEmail}`)
    
    // 3. Verify logo is from database
    console.log(`\n✅ Logo Source Verification:`)
    console.log(`   Settings.siteLogo: ${settings?.siteLogo}`)
    console.log(`   BrandConfig.logoUrl: ${brandConfig.logoUrl}`)
    console.log(`   Match: ${settings?.siteLogo === brandConfig.logoUrl ? 'YES ✅' : 'NO ❌'}`)
    
    // 4. Generate HTML snippet showing logo usage
    const backgroundDesign = template.customBranding?.backgroundDesign || 'simple'
    const designs = {
      simple: { containerBg: '#ffffff', textColor: '#1f2937' },
      blue: { containerBg: '#f8fafc', textColor: '#1e3a8a' },
      elegant: { containerBg: '#ffffff', textColor: '#374151' }
    }
    const design = designs[backgroundDesign] || designs.simple
    
    const emailHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${template.subject}</title>
</head>
<body>
  <table role="presentation">
    <tr>
      <td align="center" style="background-color: ${design.containerBg}; padding: 40px;">
        <!-- LOGO FROM DATABASE -->
        <img src="${brandConfig.logoUrl}" alt="${brandConfig.name}" style="max-height: 60px; width: auto;" />
        
        <h1 style="color: ${design.textColor};">${brandConfig.name}</h1>
        <p style="color: ${design.textColor};">${brandConfig.tagline}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        ${template.content.split('\n').slice(0, 3).join('<br/>')}
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 30px; text-align: center;">
        <p style="font-weight: 600;">${brandConfig.name}</p>
        <p>${brandConfig.address}</p>
        <p>Email: ${brandConfig.supportEmail}</p>
        <p>© 2024 ${brandConfig.copyrightText}</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
    
    console.log(`\n📄 Sample Email HTML:`)
    console.log(emailHTML)
    
    console.log(`\n✅ SUCCESS!`)
    console.log(`   ✓ Logo dari Neon DB: ${settings?.siteLogo}`)
    console.log(`   ✓ Logo URL adalah absolute: ${brandConfig.logoUrl.startsWith('https://') ? 'YES' : 'NO'}`)
    console.log(`   ✓ Template menggunakan background design: ${backgroundDesign}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

generateTestEmail()
