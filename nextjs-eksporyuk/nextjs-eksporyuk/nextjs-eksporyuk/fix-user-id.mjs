import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fixUser() {
  try {
    console.log('🔧 Fixing user ID mismatch...\n')
    
    const sessionUserId = 'cmil1gsx50004itjv2dz0j9a2' // From session
    const currentUserId = 'cmitrz6yx00045tcty2iehi0' // In database
    
    console.log('Session User ID:', sessionUserId)
    console.log('Database User ID:', currentUserId)
    
    // Check if session user ID exists
    const existingUser = await prisma.user.findUnique({
      where: { id: sessionUserId }
    })
    
    if (existingUser) {
      console.log('\n✅ User with session ID already exists!')
      console.log('Email:', existingUser.email)
      console.log('Name:', existingUser.name)
      return
    }
    
    console.log('\n❌ User with session ID not found')
    console.log('🔄 Recreating user with correct ID...')
    
    // Delete current admin
    await prisma.user.delete({
      where: { id: currentUserId }
    }).catch(() => console.log('   (Current user already deleted)'))
    
    // Recreate with session ID
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
    
    console.log('\n✅ User recreated successfully!')
    console.log('ID:', user.id)
    console.log('Email:', user.email)
    console.log('Name:', user.name)
    console.log('Role:', user.role)
    
    console.log('\n🎉 Profile page should work now!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\n💡 Alternative: Logout and login again to clear session')
  } finally {
    await prisma.$disconnect()
  }
}

fixUser()
