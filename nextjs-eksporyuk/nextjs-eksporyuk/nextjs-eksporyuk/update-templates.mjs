import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Update type dari NOTIFICATION ke EMAIL
  const result = await prisma.brandedTemplate.updateMany({
    where: { type: 'NOTIFICATION' },
    data: { type: 'EMAIL' }
  })
  console.log('Updated:', result.count, 'templates')
  
  // Check all templates
  const templates = await prisma.brandedTemplate.findMany({
    select: { name: true, type: true, isActive: true }
  })
  console.log('\nAll templates:')
  templates.forEach(t => console.log(`  ${t.name} | ${t.type} | Active: ${t.isActive}`))
  
  await prisma.$disconnect()
}
main().catch(console.error)
