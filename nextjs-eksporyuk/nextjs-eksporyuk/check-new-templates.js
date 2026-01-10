/**
 * Check for New Email Templates
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTemplates() {
  console.log('\n📋 Checking for NEW Email Templates...\n');
  
  try {
    const newSlugs = ['welcome-registration', 'order-confirmation', 'payment-confirmation'];
    
    for (const slug of newSlugs) {
      const template = await prisma.brandedTemplate.findFirst({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          createdAt: true
        }
      });

      if (template) {
        console.log(`✅ ${template.name} (${slug})`);
        console.log(`   Created: ${template.createdAt}`);
        console.log(`   Active: ${template.isActive ? '✓' : '✗'}\n`);
      } else {
        console.log(`❌ NOT FOUND: ${slug}`);
        console.log(`   Will be auto-created on first API call\n`);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('\nTemplates will be created when:');
    console.log('✓ User registers via /api/auth/register');
    console.log('✓ User purchases membership via /api/checkout/membership');
    console.log('✓ User uploads payment proof via /api/payment/confirm/[transactionId]');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
