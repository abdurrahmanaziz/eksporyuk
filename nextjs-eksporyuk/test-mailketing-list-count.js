/**
 * Test script untuk melihat user count per list
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n===== TEST MAILKETING LIST COUNT =====\n')
  
  // 1. Cek total user
  const totalUsers = await prisma.user.count()
  console.log(`📊 Total users: ${totalUsers}`)
  
  // 2. Cek user dengan mailketingLists
  const usersWithLists = await prisma.user.findMany({
    where: {
      mailketingLists: { not: null }
    },
    select: {
      id: true,
      email: true,
      name: true,
      mailketingLists: true
    }
  })
  
  console.log(`\n📋 Users dengan mailketingLists: ${usersWithLists.length}`)
  
  if (usersWithLists.length > 0) {
    console.log('\n--- Detail Users ---')
    usersWithLists.forEach(user => {
      console.log(`\n  User: ${user.name || 'No name'} (${user.email})`)
      console.log(`  Lists: ${JSON.stringify(user.mailketingLists)}`)
    })
  } else {
    console.log('  ⚠️  Tidak ada user dengan mailketingLists!\n')
  }
  
  // 3. Test query untuk list tertentu
  console.log('\n--- Test Query untuk List ID 44140 (Affiliate Ekspor Yuk) ---')
  
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM User 
      WHERE mailketingLists IS NOT NULL 
      AND (
        json_extract(mailketingLists, '$') LIKE ${'%"44140"%'}
        OR json_extract(mailketingLists, '$') LIKE ${'%44140%'}
      )
    `
    console.log('Count:', result[0]?.count || 0)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
  
  // 4. Buat test user dengan mailketingLists
  console.log('\n--- Membuat Test User ---')
  
  const testEmail = 'test-mailketing@eksporyuk.com'
  
  // Delete jika sudah ada
  await prisma.user.deleteMany({
    where: { email: testEmail }
  })
  
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Mailketing User',
      password: 'hashed',
      emailVerified: true,
      mailketingLists: ["44140", "39870", "30965"] // 3 list IDs
    }
  })
  
  console.log(`✅ Created test user: ${testUser.email}`)
  console.log(`   Lists: ${JSON.stringify(testUser.mailketingLists)}`)
  
  // 5. Test query lagi
  console.log('\n--- Test Query Lagi setelah Create User ---')
  
  const counts = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM User 
      WHERE mailketingLists IS NOT NULL 
      AND (
        json_extract(mailketingLists, '$') LIKE ${'%"44140"%'}
        OR json_extract(mailketingLists, '$') LIKE ${'%44140%'}
      )
    `,
    prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM User 
      WHERE mailketingLists IS NOT NULL 
      AND (
        json_extract(mailketingLists, '$') LIKE ${'%"39870"%'}
        OR json_extract(mailketingLists, '$') LIKE ${'%39870%'}
      )
    `,
    prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM User 
      WHERE mailketingLists IS NOT NULL 
      AND (
        json_extract(mailketingLists, '$') LIKE ${'%"30965"%'}
        OR json_extract(mailketingLists, '$') LIKE ${'%30965%'}
      )
    `
  ])
  
  console.log(`  List 44140 (Affiliate Ekspor Yuk): ${counts[0][0]?.count || 0} users`)
  console.log(`  List 39870 (Aplikasi EYA): ${counts[1][0]?.count || 0} users`)
  console.log(`  List 30965 (Free Member): ${counts[2][0]?.count || 0} users`)
  
  console.log('\n✅ Test selesai!\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
