const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testResetPasswordUrl() {
  console.log('🧪 Testing Reset Password URL Generation\n')
  
  // Simulate env vars
  const envVars = {
    'NEXTAUTH_URL (clean)': 'https://eksporyuk.com',
    'NEXTAUTH_URL (with newline)': 'https://eksporyuk.com\n',
    'NEXTAUTH_URL (with space)': 'https://eksporyuk.com ',
    'NEXT_PUBLIC_APP_URL (with \\n)': 'https://eksporyuk.com\\n'
  }
  
  console.log('=== Test 1: URL Generation ===\n')
  
  for (const [label, value] of Object.entries(envVars)) {
    const token = 'test123token'
    
    // Without trim
    const urlWithoutTrim = `${value}/auth/reset-password?token=${token}`
    
    // With trim
    const urlWithTrim = `${value.trim()}/auth/reset-password?token=${token}`
    
    console.log(`${label}:`)
    console.log(`  Without trim: "${urlWithoutTrim}"`)
    console.log(`  With trim:    "${urlWithTrim}"`)
    console.log(`  Has space:    ${urlWithoutTrim.includes(' ')}`)
    console.log('')
  }
  
  console.log('\n=== Test 2: Template Variable Matching ===\n')
  
  const template = await prisma.brandedTemplate.findFirst({
    where: { slug: 'reset-password' },
    select: { 
      name: true,
      slug: true,
      subject: true,
      content: true,
      ctaLink: true,
      ctaText: true
    }
  })
  
  if (template) {
    console.log('✅ Reset password template found:', template.name)
    console.log('\nTemplate variables:')
    
    // Extract variables
    const allText = `${template.subject} ${template.content} ${template.ctaLink || ''}`
    const variables = allText.match(/\{\{([^}]+)\}\}/g)
    
    if (variables) {
      const uniqueVars = [...new Set(variables)]
      uniqueVars.forEach(v => console.log(`  - ${v}`))
    }
    
    console.log('\nVariables sent by code:')
    console.log('  - {{userName}}')
    console.log('  - {{resetUrl}}     ← FIXED (was resetLink)')
    console.log('  - {{resetLink}}    ← Fallback compatibility')
    console.log('  - {{expiryTime}}')
    console.log('  - {{appName}}')
    
    // Check mismatch
    const templateVars = template.ctaLink || ''
    if (templateVars.includes('{{resetUrl}}')) {
      console.log('\n✅ Template uses {{resetUrl}} - MATCHES code now!')
    } else if (templateVars.includes('{{resetLink}}')) {
      console.log('\n⚠️ Template uses {{resetLink}} - need to update template')
    }
  } else {
    console.log('❌ No reset-password template found')
  }
  
  console.log('\n=== Test 3: Expected URLs ===\n')
  
  const testToken = '82a03c20c7f2c4462a2ef445632d6a704ac3befec3b6449f6583dbe8b94c7149'
  
  console.log('❌ WRONG (with space):')
  console.log(`https://eksporyuk.com /auth/reset-password?token=${testToken}`)
  
  console.log('\n✅ CORRECT (no space):')
  console.log(`https://eksporyuk.com/auth/reset-password?token=${testToken}`)
  
  await prisma.$disconnect()
}

testResetPasswordUrl().catch(console.error)
