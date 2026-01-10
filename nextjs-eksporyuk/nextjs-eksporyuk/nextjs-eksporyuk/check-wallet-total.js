import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const wallets = await prisma.wallet.findMany({
  where: {
    OR: [
      { balance: { gt: 0 } },
      { balancePending: { gt: 0 } }
    ]
  },
  include: {
    user: { select: { name: true, email: true, role: true } }
  }
});

const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
const totalPending = wallets.reduce((sum, w) => sum + Number(w.balancePending), 0);

console.log('💰 WALLET SUMMARY\n');
console.log(`Total wallets with balance: ${wallets.length}`);
console.log(`Total balance: Rp ${totalBalance.toLocaleString('id-ID')}`);
console.log(`Total pending: Rp ${totalPending.toLocaleString('id-ID')}`);
console.log(`\nTop 20 Affiliates:`);

wallets
  .sort((a, b) => Number(b.balance) - Number(a.balance))
  .slice(0, 20)
  .forEach((w, i) => {
    console.log(`${i + 1}. ${w.user.name}: Rp ${Number(w.balance).toLocaleString('id-ID')}`);
  });

await prisma.$disconnect();
