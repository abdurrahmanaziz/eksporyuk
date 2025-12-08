const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateOptinFormSlugs() {
  try {
    console.log('🔄 Updating optin form slugs...')

    // Get all optin forms
    const forms = await prisma.affiliateOptinForm.findMany()

    console.log(`Found ${forms.length} optin forms`)

    for (const form of forms) {
      // Generate slug from formName
      let slug = form.formName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)

      // Check if slug exists
      const existing = await prisma.affiliateOptinForm.findUnique({
        where: { slug }
      })

      // If slug exists and it's not the current form, add random suffix
      if (existing && existing.id !== form.id) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`
      }

      // Update the form with slug
      await prisma.affiliateOptinForm.update({
        where: { id: form.id },
        data: { slug }
      })

      console.log(`✅ Updated: "${form.formName}" → slug: "${slug}"`)
    }

    console.log('\n✨ All optin forms updated successfully!')
  } catch (error) {
    console.error('❌ Error updating slugs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateOptinFormSlugs()
