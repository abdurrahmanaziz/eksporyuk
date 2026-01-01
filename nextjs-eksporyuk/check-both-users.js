const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // User yang login sekarang (dari session)
  const currentUser = await prisma.user.findUnique({
    where: { id: 'cmjr7cuc80004ithaj28yxtbq' },
    select: { id: true, email: true, name: true, role: true }
  })
  
  // User yang punya affiliate links
  const azizUser = await prisma.user.findUnique({
    where: { id: 'cmjmtotzh001eitz0kq029lk5' },
    select: { id: true, email: true, name: true, role: true }
  })
  
  // Check affiliate profile for current logged in user
  const currentAffiliate = await prisma.affiliateProfile.findUnique({
    where: { userId: 'cmjr7cuc80004ithaj28yxtbq' }
  })
  
  console.log('\n👤 USER YANG LOGIN SEKARANG:')
  console.log(currentUser)
  console.log('Affiliate profile:', currentAffiliate ? '✅ ADA' : '❌ TIDAK ADA')
  
  console.log('\n👤 USER YANG PUNYA 13 LINKS:')
  console.log(azizUser)
  
  if (currentUser && azizUser && currentUser.email !== azizUser.email) {
    console.log('\n⚠️  BERBEDA! Kamu login dengan akun yang salah!')
    console.log(`   Login dengan: ${currentUser?.email}`)
    console.log(`   Yang punya links: ${azizUser?.email}`)
  }
  
  await prisma.$disconnect()
}
main()
