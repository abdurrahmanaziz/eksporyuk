const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMemberships() {
  try {
    console.log('🔍 Checking database...\n');
    
    const memberships = await prisma.membership.findMany({
      include: {
        _count: {
          select: { userMemberships: true }
        }
      }
    });
    
    console.log(`📊 Total memberships in database: ${memberships.length}\n`);
    
    if (memberships.length === 0) {
      console.log('❌ Database is empty!');
    } else {
      memberships.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name}`);
        console.log(`   Slug: ${m.slug}`);
        console.log(`   Price: Rp ${m.price.toLocaleString()}`);
        console.log(`   Duration: ${m.duration}`);
        console.log(`   Active: ${m.isActive ? '✅' : '❌'}`);
        console.log(`   Subscribers: ${m._count.userMemberships}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMemberships();
