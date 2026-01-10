const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@eksporyuk.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        username: true
      }
    })
    
    if (admin) {
      console.log('✅ Admin found:')
      console.log(JSON.stringify(admin, null, 2))
    } else {
      console.log('❌ Admin not found with email: admin@eksporyuk.com')
      
      // Try to find any admin
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })
      
      console.log('\nAll admins:', JSON.stringify(admins, null, 2))
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
