/**
 * IMPORT DATA SEJOLI KE NEON DATABASE
 * 
 * Script ini akan import:
 * 1. Users (18,000 users)
 * 2. Transactions (18,584 orders) 
 * 3. AffiliateConversions dengan komisi yang BENAR per product
 * 
 * Komisi dihitung berdasarkan product_id, BUKAN persentase!
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Load data files
const sejoliData = require('./wp-data/sejolisa-full-18000users-1765279985617.json');
const productMapping = require('./product-membership-mapping.js');

// Helper: Get commission by product ID
function getCommissionByProductId(productId) {
  const product = productMapping.PRODUCT_MEMBERSHIP_MAPPING[productId];
  if (!product) {
    console.warn(`⚠️  Product ID ${productId} tidak ada di mapping, komisi = 0`);
    return 0;
  }
  return product.commissionFlat || 0;
}

// Helper: Get membership slug by product ID  
function getMembershipSlugByProductId(productId) {
  const product = productMapping.PRODUCT_MEMBERSHIP_MAPPING[productId];
  return product?.membershipSlug || null;
}

// Helper: Get membership duration by product ID
function getMembershipDurationByProductId(productId) {
  const product = productMapping.PRODUCT_MEMBERSHIP_MAPPING[productId];
  return product?.duration || null; // null = lifetime
}

async function importSejoliData() {
  console.log('🚀 MEMULAI IMPORT DATA SEJOLI KE NEON DATABASE');
  console.log('='.repeat(80));
  
  const stats = {
    usersImported: 0,
    usersSkipped: 0,
    transactionsImported: 0,
    transactionsSkipped: 0,
    conversionsCreated: 0,
    totalCommission: 0,
    errors: []
  };

  try {
    // ==========================================
    // STEP 1: Import Users
    // ==========================================
    console.log('\n📥 STEP 1: Import Users...');
    
    for (const sejoliUser of sejoliData.users) {
      try {
        // Skip if user already exists (check by email)
        const existingUser = await prisma.user.findUnique({
          where: { email: sejoliUser.user_email }
        });
        
        if (existingUser) {
          stats.usersSkipped++;
          continue;
        }

        // Hash password (default: email sebagai password)
        const hashedPassword = await bcrypt.hash(sejoliUser.user_email, 10);

        // Create user
        await prisma.user.create({
          data: {
            name: sejoliUser.display_name || sejoliUser.user_login,
            email: sejoliUser.user_email,
            password: hashedPassword,
            phone: sejoliUser.phone || null,
            whatsapp: sejoliUser.phone || null,
            role: 'MEMBER_FREE', // Default role
            createdAt: new Date(sejoliUser.user_registered),
            updatedAt: new Date()
          }
        });
        
        stats.usersImported++;
        
        if (stats.usersImported % 500 === 0) {
          console.log(`   ✓ ${stats.usersImported} users imported...`);
        }
      } catch (error) {
        stats.usersSkipped++;
        stats.errors.push(`User ${sejoliUser.user_email}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Users imported: ${stats.usersImported}`);
    console.log(`⏭️  Users skipped: ${stats.usersSkipped}`);

    // ==========================================
    // STEP 1.5: Create Affiliate Profiles
    // ==========================================
    console.log('\n📥 STEP 1.5: Create Affiliate Profiles...');
    
    let affiliatesCreated = 0;
    let affiliatesSkipped = 0;
    
    for (const affiliateData of sejoliData.affiliates) {
      try {
        // Get user by email
        const userId = userEmailMap.get(affiliateData.user_email);
        if (!userId) {
          affiliatesSkipped++;
          continue;
        }
        
        // Check if affiliate profile already exists
        const existingAffiliate = await prisma.affiliateProfile.findUnique({
          where: { userId: userId }
        });
        
        if (existingAffiliate) {
          affiliatesSkipped++;
          continue;
        }
        
        // Create affiliate profile
        const newAffiliate = await prisma.affiliateProfile.create({
          data: {
            userId: userId,
            affiliateCode: affiliateData.affiliate_code || `AFF-${userId.slice(0, 8)}`,
            commissionRate: 30, // Default commission rate
            isActive: true,
            createdAt: new Date()
          }
        });
        
        // Update userAffiliateMap
        userAffiliateMap.set(userId, newAffiliate.id);
        
        affiliatesCreated++;
        
        if (affiliatesCreated % 500 === 0) {
          console.log(`   ✓ ${affiliatesCreated} affiliate profiles created...`);
        }
      } catch (error) {
        affiliatesSkipped++;
        stats.errors.push(`Affiliate ${affiliateData.user_email}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Affiliate profiles created: ${affiliatesCreated}`);
    console.log(`⏭️  Affiliate profiles skipped: ${affiliatesSkipped}`);

    // Reload affiliate map after creating new affiliates
    const updatedAffiliates = await prisma.affiliateProfile.findMany({
      select: { id: true, userId: true }
    });
    userAffiliateMap.clear();
    updatedAffiliates.forEach(a => userAffiliateMap.set(a.userId, a.id));

    // ==========================================
    // STEP 2: Import Transactions & Conversions
    // ==========================================
    console.log('\n📥 STEP 2: Import Transactions & Affiliate Conversions...');
    
    // Get all users for mapping
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    const userEmailMap = new Map(allUsers.map(u => [u.email, u.id]));
    
    // Get all affiliates for mapping
    const allAffiliates = await prisma.affiliateProfile.findMany({
      select: { id: true, userId: true }
    });
    const userAffiliateMap = new Map(allAffiliates.map(a => [a.userId, a.id]));
    
    // Get default admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('❌ Admin user tidak ditemukan! Buat admin dulu.');
    }

    for (const order of sejoliData.orders) {
      try {
        // Skip if not completed
        if (order.status !== 'completed') {
          stats.transactionsSkipped++;
          continue;
        }

        // Get user
        const userFromSejoli = sejoliData.users.find(u => u.id === order.user_id);
        if (!userFromSejoli) {
          stats.transactionsSkipped++;
          continue;
        }

        const userId = userEmailMap.get(userFromSejoli.user_email);
        if (!userId) {
          stats.transactionsSkipped++;
          continue;
        }

        // Get affiliate (if exists)
        let affiliateId = null;
        if (order.affiliate_id && order.affiliate_id !== 0) {
          // affiliate_id in orders corresponds to user_id in affiliates table
          const affiliateUser = sejoliData.affiliates.find(a => a.user_id === order.affiliate_id);
          if (affiliateUser) {
            const affiliateUserId = userEmailMap.get(affiliateUser.user_email);
            if (affiliateUserId) {
              affiliateId = userAffiliateMap.get(affiliateUserId) || null;
            }
          }
        }

        // Get commission based on product_id
        const commissionAmount = getCommissionByProductId(order.product_id);
        
        // Get membership info
        const membershipSlug = getMembershipSlugByProductId(order.product_id);
        const membershipDuration = getMembershipDurationByProductId(order.product_id);

        // Determine transaction type based on product
        let transactionType = 'MEMBERSHIP'; // Default for most Sejoli products
        const productData = productMapping.PRODUCT_MEMBERSHIP_MAPPING[order.product_id];
        if (productData) {
          if (productData.type === 'event') transactionType = 'EVENT';
          else if (productData.type === 'tool') transactionType = 'PRODUCT';
          else if (productData.type === 'free') transactionType = 'PRODUCT';
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: userId,
            type: transactionType,
            amount: order.grand_total,
            status: 'SUCCESS',
            reference: `SEJOLI-${order.id}`,
            externalId: `sejoli-${order.id}`,
            metadata: {
              sejoliOrderId: order.id,
              sejoliProductId: order.product_id,
              sejoliUserId: order.user_id,
              sejoliAffiliateId: order.affiliate_id,
              paymentGateway: order.payment_gateway,
              quantity: order.quantity,
              orderType: order.type,
              membershipSlug: membershipSlug,
              membershipDuration: membershipDuration
            },
            affiliateId: affiliateId,
            createdAt: new Date(order.created_at),
            updatedAt: new Date(order.created_at)
          }
        });

        stats.transactionsImported++;

        // Create AffiliateConversion if there's an affiliate
        if (affiliateId && commissionAmount > 0) {
          await prisma.affiliateConversion.create({
            data: {
              affiliateId: affiliateId,
              transactionId: transaction.id,
              commissionAmount: commissionAmount,
              commissionRate: 0, // Flat commission, not percentage
              paidOut: false,
              createdAt: new Date(order.created_at)
            }
          });

          stats.conversionsCreated++;
          stats.totalCommission += commissionAmount;
        }

        // Update user membership if applicable
        if (membershipSlug) {
          const membership = await prisma.membership.findUnique({
            where: { slug: membershipSlug }
          });

          if (membership) {
            // Calculate end date
            let endDate = null;
            if (membershipDuration) {
              endDate = new Date(order.created_at);
              endDate.setDate(endDate.getDate() + membershipDuration);
            }

            // Create user membership
            await prisma.userMembership.upsert({
              where: { userId: userId },
              create: {
                userId: userId,
                membershipId: membership.id,
                startDate: new Date(order.created_at),
                endDate: endDate,
                status: endDate && endDate < new Date() ? 'EXPIRED' : 'ACTIVE'
              },
              update: {
                // If user already has membership, only update if new one is better
                membershipId: membership.id,
                startDate: new Date(order.created_at),
                endDate: endDate
              }
            });

            // Update user role to MEMBER_PREMIUM if active
            if (!endDate || endDate > new Date()) {
              await prisma.user.update({
                where: { id: userId },
                data: { role: 'MEMBER_PREMIUM' }
              });
            }
          }
        }

        if (stats.transactionsImported % 500 === 0) {
          console.log(`   ✓ ${stats.transactionsImported} transactions imported...`);
        }
      } catch (error) {
        stats.transactionsSkipped++;
        stats.errors.push(`Order ${order.id}: ${error.message}`);
      }
    }

    console.log(`\n✅ Transactions imported: ${stats.transactionsImported}`);
    console.log(`⏭️  Transactions skipped: ${stats.transactionsSkipped}`);
    console.log(`💰 Conversions created: ${stats.conversionsCreated}`);
    console.log(`💵 Total Commission: Rp ${stats.totalCommission.toLocaleString('id-ID')}`);

    // ==========================================
    // STEP 3: Verify Data
    // ==========================================
    console.log('\n🔍 STEP 3: Verifying imported data...');
    
    const verification = {
      totalUsers: await prisma.user.count(),
      totalTransactions: await prisma.transaction.count({ 
        where: { reference: { startsWith: 'SEJOLI-' } } 
      }),
      totalConversions: await prisma.affiliateConversion.count(),
      commissionSum: await prisma.affiliateConversion.aggregate({
        _sum: { commissionAmount: true }
      })
    };

    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`   Total Users in DB: ${verification.totalUsers}`);
    console.log(`   Total Sejoli Transactions: ${verification.totalTransactions}`);
    console.log(`   Total Affiliate Conversions: ${verification.totalConversions}`);
    console.log(`   Total Commission in DB: Rp ${(verification.commissionSum._sum.commissionAmount || 0).toLocaleString('id-ID')}`);

    // Sample checks
    console.log('\n📍 SAMPLE COMMISSION VERIFICATION:');
    
    const samples = await prisma.affiliateConversion.findMany({
      where: {
        transaction: {
          reference: { startsWith: 'SEJOLI-' }
        }
      },
      include: {
        transaction: true
      },
      take: 10
    });

    samples.forEach((conv, i) => {
      const productId = conv.transaction.metadata?.sejoliProductId;
      console.log(`   ${i + 1}. Product ${productId} → Komisi: Rp ${conv.commissionAmount.toLocaleString('id-ID')}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ IMPORT SELESAI!');
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Users imported: ${stats.usersImported}`);
    console.log(`   Transactions imported: ${stats.transactionsImported}`);
    console.log(`   Conversions created: ${stats.conversionsCreated}`);
    console.log(`   Total Commission: Rp ${stats.totalCommission.toLocaleString('id-ID')}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length} total, showing first 10):`);
      stats.errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
if (require.main === module) {
  importSejoliData()
    .then(() => {
      console.log('\n🎉 Import berhasil!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Import gagal:', error);
      process.exit(1);
    });
}

module.exports = { importSejoliData };
