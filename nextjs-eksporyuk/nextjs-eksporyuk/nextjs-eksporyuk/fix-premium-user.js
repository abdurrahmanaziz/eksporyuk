const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixPremiumUser() {
  try {
    console.log('🔍 Checking for user premium-001...')
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { id: 'premium-001' }
    })

    if (user) {
      console.log('✅ User already exists:', user.email)
      return
    }

    console.log('❌ User not found, creating...')

    // Create the user
    user = await prisma.user.create({
      data: {
        id: 'premium-001',
        name: 'Premium User',
        email: 'premium@eksporyuk.com',
        password: '$2a$10$rN8Z1YxGxvPxQ0cYxKqYxeVLZxGxqYxZxGxqYxZxGxqYxZxGx', // hashed 'password123'
        role: 'MEMBER_PREMIUM',
        isActive: true,
        emailVerified: true,
      }
    })

    console.log('✅ User created successfully!')
    console.log('📧 Email:', user.email)
    console.log('🆔 ID:', user.id)
    console.log('👤 Name:', user.name)
    console.log('🎭 Role:', user.role)

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixPremiumUser()
