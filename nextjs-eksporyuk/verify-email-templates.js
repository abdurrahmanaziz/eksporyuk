/**
 * Verify Email Templates in Database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTemplates() {
  console.log('\n📋 Checking Branded Email Templates in Database...\n');
  
  try {
    // Check if branded template table exists
    const templates = await prisma.brandedTemplate.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        category: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (templates.length === 0) {
      console.log('⚠️  No templates found in database');
      console.log('\nThe templates will be auto-created on first use.');
      console.log('\nEmail templates defined in branded-template-engine.ts:');
      console.log('✓ welcome-registration');
      console.log('✓ order-confirmation');
      console.log('✓ payment-confirmation');
      console.log('✓ email-verification');
    } else {
      console.log(`✅ Found ${templates.length} templates in database:\n`);
      templates.forEach(template => {
        console.log(`📧 ${template.name}`);
        console.log(`   Slug: ${template.slug}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Active: ${template.isActive ? '✓' : '✗'}`);
        console.log('');
      });
    }

    // Check environment variables
    console.log('\n🔧 Environment Variables Status:\n');
    const mailketingKey = process.env.MAILKETING_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    console.log(`MAILKETING_API_KEY: ${mailketingKey ? '✓ Set' : '✗ Missing'}`);
    console.log(`NEXT_PUBLIC_APP_URL: ${appUrl || '(using default https://eksporyuk.com)'}`);

    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Unknown database')) {
      console.log('\n⚠️  Database schema might not include BrandedTemplate table');
      console.log('Please run: npx prisma migrate dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyTemplates();
