export default async function handler(req, res) {
  // Verify secret token
  const authHeader = req.headers.authorization
  const expectedToken = process.env.BACKUP_SECRET_TOKEN
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const timestamp = new Date().toISOString()
    
    // Backup critical data
    const data = {
      timestamp,
      users: await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          username: true,
          whatsapp: true,
          createdAt: true,
        },
      }),
      memberships: await prisma.membership.findMany(),
      userMemberships: await prisma.userMembership.findMany(),
      groups: await prisma.group.findMany({ take: 100 }),
      wallets: await prisma.wallet.findMany(),
      transactions: await prisma.transaction.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
      }),
      settings: await prisma.settings.findMany(),
      leadMagnets: await prisma.leadMagnet.findMany(),
      affiliateProfiles: await prisma.affiliateProfile.findMany({ take: 100 }),
      mentorProfiles: await prisma.mentorProfile.findMany({ take: 100 }),
    }
    
    await prisma.$disconnect()
    
    // Return backup data
    res.status(200).json({
      success: true,
      timestamp,
      stats: {
        users: data.users.length,
        memberships: data.memberships.length,
        userMemberships: data.userMemberships.length,
        groups: data.groups.length,
        transactions: data.transactions.length,
      },
      data,
    })
    
  } catch (error) {
    console.error('Backup API error:', error)
    res.status(500).json({
      error: 'Backup failed',
      message: error.message,
    })
  }
}
