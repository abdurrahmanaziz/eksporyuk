const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBrahmaAndiraTransactions() {
  console.log('🔧 FIXING BRAHMA ANDIRA STUCK TRANSACTIONS...\n');
  
  try {
    // Find Brahma Andira
    const user = await prisma.user.findUnique({
      where: { email: 'brahmandira@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Get PENDING transactions
    const pendingTxs = await prisma.transaction.findMany({
      where: { 
        userId: user.id,
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nFound ${pendingTxs.length} PENDING transactions`);
    
    for (const tx of pendingTxs) {
      console.log(`\n--- Processing Transaction ${tx.id} ---`);
      console.log(`Amount: Rp ${tx.amount.toLocaleString('id-ID')}`);
      console.log(`Payment Method: ${tx.paymentMethod}`);
      console.log(`Current membershipId field: ${tx.membershipId || 'NONE'}`);
      
      if (tx.metadata && tx.metadata.membershipId) {
        console.log(`Metadata membershipId: ${tx.metadata.membershipId}`);
        
        // FIX 1: Update the membershipId field from metadata
        console.log('🔧 Fixing membershipId field...');
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { 
            membershipId: tx.metadata.membershipId,
            status: 'SUCCESS', // Assuming payment was made based on user report
            paidAt: new Date()
          }
        });
        
        console.log('✅ Updated transaction status and membershipId');
        
        // FIX 2: Create UserMembership if it doesn't exist
        const existingMembership = await prisma.userMembership.findUnique({
          where: { transactionId: tx.id }
        });
        
        if (!existingMembership) {
          console.log('🔧 Creating UserMembership...');
          
          // Get membership details
          const membership = await prisma.membership.findUnique({
            where: { id: tx.metadata.membershipId }
          });
          
          if (membership) {
            // Calculate end date based on membership duration
            let endDate = new Date();
            if (membership.duration === 'LIFETIME') {
              endDate = new Date('2099-12-31'); // Lifetime
            } else if (membership.durationMonths) {
              endDate.setMonth(endDate.getMonth() + membership.durationMonths);
            } else {
              endDate.setFullYear(endDate.getFullYear() + 1); // Default 1 year
            }
            
            const userMembership = await prisma.userMembership.create({
              data: {
                id: `um_${Date.now()}_${user.id.slice(-6)}`,
                userId: user.id,
                membershipId: membership.id,
                transactionId: tx.id,
                status: 'ACTIVE',
                isActive: true,
                startDate: new Date(),
                endDate: endDate,
                activatedAt: new Date(),
                price: tx.amount,
                updatedAt: new Date()
              }
            });
            
            console.log(`✅ Created UserMembership: ${userMembership.id}`);
            
            // FIX 3: Auto-join groups and courses
            console.log('🔧 Adding to groups and courses...');
            
            // Get membership's included groups
            const membershipGroups = await prisma.membershipGroup.findMany({
              where: { membershipId: membership.id }
            });
            
            let groupsAdded = 0;
            for (const mg of membershipGroups) {
              try {
                await prisma.groupMember.create({
                  data: {
                    id: `gm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                    userId: user.id,
                    groupId: mg.groupId,
                    role: 'MEMBER',
                    joinedAt: new Date()
                  }
                });
                groupsAdded++;
              } catch (error) {
                if (error.code !== 'P2002') { // Ignore unique constraint errors
                  console.log(`Warning: Could not add to group ${mg.groupId}: ${error.message}`);
                }
              }
            }
            
            console.log(`✅ Added to ${groupsAdded} groups`);
            
            // Get membership's included courses
            const membershipCourses = await prisma.membershipCourse.findMany({
              where: { membershipId: membership.id }
            });
            
            let coursesAdded = 0;
            for (const mc of membershipCourses) {
              try {
                await prisma.courseEnrollment.create({
                  data: {
                    id: `ce_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                    userId: user.id,
                    courseId: mc.courseId,
                    status: 'ENROLLED',
                    enrolledAt: new Date()
                  }
                });
                coursesAdded++;
              } catch (error) {
                if (error.code !== 'P2002') {
                  console.log(`Warning: Could not enroll in course ${mc.courseId}: ${error.message}`);
                }
              }
            }
            
            console.log(`✅ Enrolled in ${coursesAdded} courses`);
            
            // FIX 4: Process commission if there was an affiliate
            if (tx.metadata.affiliateId && membership.affiliateCommissionRate > 0) {
              console.log('🔧 Processing affiliate commission...');
              
              // Get or create affiliate wallet
              const affiliateWallet = await prisma.wallet.upsert({
                where: { userId: tx.metadata.affiliateId },
                update: {},
                create: {
                  id: `wallet_${tx.metadata.affiliateId}`,
                  userId: tx.metadata.affiliateId,
                  balance: 0,
                  balancePending: 0
                }
              });
              
              // Calculate commission
              let commissionAmount = 0;
              if (membership.affiliateCommissionType === 'FLAT') {
                commissionAmount = parseFloat(membership.affiliateCommissionRate);
              } else {
                commissionAmount = (parseFloat(tx.amount) * parseFloat(membership.affiliateCommissionRate)) / 100;
              }
              
              // Add commission to wallet
              await prisma.wallet.update({
                where: { id: affiliateWallet.id },
                data: {
                  balance: { increment: commissionAmount }
                }
              });
              
              // Record wallet transaction
              await prisma.walletTransaction.create({
                data: {
                  id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  walletId: affiliateWallet.id,
                  amount: commissionAmount,
                  type: 'COMMISSION_EARNED',
                  description: `Commission from ${user.name} membership purchase`,
                  reference: tx.id
                }
              });
              
              console.log(`✅ Credited Rp ${commissionAmount.toLocaleString('id-ID')} commission`);
            }
            
          } else {
            console.log(`❌ Membership ${tx.metadata.membershipId} not found`);
          }
        } else {
          console.log('ℹ️ UserMembership already exists');
        }
      } else {
        console.log('❌ No membershipId in metadata');
      }
    }
    
    // Final verification
    console.log('\n═══ FINAL VERIFICATION ═══');
    const finalMemberships = await prisma.userMembership.findMany({
      where: { userId: user.id }
    });
    
    const finalGroups = await prisma.groupMember.findMany({
      where: { userId: user.id }
    });
    
    const finalCourses = await prisma.courseEnrollment.findMany({
      where: { userId: user.id }
    });
    
    console.log(`✅ User now has:`);
    console.log(`   - ${finalMemberships.length} active membership(s)`);
    console.log(`   - ${finalGroups.length} group access(es)`);
    console.log(`   - ${finalCourses.length} course enrollment(s)`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error fixing transactions:', error);
  }
}

// Run the fix
fixBrahmaAndiraTransactions();