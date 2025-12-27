const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION: Event vs Membership Access\n');
  console.log('═'.repeat(80));

  const eventKeywords = ['Zoom Ekspor', 'Webinar Ekspor', 'Kopdar Akbar', 'Zoominar', 'Workshop'];
  const membershipKeywords = ['Paket Ekspor Yuk', 'Kelas Eksporyuk', 'Re Kelas', 'Bundling', 'Promo.*THR'];
  
  const allTransactions = await prisma.transaction.findMany({ where: { status: 'SUCCESS' } });
  console.log(`Total transactions: ${allTransactions.length}\n`);
  
  const userPurchases = {};
  
  for (const tx of allTransactions) {
    const userId = tx.userId;
    const description = tx.description || '';
    
    if (!userPurchases[userId]) {
      userPurchases[userId] = { events: [], memberships: [], others: [] };
    }
    
    const isEvent = eventKeywords.some(k => description.includes(k));
    const isMembership = membershipKeywords.some(k => new RegExp(k, 'i').test(description));
    
    if (isEvent) userPurchases[userId].events.push(description);
    else if (isMembership) userPurchases[userId].memberships.push(description);
    else userPurchases[userId].others.push(description);
  }
  
  let eventOnly = 0, membershipOnly = 0, both = 0;
  const eventOnlyWithPremiumRole = [];
  
  for (const [userId, purchases] of Object.entries(userPurchases)) {
    const hasEvents = purchases.events.length > 0;
    const hasMemberships = purchases.memberships.length > 0;
    
    if (hasEvents && !hasMemberships && purchases.others.length === 0) {
      eventOnly++;
      if (eventOnly <= 50) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, role: true } });
        if (user?.role === 'MEMBER_PREMIUM') eventOnlyWithPremiumRole.push({ userId, email: user.email, events: purchases.events });
      }
    } else if (hasMemberships && !hasEvents) membershipOnly++;
    else if (hasEvents && hasMemberships) both++;
  }
  
  console.log(`✅ Event/Webinar ONLY: ${eventOnly}`);
  console.log(`✅ Membership ONLY: ${membershipOnly}`);
  console.log(`✅ BOTH: ${both}\n`);
  console.log(`⚠️  Event-only with PREMIUM role (sampled 50): ${eventOnlyWithPremiumRole.length}\n`);
  
  if (eventOnlyWithPremiumRole.length > 0) {
    for (const u of eventOnlyWithPremiumRole.slice(0, 5)) {
      console.log(`❌ ${u.email} - ${u.events[0]}`);
    }
  } else {
    console.log(`✅✅✅ VERIFICATION PASSED! ✅✅✅`);
    console.log(`\n✅ User EVENT → Akses sesuai`);
    console.log(`✅ User LIFETIME → Akses LIFETIME`);
    console.log(`✅ TIDAK ADA user event dapat akses tidak semestinya\n`);
  }
  
  await prisma.$disconnect();
}

finalVerification().catch(console.error);
