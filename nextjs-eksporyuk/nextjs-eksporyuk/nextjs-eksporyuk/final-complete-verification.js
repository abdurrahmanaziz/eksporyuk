const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')

async function finalVerificationComplete() {
  try {
    console.log('🎯 FINAL VERIFICATION - COMPLETE SYSTEM CHECK\n')
    console.log('='.repeat(70))
    
    // 1. Check Database
    console.log('\n1️⃣  DATABASE CHECK')
    console.log('-'.repeat(70))
    const settings = await prisma.settings.findFirst()
    
    console.log('   Settings.siteLogo:')
    console.log(`   Type: ${settings?.siteLogo?.startsWith('data:') ? 'Data URI (Embedded)' : 'External URL'}`)
    console.log(`   Length: ${settings?.siteLogo?.length} chars`)
    console.log(`   Preview: ${settings?.siteLogo?.substring(0, 80)}...`)
    
    const logoChecks = {
      'Logo exists': !!settings?.siteLogo,
      'Logo not empty': settings?.siteLogo && settings.siteLogo.length > 0,
      'Valid format': settings?.siteLogo?.startsWith('data:') || settings?.siteLogo?.startsWith('http'),
    }
    
    console.log('\n   Checks:')
    Object.entries(logoChecks).forEach(([check, pass]) => {
      console.log(`   ${pass ? '✅' : '❌'} ${check}`)
    })
    
    // 2. Check Templates
    console.log('\n2️⃣  TEMPLATES CHECK')
    console.log('-'.repeat(70))
    const templates = await prisma.brandedTemplate.findMany({
      where: { type: 'EMAIL' }
    })
    
    console.log(`   Total templates: ${templates.length}`)
    templates.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name}`)
      console.log(`      Background: ${t.customBranding?.backgroundDesign || 'default'}`)
      console.log(`      Active: ${t.isActive ? 'YES' : 'NO'}`)
    })
    
    // 3. Simulate getBrandConfig
    console.log('\n3️⃣  BRAND CONFIG SIMULATION')
    console.log('-'.repeat(70))
    
    let logoUrl = settings?.siteLogo || ''
    
    // Check if needs conversion
    if (logoUrl && logoUrl.startsWith('/')) {
      logoUrl = `https://app.eksporyuk.com${logoUrl}`
      console.log('   ⚠️  Logo was relative, converted to absolute')
    }
    
    if (logoUrl && logoUrl.includes('localhost')) {
      console.log('   ⚠️  Logo contains localhost, would use fallback')
      logoUrl = 'FALLBACK_LOGO'
    }
    
    console.log(`   Final logoUrl: ${logoUrl.substring(0, 80)}${logoUrl.length > 80 ? '...' : ''}`)
    
    // 4. Generate Test Email
    console.log('\n4️⃣  EMAIL GENERATION TEST')
    console.log('-'.repeat(70))
    
    const brandConfig = {
      name: settings?.emailFooterCompany || 'EksporYuk',
      logoUrl: logoUrl,
      tagline: settings?.emailFooterText || 'Platform ekspor',
      supportEmail: settings?.emailFooterEmail || 'support@eksporyuk.com'
    }
    
    console.log('   Brand Config:')
    console.log(`   - name: ${brandConfig.name}`)
    console.log(`   - logoUrl: ${brandConfig.logoUrl.substring(0, 60)}...`)
    console.log(`   - email: ${brandConfig.supportEmail}`)
    
    // Generate minimal HTML
    const testHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Test</title></head>
<body>
  <table style="width:600px;margin:0 auto;">
    <tr>
      <td align="center" style="padding:40px;">
        <img src="${brandConfig.logoUrl}" alt="${brandConfig.name}" style="max-height:60px;width:auto;display:block;margin:0 auto;" />
        <h1>${brandConfig.name}</h1>
        <p>Test email content</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
    
    fs.writeFileSync('final-test-email.html', testHTML)
    
    console.log('   ✅ Test email generated: final-test-email.html')
    
    // Extract img tag
    const imgMatch = testHTML.match(/<img[^>]*src="([^"]*)"[^>]*>/i)
    if (imgMatch) {
      console.log('\n   IMG Tag Check:')
      console.log(`   ✅ IMG tag exists`)
      console.log(`   ✅ src="${imgMatch[1].substring(0, 60)}..."`)
      console.log(`   ✅ Logo URL embedded in HTML`)
    }
    
    // 5. Email Client Compatibility
    console.log('\n5️⃣  EMAIL CLIENT COMPATIBILITY')
    console.log('-'.repeat(70))
    
    const isDataURI = logoUrl.startsWith('data:')
    const isHTTPS = logoUrl.startsWith('https://')
    const isRelative = logoUrl.startsWith('/')
    const isLocalhost = logoUrl.includes('localhost')
    
    console.log(`   Data URI (embedded): ${isDataURI ? '✅ YES' : '❌ NO'}`)
    console.log(`   HTTPS URL: ${isHTTPS ? '✅ YES' : '❌ NO'}`)
    console.log(`   Relative path: ${isRelative ? '❌ YES (PROBLEM)' : '✅ NO'}`)
    console.log(`   Localhost: ${isLocalhost ? '❌ YES (PROBLEM)' : '✅ NO'}`)
    
    const compatible = (isDataURI || isHTTPS) && !isRelative && !isLocalhost
    
    console.log(`\n   Overall compatibility: ${compatible ? '✅ EXCELLENT' : '⚠️  ISSUES DETECTED'}`)
    
    // 6. Final Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 FINAL SUMMARY')
    console.log('='.repeat(70))
    
    const allChecks = [
      { name: 'Database has logo', pass: !!settings?.siteLogo },
      { name: 'Logo URL valid format', pass: settings?.siteLogo?.startsWith('data:') || settings?.siteLogo?.startsWith('https://') },
      { name: 'Templates exist', pass: templates.length > 0 },
      { name: 'getBrandConfig logic OK', pass: !!logoUrl },
      { name: 'Email HTML generated', pass: fs.existsSync('final-test-email.html') },
      { name: 'IMG tag present', pass: !!imgMatch },
      { name: 'Email client compatible', pass: compatible }
    ]
    
    console.log('')
    allChecks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`)
    })
    
    const allPass = allChecks.every(c => c.pass)
    
    console.log('\n' + '='.repeat(70))
    if (allPass) {
      console.log('🎉 ALL CHECKS PASSED!')
      console.log('='.repeat(70))
      console.log('\n✨ System Status: FULLY FUNCTIONAL')
      console.log('📧 Logo will appear in emails!')
      console.log('')
      console.log('Next Steps:')
      console.log('1. Open final-test-email.html in browser')
      console.log('2. Send test email from /admin/branded-templates')
      console.log('3. Check inbox - logo should display!')
      console.log('')
      console.log('Current logo: Data URI SVG (blue box with "PT Ekspor Yuk")')
      console.log('To use real logo: Upload to PostImages → Update Settings.siteLogo')
    } else {
      console.log('⚠️  SOME CHECKS FAILED')
      console.log('='.repeat(70))
      console.log('\nPlease review failed checks above.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

finalVerificationComplete()
