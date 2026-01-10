const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createDummyUser() {
  try {
    // Cek user yang ada
    const users = await prisma.user.findMany()
    console.log('Existing users:', users.length)
    
    if (users.length === 0) {
      console.log('\n🔄 Creating dummy affiliate user...')
      
      const user = await prisma.user.create({
        data: {
          email: 'affiliate@test.com',
          name: 'Test Affiliate',
          password: 'hashed_password_here', // Dummy password
          role: 'AFFILIATE',
          username: 'testaffiliate',
        }
      })
      
      console.log('✅ User created!')
      console.log('   ID:', user.id)
      console.log('   Email:', user.email)
      console.log('   Role:', user.role)
      
      return user.id
    } else {
      console.log('\nExisting users:')
      users.forEach(u => {
        console.log(`- ${u.name} (${u.email}) - Role: ${u.role} - ID: ${u.id}`)
      })
      return users[0].id
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createDummyUser()
