const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testBrandedTemplates() {
  console.log('�� TESTING BRANDED TEMPLATES FIXES\n')
  console.log('='.repeat(80))

  // 1. Check Settings
  console.log('\n1️⃣  CHECKING SETTINGS (Logo & Footer)')
  console.log('-'.repeat(80))
  const settings = await prisma.settings.findFirst()
  
  if (!settings) {
    console.log('❌ Settings not found! Run: node seed-settings.js')
    return
  }

  console.log('✅ Settings found:')
  console.log(`   Logo: ${settings.siteLogo || 'NOT SET'}`)
  console.log(`   Company: ${settings.emailFooterCompany || 'NOT SET'}`)
  console.log(`   Footer Text: ${settings.emailFooterText || 'NOT SET'}`)
  console.log(`   Email: ${settings.emailFooterEmail || 'NOT SET'}`)
  console.log(`   Phone: ${settings.emailFooterPhone || 'NOT SET'}`)

  // 2. Check Templates
  console.log('\n2️⃣  CHECKING TEMPLATES')
  console.log('-'.repeat(80))
  const templates = await prisma.brandedTemplate.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`✅ Found ${templates.length} active templates:`)
  templates.forEach((t, idx) => {
    console.log(`   ${idx + 1}. ${t.name} (${t.category} - ${t.type})`)
    console.log(`      Slug: ${t.slug}`)
    console.log(`      Usage Count: ${t.usageCount}`)
    console.log(`      Last Used: ${t.lastUsedAt || 'Never'}`)
  })

  // 3. Check Usage Records
  console.log('\n3️⃣  CHECKING USAGE RECORDS')
  console.log('-'.repeat(80))
  const usageRecords = await prisma.brandedTemplateUsage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true } }
    }
  })

  if (usageRecords.length === 0) {
    console.log('ℹ️  No usage records yet (belum ada test email yang dikirim)')
  } else {
    console.log(`✅ Found ${usageRecords.length} recent usage records:`)
    usageRecords.forEach((u, idx) => {
      console.log(`   ${idx + 1}. ${u.template.name}`)
      console.log(`      Context: ${u.context}`)
      console.log(`      Success: ${u.success ? '✅' : '❌'}`)
      console.log(`      Created: ${u.createdAt.toLocaleString('id-ID')}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n📋 MANUAL TESTING STEPS:\n')
  console.log('1. npm run dev')
  console.log('2. Login sebagai ADMIN')
  console.log('3. Go to: http://localhost:3000/admin/branded-templates\n')
  
  console.log('✅ TEST SCENARIO 1: Preview Auto-Load')
  console.log('   a) Click eye icon pada salah satu template')
  console.log('   b) Preview harus auto-load dalam 300ms')
  console.log('   c) Iframe tampil dengan logo & footer dari Settings\n')

  console.log('✅ TEST SCENARIO 2: Test Email - Preview Tab')
  console.log('   a) Di tab Preview, lihat green box "Test Email dengan Mailketing API"')
  console.log('   b) Masukkan email Anda')
  console.log('   c) Click "Kirim Test"')
  console.log('   d) Check inbox → email harus diterima dengan branding lengkap\n')

  console.log('✅ TEST SCENARIO 3: Test Email - Settings Tab')
  console.log('   a) Go to tab "Pengaturan Template"')
  console.log('   b) Scroll ke bawah → ada card "Test Email dengan Mailketing API"')
  console.log('   c) Sample data ditampilkan (John Doe, Rp 500.000, dll)')
  console.log('   d) Send test email\n')

  console.log('✅ TEST SCENARIO 4: Test Email - Edit Sidebar')
  console.log('   a) Edit template manapun')
  console.log('   b) Check right sidebar → ada green box test email')
  console.log('   c) Send test works (template harus sudah disimpan)\n')

  console.log('💡 EXPECTED RESULTS:')
  console.log('   ✅ Preview tampil clean dengan iframe yang baik')
  console.log('   ✅ Test email sections SANGAT prominent (green boxes)')
  console.log('   ✅ Email diterima di inbox dengan logo & footer lengkap')
  console.log('   ✅ Usage count increment setelah test email')
  console.log('   ✅ BrandedTemplateUsage record tercreate\n')

  console.log('📊 After testing, run this script again to see usage records!\n')

  await prisma.$disconnect()
}

testBrandedTemplates().catch(console.error)
