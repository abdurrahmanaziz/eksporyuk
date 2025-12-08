const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteRina() {
  try {
    const deleted = await prisma.coupon.deleteMany({
      where: {
        code: 'RINA',
      }
    })
    
    console.log(`✅ Deleted ${deleted.count} coupon(s) with code RINA`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteRina()
