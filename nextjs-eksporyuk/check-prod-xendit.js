const { PrismaClient } = require('@prisma/client');

// Production database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
});

async function main() {
  const xenditConfig = await prisma.integrationConfig.findFirst({
    where: { service: 'xendit' }
  });
  
  console.log('=== PRODUCTION Xendit Integration Config ===');
  if (xenditConfig) {
    console.log('ID:', xenditConfig.id);
    console.log('Service:', xenditConfig.service);
    console.log('Active:', xenditConfig.isActive);
    console.log('Config keys:', Object.keys(xenditConfig.config || {}));
    
    const config = xenditConfig.config;
    if (config) {
      console.log('Has SECRET_KEY:', !!config.XENDIT_SECRET_KEY);
      console.log('SECRET_KEY preview:', config.XENDIT_SECRET_KEY ? config.XENDIT_SECRET_KEY.substring(0, 10) + '...' : 'N/A');
      console.log('Has WEBHOOK_TOKEN:', !!config.XENDIT_WEBHOOK_TOKEN);
      console.log('Environment:', config.XENDIT_ENVIRONMENT);
    }
  } else {
    console.log('❌ NO XENDIT CONFIG FOUND IN PRODUCTION!');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
