const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function makeUserAdmin() {
  try {
    const email = process.argv[2]
    
    if (!email) {
      console.log('Usage: node make-admin.js <email>')
      console.log('Example: node make-admin.js user@example.com')
      process.exit(1)
    }

    console.log(`🔍 Looking for user: ${email}\n`)
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`)
      process.exit(1)
    }

    console.log('Found user:')
    console.log(`  Name: ${user.name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Current Role: ${user.role}\n`)

    if (user.role === 'ADMIN') {
      console.log('✅ User is already an ADMIN!')
      process.exit(0)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    })

    console.log('✅ User updated to ADMIN!')
    console.log(`  New Role: ${updated.role}\n`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

makeUserAdmin()
