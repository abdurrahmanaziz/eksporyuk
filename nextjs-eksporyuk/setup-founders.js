const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupFounders() {
  try {
    console.log('🔧 Setting up Founder and Co-Founder...\n')
    
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found!')
      return
    }
    
    console.log(`Found admin: ${admin.email}`)
    
    // Check for existing founder
    let founder = await prisma.user.findFirst({
      where: { isFounder: true }
    })
    
    if (!founder) {
      // Create founder
      founder = await prisma.user.create({
        data: {
          name: 'Founder',
          email: 'founder@eksporyuk.com',
          password: 'hashed_password',
          role: 'ADMIN',
          isFounder: true,
          emailVerified: true
        }
      })
      
      // Create wallet for founder
      await prisma.wallet.create({
        data: {
          userId: founder.id,
          balance: 0,
          balancePending: 0
        }
      })
      
      console.log('✅ Created Founder:', founder.email)
    } else {
      console.log('✅ Founder already exists:', founder.email)
    }
    
    // Check for existing co-founder
    let cofounder = await prisma.user.findFirst({
      where: { isCoFounder: true }
    })
    
    if (!cofounder) {
      // Create co-founder
      cofounder = await prisma.user.create({
        data: {
          name: 'Co-Founder',
          email: 'cofounder@eksporyuk.com',
          password: 'hashed_password',
          role: 'ADMIN',
          isCoFounder: true,
          emailVerified: true
        }
      })
      
      // Create wallet for co-founder
      await prisma.wallet.create({
        data: {
          userId: cofounder.id,
          balance: 0,
          balancePending: 0
        }
      })
      
      console.log('✅ Created Co-Founder:', cofounder.email)
    } else {
      console.log('✅ Co-Founder already exists:', cofounder.email)
    }
    
    console.log('\n✅ Founder and Co-Founder setup complete!')
    console.log('\nSummary:')
    console.log(`  Admin: ${admin.email}`)
    console.log(`  Founder: ${founder.email}`)
    console.log(`  Co-Founder: ${cofounder.email}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setupFounders()
