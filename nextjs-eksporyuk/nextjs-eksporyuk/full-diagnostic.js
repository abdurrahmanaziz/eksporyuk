const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function fullDiagnostic() {
  try {
    console.log('🔍 FULL SYSTEM DIAGNOSTIC\n')
    console.log('=' .repeat(60))
    
    // 1. Check database connection
    console.log('\n1️⃣ CHECKING DATABASE CONNECTION...')
    await prisma.$connect()
    console.log('✅ Database connected\n')

    // 2. Check admin users
    console.log('2️⃣ CHECKING ADMIN USERS...')
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      }
    })

    console.log(`Found ${admins.length} admin users\n`)

    if (admins.length === 0) {
      console.log('⚠️  NO ADMIN USERS FOUND! Creating one...\n')
      
      const hashedPassword = await bcrypt.hash('password123', 10)
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@eksporyuk.com',
          name: 'Admin Ekspor',
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: true,
          wallet: {
            create: {
              balance: 0,
            },
          },
        },
      })
      
      console.log('✅ ADMIN CREATED!')
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   Password: password123`)
      console.log(`   Role: ${newAdmin.role}\n`)
    } else {
      console.log('✅ Admin users exist:')
      for (const admin of admins) {
        console.log(`   - ${admin.email} (${admin.name})`)
        console.log(`     Has password: ${!!admin.password}`)
        
        // Test password
        if (admin.password) {
          const isValid = await bcrypt.compare('password123', admin.password)
          console.log(`     Password 'password123' works: ${isValid}`)
          
          if (!isValid) {
            console.log(`     ⚠️  RESETTING PASSWORD...`)
            const newHash = await bcrypt.hash('password123', 10)
            await prisma.user.update({
              where: { id: admin.id },
              data: { password: newHash }
            })
            console.log(`     ✅ Password reset to: password123`)
          }
        }
        console.log('')
      }
    }

    // 3. Check total users
    console.log('3️⃣ CHECKING ALL USERS...')
    const totalUsers = await prisma.user.count()
    const byRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })
    
    console.log(`   Total users: ${totalUsers}`)
    byRole.forEach(r => {
      console.log(`   - ${r.role}: ${r._count}`)
    })
    console.log('')

    // 4. Test auth manually
    console.log('4️⃣ TESTING AUTH MANUALLY...')
    const testEmail = 'admin@eksporyuk.com'
    const testPassword = 'password123'
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    
    if (!user) {
      console.log('❌ Test user not found!')
    } else {
      console.log(`✅ User found: ${user.email}`)
      
      if (!user.password) {
        console.log('❌ User has NO password!')
      } else {
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log(`   Password valid: ${isValid}`)
        
        if (isValid) {
          console.log('   ✅ LOGIN SHOULD WORK!')
        } else {
          console.log('   ❌ PASSWORD MISMATCH!')
        }
      }
    }
    console.log('')

    // 5. Check environment variables
    console.log('5️⃣ CHECKING ENVIRONMENT VARIABLES...')
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`)
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}`)
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'Not set (using default)'}`)
    console.log('')

    console.log('=' .repeat(60))
    console.log('\n✅ DIAGNOSTIC COMPLETE!\n')
    console.log('📋 CREDENTIALS TO TEST:')
    console.log('   Email: admin@eksporyuk.com')
    console.log('   Password: password123\n')

  } catch (error) {
    console.error('❌ DIAGNOSTIC ERROR:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

fullDiagnostic()
