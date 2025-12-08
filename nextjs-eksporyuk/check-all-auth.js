const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function checkAll() {
  console.log('🔍 COMPREHENSIVE AUTH CHECK\n')
  console.log('='.repeat(60))
  
  // 1. Check Database
  console.log('\n1️⃣ DATABASE CHECK')
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, password: true }
    })
    
    console.log(`✅ Found ${admins.length} admin users`)
    
    for (const admin of admins) {
      const passwordWorks = await bcrypt.compare('password123', admin.password)
      console.log(`   - ${admin.email}`)
      console.log(`     Name: ${admin.name}`)
      console.log(`     Password hash exists: ${!!admin.password}`)
      console.log(`     Password 'password123' works: ${passwordWorks ? '✅' : '❌'}`)
    }
  } catch (error) {
    console.error('❌ Database error:', error.message)
  }
  
  // 2. Check Environment Variables
  console.log('\n2️⃣ ENVIRONMENT VARIABLES')
  const requiredEnvs = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  for (const env of requiredEnvs) {
    const value = process.env[env]
    if (value) {
      console.log(`✅ ${env}: ${env === 'DATABASE_URL' ? 'Set' : value}`)
    } else {
      console.log(`❌ ${env}: NOT SET`)
    }
  }
  
  // 3. Check Files Exist
  console.log('\n3️⃣ CRITICAL FILES CHECK')
  const criticalFiles = [
    'src/lib/auth-options.ts',
    'src/app/api/auth/[...nextauth]/route.ts',
    'src/app/auth/login/page.tsx',
    'src/middleware.ts',
    '.env.local',
  ]
  
  for (const file of criticalFiles) {
    const fullPath = path.join(__dirname, file)
    const exists = fs.existsSync(fullPath)
    console.log(`${exists ? '✅' : '❌'} ${file}`)
  }
  
  // 4. Check auth-options.ts for syntax errors
  console.log('\n4️⃣ AUTH-OPTIONS.TS SYNTAX')
  try {
    const authOptionsPath = path.join(__dirname, 'src/lib/auth-options.ts')
    const content = fs.readFileSync(authOptionsPath, 'utf-8')
    
    // Check for common issues
    const issues = []
    
    if (!content.includes('async authorize(credentials)')) {
      issues.push('❌ Missing authorize function')
    } else {
      console.log('✅ authorize() function exists')
    }
    
    if (!content.includes('CredentialsProvider')) {
      issues.push('❌ Missing CredentialsProvider')
    } else {
      console.log('✅ CredentialsProvider imported')
    }
    
    if (!content.includes('export const authOptions')) {
      issues.push('❌ Missing authOptions export')
    } else {
      console.log('✅ authOptions exported')
    }
    
    // Check for duplicate catch blocks
    const catchMatches = content.match(/} catch \(/g)
    const tryMatches = content.match(/try {/g)
    if (catchMatches && tryMatches && catchMatches.length === tryMatches.length) {
      console.log('✅ No duplicate catch blocks')
    } else {
      console.log(`⚠️  Try blocks: ${tryMatches?.length || 0}, Catch blocks: ${catchMatches?.length || 0}`)
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues found:')
      issues.forEach(issue => console.log(`   ${issue}`))
    }
  } catch (error) {
    console.error('❌ Error reading auth-options.ts:', error.message)
  }
  
  // 5. Check NextAuth route handler
  console.log('\n5️⃣ NEXTAUTH ROUTE HANDLER')
  try {
    const routePath = path.join(__dirname, 'src/app/api/auth/[...nextauth]/route.ts')
    const content = fs.readFileSync(routePath, 'utf-8')
    
    if (content.includes('export { handler as GET, handler as POST }')) {
      console.log('✅ GET and POST handlers exported')
    } else {
      console.log('❌ Missing GET/POST exports')
    }
    
    if (content.includes('import { authOptions }')) {
      console.log('✅ authOptions imported')
    } else {
      console.log('❌ authOptions not imported')
    }
  } catch (error) {
    console.error('❌ Error reading route.ts:', error.message)
  }
  
  // 6. Check login page
  console.log('\n6️⃣ LOGIN PAGE')
  try {
    const loginPath = path.join(__dirname, 'src/app/auth/login/page.tsx')
    const content = fs.readFileSync(loginPath, 'utf-8')
    
    if (content.includes("import { signIn } from 'next-auth/react'")) {
      console.log('✅ signIn imported from next-auth/react')
    } else {
      console.log('❌ signIn not properly imported')
    }
    
    if (content.includes("signIn('credentials'")) {
      console.log('✅ signIn() called with credentials provider')
    } else {
      console.log('❌ signIn() not called correctly')
    }
    
    if (content.includes('redirect: false')) {
      console.log('✅ redirect: false set')
    } else {
      console.log('⚠️  redirect: false not set (might auto-redirect)')
    }
  } catch (error) {
    console.error('❌ Error reading login page:', error.message)
  }
  
  // 7. Test actual authentication flow
  console.log('\n7️⃣ MANUAL AUTH TEST')
  try {
    const testEmail = 'admin@eksporyuk.com'
    const testPassword = 'password123'
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    
    if (!user) {
      console.log(`❌ User ${testEmail} not found`)
    } else {
      console.log(`✅ User found: ${user.email}`)
      
      if (!user.password) {
        console.log('❌ User has no password')
      } else {
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log(`${isValid ? '✅' : '❌'} Password '${testPassword}' is ${isValid ? 'VALID' : 'INVALID'}`)
        
        if (isValid) {
          console.log(`✅ User role: ${user.role}`)
          console.log('✅ LOGIN SHOULD WORK!')
        }
      }
    }
  } catch (error) {
    console.error('❌ Manual test error:', error.message)
  }
  
  // 8. Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 NEXT STEPS TO DEBUG:')
  console.log('1. Open browser DevTools → Network tab')
  console.log('2. Go to http://localhost:3000/auth/login')
  console.log('3. Enter: admin@eksporyuk.com / password123')
  console.log('4. Click login and watch for:')
  console.log('   - POST request to /api/auth/callback/credentials')
  console.log('   - Check request payload')
  console.log('   - Check response status')
  console.log('5. Check browser Console for [LOGIN] logs')
  console.log('6. Check terminal for [AUTH] logs')
  console.log('\n📌 If NO POST request appears:')
  console.log('   → signIn() function not working')
  console.log('   → Check next-auth package version')
  console.log('   → Try: npm install next-auth@latest')
  console.log('\n📌 If POST request but no [AUTH] logs:')
  console.log('   → authorize() function not being called')
  console.log('   → Check auth-options.ts for syntax errors')
  console.log('   → Check if NEXTAUTH_SECRET is same in .env and .env.local')
  console.log('='.repeat(60))
  
  await prisma.$disconnect()
}

checkAll().catch(console.error)
