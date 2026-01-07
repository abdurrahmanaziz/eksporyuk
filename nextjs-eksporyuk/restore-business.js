const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreBusinessData() {
  console.log('🔄 Downloading backup...')
  
  const response = await fetch('https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/full-backup-1767414248776.json')
  const backup = await response.json()
  
  // Important business tables
  const businessTables = [
    'userMembership',  // Member subscriptions
    'userProduct',     // Product purchases  
    'affiliateConversion',  // Affiliate sales
    'affiliateLink',   // Affiliate links
    'coupon',         // Discount coupons
    'notification',   // User notifications
    'course',         // Courses
    'courseEnrollment' // Course enrollments
  ]
  
  for (const tableName of businessTables) {
    if (backup.tables[tableName] && backup.tables[tableName].length > 0) {
      console.log(`📥 Restoring ${tableName}: ${backup.tables[tableName].length} records`)
      
      try {
        const records = backup.tables[tableName]
        let restored = 0
        let skipped = 0
        
        for (const record of records) {
          try {
            if (tableName === 'userMembership') {
              // Check if user and membership exist
              const [userExists, membershipExists] = await Promise.all([
                prisma.user.findUnique({ where: { id: record.userId } }),
                prisma.membership.findUnique({ where: { id: record.membershipId } })
              ])
              
              if (userExists && membershipExists) {
                await prisma.userMembership.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              } else {
                skipped++
              }
            } else if (tableName === 'userProduct') {
              const userExists = await prisma.user.findUnique({ where: { id: record.userId } })
              if (userExists) {
                await prisma.userProduct.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              } else {
                skipped++
              }
            } else if (tableName === 'affiliateConversion') {
              const userExists = await prisma.user.findUnique({ where: { id: record.userId } })
              if (userExists) {
                await prisma.affiliateConversion.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              } else {
                skipped++
              }
            } else if (tableName === 'affiliateLink') {
              const userExists = await prisma.user.findUnique({ where: { id: record.userId } })
              if (userExists) {
                await prisma.affiliateLink.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              } else {
                skipped++
              }
            } else if (tableName === 'coupon') {
              await prisma.coupon.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
              restored++
            } else if (tableName === 'notification') {
              const userExists = await prisma.user.findUnique({ where: { id: record.userId } })
              if (userExists) {
                await prisma.notification.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              } else {
                skipped++
              }
            } else if (tableName === 'course') {
              await prisma.course.upsert({
                where: { id: record.id },
                update: record,
                create: record
              })
              restored++
            } else if (tableName === 'courseEnrollment') {
              const [userExists, courseExists] = await Promise.all([
                prisma.user.findUnique({ where: { id: record.userId } }),
                prisma.course.findUnique({ where: { id: record.courseId } })
              ])
              
              if (userExists && courseExists) {
                await prisma.courseEnrollment.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
                })
                restored++
              } else {
                skipped++
              }
            }
            
            if (restored % 200 === 0 && restored > 0) {
              console.log(`  ✓ ${tableName}: ${restored}/${records.length} (skipped: ${skipped})`)
            }
          } catch (error) {
            skipped++
          }
        }
        
        console.log(`✅ ${tableName}: ${restored}/${records.length} restored (skipped: ${skipped})`)
        
      } catch (error) {
        console.error(`❌ Error restoring ${tableName}:`, error.message)
      }
    } else {
      console.log(`⚠️  ${tableName}: No data to restore`)
    }
  }
  
  console.log('🎉 Business data restoration completed!')
  
  // Show final counts
  try {
    const counts = await Promise.all([
      prisma.userMembership.count(),
      prisma.userProduct.count(),
      prisma.affiliateConversion.count(),
      prisma.affiliateLink.count(),
      prisma.course.count(),
      prisma.notification.count()
    ])
    
    console.log('\n📊 Final business data counts:')
    console.log(`  - User Memberships: ${counts[0]}`)
    console.log(`  - User Products: ${counts[1]}`)
    console.log(`  - Affiliate Conversions: ${counts[2]}`)
    console.log(`  - Affiliate Links: ${counts[3]}`)
    console.log(`  - Courses: ${counts[4]}`)
    console.log(`  - Notifications: ${counts[5]}`)
  } catch (error) {
    console.log('⚠️  Could not get final counts:', error.message)
  }
}

restoreBusinessData()
  .catch(error => {
    console.error('💥 Restore failed:', error.message)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })