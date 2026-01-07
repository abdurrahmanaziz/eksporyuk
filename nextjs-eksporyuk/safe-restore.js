const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function restoreEssentialData() {
  console.log('🔄 Downloading backup...')
  
  const response = await fetch('https://2o4ab48sr0rokwsf.public.blob.vercel-storage.com/db-backups/full-backup-1767414248776.json')
  const backup = await response.json()
  
  console.log('📥 Restoring users with safe upsert...')
  
  // First, restore users (required for other tables)
  const users = backup.tables.user || []
  let userCount = 0
  
  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user
      })
      userCount++
      if (userCount % 100 === 0) {
        console.log(`✓ Users restored: ${userCount}/${users.length}`)
      }
    } catch (error) {
      // Skip duplicates, continue with others
    }
  }
  
  console.log(`✅ Users restored: ${userCount}/${users.length}`)
  
  // Now restore wallets
  console.log('📥 Restoring wallets...')
  const wallets = backup.tables.wallet || []
  let walletCount = 0
  
  for (const wallet of wallets) {
    try {
      // Check if user exists first
      const userExists = await prisma.user.findUnique({
        where: { id: wallet.userId }
      })
      
      if (userExists) {
        await prisma.wallet.upsert({
          where: { userId: wallet.userId },
          update: wallet,
          create: wallet
        })
        walletCount++
      }
    } catch (error) {
      // Skip errors
    }
  }
  
  console.log(`✅ Wallets restored: ${walletCount}/${wallets.length}`)
  
  // Restore affiliate profiles
  console.log('📥 Restoring affiliate profiles...')
  const profiles = backup.tables.affiliateProfile || []
  let profileCount = 0
  
  for (const profile of profiles) {
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: profile.userId }
      })
      
      if (userExists) {
        await prisma.affiliateProfile.upsert({
          where: { userId: profile.userId },
          update: profile,
          create: profile
        })
        profileCount++
      }
    } catch (error) {
      // Skip errors
    }
  }
  
  console.log(`✅ Affiliate profiles restored: ${profileCount}/${profiles.length}`)
  
  console.log('🎉 Essential data restoration completed!')
  console.log('🚀 Database is ready for testing')
}

restoreEssentialData()
  .catch(error => {
    console.error('💥 Restore failed:', error.message)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })