import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('📊 AFFILIATE COMMISSION STATUS\n');
  
  // Check AffiliateCommission table
  const commissions = await prisma.affiliateCommission.count();
  console.log(`AffiliateCommission records: ${commissions}`);
  
  // Check by status
  const byStatus = await prisma.affiliateCommission.groupBy({
    by: ['status'],
    _count: true
  });
  
  console.log('\nBy Status:');
  byStatus.forEach(s => {
    console.log(`├─ ${s.status}: ${s._count}`);
  });
  
  // Check total commission amount
  const total = await prisma.affiliateCommission.aggregate({
    _sum: { amount: true }
  });
  
  console.log(`\nTotal Commission Amount: Rp ${total._sum.amount?.toLocaleString('id-ID') || 0}`);
  
  // Check users with AFFILIATE role
  const affiliates = await prisma.user.count({
    where: { role: 'AFFILIATE' }
  });
  
  console.log(`\nUsers with AFFILIATE role: ${affiliates}`);
  
  // Sample commission data
  const sample = await prisma.affiliateCommission.findMany({
    take: 5,
    include: {
      affiliate: { select: { name: true, email: true } },
      transaction: { select: { status: true, amount: true } }
    }
  });
  
  console.log('\nSample Commissions:');
  sample.forEach(c => {
    console.log(`├─ ${c.affiliate?.name}: Rp ${c.amount.toLocaleString('id-ID')} (${c.status})`);
  });
  
  await prisma.$disconnect();
}

check();
