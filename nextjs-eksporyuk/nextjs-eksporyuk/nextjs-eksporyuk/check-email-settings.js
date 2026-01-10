const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const settings = await prisma.settings.findFirst();
  console.log('=== Settings Table ===');
  if (settings) {
    console.log('siteLogo:', settings.siteLogo || 'NOT SET');
    console.log('siteTitle:', settings.siteTitle || 'NOT SET');
    console.log('emailFooterText:', settings.emailFooterText || 'NOT SET');
    console.log('emailFooterCompany:', settings.emailFooterCompany || 'NOT SET');
    console.log('emailFooterEmail:', settings.emailFooterEmail || 'NOT SET');
  } else {
    console.log('NO SETTINGS FOUND!');
  }
  
  const mailConfig = await prisma.integrationConfig.findFirst({
    where: { integration: 'MAILKETING' }
  });
  console.log('\n=== Mailketing Config ===');
  if (mailConfig) {
    console.log('isActive:', mailConfig.isActive);
    console.log('Has API Key:', !!mailConfig.apiKey);
    console.log('Settings:', JSON.stringify(mailConfig.settings, null, 2));
  } else {
    console.log('NO MAILKETING CONFIG!');
  }
  
  const welcomeTemplate = await prisma.brandedTemplate.findFirst({
    where: { slug: 'welcome-email-new-member' }
  });
  console.log('\n=== Welcome Template (welcome-email-new-member) ===');
  if (welcomeTemplate) {
    console.log('Name:', welcomeTemplate.name);
    console.log('Subject:', welcomeTemplate.subject);
    console.log('Content:', welcomeTemplate.content);
    console.log('CTA Text:', welcomeTemplate.ctaText || 'NOT SET');
    console.log('CTA Link:', welcomeTemplate.ctaLink || 'NOT SET');
  } else {
    console.log('NOT FOUND!');
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
