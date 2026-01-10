const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmailUsage() {
  console.log('📧 CHECKING EMAIL USAGE IMPLEMENTATION\n')
  console.log('='.repeat(80))

  // 1. Check sendBrandedEmail implementation
  console.log('\n1️⃣  CHECKING sendBrandedEmail() USAGE TRACKING')
  console.log('-'.repeat(80))
  
  const fs = require('fs')
  const emailHelperPath = './src/lib/email-template-helper.ts'
  
  if (fs.existsSync(emailHelperPath)) {
    const content = fs.readFileSync(emailHelperPath, 'utf-8')
    
    // Check if usage tracking is implemented
    const hasUsageCount = content.includes('usageCount: { increment: 1 }')
    const hasLastUsedAt = content.includes('lastUsedAt: new Date()')
    const hasUsageRecord = content.includes('brandedTemplateUsage.create')
    
    console.log('✅ File found: src/lib/email-template-helper.ts')
    console.log(`   ${hasUsageCount ? '✅' : '❌'} Usage count increment: ${hasUsageCount}`)
    console.log(`   ${hasLastUsedAt ? '✅' : '❌'} Last used timestamp: ${hasLastUsedAt}`)
    console.log(`   ${hasUsageRecord ? '✅' : '❌'} Usage record creation: ${hasUsageRecord}`)
    
    if (hasUsageCount && hasLastUsedAt && hasUsageRecord) {
      console.log('\n   ✅ Usage tracking FULLY IMPLEMENTED')
    } else {
      console.log('\n   ⚠️  Usage tracking INCOMPLETE')
    }
  } else {
    console.log('❌ File not found!')
  }

  // 2. Check current template usage
  console.log('\n2️⃣  CHECKING TEMPLATE USAGE DATA')
  console.log('-'.repeat(80))
  
  const templates = await prisma.brandedTemplate.findMany({
    orderBy: { usageCount: 'desc' }
  })
  
  console.log(`📊 Total Templates: ${templates.length}`)
  console.log(`   Active: ${templates.filter(t => t.isActive).length}`)
  console.log(`   Total Usage: ${templates.reduce((sum, t) => sum + t.usageCount, 0)}\n`)
  
  if (templates.length > 0) {
    console.log('Top Templates by Usage:')
    templates.slice(0, 5).forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.name}`)
      console.log(`      Category: ${t.category} | Type: ${t.type}`)
      console.log(`      Usage Count: ${t.usageCount}`)
      console.log(`      Last Used: ${t.lastUsedAt ? t.lastUsedAt.toLocaleString('id-ID') : 'Never'}`)
    })
  }

  // 3. Check usage records
  console.log('\n3️⃣  CHECKING USAGE RECORDS (BrandedTemplateUsage)')
  console.log('-'.repeat(80))
  
  const usageRecords = await prisma.brandedTemplateUsage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, category: true } },
      user: { select: { name: true, email: true } }
    }
  })
  
  console.log(`📊 Total Usage Records: ${await prisma.brandedTemplateUsage.count()}`)
  
  if (usageRecords.length > 0) {
    console.log(`\nRecent 10 Usage Records:`)
    usageRecords.forEach((u, idx) => {
      console.log(`\n   ${idx + 1}. ${u.template.name} (${u.template.category})`)
      console.log(`      User: ${u.user.name} (${u.user.email})`)
      console.log(`      Context: ${u.context}`)
      console.log(`      Success: ${u.success ? '✅' : '❌'}`)
      console.log(`      Created: ${u.createdAt.toLocaleString('id-ID')}`)
      if (u.metadata) {
        console.log(`      Metadata: ${JSON.stringify(u.metadata).substring(0, 100)}...`)
      }
    })
  } else {
    console.log('\n   ℹ️  No usage records yet')
    console.log('   💡 Send test email dari /admin/branded-templates untuk create usage record')
  }

  // 4. Check places where sendBrandedEmail is called
  console.log('\n4️⃣  CHECKING sendBrandedEmail() USAGE LOCATIONS')
  console.log('-'.repeat(80))
  
  const filesToCheck = [
    './src/app/api/admin/branded-templates/test-email/route.ts',
    './src/app/api/admin/sales/bulk-action/route.ts',
    './src/lib/services/notificationService.ts',
    './src/lib/email-template-helper.ts'
  ]
  
  filesToCheck.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const hasSendBrandedEmail = content.includes('sendBrandedEmail')
      console.log(`   ${hasSendBrandedEmail ? '✅' : '➖'} ${filePath.replace('./', '')}`)
    }
  })

  // 5. Recommendations
  console.log('\n5️⃣  USAGE TRACKING STATUS & RECOMMENDATIONS')
  console.log('-'.repeat(80))
  
  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0)
  const hasUsageRecords = usageRecords.length > 0
  
  if (totalUsage === 0 && !hasUsageRecords) {
    console.log('⚠️  STATUS: NOT TESTED YET')
    console.log('\n📋 Next Steps:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Login sebagai ADMIN')
    console.log('   3. Go to: /admin/branded-templates')
    console.log('   4. Pilih template → tab Preview')
    console.log('   5. Send test email di green box')
    console.log('   6. Run script ini lagi: node check-email-usage.js')
    console.log('\n   Expected Result:')
    console.log('   ✅ usageCount akan increment dari 0 → 1')
    console.log('   ✅ lastUsedAt akan terisi')
    console.log('   ✅ BrandedTemplateUsage record akan tercreate')
  } else {
    console.log('✅ STATUS: USAGE TRACKING ACTIVE')
    console.log(`\n   Total Usage: ${totalUsage}`)
    console.log(`   Usage Records: ${usageRecords.length}`)
    console.log('   Implementation: WORKING ✅')
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n💡 Documentation: BRANDED_TEMPLATES_FIX_COMPLETE.md\n')

  await prisma.$disconnect()
}

checkEmailUsage().catch(console.error)
