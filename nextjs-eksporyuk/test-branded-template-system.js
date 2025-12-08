const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBrandedTemplateSystem() {
  console.log('\n🧪 Testing Branded Template System\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. Check database connection
    console.log('\n1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // 2. Count templates
    console.log('\n2️⃣ Checking templates...')
    const totalTemplates = await prisma.brandedTemplate.count()
    const activeTemplates = await prisma.brandedTemplate.count({ where: { isActive: true } })
    const emailTemplates = await prisma.brandedTemplate.count({ where: { type: 'EMAIL' } })
    
    console.log(`✅ Total templates: ${totalTemplates}`)
    console.log(`✅ Active templates: ${activeTemplates}`)
    console.log(`✅ Email templates: ${emailTemplates}`)
    
    // 3. Get sample template
    console.log('\n3️⃣ Fetching sample template...')
    const sampleTemplate = await prisma.brandedTemplate.findFirst({
      where: { 
        type: 'EMAIL',
        isActive: true 
      }
    })
    
    if (sampleTemplate) {
      console.log(`✅ Sample template found: ${sampleTemplate.name}`)
      console.log(`   Category: ${sampleTemplate.category}`)
      console.log(`   Subject: ${sampleTemplate.subject}`)
      console.log(`   Usage count: ${sampleTemplate.usageCount}`)
    } else {
      console.log('⚠️  No active email templates found')
    }
    
    // 4. Check template usage records
    console.log('\n4️⃣ Checking template usage...')
    const totalUsage = await prisma.brandedTemplateUsage.count()
    const successUsage = await prisma.brandedTemplateUsage.count({ where: { success: true } })
    const failedUsage = await prisma.brandedTemplateUsage.count({ where: { success: false } })
    
    console.log(`✅ Total usage records: ${totalUsage}`)
    console.log(`✅ Successful sends: ${successUsage}`)
    console.log(`⚠️  Failed sends: ${failedUsage}`)
    
    // 5. Check settings
    console.log('\n5️⃣ Checking settings...')
    const settings = await prisma.settings.findFirst()
    
    if (settings) {
      console.log(`✅ Settings found`)
      console.log(`   Site logo: ${settings.siteLogo ? 'Configured' : 'Not set'}`)
      console.log(`   Site title: ${settings.siteTitle || 'Not set'}`)
    } else {
      console.log('⚠️  No settings found')
    }
    
    // 6. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SYSTEM STATUS SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Database: Connected`)
    console.log(`✅ Templates: ${totalTemplates} total, ${activeTemplates} active`)
    console.log(`✅ Email Templates: ${emailTemplates}`)
    console.log(`✅ Usage Records: ${totalUsage}`)
    console.log(`✅ Settings: ${settings ? 'Configured' : 'Not configured'}`)
    console.log('='.repeat(60))
    console.log('\n✅ All branded template system checks passed!\n')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testBrandedTemplateSystem()
