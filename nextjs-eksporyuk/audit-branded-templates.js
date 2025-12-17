const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function auditBrandedTemplates() {
  console.log('🔍 AUDIT: Branded Templates System\n')
  console.log('='.repeat(80))
  
  // 1. Check templates in database
  const templates = await prisma.brandedTemplate.findMany({
    include: {
      usages: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  
  console.log('\n📊 TEMPLATE STATISTICS:')
  console.log(`   Total Templates: ${templates.length}`)
  console.log(`   Active: ${templates.filter(t => t.isActive).length}`)
  console.log(`   System Templates: ${templates.filter(t => t.isSystem).length}`)
  
  // Group by category
  const byCategory = templates.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {})
  
  console.log('\n📂 BY CATEGORY:')
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} templates`)
  })
  
  // Group by type
  const byType = templates.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1
    return acc
  }, {})
  
  console.log('\n📧 BY TYPE:')
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} templates`)
  })
  
  console.log('\n📈 USAGE STATISTICS:')
  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0)
  const avgUsage = templates.length > 0 ? (totalUsage / templates.length).toFixed(2) : 0
  console.log(`   Total Usage Count: ${totalUsage}`)
  console.log(`   Average per Template: ${avgUsage}`)
  console.log(`   Templates with 0 usage: ${templates.filter(t => t.usageCount === 0).length}`)
  
  // 2. Check Settings table
  const settings = await prisma.settings.findFirst()
  
  console.log('\n⚙️ TEMPLATE SETTINGS (Logo & Footer):')
  if (settings) {
    console.log(`   ${settings.siteLogo ? '✅' : '❌'} Site Logo: ${settings.siteLogo || 'NOT SET'}`)
    console.log(`   ${settings.emailFooterCompany ? '✅' : '❌'} Footer Company: ${settings.emailFooterCompany || 'NOT SET'}`)
    console.log(`   ${settings.emailFooterAddress ? '✅' : '❌'} Footer Address: ${settings.emailFooterAddress || 'NOT SET'}`)
    console.log(`   ${settings.emailFooterPhone ? '✅' : '❌'} Footer Phone: ${settings.emailFooterPhone || 'NOT SET'}`)
    console.log(`   ${settings.emailFooterEmail ? '✅' : '❌'} Footer Email: ${settings.emailFooterEmail || 'NOT SET'}`)
    console.log(`   ${settings.emailFooterCopyrightText ? '✅' : '❌'} Copyright Text: ${settings.emailFooterCopyrightText || 'NOT SET'}`)
  } else {
    console.log('   ❌ Settings table tidak ada record!')
  }
  
  // 3. Show templates detail
  console.log('\n📋 TEMPLATE DETAILS:\n')
  
  templates.forEach((t, idx) => {
    const hasLogo = t.content?.includes('{{logoUrl}}') || t.content?.includes('logo')
    const hasFooter = t.content?.includes('{{footer') || t.content?.includes('footer')
    
    console.log(`${idx + 1}. ${t.name}`)
    console.log(`   Slug: ${t.slug}`)
    console.log(`   Category: ${t.category} | Type: ${t.type}`)
    console.log(`   Active: ${t.isActive ? '✅' : '❌'} | System: ${t.isSystem ? '✅' : '❌'}`)
    console.log(`   Usage Count: ${t.usageCount}`)
    console.log(`   Last Used: ${t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString('id-ID') : 'Never'}`)
    console.log(`   Logo in content: ${hasLogo ? '✅' : '❌'}`)
    console.log(`   Footer in content: ${hasFooter ? '✅' : '❌'}`)
    console.log(`   Subject: ${t.subject}`)
    if (t.usages.length > 0) {
      console.log(`   Recent usages: ${t.usages.length} records`)
    }
    console.log()
  })
  
  // 4. Check usage records
  const allUsages = await prisma.brandedTemplateUsage.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      template: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } }
    }
  })
  
  console.log('\n📊 RECENT USAGE RECORDS:')
  if (allUsages.length === 0) {
    console.log('   ⚠️ Tidak ada usage records! Usage tracking mungkin belum berfungsi.')
  } else {
    allUsages.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.template.name} (${u.template.slug})`)
      console.log(`   User: ${u.user?.name || 'N/A'} (${u.user?.email || 'N/A'})`)
      console.log(`   Date: ${new Date(u.createdAt).toLocaleString('id-ID')}`)
      console.log(`   Success: ${u.success ? '✅' : '❌'}`)
      console.log()
    })
  }
  
  // 5. Check API endpoints
  console.log('='.repeat(80))
  console.log('\n🔧 RECOMMENDATIONS:\n')
  
  if (!settings) {
    console.log('❌ CRITICAL: Buat record Settings untuk logo & footer')
  } else {
    if (!settings.siteLogo) console.log('⚠️  Upload logo di tab Pengaturan Template')
    if (!settings.emailFooterCompany) console.log('⚠️  Isi Footer Company di tab Pengaturan Template')
  }
  
  const zeroUsage = templates.filter(t => t.usageCount === 0)
  if (zeroUsage.length > 0) {
    console.log(`⚠️  ${zeroUsage.length} templates belum pernah digunakan`)
  }
  
  if (allUsages.length === 0) {
    console.log('⚠️  Usage tracking belum aktif - cek sendBrandedEmail() implementation')
  }
  
  const noLogoFooter = templates.filter(t => 
    t.type === 'EMAIL' && 
    (!t.content?.includes('{{logoUrl}}') || !t.content?.includes('{{footer'))
  )
  if (noLogoFooter.length > 0) {
    console.log(`⚠️  ${noLogoFooter.length} EMAIL templates tanpa logo/footer variables`)
  }
  
  console.log('\n' + '='.repeat(80))
  
  await prisma.$disconnect()
}

auditBrandedTemplates().catch(console.error)
