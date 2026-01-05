import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixMissingSlugs() {
  try {
    console.log('🔧 Fixing groups with missing slugs...\n')
    
    // Get groups without slug
    const groupsWithoutSlug = await prisma.group.findMany({
      where: { slug: null },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    console.log(`Found ${groupsWithoutSlug.length} groups without slug\n`)

    // Update each group with auto-generated slug
    for (const group of groupsWithoutSlug) {
      // Generate slug from name
      const generatedSlug = group.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Check if slug already exists
      const existingSlug = await prisma.group.findUnique({
        where: { slug: generatedSlug },
        select: { id: true }
      })

      const finalSlug = existingSlug ? `${generatedSlug}-${group.id.substring(0, 8)}` : generatedSlug

      try {
        await prisma.group.update({
          where: { id: group.id },
          data: { slug: finalSlug }
        })
        console.log(`✅ ${group.name} → ${finalSlug}`)
      } catch (error) {
        console.log(`⚠️  ${group.name} → Error: ${error.message}`)
      }
    }

    console.log('\n✅ All groups now have slugs!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingSlugs()