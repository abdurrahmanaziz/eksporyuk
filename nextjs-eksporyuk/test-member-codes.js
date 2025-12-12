/**
 * Test script untuk memverifikasi fitur Update Member ID
 * Jalankan dengan: node test-member-codes.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMemberCodes() {
  console.log('🔍 Memulai test Member ID system...\n')

  try {
    // 1. Count total users
    const totalUsers = await prisma.user.count()
    console.log(`1️⃣ Total Users: ${totalUsers}`)

    // 2. Count users with memberCode
    const usersWithCode = await prisma.user.count({
      where: {
        memberCode: { not: null },
        NOT: { memberCode: '' }
      }
    })
    console.log(`2️⃣ Users dengan Member ID: ${usersWithCode}`)

    // 3. Count users without memberCode
    const usersWithoutCode = await prisma.user.count({
      where: {
        OR: [
          { memberCode: null },
          { memberCode: '' }
        ]
      }
    })
    console.log(`3️⃣ Users tanpa Member ID: ${usersWithoutCode}`)

    // 4. Show sample of users without memberCode
    if (usersWithoutCode > 0) {
      console.log('\n📋 Sample users tanpa Member ID:')
      const sampleUsers = await prisma.user.findMany({
        where: {
          OR: [
            { memberCode: null },
            { memberCode: '' }
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          memberCode: true,
          createdAt: true
        }
      })
      sampleUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name} (${user.email})`)
      })
    }

    // 5. Show existing memberCodes format
    console.log('\n📋 Sample Member IDs yang sudah ada:')
    const existingCodes = await prisma.user.findMany({
      where: {
        memberCode: { not: null },
        NOT: { memberCode: '' }
      },
      take: 10,
      orderBy: { memberCode: 'desc' },
      select: {
        memberCode: true,
        name: true
      }
    })
    existingCodes.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.memberCode} - ${user.name}`)
    })

    // 6. Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SUMMARY:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Total Users:           ${totalUsers}`)
    console.log(`   Punya Member ID:       ${usersWithCode} (${((usersWithCode / totalUsers) * 100).toFixed(1)}%)`)
    console.log(`   Belum punya Member ID: ${usersWithoutCode} (${((usersWithoutCode / totalUsers) * 100).toFixed(1)}%)`)
    
    if (usersWithoutCode > 0) {
      console.log('\n📝 AKSI YANG DIPERLUKAN:')
      console.log('   1. Buka /admin/users')
      console.log('   2. Klik tombol "Update Member ID" berwarna orange')
      console.log(`   3. ${usersWithoutCode} user akan diberi Member ID format EYxxxx`)
    } else {
      console.log('\n✅ Semua user sudah memiliki Member ID!')
    }
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMemberCodes()
