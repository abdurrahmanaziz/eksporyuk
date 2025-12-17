const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Starting...');
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Update semua template yang type-nya NOTIFICATION jadi EMAIL
    const result = await prisma.brandedTemplate.updateMany({
      where: { type: 'NOTIFICATION' },
      data: { type: 'EMAIL' }
    });
    
    console.log('Updated:', result.count, 'templates');
    
    // List semua template
    const templates = await prisma.brandedTemplate.findMany({
      select: { id: true, name: true, type: true, isActive: true }
    });
    
    console.log('All templates:');
    templates.forEach(t => {
      console.log(`- ${t.name}: type=${t.type}, active=${t.isActive}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
