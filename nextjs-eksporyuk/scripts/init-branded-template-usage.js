// Inisialisasi penggunaan untuk semua BrandedTemplate
// Aman: hanya menambah usage ketika usageCount masih 0

const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')
const prisma = new PrismaClient()

async function initUsage() {
  const templates = await prisma.brandedTemplate.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, slug: true, category: true, type: true, usageCount: true }
  })

  let created = 0
  for (const t of templates) {
    if ((t.usageCount || 0) > 0) continue

    // Tambah satu catatan usage agar kolom penggunaan tidak kosong
    await prisma.brandedTemplateUsage.create({
      data: {
        id: randomBytes(16).toString('hex'),
        templateId: t.id,
        userId: null,
        userRole: 'SYSTEM',
        context: 'INIT_DEFAULT',
        success: true,
        metadata: { note: 'Initialized usage so admin can see usage populated' }
      }
    })

    await prisma.brandedTemplate.update({
      where: { id: t.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    })

    created++
    console.log(`✔ Initialized usage: ${t.category}/${t.type} • ${t.name} (${t.slug})`)
  }

  return created
}

initUsage()
  .then(async (count) => {
    console.log(`\nSelesai. Template diinisialisasi: ${count}`)
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error init usage:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
