const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('👤 Creating admin user...\n')

  const email = 'admin@eksporyuk.com'
  const password = 'admin123'
  const hashedPassword = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Admin Ekspor Yuk',
      role: 'ADMIN',
      emailVerified: true,
    },
  })

  console.log('✅ Admin user created/updated!')
  console.log(`\n📧 Email: ${admin.email}`)
  console.log(`🔑 Password: ${password}`)
  console.log(`👤 Name: ${admin.name}`)
  console.log(`⚡ Role: ${admin.role}`)
  console.log(`\n🎉 You can now login to admin panel!`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
