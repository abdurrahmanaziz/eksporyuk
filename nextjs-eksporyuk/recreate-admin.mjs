import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function recreateAdmin() {
  try {
    console.log('🔧 Recreating admin user with correct ID...\n')
    
    const sessionUserId = 'cmil1gsx50004itjv2dz0j9a2'
    
    // Delete all admin@eksporyuk.com users
    await prisma.user.deleteMany({
      where: { email: 'admin@eksporyuk.com' }
    })
    console.log('✅ Deleted existing admin user(s)')
    
    // Create new admin with session ID
    const user = await prisma.user.create({
      data: {
        id: sessionUserId,
        email: 'admin@eksporyuk.com',
        name: 'Admin Eksporyuk',
        username: 'admin',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Admin+Eksporyuk&background=3b82f6&color=fff',
        emailVerified: true,
        phone: '+628123456789',
        whatsapp: '+628123456789',
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        profileCompleted: true,
      }
    })
    
    console.log('\n✅ Admin user recreated successfully!')
    console.log('ID:', user.id)
    console.log('Email:', user.email)
    console.log('Name:', user.name)
    console.log('Role:', user.role)
    console.log('\n🎉 Profile page should work now! Refresh browser.')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

recreateAdmin()
