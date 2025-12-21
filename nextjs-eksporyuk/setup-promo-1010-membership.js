/**
 * Setup Promo 10.10 2025 - Ensure Lifetime Membership Access
 * Sejoli Product ID: 20852
 * Price: Rp 1.998.000
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPromo1010Membership() {
  console.log('🎯 SETUP PROMO 10.10 2025 - LIFETIME MEMBERSHIP\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Check if membership plan exists
    console.log('1️⃣ Checking membership plans...\n');
    
    const existingMembership = await prisma.membership.findFirst({
      where: {
        OR: [
          { name: { contains: 'Promo 10.10', mode: 'insensitive' } },
          { slug: 'promo-10-10-2025' },
          { name: { contains: 'Paket Ekspor Yuk - Lifetime', mode: 'insensitive' } }
        ]
      }
    });

    let membershipId;

    if (existingMembership) {
      console.log(`✅ Found existing membership: ${existingMembership.name}`);
      console.log(`   ID: ${existingMembership.id}`);
      console.log(`   Slug: ${existingMembership.slug}`);
      console.log(`   Duration: ${existingMembership.duration} months`);
      console.log(`   Price: Rp ${existingMembership.price.toLocaleString('id-ID')}\n`);
      
      membershipId = existingMembership.id;

      // Update if needed to ensure it's lifetime
      if (existingMembership.duration !== 'LIFETIME') {
        console.log('⚠️  Updating to ensure LIFETIME access...');
        await prisma.membership.update({
          where: { id: existingMembership.id },
          data: {
            duration: 'LIFETIME',
            features: {
              lifetime_access: true,
              all_courses: true,
              priority_support: true,
              certificate: true,
              community_access: true,
              updates: 'lifetime'
            }
          }
        });
        console.log('✅ Updated to LIFETIME\n');
      } else {
        console.log('✅ Already set to LIFETIME\n');
      }
    } else {
      // Create new membership for Promo 10.10 2025
      console.log('📦 Creating new membership for Promo 10.10 2025...\n');
      
      const newMembership = await prisma.membership.create({
        data: {
          name: 'Paket Ekspor Yuk - Lifetime (Promo 10.10)',
          slug: 'paket-ekspor-yuk-lifetime-promo-1010',
          description: 'Paket Lifetime Membership - Special Promo 10.10 2025',
          price: 1998000,
          duration: 'LIFETIME', // Enum value
          features: {
            lifetime_access: true,
            all_courses: true,
            priority_support: true,
            certificate: true,
            community_access: true,
            updates: 'lifetime',
            promo: '10.10 Special'
          },
          isActive: true,
          affiliateCommissionRate: 0, // No commission as per Sejoli
          commissionType: 'FLAT'
        }
      });

      membershipId = newMembership.id;
      
      console.log(`✅ Created new membership: ${newMembership.name}`);
      console.log(`   ID: ${newMembership.id}`);
      console.log(`   Slug: ${newMembership.slug}`);
      console.log(`   Duration: LIFETIME\n`);
    }

    // 2. Check transactions with Sejoli Product ID 20852
    console.log('2️⃣ Checking transactions for Product ID 20852...\n');
    
    const transactions = await prisma.transaction.findMany({
      where: {
        metadata: {
          path: ['sejoliProductId'],
          equals: 20852
        },
        status: 'SUCCESS'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        membership: true
      }
    });

    console.log(`Found ${transactions.length} transactions for Product ID 20852\n`);

    if (transactions.length > 0) {
      console.log('3️⃣ Processing transactions and creating memberships...\n');
      
      let created = 0;
      let alreadyExists = 0;
      let errors = 0;

      for (const tx of transactions) {
        try {
          // Check if user already has membership for this transaction
          if (tx.membership) {
            console.log(`  ⏭️  ${tx.user?.name || 'N/A'} - Already has membership (${tx.membership.status})`);
            alreadyExists++;
            continue;
          }

          // Create UserMembership
          const userMembership = await prisma.userMembership.create({
            data: {
              userId: tx.userId,
              membershipId: membershipId,
              transactionId: tx.id,
              startDate: tx.paidAt || tx.createdAt,
              endDate: new Date('2099-12-31'), // Lifetime
              status: 'ACTIVE',
              isActive: true,
              activatedAt: tx.paidAt || tx.createdAt,
              price: tx.amount
            }
          });

          console.log(`  ✅ ${tx.user?.name || 'N/A'} (${tx.user?.email || 'N/A'})`);
          console.log(`     Invoice: ${tx.invoiceNumber}`);
          console.log(`     Membership ID: ${userMembership.id}`);
          console.log(`     End Date: LIFETIME (2099-12-31)\n`);
          
          created++;

        } catch (error) {
          console.log(`  ❌ ${tx.user?.name || 'N/A'} - Error: ${error.message}\n`);
          errors++;
        }
      }

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('SUMMARY:');
      console.log(`Total Transactions: ${transactions.length}`);
      console.log(`✅ Memberships Created: ${created}`);
      console.log(`⏭️  Already Exists: ${alreadyExists}`);
      console.log(`❌ Errors: ${errors}`);
      console.log('═══════════════════════════════════════════════════════════════\n');
    } else {
      console.log('ℹ️  No transactions found for Product ID 20852 yet.\n');
      console.log('   Membership plan is ready for future purchases.\n');
    }

    // 4. Verify membership is in Membership table
    console.log('4️⃣ Verifying membership in database...\n');
    
    const verification = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        _count: {
          select: {
            userMemberships: true
          }
        }
      }
    });

    if (verification) {
      console.log('✅ VERIFICATION SUCCESSFUL');
      console.log(`   Name: ${verification.name}`);
      console.log(`   Slug: ${verification.slug}`);
      console.log(`   Duration: ${verification.duration} months`);
      console.log(`   Price: Rp ${verification.price.toLocaleString('id-ID')}`);
      console.log(`   Active Users: ${verification._count.userMemberships}`);
      console.log(`   Is Active: ${verification.isActive ? 'Yes' : 'No'}\n`);
    }

    console.log('🎉 SETUP COMPLETE!\n');
    console.log('Promo 10.10 2025 sekarang memberikan akses LIFETIME membership.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run
setupPromo1010Membership()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
