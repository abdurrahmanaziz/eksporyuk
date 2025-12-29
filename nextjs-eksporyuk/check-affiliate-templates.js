const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const templates = await prisma.brandedTemplate.findMany({
    where: { category: 'AFFILIATE' },
    select: { slug: true, name: true, category: true },
    take: 20
  });
  
  console.log('AFFILIATE Templates:');
  templates.forEach(t => console.log(`  ${t.slug} - ${t.name}`));
  
  const total = await prisma.brandedTemplate.count({ where: { category: 'AFFILIATE' } });
  console.log(`\nTotal AFFILIATE templates: ${total}`);
  
  // Also check if any challenge templates exist
  const challengeTemplates = await prisma.brandedTemplate.findMany({
    where: { 
      OR: [
        { slug: { contains: 'challenge' } },
        { name: { contains: 'challenge' } }
      ]
    }
  });
  
  console.log(`\nChallenge-related templates: ${challengeTemplates.length}`);
  
  await prisma.$disconnect();
})();
