const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testNewTemplates() {
  console.log('🧪 Testing Template Baru...\n')
  
  // Ambil semua template transaksi
  const templates = await prisma.brandedTemplate.findMany({
    where: {
      category: 'TRANSACTION'
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  console.log(`📋 Ditemukan ${templates.length} template:\n`)
  
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`)
    console.log(`   Subject: ${template.subject}`)
    console.log(`   Background: ${template.customBranding?.backgroundDesign || 'default'}`)
    console.log(`   Content Preview:`)
    console.log(`   ${template.content.split('\n').slice(0, 3).join('\n   ')}...`)
    console.log('')
  })
  
  // Test preview data
  console.log('🎯 Preview Data Test:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  for (const template of templates) {
    console.log(`\n📧 ${template.name}`)
    console.log(`Subject: ${template.subject}`)
    console.log(`Background Design: ${template.customBranding?.backgroundDesign || 'simple'}`)
    
    // Simulate variable replacement
    let previewContent = template.content
    const previewData = template.previewData || {}
    
    Object.entries(previewData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value)
    })
    
    console.log('\nContent Preview:')
    console.log(previewContent)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }
  
  console.log('\n✅ Semua template siap digunakan!')
  console.log('💡 Tips:')
  console.log('   1. Buka /admin/branded-templates')
  console.log('   2. Edit template dan pilih background design')
  console.log('   3. Gunakan placeholder seperti {{userName}}, {{amount}}')
  console.log('   4. Test email dari tab Settings')
  
  await prisma.$disconnect()
}

testNewTemplates().catch(console.error)
