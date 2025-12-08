const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users...\n')
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    console.log(`Found ${admins.length} admin users:\n`)
    admins.forEach((admin, i) => {
      console.log(`${i + 1}. ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   ID: ${admin.id}\n`)
    })

    if (admins.length === 0) {
      console.log('⚠️  No admin users found! Creating one...\n')
      
      const bcrypt = require('bcryptjs')
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
      
      console.log('✅ Admin created:')
      console.log(`   Email: ${newAdmin.email}`)
      console.log(`   Password: password123`)
      console.log(`   Role: ${newAdmin.role}\n`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminUsers()
