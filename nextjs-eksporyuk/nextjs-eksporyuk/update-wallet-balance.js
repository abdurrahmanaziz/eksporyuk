const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== UPDATE WALLET BALANCE FROM AFFILIATE PROFILE ===\n');
  
  // Get all affiliate profiles with users
  const profiles = await prisma.affiliateProfile.findMany({
    include: { user: true }
  });
  
  console.log(`Total profiles: ${profiles.length}`);
  
  let updated = 0;
  let created = 0;
  
  for (const profile of profiles) {
    const earnings = Number(profile.totalEarnings) || 0;
    
    // Update or create wallet
    const wallet = await prisma.wallet.upsert({
      where: { userId: profile.userId },
      create: {
        userId: profile.userId,
        balance: earnings,
        totalEarnings: earnings
      },
      update: {
        balance: earnings,
        totalEarnings: earnings
      }
    });
    
    if (wallet) {
      updated++;
      if (earnings > 10000000) {
        console.log(`✓ ${profile.user.name} → Balance: Rp ${earnings.toLocaleString('id-ID')}`);
      }
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Updated: ${updated}`);
  
  // Show top 10 wallets
  console.log('\n=== TOP 10 WALLETS ===');
  const top10 = await prisma.wallet.findMany({
    orderBy: { balance: 'desc' },
    take: 10,
    include: { user: true }
  });
  
  top10.forEach((w, i) => {
    console.log(`${i+1}. ${w.user.name} | Balance: Rp ${Number(w.balance).toLocaleString('id-ID')}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

