const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCheck() {
  console.log('🔍 FINAL CHECK - Sample User Verification\n');
  console.log('═'.repeat(80));
  
  // Check user yang tadi salah (event-only dapat premium)
  const sampleEmails = [
    'intanmargarita@gmail.com', // Kopdar only
    'cahayahatisemesta@gmail.com', // Kopdar only
    'admin@eksporyuk.com', // Admin (should stay ADMIN)
  ];
  
  for (const email of sampleEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true }
    });
    
    if (!user) {
      console.log(`❌ User not found: ${email}\n`);
      continue;
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, status: 'SUCCESS' },
      orderBy: { createdAt: 'asc' }
    });
    
    const membership = await prisma.userMembership.findFirst({
      where: { userId: user.id, status: 'ACTIVE' }
    });
    
    let membershipData = null;
    if (membership) {
      membershipData = await prisma.membership.findUnique({
        where: { id: membership.membershipId }
      });
    }
    
    console.log(`\n📧 ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Transactions: ${transactions.length}`);
    transactions.forEach(tx => {
      console.log(`      - ${tx.description} (Rp ${tx.amount})`);
    });
    console.log(`   Membership: ${membershipData ? membershipData.duration : 'None'}`);
    
    // Verify correctness
    const hasEventOnly = transactions.every(tx => {
      const desc = tx.description || '';
      return desc.includes('Webinar') || desc.includes('Zoom') || desc.includes('Kopdar');
    });
    
    if (hasEventOnly && transactions.length > 0) {
      if (user.role === 'MEMBER_FREE' && !membershipData) {
        console.log(`   ✅ CORRECT: Event-only → FREE role, no membership`);
      } else if (['ADMIN', 'MENTOR', 'FOUNDER'].includes(user.role)) {
        console.log(`   ✅ CORRECT: Special role (${user.role})`);
      } else {
        console.log(`   ❌ WRONG: Should be FREE but is ${user.role}`);
      }
    } else if (membershipData) {
      console.log(`   ✅ CORRECT: Has membership → ${user.role}`);
    }
  }
  
  // Check user with BOTH event + membership
  console.log('\n' + '═'.repeat(80));
  console.log('\n🔍 Checking user with BOTH event + membership:\n');
  
  const bothUser = await prisma.transaction.findFirst({
    where: {
      status: 'SUCCESS',
      description: { contains: 'Paket Ekspor Yuk Lifetime' }
    }
  });
  
  if (bothUser) {
    const user = await prisma.user.findUnique({
      where: { id: bothUser.userId },
      select: { id: true, email: true, role: true }
    });
    
    const allTx = await prisma.transaction.findMany({
      where: { userId: bothUser.userId, status: 'SUCCESS' }
    });
    
    const membership = await prisma.userMembership.findFirst({
      where: { userId: bothUser.userId, status: 'ACTIVE' }
    });
    
    let membershipData = null;
    if (membership) {
      membershipData = await prisma.membership.findUnique({
        where: { id: membership.membershipId }
      });
    }
    
    console.log(`📧 ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Transactions: ${allTx.length}`);
    allTx.slice(0, 3).forEach(tx => {
      console.log(`      - ${tx.description}`);
    });
    if (allTx.length > 3) console.log(`      ... and ${allTx.length - 3} more`);
    console.log(`   Membership: ${membershipData ? membershipData.duration : 'None'}`);
    
    if (user.role === 'MEMBER_PREMIUM' && membershipData) {
      console.log(`   ✅ CORRECT: Has membership → PREMIUM role`);
    } else {
      console.log(`   ⚠️  Check needed`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✅ Sample verification complete!\n');
  
  await prisma.$disconnect();
}

finalCheck().catch(console.error);
