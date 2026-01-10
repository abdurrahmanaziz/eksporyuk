/**
 * FIX SESSION MISMATCH
 * Script untuk memperbaiki session user yang tidak cocok dengan database
 * Jalankan: node fix-session-mismatch.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixSessionMismatch() {
  try {
    console.log('🔍 Checking database users...\n')

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    })

    if (users.length === 0) {
      console.log('❌ No users found in database!')
      console.log('Run: node scripts/quick-seed.js')
      return
    }

    console.log('✅ Users in database:')
    console.log('=' .repeat(70))
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log('-'.repeat(70))
    })

    console.log('\n🔧 SOLUTION:')
    console.log('=' .repeat(70))
    console.log('1. Clear browser cookies for localhost:3000')
    console.log('   - Open DevTools (F12)')
    console.log('   - Go to: Application → Cookies → http://localhost:3000')
    console.log('   - Delete all cookies (especially next-auth.*)')
    console.log('')
    console.log('2. Go to: http://localhost:3000/login')
    console.log('3. Login with one of these accounts:')
    console.log('   Email: admin@eksporyuk.com')
    console.log('   Password: password123')
    console.log('')
    console.log('3. Or use this JavaScript in browser console:')
    console.log('   document.cookie.split(";").forEach(c => {')
    console.log('     document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC"')
    console.log('   })')
    console.log('   Then reload and login again')
    console.log('=' .repeat(70))

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixSessionMismatch()
