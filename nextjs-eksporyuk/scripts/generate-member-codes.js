/**
 * Script untuk generate memberCode untuk semua existing users
 * Format: EY0001, EY0002, dst
 * Urutan berdasarkan createdAt (user lama dapat nomor kecil)
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function generateMemberCode(number) {
  // Format: EY + 4-6 digit (EY0001 sampai EY999999)
  const padLength = number > 9999 ? 6 : 4
  return `EY${number.toString().padStart(padLength, '0')}`
}

async function main() {
  console.log('🚀 Starting memberCode generation...\n')

  // Get all users ordered by createdAt (oldest first)
  const users = await prisma.user.findMany({
    where: {
      memberCode: null // Only users without memberCode
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  })

  console.log(`📊 Found ${users.length} users without memberCode\n`)

  if (users.length === 0) {
    console.log('✅ All users already have memberCode!')
    return
  }

  // Get the highest existing memberCode number
  const existingCodes = await prisma.user.findMany({
    where: {
      memberCode: {
        not: null
      }
    },
    select: {
      memberCode: true
    }
  })

  let startNumber = 1
  if (existingCodes.length > 0) {
    const numbers = existingCodes
      .map(u => parseInt(u.memberCode.replace('EY', '')))
      .filter(n => !isNaN(n))
    if (numbers.length > 0) {
      startNumber = Math.max(...numbers) + 1
    }
  }

  console.log(`📌 Starting from number: ${startNumber}\n`)
  console.log('─'.repeat(60))

  let updated = 0
  let failed = 0

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const memberCode = generateMemberCode(startNumber + i)

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { memberCode }
      })
      
      console.log(`✅ ${memberCode} → ${user.name} (${user.email})`)
      updated++
    } catch (error) {
      console.log(`❌ Failed for ${user.email}: ${error.message}`)
      failed++
    }
  }

  console.log('─'.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📌 Next available code: ${generateMemberCode(startNumber + users.length)}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
