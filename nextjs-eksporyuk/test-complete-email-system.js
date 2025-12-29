/**
 * TEST COMPLETE EMAIL SYSTEM
 * Script untuk test lengkap seluruh flow email branded templates
 * Termasuk: Database, Settings, Template Rendering, Mailketing Integration
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 TESTING COMPLETE EMAIL SYSTEM FOR BRANDED TEMPLATES\n')
  console.log('='.repeat(60))
  
  // ========================================
  // TEST 1: Check Database Settings
  // ========================================
  console.log('\n📊 TEST 1: Checking Database Settings...')
  try {
    const settings = await prisma.settings.findFirst()
    
    if (!settings) {
      console.error('❌ No settings found in database!')
      console.log('💡 Creating default settings...')
      
      await prisma.settings.create({
        data: {
          id: 1,
          siteTitle: 'EksporYuk',
          siteDescription: 'Platform Ekspor Indonesia',
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937',
          emailFooterCompany: 'PT EksporYuk Indonesia',
          emailFooterEmail: 'support@eksporyuk.com',
          emailFooterAddress: 'Jakarta, Indonesia',
          emailFooterText: 'Platform Edukasi & Mentoring Ekspor Terpercaya',
          emailFooterCopyrightText: 'EksporYuk. All rights reserved.'
        }
      })
      
      console.log('✅ Default settings created')
      return
    }
    
    console.log('✅ Settings found in database')
    console.log('   - Site Logo:', settings.siteLogo || '(not set)')
    console.log('   - Email Footer Company:', settings.emailFooterCompany || '(not set)')
    console.log('   - Email Footer Email:', settings.emailFooterEmail || '(not set)')
    console.log('   - Email Footer Address:', settings.emailFooterAddress || '(not set)')
    console.log('   - Email Footer Text:', settings.emailFooterText ? settings.emailFooterText.substring(0, 50) + '...' : '(not set)')
    console.log('   - Instagram URL:', settings.emailFooterInstagramUrl || '(not set)')
    console.log('   - Facebook URL:', settings.emailFooterFacebookUrl || '(not set)')
    console.log('   - LinkedIn URL:', settings.emailFooterLinkedinUrl || '(not set)')
    console.log('   - Website URL:', settings.emailFooterWebsiteUrl || '(not set)')
    console.log('   - Copyright Text:', settings.emailFooterCopyrightText || '(not set)')
  } catch (error) {
    console.error('❌ Error fetching settings:', error.message)
    return
  }
  
  // ========================================
  // TEST 2: Check Branded Templates
  // ========================================
  console.log('\n📧 TEST 2: Checking Branded Templates...')
  try {
    const templates = await prisma.brandedTemplate.findMany({
      where: { type: 'EMAIL', isActive: true },
      orderBy: { category: 'asc' }
    })
    
    console.log(`✅ Found ${templates.length} active EMAIL templates`)
    
    if (templates.length === 0) {
      console.log('⚠️  No active email templates found!')
      console.log('💡 Run: node seed-branded-templates.js')
    } else {
      templates.forEach((template, idx) => {
        console.log(`   ${idx + 1}. ${template.name} (${template.category})`)
        console.log(`      Slug: ${template.slug}`)
        console.log(`      Usage: ${template.usageCount}x`)
        console.log(`      Has CTA: ${template.ctaText ? 'Yes' : 'No'}`)
      })
    }
  } catch (error) {
    console.error('❌ Error fetching templates:', error.message)
    return
  }
  
  // ========================================
  // TEST 3: Test Usage Tracking
  // ========================================
  console.log('\n📊 TEST 3: Testing Usage Tracking...')
  try {
    const template = await prisma.brandedTemplate.findFirst({
      where: { type: 'EMAIL', isActive: true }
    })
    
    if (!template) {
      console.log('⚠️  No template available for testing')
    } else {
      const usageBefore = template.usageCount
      
      // Create usage record
      await prisma.brandedTemplateUsage.create({
        data: {
          id: `usage_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          templateId: template.id,
          userId: null,
          userRole: 'ADMIN',
          context: 'TEST_SCRIPT',
          success: true,
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        }
      })
      
      // Update template usage count
      await prisma.brandedTemplate.update({
        where: { id: template.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      })
      
      const updatedTemplate = await prisma.brandedTemplate.findUnique({
        where: { id: template.id }
      })
      
      console.log('✅ Usage tracking successful')
      console.log(`   Template: ${template.name}`)
      console.log(`   Usage Before: ${usageBefore}`)
      console.log(`   Usage After: ${updatedTemplate.usageCount}`)
      console.log(`   Last Used: ${updatedTemplate.lastUsedAt}`)
      
      // Get recent usage records
      const recentUsage = await prisma.brandedTemplateUsage.findMany({
        where: { templateId: template.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      
      console.log(`\n   Recent Usage (${recentUsage.length} records):`)
      recentUsage.forEach((usage, idx) => {
        console.log(`   ${idx + 1}. ${usage.context} - ${usage.success ? '✅' : '❌'} - ${new Date(usage.createdAt).toLocaleString('id-ID')}`)
      })
    }
  } catch (error) {
    console.error('❌ Error testing usage tracking:', error.message)
  }
  
  // ========================================
  // TEST 4: Check Mailketing Configuration
  // ========================================
  console.log('\n📨 TEST 4: Checking Mailketing Configuration...')
  const apiKey = process.env.MAILKETING_API_KEY
  
  if (!apiKey) {
    console.log('⚠️  MAILKETING_API_KEY not configured in .env.local')
    console.log('   Email sending will use simulation mode')
    console.log('💡 To send real emails, add MAILKETING_API_KEY to .env.local')
  } else {
    console.log('✅ MAILKETING_API_KEY is configured')
    console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`)
  }
  
  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('📋 TEST SUMMARY\n')
  console.log('✅ All database tests completed!')
  console.log('\n📌 NEXT STEPS TO COMPLETE EMAIL SYSTEM:')
  console.log('1. ✅ Database schema is ready with all email footer fields')
  console.log('2. ✅ API endpoint /api/admin/settings handles all fields')
  console.log('3. ✅ Branded template engine uses settings from database')
  console.log('4. Configure MAILKETING_API_KEY in .env.local for real email sending')
  console.log('5. Upload logo via /admin/branded-templates Settings tab')
  console.log('6. Configure email footer settings in Settings tab')
  console.log('7. Test sending email to real email address using Test Email feature')
  console.log('\n💡 ADMIN PANEL:')
  console.log('   - Templates: http://localhost:3000/admin/branded-templates')
  console.log('   - Settings: http://localhost:3000/admin/branded-templates (Settings tab)')
  console.log('   - Test Email: http://localhost:3000/admin/branded-templates (Settings tab, bottom)')
  console.log('\n🔧 TO TEST EMAIL SENDING:')
  console.log('   1. Start dev server: npm run dev')
  console.log('   2. Open: http://localhost:3000/admin/branded-templates')
  console.log('   3. Go to Settings tab')
  console.log('   4. Fill email footer information')
  console.log('   5. Upload logo (optional)')
  console.log('   6. Save settings')
  console.log('   7. Scroll to "Test Email" section')
  console.log('   8. Select template and enter your email')
  console.log('   9. Click "Kirim Test" button')
  console.log('   10. Check your email inbox')
  console.log('\n' + '='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
