const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkMailketingSetup() {
  console.log('\n🔍 COMPREHENSIVE MAILKETING SYSTEM CHECK\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. Check environment variables
    console.log('\n1️⃣ ENVIRONMENT VARIABLES')
    console.log('-'.repeat(60))
    const envVars = {
      'MAILKETING_API_KEY': process.env.MAILKETING_API_KEY,
      'MAILKETING_API_URL': process.env.MAILKETING_API_URL,
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
      'NEXT_PUBLIC_APP_NAME': process.env.NEXT_PUBLIC_APP_NAME
    }
    
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        console.log(`   ✅ ${key}: ${key.includes('KEY') ? value.substring(0, 20) + '...' : value}`)
      } else {
        console.log(`   ❌ ${key}: NOT SET`)
      }
    }
    
    // 2. Check database settings
    console.log('\n2️⃣ DATABASE SETTINGS')
    console.log('-'.repeat(60))
    const mailketingSettings = await prisma.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'mailketing_' } },
          { key: { startsWith: 'email_' } }
        ]
      }
    })
    
    if (mailketingSettings.length > 0) {
      console.log(`   Found ${mailketingSettings.length} email-related settings:`)
      mailketingSettings.forEach(s => {
        const displayValue = s.key.includes('api_key') 
          ? (s.value?.substring(0, 20) + '...' || 'NULL')
          : s.value
        console.log(`   ✅ ${s.key} = ${displayValue}`)
      })
    } else {
      console.log('   ⚠️  No email settings found in database')
    }
    
    // 3. Check admin user
    console.log('\n3️⃣ ADMIN USER')
    console.log('-'.repeat(60))
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (admin) {
      console.log(`   ✅ Email: ${admin.email}`)
      console.log(`   ✅ Name: ${admin.name}`)
      console.log(`   ✅ Username: ${admin.username}`)
    } else {
      console.log('   ❌ No admin user found')
    }
    
    // 4. Check email templates
    console.log('\n4️⃣ EMAIL TEMPLATES')
    console.log('-'.repeat(60))
    const templates = await prisma.brandedTemplate.findMany({
      where: {
        OR: [
          { slug: 'reset-password' },
          { slug: 'password-reset-confirmation' },
          { slug: 'welcome' }
        ]
      }
    })
    
    const requiredTemplates = ['reset-password', 'password-reset-confirmation']
    requiredTemplates.forEach(slug => {
      const found = templates.find(t => t.slug === slug)
      if (found) {
        console.log(`   ✅ ${slug}: ${found.name} (${found.isActive ? 'Active' : 'Inactive'})`)
      } else {
        console.log(`   ❌ ${slug}: NOT FOUND`)
      }
    })
    
    // 5. Check recent password reset tokens
    console.log('\n5️⃣ PASSWORD RESET TOKENS')
    console.log('-'.repeat(60))
    const tokens = await prisma.passwordResetToken.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    })
    
    if (tokens.length > 0) {
      console.log(`   Found ${tokens.length} recent tokens:`)
      tokens.forEach((t, i) => {
        const isExpired = new Date(t.expiresAt) < new Date()
        console.log(`   ${i + 1}. ${t.user.email}`)
        console.log(`      Token: ${t.token.substring(0, 10)}...`)
        console.log(`      Status: ${isExpired ? '❌ Expired' : '✅ Active'}`)
        console.log(`      Created: ${t.createdAt.toLocaleString('id-ID')}`)
        console.log(`      Expires: ${t.expiresAt.toLocaleString('id-ID')}`)
      })
    } else {
      console.log('   ℹ️  No password reset requests yet')
    }
    
    // 6. Test Mailketing API connection
    console.log('\n6️⃣ MAILKETING API CONNECTION TEST')
    console.log('-'.repeat(60))
    
    const apiKey = process.env.MAILKETING_API_KEY || 
                   mailketingSettings.find(s => s.key === 'mailketing_api_key')?.value
    const apiUrl = process.env.MAILKETING_API_URL || 
                   mailketingSettings.find(s => s.key === 'mailketing_api_url')?.value ||
                   'https://api.mailketing.co.id/api/v1'
    
    if (!apiKey) {
      console.log('   ❌ Cannot test: MAILKETING_API_KEY not found')
    } else {
      console.log(`   Testing API: ${apiUrl}/send`)
      console.log(`   API Key: ${apiKey.substring(0, 20)}...`)
      
      try {
        const params = new URLSearchParams()
        params.append('api_token', apiKey)
        params.append('recipient', 'test@example.com')
        params.append('content', '<h1>Test</h1>')
        params.append('from_email', 'noreply@eksporyuk.com')
        params.append('from_name', 'EksporYuk')
        
        const response = await fetch(`${apiUrl}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        })
        
        console.log(`   Response Status: ${response.status} ${response.statusText}`)
        
        const text = await response.text()
        console.log(`   Response: ${text.substring(0, 200)}`)
        
        if (response.ok) {
          console.log('   ✅ API is reachable and accepting requests')
        } else {
          console.log('   ⚠️  API responded with error')
        }
      } catch (error) {
        console.log(`   ❌ Connection failed: ${error.message}`)
      }
    }
    
    // 7. Summary and recommendations
    console.log('\n7️⃣ DIAGNOSIS & RECOMMENDATIONS')
    console.log('-'.repeat(60))
    
    const issues = []
    
    if (!apiKey) {
      issues.push('❌ MAILKETING_API_KEY not configured')
    }
    
    if (!admin) {
      issues.push('❌ No admin user to test with')
    }
    
    const resetTemplate = templates.find(t => t.slug === 'reset-password')
    if (!resetTemplate) {
      issues.push('❌ reset-password template missing')
    }
    
    if (issues.length > 0) {
      console.log('\n   ⚠️  ISSUES FOUND:')
      issues.forEach(issue => console.log(`   ${issue}`))
    } else {
      console.log('\n   ✅ All basic checks passed!')
    }
    
    console.log('\n   📋 NEXT STEPS:')
    if (!apiKey) {
      console.log('   1. Add MAILKETING_API_KEY to .env file')
      console.log('   2. Or insert into settings table:')
      console.log('      INSERT INTO Setting (key, value) VALUES ("mailketing_api_key", "your-key-here");')
    }
    if (issues.length === 0) {
      console.log('   1. Visit: http://localhost:3000/forgot-password')
      console.log(`   2. Enter email: ${admin?.email || 'admin@eksporyuk.com'}`)
      console.log('   3. Check server console logs for detailed output')
      console.log('   4. Check email inbox')
    }
    
    console.log('\n' + '='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ Check failed:', error)
  }
  
  await prisma.$disconnect()
}

checkMailketingSetup().catch(console.error)
