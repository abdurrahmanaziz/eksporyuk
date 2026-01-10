const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const xenditConfig = await prisma.integrationConfig.findFirst({
    where: { service: 'xendit' }
  });
  
  console.log('=== Xendit Integration Config ===');
  if (xenditConfig) {
    console.log('ID:', xenditConfig.id);
    console.log('Service:', xenditConfig.service);
    console.log('Active:', xenditConfig.isActive);
    console.log('Config keys:', Object.keys(xenditConfig.config || {}));
    
    const config = xenditConfig.config;
    if (config) {
      console.log('Has SECRET_KEY:', !!config.XENDIT_SECRET_KEY);
      console.log('Has WEBHOOK_TOKEN:', !!config.XENDIT_WEBHOOK_TOKEN);
      console.log('Environment:', config.XENDIT_ENVIRONMENT);
    }
  } else {
    console.log('❌ NO XENDIT CONFIG FOUND!');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
