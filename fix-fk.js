const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    // Get invalid transactions
    const invalid = await prisma.$queryRaw`
      SELECT t.id, t."userId" FROM "Transaction" t 
      LEFT JOIN "User" u ON t."userId" = u.id 
      WHERE u.id IS NULL
    `;
    
    console.log(`Found ${invalid.length} transactions with invalid userId`);
    
    if (invalid.length > 0) {
      const ids = invalid.map(t => t.id);
      await prisma.$executeRaw`DELETE FROM "Transaction" WHERE id = ANY(${ids})`;
      console.log(`Deleted ${invalid.length} invalid transactions`);
    }
    
    // Check UserMembership
    const invalidUM = await prisma.$queryRaw`
      SELECT um.id, um."userId" FROM "UserMembership" um 
      LEFT JOIN "User" u ON um."userId" = u.id 
      WHERE u.id IS NULL
    `;
    
    console.log(`Found ${invalidUM.length} UserMemberships with invalid userId`);
    
    if (invalidUM.length > 0) {
      const ids = invalidUM.map(um => um.id);
      await prisma.$executeRaw`DELETE FROM "UserMembership" WHERE id = ANY(${ids})`;
      console.log(`Deleted ${invalidUM.length} invalid UserMemberships`);
    }
    
    console.log('✅ FK constraints fixed');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
