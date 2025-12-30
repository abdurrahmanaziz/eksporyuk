// Set one default branded template per category/type if missing
// Safe: only sets isDefault=true when none exists for (category,type)

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function ensureDefaults() {
  const categories = await prisma.brandedTemplate.findMany({
    distinct: ['category', 'type'],
    select: { category: true, type: true }
  })

  let updated = 0

  for (const { category, type } of categories) {
    // Skip if a default already exists and active
    const existingDefault = await prisma.brandedTemplate.findFirst({
      where: { category, type, isDefault: true, isActive: true }
    })

    if (existingDefault) continue

    // Prefer templates with known slugs per category/type
    const preferredSlugs = []
    if (type === 'EMAIL') {
      if (category === 'SYSTEM') preferredSlugs.push('verify-email', 'reset-password', 'email-verification')
      if (category === 'MEMBERSHIP') preferredSlugs.push('welcome-email-new-member', 'welcome-new-member', 'membership-activated')
      if (category === 'AFFILIATE') preferredSlugs.push('affiliate-commission-notification')
      if (category === 'TRANSACTION') preferredSlugs.push('payment-confirmation', 'payment-success')
      if (category === 'PAYMENT') preferredSlugs.push('payment-confirmation', 'invoice-issued')
    }

    let candidate = null

    if (preferredSlugs.length) {
      candidate = await prisma.brandedTemplate.findFirst({
        where: {
          category,
          type,
          slug: { in: preferredSlugs },
          isActive: true
        },
        orderBy: { updatedAt: 'desc' }
      })
    }

    if (!candidate) {
      // Fallback: most recently updated active template in that (category,type)
      candidate = await prisma.brandedTemplate.findFirst({
        where: { category, type, isActive: true },
        orderBy: [{ usageCount: 'desc' }, { updatedAt: 'desc' }]
      })
    }

    if (candidate) {
      // Unset other defaults defensively
      await prisma.brandedTemplate.updateMany({
        where: { category, type, isDefault: true, id: { not: candidate.id } },
        data: { isDefault: false }
      })

      await prisma.brandedTemplate.update({
        where: { id: candidate.id },
        data: { isDefault: true }
      })
      updated++
      console.log(`✔ Set default for ${category}/${type}: ${candidate.name} (${candidate.slug})`)
    } else {
      console.log(`ℹ No active templates found for ${category}/${type}`)
    }
  }

  return updated
}

ensureDefaults()
  .then(async (count) => {
    console.log(`\nDone. Defaults set for ${count} category/type groups.`)
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error setting defaults:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
