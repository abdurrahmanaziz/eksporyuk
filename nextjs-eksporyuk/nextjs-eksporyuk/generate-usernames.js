// Script to generate usernames for existing users without username
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateUsernames() {
  try {
    console.log('🔍 Finding users without username...')
    
    const usersWithoutUsername = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
      }
    })

    console.log(`📊 Found ${usersWithoutUsername.length} users without username`)

    if (usersWithoutUsername.length === 0) {
      console.log('✅ All users already have usernames!')
      return
    }

    let updated = 0
    let skipped = 0

    for (const user of usersWithoutUsername) {
      // Generate username from name
      const baseUsername = user.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 20)
      
      // Add timestamp to make it unique
      const timestamp = Date.now().toString().slice(-6)
      const generatedUsername = `${baseUsername}_${timestamp}`

      try {
        // Check if username already exists
        const existing = await prisma.user.findUnique({
          where: { username: generatedUsername }
        })

        if (existing) {
          console.log(`⚠️  Skipping ${user.name} - generated username already exists`)
          skipped++
          continue
        }

        // Update user with generated username
        await prisma.user.update({
          where: { id: user.id },
          data: { username: generatedUsername }
        })

        console.log(`✅ Updated ${user.name} -> ${generatedUsername}`)
        updated++

        // Small delay to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 10))
      } catch (error) {
        console.error(`❌ Error updating ${user.name}:`, error.message)
        skipped++
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Updated: ${updated}`)
    console.log(`⚠️  Skipped: ${skipped}`)
    console.log(`📝 Total: ${usersWithoutUsername.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateUsernames()
