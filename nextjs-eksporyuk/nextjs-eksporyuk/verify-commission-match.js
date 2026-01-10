import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sum commissions from AffiliateConversion
const conversions = await prisma.affiliateConversion.groupBy({
  by: ['affiliateId'],
  _sum: { commissionAmount: true },
  _count: true
});

console.log(`\n📊 COMMISSION VERIFICATION\n`);

let totalFromConversions = 0;
const top10 = [];

for (const conv of conversions) {
  const sum = Number(conv._sum.commissionAmount || 0);
  totalFromConversions += sum;
  
  const profile = await prisma.affiliateProfile.findUnique({
    where: { id: conv.affiliateId },
    include: { user: { select: { name: true } } }
  });
  
  top10.push({
    name: profile?.user?.name || 'Unknown',
    commission: sum,
    count: conv._count
  });
}

top10.sort((a, b) => b.commission - a.commission);

console.log(`Total from AffiliateConversion: Rp ${totalFromConversions.toLocaleString('id-ID')}`);
console.log(`Total records: ${conversions.length} affiliates\n`);

// Compare with Wallet balances
const wallets = await prisma.wallet.findMany({
  where: { balance: { gt: 0 } }
});

const totalFromWallets = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

console.log(`Total from Wallet.balance: Rp ${totalFromWallets.toLocaleString('id-ID')}`);
console.log(`Wallets with balance: ${wallets.length}\n`);

console.log(`✅ Match? ${Math.abs(totalFromConversions - totalFromWallets) < 1000 ? 'YES' : 'NO'}`);
console.log(`Difference: Rp ${Math.abs(totalFromConversions - totalFromWallets).toLocaleString('id-ID')}\n`);

console.log(`Top 10 Affiliates by Commission:`);
top10.slice(0, 10).forEach((a, i) => {
  console.log(`${i + 1}. ${a.name}: Rp ${a.commission.toLocaleString('id-ID')} (${a.count} conversions)`);
});

await prisma.$disconnect();
