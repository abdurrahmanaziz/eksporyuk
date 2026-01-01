const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if there's any table with aff_ prefix
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log('=== All tables ===');
  for (const t of tables) {
    console.log(t.table_name);
  }
  
  // Check if User table has any field with aff_ format
  const usersWithAff = await prisma.$queryRaw`
    SELECT id, name, email FROM "User" 
    WHERE id LIKE 'aff_%' OR email LIKE '%aff_%'
    LIMIT 5
  `;
  console.log('\n=== Users with aff_ ===');
  console.log(usersWithAff);
  
  // Check if there's external_id or sejoli_id field
  const userColumns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'User'
  `;
  console.log('\n=== User table columns ===');
  for (const c of userColumns) {
    console.log(c.column_name);
  }
  
  // Check Transaction table columns
  const txColumns = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Transaction'
  `;
  console.log('\n=== Transaction table columns ===');
  for (const c of txColumns) {
    console.log(c.column_name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
