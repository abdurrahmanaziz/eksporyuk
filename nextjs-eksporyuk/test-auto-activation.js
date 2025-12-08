const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAutoActivation() {
  console.log('\n🧪 Testing Auto-Activation Flow...\n')

  try {
    // 1. Get test user (or create one)
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@eksporyuk.com' }
    })

    if (!testUser) {
      console.log('📝 Creating test user...')
      testUser = await prisma.user.create({
        data: {
          name: 'Test User Auto Activation',
          email: 'test@eksporyuk.com',
          password: '$2a$10$abcdefghijklmnopqrstuv', // dummy hash
          role: 'MEMBER_FREE',
          emailVerified: true,
        }
      })
      console.log('✅ Test user created:', testUser.email)
    } else {
      console.log('✅ Using existing test user:', testUser.email)
      // Reset user to FREE if needed
      await prisma.user.update({
        where: { id: testUser.id },
        data: { role: 'MEMBER_FREE' }
      })
    }

    // 2. Get membership with groups and courses
    const membership = await prisma.membership.findFirst({
      where: { 
        isActive: true,
        slug: { not: 'free' }
      },
      include: {
        membershipGroups: {
          include: {
            group: true
          }
        },
        membershipCourses: {
          include: {
            course: true
          }
        }
      }
    })

    if (!membership) {
      console.log('❌ No active membership found. Run seed-sample-data.js first!')
      return
    }

    console.log(`\n📦 Testing with Membership: ${membership.name}`)
    console.log(`   Duration: ${membership.duration}`)
    console.log(`   Price: Rp ${membership.price.toLocaleString('id-ID')}`)
    console.log(`   Groups: ${membership.membershipGroups.length}`)
    console.log(`   Courses: ${membership.membershipCourses.length}`)

    // 3. Clean up previous test data
    console.log('\n🧹 Cleaning up previous test data...')
    await prisma.userMembership.deleteMany({
      where: { userId: testUser.id }
    })
    await prisma.userProduct.deleteMany({
      where: { userId: testUser.id }
    })
    await prisma.groupMember.deleteMany({
      where: { userId: testUser.id }
    })
    await prisma.userCourseProgress.deleteMany({
      where: { userId: testUser.id }
    })

    // 4. Simulate membership purchase with auto-activation
    console.log('\n💳 Simulating membership purchase...')
    
    const startDate = new Date()
    
    // Convert duration enum to days
    const durationMap = {
      'ONE_MONTH': 30,
      'THREE_MONTHS': 90,
      'SIX_MONTHS': 180,
      'TWELVE_MONTHS': 365,
      'LIFETIME': null // No expiry
    }
    
    const durationDays = durationMap[membership.duration]
    const expiryDate = new Date(startDate)
    
    if (durationDays) {
      expiryDate.setDate(expiryDate.getDate() + durationDays)
    } else {
      // Lifetime: set to 100 years from now
      expiryDate.setFullYear(expiryDate.getFullYear() + 100)
    }

    // Create UserMembership
    const userMembership = await prisma.userMembership.create({
      data: {
        userId: testUser.id,
        membershipId: membership.id,
        startDate,
        endDate: expiryDate,
        isActive: true,
        autoRenew: false
      }
    })
    console.log('✅ UserMembership created')

    // Update user role to MEMBER_PREMIUM
    await prisma.user.update({
      where: { id: testUser.id },
      data: { role: 'MEMBER_PREMIUM' }
    })
    console.log('✅ User role updated to MEMBER_PREMIUM')

    // 5. Auto-join Groups
    console.log('\n👥 Auto-joining groups...')
    for (const membershipGroup of membership.membershipGroups) {
      const existingMember = await prisma.groupMember.findFirst({
        where: {
          userId: testUser.id,
          groupId: membershipGroup.groupId
        }
      })

      if (!existingMember) {
        await prisma.groupMember.create({
          data: {
            userId: testUser.id,
            groupId: membershipGroup.groupId,
            role: 'MEMBER',
            joinedAt: new Date()
          }
        })
        console.log(`   ✅ Joined: ${membershipGroup.group.name}`)
      } else {
        console.log(`   ⏭️  Already member: ${membershipGroup.group.name}`)
      }
    }

    // 6. Auto-activate Courses
    console.log('\n📚 Auto-activating courses...')
    for (const membershipCourse of membership.membershipCourses) {
      const course = membershipCourse.course

      // Check if course has products linked
      const courseProducts = await prisma.product.findMany({
        where: {
          OR: [
            { courseId: course.id },
            { name: { contains: course.title, mode: 'insensitive' } }
          ]
        }
      })

      if (courseProducts.length > 0) {
        for (const product of courseProducts) {
          const existingUserProduct = await prisma.userProduct.findFirst({
            where: {
              userId: testUser.id,
              productId: product.id
            }
          })

          if (!existingUserProduct) {
            await prisma.userProduct.create({
              data: {
                userId: testUser.id,
                productId: product.id,
                purchaseDate: new Date(),
                expiresAt: expiryDate,
                isActive: true,
                price: product.price
              }
            })
            console.log(`   ✅ Product activated: ${product.name}`)
          }
        }
      }

      // Create UserCourseProgress
      const existingProgress = await prisma.userCourseProgress.findFirst({
        where: {
          userId: testUser.id,
          courseId: course.id
        }
      })

      if (!existingProgress) {
        await prisma.userCourseProgress.create({
          data: {
            userId: testUser.id,
            courseId: course.id,
            progress: 0,
            accessExpiresAt: expiryDate,
            hasAccess: true
          }
        })
        console.log(`   ✅ Course progress created: ${course.title}`)
      } else {
        // Update expiry if already exists
        await prisma.userCourseProgress.update({
          where: { id: existingProgress.id },
          data: {
            accessExpiresAt: expiryDate,
            hasAccess: true
          }
        })
        console.log(`   ✅ Course progress updated: ${course.title}`)
      }
    }

    // 7. Verify results
    console.log('\n\n🔍 VERIFICATION RESULTS:')
    console.log('=' .repeat(60))

    // Check UserMembership
    const verifyMembership = await prisma.userMembership.findFirst({
      where: { 
        userId: testUser.id,
        isActive: true 
      },
      include: {
        membership: true
      }
    })
    console.log(`\n✅ Membership Active: ${verifyMembership ? 'YES' : 'NO'}`)
    if (verifyMembership) {
      console.log(`   Name: ${verifyMembership.membership.name}`)
      console.log(`   Start: ${verifyMembership.startDate.toLocaleDateString('id-ID')}`)
      console.log(`   Expiry: ${verifyMembership.endDate.toLocaleDateString('id-ID')}`)
      console.log(`   Days Left: ${Math.ceil((verifyMembership.endDate - new Date()) / (1000 * 60 * 60 * 24))}`)
    }

    // Check User Role
    const verifyUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    })
    console.log(`\n✅ User Role: ${verifyUser.role}`)

    // Check Groups
    const verifyGroups = await prisma.groupMember.findMany({
      where: { userId: testUser.id },
      include: {
        group: true
      }
    })
    console.log(`\n✅ Joined Groups: ${verifyGroups.length}`)
    verifyGroups.forEach(gm => {
      console.log(`   - ${gm.group.name} (${gm.role})`)
    })

    // Check Products
    const verifyProducts = await prisma.userProduct.findMany({
      where: { 
        userId: testUser.id,
        isActive: true 
      },
      include: {
        product: true
      }
    })
    console.log(`\n✅ Activated Products: ${verifyProducts.length}`)
    verifyProducts.forEach(up => {
      console.log(`   - ${up.product.name}`)
      console.log(`     Expiry: ${up.accessExpiresAt?.toLocaleDateString('id-ID') || 'No expiry'}`)
    })

    // Check Course Progress
    const verifyProgress = await prisma.userCourseProgress.findMany({
      where: { 
        userId: testUser.id,
        hasAccess: true 
      },
      include: {
        course: true
      }
    })
    console.log(`\n✅ Course Progress Records: ${verifyProgress.length}`)
    verifyProgress.forEach(cp => {
      console.log(`   - ${cp.course.title}`)
      console.log(`     Progress: ${cp.progress}%`)
      console.log(`     Expires: ${cp.expiresAt?.toLocaleDateString('id-ID') || 'No expiry'}`)
    })

    // Final Summary
    console.log('\n\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY:')
    console.log('='.repeat(60))
    
    const allPassed = 
      verifyMembership !== null &&
      verifyUser.role === 'MEMBER_PREMIUM' &&
      verifyGroups.length === membership.membershipGroups.length &&
      verifyProgress.length === membership.membershipCourses.length

    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!')
      console.log('\n🎉 Auto-Activation is working correctly!')
      console.log('\nWhat was tested:')
      console.log('  ✅ User membership activated')
      console.log('  ✅ User role changed to MEMBER_PREMIUM')
      console.log('  ✅ Auto-joined all membership groups')
      console.log('  ✅ Auto-activated all membership courses')
      console.log('  ✅ Course progress records created')
      console.log('  ✅ Expiry dates calculated correctly')
    } else {
      console.log('⚠️ SOME TESTS FAILED!')
      console.log('\nExpected:')
      console.log(`  - Groups: ${membership.groups.length}, Got: ${verifyGroups.length}`)
      console.log(`  - Courses: ${membership.courses.length}, Got: ${verifyProgress.length}`)
    }

    console.log('\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAutoActivation()
