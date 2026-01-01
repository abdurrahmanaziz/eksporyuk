const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check transactions with affiliate conversions
  const conversions = await prisma.affiliateConversion.findMany({
    take: 10,
    orderBy: { commissionAmount: 'desc' }
  });
  
  console.log('=== AffiliateConversion samples ===');
  for (const c of conversions) {
    console.log(`affiliateId: ${c.affiliateId}, txId: ${c.transactionId}, commission: ${c.commissionAmount}`);
  }
  
  // Check if there are users with AFFILIATE role
  const affiliateUsers = await prisma.user.findMany({
    where: { role: 'AFFILIATE' },
    select: { id: true, name: true, email: true },
    take: 10
  });
  console.log('\n=== Users with AFFILIATE role ===');
  for (const u of affiliateUsers) {
    console.log(`${u.name} (${u.email}) - ID: ${u.id}`);
  }
  
  // Check UserRole table for AFFILIATE
  const userRoles = await prisma.userRole.findMany({
    where: { role: 'AFFILIATE' },
    include: { user: { select: { name: true, email: true } } },
    take: 10
  });
  console.log('\n=== UserRole with AFFILIATE ===');
  for (const ur of userRoles) {
    console.log(`${ur.user?.name} (${ur.user?.email}) - userId: ${ur.userId}`);
  }
  
  // Check Transaction metadata for affiliate info
  const txsWithMeta = await prisma.$queryRaw`
    SELECT id, metadata, "customerName" 
    FROM "Transaction" 
    WHERE metadata::text LIKE '%affiliate%' 
    OR metadata::text LIKE '%Affiliate%'
    LIMIT 5
  `;
  console.log('\n=== Transactions with affiliate in metadata ===');
  for (const tx of txsWithMeta) {
    console.log(`TX: ${tx.id}`);
    console.log(`  metadata: ${JSON.stringify(tx.metadata)}`);
  }
  
  // Check AffiliateProfile for matching
  const profiles = await prisma.affiliateProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 10
  });
  console.log('\n=== AffiliateProfile ===');
  for (const p of profiles) {
    console.log(`${p.user?.name} (${p.user?.email}) - userId: ${p.userId}, code: ${p.affiliateCode}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
