import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixUserProfile() {
  try {
    console.log('🔍 Checking for existing admin user...')
    
    // Check if admin user exists
    let admin = await prisma.user.findUnique({
      where: { email: 'admin@eksporyuk.com' }
    })
    
    if (!admin) {
      console.log('❌ Admin user not found in database!')
      console.log('🔧 Creating new admin user...')
      
      // Create admin user
      admin = await prisma.user.create({
        data: {
          id: 'cmil1gsx50004itjv2dz0j9a2', // Use the session user ID
          email: 'admin@eksporyuk.com',
          name: 'Admin Eksporyuk',
          username: 'admin',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'ADMIN',
          avatar: 'https://ui-avatars.com/api/?name=Admin+Eksporyuk&background=3b82f6&color=fff',
          emailVerified: new Date(),
          phone: '+628123456789',
          whatsapp: '+628123456789',
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          profileCompleted: true,
        }
      })
      
      console.log('✅ Admin user created:', admin.email)
    } else {
      console.log('✅ Admin user already exists:', admin.email)
    }
    
    console.log('\n📊 User Details:')
    console.log('ID:', admin.id)
    console.log('Email:', admin.email)
    console.log('Name:', admin.name)
    console.log('Role:', admin.role)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserProfile()
