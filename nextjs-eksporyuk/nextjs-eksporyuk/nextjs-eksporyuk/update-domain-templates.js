const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OLD_DOMAIN = 'app.eksporyuk.com';
const NEW_DOMAIN = 'eksporyuk.com';

async function updateDomainInDatabase() {
  console.log('🔄 Starting domain migration in database...');
  console.log(`   Old: https://${OLD_DOMAIN}`);
  console.log(`   New: https://${NEW_DOMAIN}\n`);

  try {
    // 1. Get all email templates
    console.log('📧 Checking Email Templates...');
    const emailTemplates = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { body: { contains: OLD_DOMAIN } },
          { subject: { contains: OLD_DOMAIN } },
          { ctaLink: { contains: OLD_DOMAIN } }
        ]
      }
    });

    console.log(`   Found ${emailTemplates.length} email templates with old domain`);

    for (const template of emailTemplates) {
      const updatedBody = template.body?.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);
      const updatedSubject = template.subject?.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);
      const updatedCtaLink = template.ctaLink?.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);

      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: {
          body: updatedBody,
          subject: updatedSubject,
          ctaLink: updatedCtaLink
        }
      });

      console.log(`   ✅ Updated: ${template.name}`);
    }

    // 2. Get all notification templates (skip if model doesn't exist)
    console.log('\n🔔 Checking Notification Templates...');
    
    let notifTemplates = [];
    try {
      if (prisma.notificationTemplate) {
        notifTemplates = await prisma.notificationTemplate.findMany({
          where: {
            OR: [
              { content: { contains: OLD_DOMAIN } },
              { title: { contains: OLD_DOMAIN } }
            ]
          }
        });
      }
    } catch (e) {
      console.log('   ℹ️  NotificationTemplate model not found, skipping...');
    }

    console.log(`   Found ${notifTemplates.length} notification templates with old domain`);

    for (const template of notifTemplates) {
      const updatedContent = template.content?.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);
      const updatedTitle = template.title?.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);

      await prisma.notificationTemplate.update({
        where: { id: template.id },
        data: {
          content: updatedContent,
          title: updatedTitle
        }
      });

      console.log(`   ✅ Updated: ${template.name}`);
    }

    // 3. Check WhatsApp templates (skip if model doesn't exist)
    console.log('\n💬 Checking WhatsApp Templates...');
    
    let whatsappTemplates = [];
    try {
      if (prisma.whatsAppTemplate) {
        whatsappTemplates = await prisma.whatsAppTemplate.findMany({
          where: {
            content: { contains: OLD_DOMAIN }
          }
        });
      }
    } catch (e) {
      console.log('   ℹ️  WhatsAppTemplate model not found, skipping...');
    }

    console.log(`   Found ${whatsappTemplates.length} WhatsApp templates with old domain`);

    for (const template of whatsappTemplates) {
      const updatedContent = template.content.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);

      await prisma.whatsAppTemplate.update({
        where: { id: template.id },
        data: {
          content: updatedContent
        }
      });

      console.log(`   ✅ Updated: ${template.name}`);
    }

    // 4. Check Settings table for any domain references
    console.log('\n⚙️  Checking Settings...');
    const settings = await prisma.settings.findFirst();
    
    if (settings) {
      let updated = false;
      const updates = {};

      // Check common settings fields that might have domain
      if (settings.siteUrl?.includes(OLD_DOMAIN)) {
        updates.siteUrl = settings.siteUrl.replace(OLD_DOMAIN, NEW_DOMAIN);
        updated = true;
      }

      if (settings.metadata && typeof settings.metadata === 'object') {
        const metadataStr = JSON.stringify(settings.metadata);
        if (metadataStr.includes(OLD_DOMAIN)) {
          const updatedMetadata = JSON.parse(metadataStr.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN));
          updates.metadata = updatedMetadata;
          updated = true;
        }
      }

      if (updated) {
        await prisma.settings.update({
          where: { id: settings.id },
          data: updates
        });
        console.log('   ✅ Updated Settings');
      } else {
        console.log('   ℹ️  No settings to update');
      }
    }

    // Summary
    console.log('\n✅ Domain Migration Complete!');
    console.log(`   Email Templates: ${emailTemplates.length}`);
    console.log(`   Notification Templates: ${notifTemplates.length}`);
    console.log(`   WhatsApp Templates: ${whatsappTemplates.length}`);
    console.log(`\n🎉 All database references updated to ${NEW_DOMAIN}`);

  } catch (error) {
    console.error('\n❌ Error during migration:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  updateDomainInDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { updateDomainInDatabase };
