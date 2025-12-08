import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSession() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@eksporyuk.com' },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    console.log('\n🔍 Current User in Database:')
    console.log('ID:', user?.id)
    console.log('Email:', user?.email)
    console.log('Name:', user?.name)

    const sessions = await prisma.session.findMany({
      where: { userId: user?.id },
      orderBy: { expires: 'desc' },
      take: 5
    })

    console.log('\n📋 Active Sessions:', sessions.length)
    sessions.forEach((s, i) => {
      console.log(`\nSession ${i + 1}:`)
      console.log('  Session Token:', s.sessionToken.substring(0, 20) + '...')
      console.log('  User ID:', s.userId)
      console.log('  Expires:', s.expires)
    })

    // Check all sessions
    const allSessions = await prisma.session.findMany({
      orderBy: { expires: 'desc' }
    })

    console.log('\n📊 Total Sessions in DB:', allSessions.length)
    
    // Group by userId
    const byUser = {}
    allSessions.forEach(s => {
      byUser[s.userId] = (byUser[s.userId] || 0) + 1
    })
    
    console.log('\n👥 Sessions by User ID:')
    Object.entries(byUser).forEach(([userId, count]) => {
      console.log(`  ${userId}: ${count} session(s)`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSession()
