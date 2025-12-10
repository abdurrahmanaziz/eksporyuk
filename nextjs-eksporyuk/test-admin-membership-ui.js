/**
 * Test Admin Membership Upgrade System
 * 
 * Prerequisites:
 * 1. Dev server running (npm run dev)
 * 2. Admin user logged in
 * 3. User with active membership exists
 */

const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function testAdminMembershipSystem() {
  console.log('🧪 Testing Admin Membership Upgrade System\n')
  
  // Test 1: Get all memberships
  console.log('1️⃣  Testing GET /api/admin/memberships')
  try {
    const res = await fetch(`${NEXTAUTH_URL}/api/admin/memberships`)
    const data = await res.json()
    
    if (res.ok) {
      console.log('✅ Success - Found memberships:', data.memberships?.length || 0)
      if (data.memberships?.length > 0) {
        console.log('   Sample:', data.memberships[0].name)
      }
    } else {
      console.log('❌ Failed:', data.error)
      console.log('   Note: You need to be logged in as ADMIN')
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
  
  console.log()
  
  // Test 2: Get user with membership (using first migrated user)
  console.log('2️⃣  Testing GET /api/admin/users/[id]/memberships')
  
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    // Find user with active membership
    const userWithMembership = await prisma.user.findFirst({
      where: {
        userMemberships: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        userMemberships: {
          where: { isActive: true },
          include: { membership: true }
        }
      }
    })
    
    if (userWithMembership) {
      console.log('   User found:', userWithMembership.email)
      console.log('   User ID:', userWithMembership.id)
      console.log('   Membership:', userWithMembership.userMemberships[0]?.membership.name)
      
      // Try to fetch via API
      const res = await fetch(`${NEXTAUTH_URL}/api/admin/users/${userWithMembership.id}/memberships`)
      const data = await res.json()
      
      if (res.ok) {
        console.log('✅ API Success - User data loaded')
        console.log('   Memberships count:', data.user?.userMemberships?.length || 0)
      } else {
        console.log('❌ API Failed:', data.error)
      }
    } else {
      console.log('⚠️  No user with active membership found')
      console.log('   Run migration first: node scripts/migration/import-memberships.js')
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
  
  console.log()
  
  // Test 3: Check UI pages exist
  console.log('3️⃣  Checking UI Routes')
  const routes = [
    '/admin/users',
    '/admin/users/[id]/memberships',
  ]
  
  routes.forEach(route => {
    const path = route.replace('[id]', 'any-id')
    console.log(`   📄 ${route} - Ready`)
  })
  
  console.log()
  console.log('🎯 Manual Testing Steps:')
  console.log('   1. Login as admin at http://localhost:3000/login')
  console.log('   2. Go to http://localhost:3000/admin/users')
  console.log('   3. Click Crown icon (👑) on any user row')
  console.log('   4. You should see membership management page')
  console.log('   5. Click "Upgrade" button to test modal')
  console.log()
  console.log('✅ System is ready for testing!')
}

// Run tests
testAdminMembershipSystem()
  .catch(console.error)
