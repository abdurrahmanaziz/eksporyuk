const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUser() {
  const email = 'dherifkyalazhary29@gmail.com'
  
  console.log(`🔍 Checking user: ${email}\n`)
  
  // Check user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      password: true
    }
  })
  
  if (user) {
    console.log('✅ User exists:')
    console.log('   ID:', user.id)
    console.log('   Name:', user.name)
    console.log('   Email:', user.email)
    console.log('   Role:', user.role)
    console.log('   Has password:', !!user.password)
    console.log('   Password length:', user.password?.length || 0)
    console.log('   Created:', user.createdAt)
  } else {
    console.log('❌ User not found!')
  }
  
  console.log('\n🔑 Reset tokens:')
  const tokens = await prisma.passwordResetToken.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  
  console.log(`   Found ${tokens.length} token(s)`)
  tokens.forEach((token, i) => {
    console.log(`   ${i+1}. ${token.token.substring(0, 30)}...`)
    console.log(`      Created: ${token.createdAt.toLocaleString('id-ID')}`)
    console.log(`      Expires: ${token.expiresAt.toLocaleString('id-ID')}`)
    console.log(`      Used: ${token.used}`)
    console.log(`      Expired: ${token.expiresAt < new Date()}`)
  })
  
  await prisma.$disconnect()
}

checkUser()
