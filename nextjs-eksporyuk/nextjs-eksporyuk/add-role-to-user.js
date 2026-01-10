/**
 * Script: Add MEMBER_PREMIUM role to user Rifki
 * 
 * This demonstrates how the multi-role system works:
 * 1. User has primary role (User.role) - e.g., AFFILIATE
 * 2. User can have additional roles in UserRole table - e.g., MEMBER_PREMIUM
 * 3. DashboardSelector reads from UserRole table to show all available dashboards
 */

const { PrismaClient } = require('@prisma/client')
const { nanoid } = require('nanoid')

const prisma = new PrismaClient()

const USER_EMAIL = 'dherifkyalazhary29@gmail.com'
const NEW_ROLE = 'MEMBER_PREMIUM'

async function addRoleToUser() {
  try {
    console.log('\n🔧 Adding role to user...')
    console.log('========================')
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userRoles: {
          select: { id: true, role: true }
        }
      }
    })
    
    if (!user) {
      console.error('❌ User not found:', USER_EMAIL)
      return
    }
    
    console.log('\n📋 Current User Data:')
    console.log('  ID:', user.id)
    console.log('  Name:', user.name)
    console.log('  Email:', user.email)
    console.log('  Primary Role:', user.role)
    console.log('  UserRoles:', JSON.stringify(user.userRoles, null, 2))
    
    // Check if role already exists
    const existingRole = user.userRoles.find(r => r.role === NEW_ROLE)
    if (existingRole) {
      console.log(`\n✅ User already has ${NEW_ROLE} role in UserRole table`)
      return
    }
    
    // Add new role
    console.log(`\n➕ Adding ${NEW_ROLE} role to UserRole table...`)
    const newUserRole = await prisma.userRole.create({
      data: {
        id: `role_${nanoid()}`,
        userId: user.id,
        role: NEW_ROLE
      }
    })
    
    console.log('✅ Role added successfully!')
    console.log('  Role ID:', newUserRole.id)
    console.log('  Role:', newUserRole.role)
    
    // Verify
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        role: true,
        userRoles: {
          select: { id: true, role: true }
        }
      }
    })
    
    console.log('\n📋 Updated User Data:')
    console.log('  Name:', updatedUser.name)
    console.log('  Primary Role:', updatedUser.role)
    console.log('  All Roles (from UserRole table):')
    updatedUser.userRoles.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.role} (ID: ${r.id})`)
    })
    
    console.log('\n🎯 Now when this user logs in:')
    console.log('  - They will see Dashboard Selector (because they have multiple roles)')
    console.log('  - Available dashboards:')
    console.log('    1. Member Dashboard (from MEMBER_PREMIUM role)')
    console.log('    2. Affiliate Dashboard (from AFFILIATE role)')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addRoleToUser()
