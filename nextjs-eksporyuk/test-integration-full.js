// Test integrasi lengkap membership system dengan database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDatabaseIntegration() {
  console.log('🔍 TEST INTEGRASI DATABASE MEMBERSHIP\n')
  console.log('=' .repeat(80))
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  }

  // Test 1: Cek Model Membership
  console.log('\n📍 Test 1: Model Membership')
  try {
    const memberships = await prisma.membership.findMany()
    console.log(`✅ PASS - Found ${memberships.length} membership plans`)
    
    if (memberships.length === 0) {
      console.log('⚠️  WARNING - No membership plans in database')
      results.warnings++
    }
    
    memberships.forEach(m => {
      console.log(`   - ${m.name}: Rp ${m.price.toLocaleString('id-ID')} (${m.duration})`)
    })
    
    results.passed++
    results.tests.push({ name: 'Model Membership', status: 'PASS', count: memberships.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Model Membership', status: 'FAIL', error: error.message })
  }

  // Test 2: Cek Model UserMembership
  console.log('\n📍 Test 2: Model UserMembership')
  try {
    const userMemberships = await prisma.userMembership.findMany({
      include: {
        user: { select: { name: true, email: true } },
        membership: { select: { name: true, duration: true } }
      }
    })
    console.log(`✅ PASS - Found ${userMemberships.length} active user memberships`)
    
    if (userMemberships.length === 0) {
      console.log('⚠️  INFO - No users have membership yet (expected for new system)')
    } else {
      userMemberships.slice(0, 3).forEach(um => {
        console.log(`   - ${um.user.name}: ${um.membership.name} (${um.status})`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Model UserMembership', status: 'PASS', count: userMemberships.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Model UserMembership', status: 'FAIL', error: error.message })
  }

  // Test 3: Cek Model MembershipGroup
  console.log('\n📍 Test 3: Model MembershipGroup (Hubungan Membership-Group)')
  try {
    const membershipGroups = await prisma.membershipGroup.findMany({
      include: {
        membership: { select: { name: true } },
        group: { select: { name: true } }
      }
    })
    console.log(`✅ PASS - Found ${membershipGroups.length} membership-group relations`)
    
    if (membershipGroups.length === 0) {
      console.log('⚠️  WARNING - No groups assigned to membership plans yet')
      console.log('   👉 Admin perlu assign groups ke membership plans di admin panel')
      results.warnings++
    } else {
      membershipGroups.slice(0, 3).forEach(mg => {
        console.log(`   - ${mg.membership.name} → ${mg.group.name}`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Model MembershipGroup', status: 'PASS', count: membershipGroups.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Model MembershipGroup', status: 'FAIL', error: error.message })
  }

  // Test 4: Cek Model MembershipCourse
  console.log('\n📍 Test 4: Model MembershipCourse (Hubungan Membership-Course)')
  try {
    const membershipCourses = await prisma.membershipCourse.findMany({
      include: {
        membership: { select: { name: true } },
        course: { select: { title: true } }
      }
    })
    console.log(`✅ PASS - Found ${membershipCourses.length} membership-course relations`)
    
    if (membershipCourses.length === 0) {
      console.log('⚠️  WARNING - No courses assigned to membership plans yet')
      console.log('   👉 Admin perlu assign courses ke membership plans di admin panel')
      results.warnings++
    } else {
      membershipCourses.slice(0, 3).forEach(mc => {
        console.log(`   - ${mc.membership.name} → ${mc.course.title}`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Model MembershipCourse', status: 'PASS', count: membershipCourses.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Model MembershipCourse', status: 'FAIL', error: error.message })
  }

  // Test 5: Cek Model MembershipProduct
  console.log('\n📍 Test 5: Model MembershipProduct (Hubungan Membership-Product)')
  try {
    const membershipProducts = await prisma.membershipProduct.findMany({
      include: {
        membership: { select: { name: true } },
        product: { select: { name: true } }
      }
    })
    console.log(`✅ PASS - Found ${membershipProducts.length} membership-product relations`)
    
    if (membershipProducts.length === 0) {
      console.log('⚠️  WARNING - No products assigned to membership plans yet')
      console.log('   👉 Admin perlu assign products ke membership plans di admin panel')
      results.warnings++
    } else {
      membershipProducts.slice(0, 3).forEach(mp => {
        console.log(`   - ${mp.membership.name} → ${mp.product.name}`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Model MembershipProduct', status: 'PASS', count: membershipProducts.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Model MembershipProduct', status: 'FAIL', error: error.message })
  }

  // Test 6: Cek Model MembershipUpgradeLog
  console.log('\n📍 Test 6: Model MembershipUpgradeLog')
  try {
    const upgradeLogs = await prisma.membershipUpgradeLog.findMany({
      include: {
        user: { select: { name: true } },
        oldMembership: { select: { name: true } }
      }
    })
    console.log(`✅ PASS - Found ${upgradeLogs.length} upgrade logs`)
    
    if (upgradeLogs.length === 0) {
      console.log('   INFO - No upgrade history yet (expected for new system)')
    } else {
      upgradeLogs.slice(0, 3).forEach(log => {
        const oldName = log.oldMembership?.name || 'None'
        console.log(`   - ${log.user.name}: ${oldName} → Membership ID ${log.newMembershipId} (${log.paymentMode})`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Model MembershipUpgradeLog', status: 'PASS', count: upgradeLogs.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Model MembershipUpgradeLog', status: 'FAIL', error: error.message })
  }

  // Test 7: Cek Relasi User-Membership
  console.log('\n📍 Test 7: Relasi User-Membership Complex Query')
  try {
    const usersWithMembership = await prisma.user.findMany({
      where: {
        userMemberships: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        userMemberships: {
          where: { status: 'ACTIVE' },
          include: {
            membership: true
          }
        }
      }
    })
    console.log(`✅ PASS - Found ${usersWithMembership.length} users with active membership`)
    
    if (usersWithMembership.length === 0) {
      console.log('   INFO - No active memberships yet')
    } else {
      usersWithMembership.slice(0, 3).forEach(user => {
        const activeMembership = user.userMemberships[0]
        console.log(`   - ${user.name}: ${activeMembership.membership.name}`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Complex User-Membership Query', status: 'PASS', count: usersWithMembership.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Complex User-Membership Query', status: 'FAIL', error: error.message })
  }

  // Test 8: Cek Groups yang tersedia
  console.log('\n📍 Test 8: Groups Available')
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        _count: {
          select: {
            membershipGroups: true,
            members: true
          }
        }
      }
    })
    console.log(`✅ PASS - Found ${groups.length} groups in database`)
    
    if (groups.length === 0) {
      console.log('⚠️  WARNING - No groups in database')
      results.warnings++
    } else {
      groups.slice(0, 5).forEach(g => {
        console.log(`   - ${g.name} (${g.type}): ${g._count.members} members, linked to ${g._count.membershipGroups} membership plans`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Groups Available', status: 'PASS', count: groups.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Groups Available', status: 'FAIL', error: error.message })
  }

  // Test 9: Cek Courses yang tersedia
  console.log('\n📍 Test 9: Courses Available')
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        isPublished: true,
        _count: {
          select: {
            membershipCourses: true,
            enrollments: true
          }
        }
      }
    })
    console.log(`✅ PASS - Found ${courses.length} courses in database`)
    
    if (courses.length === 0) {
      console.log('⚠️  WARNING - No courses in database')
      results.warnings++
    } else {
      courses.slice(0, 5).forEach(c => {
        const status = c.isPublished ? 'PUBLISHED' : 'DRAFT'
        console.log(`   - ${c.title} (${status}): ${c._count.enrollments} enrollments, linked to ${c._count.membershipCourses} membership plans`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Courses Available', status: 'PASS', count: courses.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Courses Available', status: 'FAIL', error: error.message })
  }

  // Test 10: Cek Products yang tersedia
  console.log('\n📍 Test 10: Products Available')
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        _count: {
          select: {
            membershipProducts: true
          }
        }
      }
    })
    console.log(`✅ PASS - Found ${products.length} products in database`)
    
    if (products.length === 0) {
      console.log('⚠️  WARNING - No products in database')
      results.warnings++
    } else {
      products.slice(0, 5).forEach(p => {
        const status = p.isActive ? 'ACTIVE' : 'INACTIVE'
        console.log(`   - ${p.name} (Rp ${p.price.toLocaleString('id-ID')}, ${status}): linked to ${p._count.membershipProducts} membership plans`)
      })
    }
    
    results.passed++
    results.tests.push({ name: 'Products Available', status: 'PASS', count: products.length })
  } catch (error) {
    console.log(`❌ FAIL - ${error.message}`)
    results.failed++
    results.tests.push({ name: 'Products Available', status: 'FAIL', error: error.message })
  }

  // Summary
  console.log('\n' + '=' .repeat(80))
  console.log('\n📊 DATABASE INTEGRATION TEST SUMMARY')
  console.log('-' .repeat(80))
  
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'
    const countInfo = test.count !== undefined ? ` (${test.count} records)` : ''
    console.log(`${icon} ${index + 1}. ${test.name.padEnd(40)} - ${test.status}${countInfo}`)
  })
  
  console.log('-' .repeat(80))
  console.log(`Total Tests: ${results.passed + results.failed}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`)
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL DATABASE INTEGRATION TESTS PASSED!')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - Please check errors above')
  }
  
  if (results.warnings > 0) {
    console.log('\n📝 NOTES:')
    console.log('   - Beberapa relasi masih kosong (groups/courses/products belum di-assign)')
    console.log('   - Ini normal untuk sistem baru, admin perlu konfigurasi via admin panel')
    console.log('   - Struktur database sudah siap untuk digunakan')
  }

  await prisma.$disconnect()
}

testDatabaseIntegration().catch(console.error)
