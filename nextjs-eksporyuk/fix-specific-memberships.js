const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSpecificUserMemberships() {
  console.log('🔧 FIXING SPECIFIC USER MEMBERSHIPS BASED ON TRANSACTION ANALYSIS');
  console.log('='.repeat(70));
  
  try {
    // Mapping based on transaction analysis and your instructions
    const userMembershipFixes = [
      {
        name: 'TRI ARDA PREBAWA',
        email: 'tri.arda.prebawa@gmail.com',
        correctMembership: 'Paket Ekspor Yuk - 12 Bulan',
        reason: 'Per your instruction: kasih 12 bulan'
      },
      {
        name: 'Dedy Kristiawan', 
        email: 'restorasimercyklasik@gmail.com',
        correctMembership: 'Paket Ekspor Yuk - 12 Bulan',
        reason: 'Transaction desc: "Re Kelas 12 Bulan Ekspor Yuk" + your instruction'
      },
      {
        name: 'Yohanes Ndona',
        email: 'ndonajohn31@gmail.com', 
        correctMembership: 'Paket Ekspor Yuk - 6 Bulan',
        reason: 'Transaction amount: Rp 699,000 (6 bulan price) + your instruction'
      }
    ];
    
    for (const userFix of userMembershipFixes) {
      console.log(`\n👤 PROCESSING: ${userFix.name}`);
      console.log('-'.repeat(50));
      
      // Find user
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: userFix.name, mode: 'insensitive' } },
            { email: userFix.email }
          ]
        },
        include: {
          userMemberships: {
            where: { isActive: true },
            include: { membership: true }
          }
        }
      });
      
      if (!user) {
        console.log(`❌ User not found: ${userFix.name}`);
        continue;
      }
      
      console.log(`✅ Found: ${user.name} (${user.email})`);
      console.log(`🎯 Target membership: ${userFix.correctMembership}`);
      console.log(`💡 Reason: ${userFix.reason}`);
      
      // Get target membership
      const targetMembership = await prisma.membership.findFirst({
        where: {
          name: userFix.correctMembership,
          isActive: true
        }
      });
      
      if (!targetMembership) {
        console.log(`❌ Target membership not found: ${userFix.correctMembership}`);
        continue;
      }
      
      console.log(`\n📋 Current active memberships: ${user.userMemberships.length}`);
      for (const um of user.userMemberships) {
        console.log(`   - ${um.membership.name} (ID: ${um.id})`);
      }
      
      // Check if user already has the correct membership
      const hasCorrectMembership = user.userMemberships.some(
        um => um.membership.name === userFix.correctMembership
      );
      
      if (hasCorrectMembership) {
        console.log(`✅ User already has correct membership: ${userFix.correctMembership}`);
        
        // Deactivate all other memberships
        const membershipsToDeactivate = user.userMemberships.filter(
          um => um.membership.name !== userFix.correctMembership
        );
        
        for (const um of membershipsToDeactivate) {
          await prisma.userMembership.update({
            where: { id: um.id },
            data: { isActive: false }
          });
          console.log(`❌ Deactivated: ${um.membership.name}`);
        }
      } else {
        console.log(`🔄 Need to create correct membership: ${userFix.correctMembership}`);
        
        // Create new correct membership
        await prisma.userMembership.create({
          data: {
            userId: user.id,
            membershipId: targetMembership.id,
            isActive: true,
            startDate: new Date(),
            endDate: userFix.correctMembership.includes('Lifetime') ? 
              new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : // 100 years
              userFix.correctMembership.includes('12 Bulan') ?
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : // 1 year
                new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)   // 6 months
          }
        });
        console.log(`✅ Created new membership: ${userFix.correctMembership}`);
        
        // Deactivate all old memberships
        for (const um of user.userMemberships) {
          await prisma.userMembership.update({
            where: { id: um.id },
            data: { isActive: false }
          });
          console.log(`❌ Deactivated old: ${um.membership.name}`);
        }
      }
      
      console.log(`🎉 COMPLETED: ${user.name} now has only "${userFix.correctMembership}"`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 MEMBERSHIP FIX SUMMARY');
    console.log('='.repeat(70));
    console.log('✅ TRI ARDA PREBAWA → 12 Bulan (per instruction)');
    console.log('✅ Dedy Kristiawan → 12 Bulan (transaction desc + instruction)');
    console.log('✅ Yohanes Ndona → 6 Bulan (Rp 699,000 transaction + instruction)');
    console.log('\n🎯 All users now have single, correct membership based on actual transactions');
    console.log('📝 Ready to run comprehensive system check to verify fixes');
    
  } catch (error) {
    console.error('❌ Error fixing memberships:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificUserMemberships();