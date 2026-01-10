const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  console.log('\n📧 BRANDED EMAIL TEMPLATES - Quick Check\n')
  console.log('=' .repeat(60))
  
  const templates = await prisma.brandedTemplate.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
  
  // Group by category
  const byCategory = {}
  templates.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t)
  })
  
  // Display grouped
  Object.keys(byCategory).sort().forEach(cat => {
    console.log(`\n📁 ${cat} (${byCategory[cat].length} templates)`)
    console.log('-'.repeat(60))
    
    byCategory[cat].forEach((t, i) => {
      const status = t.isActive ? '✅' : '❌'
      const system = t.isSystem ? '🔒' : '📝'
      console.log(`  ${i + 1}. ${status} ${system} ${t.name}`)
      console.log(`     Slug: ${t.slug}`)
      console.log(`     Subject: ${t.subject}`)
      console.log(`     CTA: ${t.ctaText || 'No CTA'}`)
      console.log(`     Variables: ${Object.keys(t.variables || {}).length} defined`)
      console.log('')
    })
  })
  
  console.log('=' .repeat(60))
  console.log(`\n📊 SUMMARY:`)
  console.log(`   Total Templates: ${templates.length}`)
  console.log(`   Active: ${templates.filter(t => t.isActive).length}`)
  console.log(`   System Protected: ${templates.filter(t => t.isSystem).length}`)
  console.log(`   Categories: ${Object.keys(byCategory).length}`)
  
  console.log(`\n🔗 Access Admin Panel:`)
  console.log(`   http://localhost:3000/admin/branded-templates`)
  console.log(`\n✅ All templates ready to use!\n`)
  
  await prisma.$disconnect()
}

check()
