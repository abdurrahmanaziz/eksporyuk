const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkXenditConfig() {
  console.log('=== CHECKING XENDIT CONFIGURATION ===\n');
  
  const envKey = process.env.XENDIT_SECRET_KEY;
  console.log('1. Environment Variable:');
  console.log('   XENDIT_SECRET_KEY:', envKey ? 'Set (length: ' + envKey.length + ')' : 'Not set');
  
  const dbConfig = await prisma.integrationConfig.findFirst({
    where: { service: 'XENDIT' }
  });
  
  console.log('\n2. Database Integration Config:');
  if (dbConfig) {
    const config = typeof dbConfig.config === 'string' ? JSON.parse(dbConfig.config) : dbConfig.config;
    console.log('   Service: XENDIT');
    console.log('   Active:', dbConfig.isActive);
    console.log('   Has API Key:', !!config.XENDIT_SECRET_KEY);
    if (config.XENDIT_SECRET_KEY) {
      console.log('   Key starts with:', config.XENDIT_SECRET_KEY.substring(0, 10) + '...');
    }
  } else {
    console.log('   No Xendit config in database');
  }
  
  console.log('\n3. Setup Xendit:');
  console.log('   Admin Panel: http://localhost:3000/admin/integrations');
  console.log('   Get API Key: https://dashboard.xendit.co/settings/developers#api-keys');
  
  await prisma.$disconnect();
}

checkXenditConfig().catch(console.error);
