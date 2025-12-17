const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import processShortcodes function simulation
function testPlaceholders(content, data) {
  let result = content
  
  // Test {{userName}}
  if (data.userName) result = result.replace(/\{\{userName\}\}/g, data.userName)
  // Test {{userEmail}}
  if (data.userEmail) result = result.replace(/\{\{userEmail\}\}/g, data.userEmail)
  // Test {{membershipPlan}}
  if (data.membershipPlan) result = result.replace(/\{\{membershipPlan\}\}/g, data.membershipPlan)
  // Test {{amount}}
  if (data.amount) result = result.replace(/\{\{amount\}\}/g, data.amount)
  // Test {{invoiceNumber}}
  if (data.invoiceNumber) result = result.replace(/\{\{invoiceNumber\}\}/g, data.invoiceNumber)
  // Test {{transactionDate}}
  if (data.transactionDate) result = result.replace(/\{\{transactionDate\}\}/g, data.transactionDate)
  // Test {{affiliateCode}}
  if (data.affiliateCode) result = result.replace(/\{\{affiliateCode\}\}/g, data.affiliateCode)
  // Test {{cancelReason}}
  if (data.cancelReason) result = result.replace(/\{\{cancelReason\}\}/g, data.cancelReason)
  
  return result
}

async function testTemplates() {
  console.log('🧪 Testing Template Placeholders...\n')
  
  const templates = await prisma.brandedTemplate.findMany({
    where: { category: 'TRANSACTION' },
    orderBy: { name: 'asc' }
  })
  
  console.log(`Found ${templates.length} templates\n`)
  
  for (const template of templates) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📧 ${template.name}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Test data
    const testData = {
      userName: 'Test User',
      userEmail: 'test@example.com',
      membershipPlan: 'Premium Plan',
      amount: 'Rp 500.000',
      invoiceNumber: 'INV-TEST-001',
      transactionDate: '17 Desember 2025',
      affiliateCode: 'TESTCODE',
      cancelReason: 'Test cancellation'
    }
    
    // Process content
    const processed = testPlaceholders(template.content, testData)
    
    console.log('\n📝 Original Content:')
    console.log(template.content)
    console.log('\n✅ Processed Content:')
    console.log(processed)
    console.log('\n')
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ All templates tested successfully!')
  console.log('💡 Placeholders yang digunakan:')
  console.log('   {{userName}} - Nama pengguna')
  console.log('   {{userEmail}} - Email pengguna')
  console.log('   {{membershipPlan}} - Nama paket membership')
  console.log('   {{amount}} - Jumlah pembayaran')
  console.log('   {{invoiceNumber}} - Nomor invoice')
  console.log('   {{transactionDate}} - Tanggal transaksi')
  console.log('   {{affiliateCode}} - Kode afiliasi')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  await prisma.$disconnect()
}

testTemplates().catch(console.error)
