import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearSessions() {
  try {
    const deleted = await prisma.session.deleteMany({})
    console.log('✅ Deleted', deleted.count, 'session(s)')
    console.log('\n📌 Silakan refresh browser dan login ulang!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearSessions()
