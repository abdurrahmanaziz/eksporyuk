const { PrismaClient } = require('@prisma/client');

async function tryDifferentConnectionMethods() {
  console.log('🔄 TESTING DIFFERENT CONNECTION METHODS TO NEON\n');
  
  // Method 1: Original connection
  console.log('1️⃣ Testing original connection...');
  try {
    const prisma1 = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
        }
      }
    });
    
    const count1 = await prisma1.user.count();
    console.log(`✅ Original connection works: ${count1} users`);
    await prisma1.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Original failed: ${error.message.split('\n')[0]}`);
  }

  // Method 2: Try with pooler
  console.log('\n2️⃣ Testing with connection pooler...');
  try {
    const prisma2 = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
        }
      }
    });
    
    const count2 = await prisma2.user.count();
    console.log(`✅ Pooler connection works: ${count2} users`);
    await prisma2.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Pooler failed: ${error.message.split('\n')[0]}`);
  }

  // Method 3: Try without SSL
  console.log('\n3️⃣ Testing without SSL requirement...');
  try {
    const prisma3 = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb"
        }
      }
    });
    
    const count3 = await prisma3.user.count();
    console.log(`✅ No SSL connection works: ${count3} users`);
    await prisma3.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ No SSL failed: ${error.message.split('\n')[0]}`);
  }

  // Method 4: Try with different SSL mode
  console.log('\n4️⃣ Testing with different SSL mode...');
  try {
    const prisma4 = new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://neondb_owner:npg_YUbWXw6urZ0d@ep-purple-breeze-a1ovfiz0.ap-southeast-1.aws.neon.tech/neondb?sslmode=prefer"
        }
      }
    });
    
    const count4 = await prisma4.user.count();
    console.log(`✅ SSL prefer works: ${count4} users`);
    await prisma4.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ SSL prefer failed: ${error.message.split('\n')[0]}`);
  }

  console.log('\n🤔 All connection methods failed. Possible issues:');
  console.log('1. Network/firewall blocking connections');
  console.log('2. Neon database credentials changed');
  console.log('3. Database server temporarily down');
  console.log('4. Regional connectivity issues');
  
  return false;
}

tryDifferentConnectionMethods()
  .then((success) => {
    if (!success) {
      console.log('\n💡 RECOMMENDATION:');
      console.log('Since Neon is not accessible right now, we can:');
      console.log('1. Use local database for immediate audit');
      console.log('2. Check Neon dashboard for any issues');
      console.log('3. Try again in a few minutes');
    }
  })
  .catch(console.error);