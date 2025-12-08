import { prisma } from '../src/lib/prisma'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  console.log('🔧 Adding slugs to existing groups...')

  // Get all groups without slug
  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true,
    }
  })

  console.log(`Found ${groups.length} groups without slug`)

  for (const group of groups) {
    let slug = generateSlug(group.name)
    let counter = 1

    // Check if slug already exists
    while (true) {
      const existing = await prisma.group.findUnique({
        where: { slug }
      })

      if (!existing || existing.id === group.id) {
        break
      }

      // Slug exists, add counter
      slug = `${generateSlug(group.name)}-${counter}`
      counter++
    }

    // Update group with slug
    await prisma.group.update({
      where: { id: group.id },
      data: { slug }
    })

    console.log(`✅ Updated group "${group.name}" with slug: ${slug}`)
  }

  console.log('\n✅ All groups now have unique slugs!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
