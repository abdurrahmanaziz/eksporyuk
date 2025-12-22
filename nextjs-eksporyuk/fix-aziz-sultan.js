const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAzizSultanMembership() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'abdurrahmanazizsultan@gmail.com' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { membership: true }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('🔍 User Details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Current Role:', user.role);
    console.log('Created:', user.createdAt);
    
    const latestTransaction = user.transactions[0];
    if (latestTransaction) {
      console.log('\n💳 Latest Transaction:');
      console.log('Invoice:', latestTransaction.invoice);
      console.log('Amount:', latestTransaction.amount);
      console.log('Status:', latestTransaction.status);
      console.log('Membership ID:', latestTransaction.membershipId);
      console.log('Created:', latestTransaction.createdAt);
    }
    
    // Cari membership yang sesuai dengan harga
    const memberships = await prisma.membership.findMany({
      where: {
        price: latestTransaction.amount
      }
    });
    
    console.log('\n🎯 Matching Memberships:');
    memberships.forEach(m => {
      console.log(`- ${m.name} | Price: ${m.price} | Duration: ${m.duration}`);
    });
    
    if (latestTransaction && latestTransaction.status === 'SUCCESS') {
      // Update user role ke MEMBER_PREMIUM
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MEMBER_PREMIUM' }
      });
      
      console.log('\n✅ Updated user role to MEMBER_PREMIUM');
      
      // Jika ada membership yang cocok, assign membership
      if (memberships.length > 0) {
        const membership = memberships[0]; // Ambil yang pertama
        
        // Hitung endDate berdasarkan duration
        const startDate = latestTransaction.createdAt;
        let endDate;
        if (membership.duration === 'LIFETIME') {
          endDate = new Date('2099-12-31'); // Set tanggal jauh di masa depan untuk lifetime
        } else if (membership.duration === '6_MONTHS') {
          endDate = new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
        } else { // 12_MONTHS
          endDate = new Date(startDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000);
        }
        
        // Create UserMembership dengan schema yang benar
        const userMembership = await prisma.userMembership.create({
          data: {
            user: { connect: { id: user.id } },
            membership: { connect: { id: membership.id } },
            status: 'ACTIVE',
            isActive: true,
            startDate: startDate,
            endDate: endDate,
            activatedAt: new Date(),
            price: membership.price,
            autoRenew: false
          }
        });
        
        // Update transaction dengan membership relation
        await prisma.transaction.update({
          where: { id: latestTransaction.id },
          data: { 
            membership: { connect: { id: userMembership.id } }
          }
        });
        
        console.log(`✅ Assigned membership: ${membership.name}`);
        console.log(`   Duration: ${membership.duration}`);
        console.log(`   Start: ${startDate.toISOString()}`);
        console.log(`   End: ${endDate.toISOString()}`);
      }
      
      console.log('🎉 Fix completed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAzizSultanMembership();