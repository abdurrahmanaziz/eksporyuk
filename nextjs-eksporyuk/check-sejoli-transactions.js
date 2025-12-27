/**
 * Check Sejoli transactions raw data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSejoliTransactions() {
  console.log('🔍 CHECKING SEJOLI TRANSACTION DATA\n');

  try {
    // Cek beberapa transaksi yang mencurigakan
    const samples = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS'
      },
      orderBy: {
        id: 'asc'
      },
      take: 20
    });

    console.log(`📊 Sample transactions (first 20):\n`);
    
    for (const tx of samples) {
      console.log('─'.repeat(80));
      console.log(`ID: ${tx.id}`);
      console.log(`Description: ${tx.description}`);
      console.log(`Type: ${tx.type}`);
      console.log(`Status: ${tx.status}`);
      console.log(`Amount: Rp ${tx.amount}`);
      console.log(`User ID: ${tx.userId}`);
      console.log(`Created: ${tx.createdAt}`);
      
      if (tx.metadata) {
        console.log(`Metadata:`);
        const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
        Object.entries(meta).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
      
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: tx.userId },
        select: { email: true, role: true, name: true }
      });
      
      if (user) {
        console.log(`User: ${user.email} (${user.role})`);
      }
      
      // Check if user has membership
      const membership = await prisma.userMembership.findFirst({
        where: {
          userId: tx.userId,
          status: 'ACTIVE'
        }
      });
      
      if (membership) {
        const membershipData = await prisma.membership.findUnique({
          where: { id: membership.membershipId }
        });
        console.log(`Membership: ${membershipData?.duration || 'Unknown'}`);
      } else {
        console.log(`Membership: None`);
      }
      
      console.log('');
    }

    // Check transaction types distribution
    console.log('\n' + '═'.repeat(80));
    console.log('📊 TRANSACTION TYPE DISTRIBUTION:\n');
    
    const typeStats = await prisma.$queryRaw`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(DISTINCT "userId") as unique_users
      FROM "Transaction"
      WHERE status = 'SUCCESS'
      GROUP BY type
      ORDER BY count DESC
    `;
    
    console.log(typeStats);

    // Check transactions with metadata containing product names
    console.log('\n' + '═'.repeat(80));
    console.log('📊 CHECKING METADATA STRUCTURE:\n');
    
    const withMetadata = await prisma.transaction.findFirst({
      where: {
        status: 'SUCCESS',
        metadata: { not: null }
      }
    });
    
    if (withMetadata) {
      console.log('Sample transaction with metadata:');
      console.log(JSON.stringify(withMetadata, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSejoliTransactions();
