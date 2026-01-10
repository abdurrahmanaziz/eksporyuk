const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const template = await prisma.brandedTemplate.findFirst({
    where: { slug: 'commission-earned-notification' }
  });
  
  console.log('EXISTING AFFILIATE TEMPLATE STRUCTURE:');
  console.log('=====================================');
  console.log(`Slug: ${template.slug}`);
  console.log(`Name: ${template.name}`);
  console.log(`Category: ${template.category}`);
  console.log(`Subject: ${template.subject}`);
  console.log(`Has HTML Content: ${!!template.htmlContent}`);
  console.log(`Has Text Content: ${!!template.textContent}`);
  console.log(`Available Shortcodes: ${template.availableShortcodes}`);
  console.log(`\nHTML Content (first 500 chars):\n${template.htmlContent?.substring(0, 500)}...`);
  
  await prisma.$disconnect();
})();
