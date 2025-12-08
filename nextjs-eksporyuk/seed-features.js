const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedFeaturePermissions() {
  try {
    console.log('🎯 Starting feature permissions seeding...')

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('❌ No admin user found. Skipping feature permissions seeding.')
      return
    }

    // Get some sample users for testing
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    const features = [
      { feature: 'revenue_share', value: { percentage: 10 } },
      { feature: 'wallet_access', value: null },
      { feature: 'create_course', value: { maxCourses: 5 } },
      { feature: 'export_database', value: { formats: ['csv', 'excel'] } },
      { feature: 'advanced_analytics', value: null },
    ]

    console.log(`📊 Creating permissions for ${sampleUsers.length} users...`)

    for (const user of sampleUsers) {
      // Give admin all features
      if (user.role === 'ADMIN') {
        for (const featureData of features) {
          await prisma.userPermission.upsert({
            where: {
              userId_feature: {
                userId: user.id,
                feature: featureData.feature
              }
            },
            update: {
              enabled: true,
              value: featureData.value
            },
            create: {
              userId: user.id,
              feature: featureData.feature,
              enabled: true,
              value: featureData.value
            }
          })
          console.log(`  ✅ Admin ${user.name}: ${featureData.feature}`)
        }
      } else {
        // Give regular users some random features
        const randomFeatures = features.slice(0, Math.floor(Math.random() * 3) + 1)
        
        for (const featureData of randomFeatures) {
          await prisma.userPermission.upsert({
            where: {
              userId_feature: {
                userId: user.id,
                feature: featureData.feature
              }
            },
            update: {
              enabled: Math.random() > 0.2, // 80% chance enabled
              value: featureData.value
            },
            create: {
              userId: user.id,
              feature: featureData.feature,
              enabled: Math.random() > 0.2,
              value: featureData.value
            }
          })
          console.log(`  ✅ ${user.name}: ${featureData.feature}`)
        }
      }
    }

    // Count results
    const totalPermissions = await prisma.userPermission.count()
    const enabledPermissions = await prisma.userPermission.count({
      where: { enabled: true }
    })

    console.log('\n📋 Feature Permissions Seeding Summary:')
    console.log(`  📊 Total Permissions: ${totalPermissions}`)
    console.log(`  ✅ Enabled Permissions: ${enabledPermissions}`)
    console.log(`  ❌ Disabled Permissions: ${totalPermissions - enabledPermissions}`)

    console.log('\n🎯 Feature Categories:')
    const featureCounts = await prisma.$queryRaw`
      SELECT feature, COUNT(*) as count, 
             SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as enabled_count
      FROM UserPermission 
      GROUP BY feature
    `
    
    featureCounts.forEach((row) => {
      console.log(`  🔧 ${row.feature}: ${row.enabled_count}/${row.count} enabled`)
    })

    console.log('\n✅ Feature permissions seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding feature permissions:', error)
    throw error
  }
}

async function main() {
  await seedFeaturePermissions()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
