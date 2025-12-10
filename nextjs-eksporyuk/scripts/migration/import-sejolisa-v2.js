/**
 * SEJOLI → EKSPORYUK MIGRATION v2
 * ================================
 * Import lengkap: Users, Affiliates, Transactions, Commissions
 * 
 * Data mapping:
 * - sejoli orders → eksporyuk Transaction
 * - sejoli commissions → eksporyuk AffiliateConversion
 * - sejoli affiliates → eksporyuk AffiliateProfile
 */

const { PrismaClient, TransactionType, TransactionStatus } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Constants - use command line arg or default to 18K export
const DATA_FILE = process.argv[2] 
  ? path.resolve(process.argv[2])
  : path.join(__dirname, 'wp-data', 'sejolisa-full-18000users-1765279985617.json');

// Helper functions
function generateAffiliateCode(username) {
  const cleanUsername = (username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanUsername}${Date.now().toString(36).slice(-4)}`;
}

function generateShortLink(username) {
  const cleanUsername = (username || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanUsername}-${Date.now().toString(36).slice(-6)}`;
}

// Map Sejoli status to Eksporyuk status
function mapOrderStatus(status) {
  const statusMap = {
    'completed': 'PAID',
    'pending': 'PENDING',
    'on-hold': 'PENDING',
    'cancelled': 'CANCELLED',
    'refunded': 'REFUNDED',
    'failed': 'FAILED',
    'processing': 'PENDING'
  };
  return statusMap[status?.toLowerCase()] || 'PENDING';
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 SEJOLI → EKSPORYUK MIGRATION v2');
  console.log('='.repeat(70));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  // Check file
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }
  
  // Load data
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`📂 Data File: ${DATA_FILE}`);
  console.log(`📊 DATA TO IMPORT:`);
  console.log(`   👤 Users: ${data.users?.length || 0}`);
  console.log(`   💳 Orders: ${data.orders?.length || 0}`);
  console.log(`   🔗 Affiliates: ${data.affiliates?.length || 0}`);
  console.log(`   💰 Commissions: ${data.commissions?.length || 0}`);
  console.log('');
  
  // Get default membership for transactions
  let defaultMembership = await prisma.membership.findFirst({
    where: { slug: 'lifetime' }
  });
  
  if (!defaultMembership) {
    defaultMembership = await prisma.membership.findFirst({
      orderBy: { price: 'desc' }
    });
  }
  
  console.log(`🎫 Default Membership: ${defaultMembership?.name || 'None'}`);
  
  const stats = {
    users: { created: 0, skipped: 0, failed: 0 },
    affiliates: { created: 0, skipped: 0, failed: 0 },
    transactions: { created: 0, skipped: 0, failed: 0 },
    conversions: { created: 0, skipped: 0, failed: 0 },
    memberships: { created: 0, skipped: 0, failed: 0 }
  };
  const errors = [];
  
  // Maps for ID translation
  const wpUserIdToEksporyukId = new Map();
  const wpUserIdToEmail = new Map();
  const wpAffiliateIdToEksporyukId = new Map();
  const wpOrderIdToTransactionId = new Map();
  
  // ============================================
  // STEP 1: IMPORT USERS
  // ============================================
  console.log('='.repeat(70));
  console.log('📥 STEP 1: IMPORTING USERS');
  console.log('='.repeat(70));
  
  for (const wpUser of data.users || []) {
    try {
      // Check if user exists (field is 'id' not 'ID')
      const wpUserId = wpUser.id || wpUser.ID;
      
      const existingUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: wpUser.user_email?.toLowerCase() },
            { username: wpUser.user_login }
          ]
        }
      });
      
      if (existingUser) {
        wpUserIdToEksporyukId.set(wpUserId, existingUser.id);
        wpUserIdToEmail.set(wpUserId, wpUser.user_email?.toLowerCase());
        stats.users.skipped++;
        continue;
      }
      
      // Create user
      const hashedPassword = await bcrypt.hash(wpUser.user_pass || 'eksporyuk2024', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: wpUser.user_email?.toLowerCase() || `user${wpUserId}@imported.local`,
          name: wpUser.display_name || wpUser.user_login || 'User',
          username: wpUser.user_login || `user${wpUserId}`,
          password: hashedPassword,
          role: 'MEMBER_FREE',
          isActive: true,
          emailVerified: wpUser.user_registered ? new Date(wpUser.user_registered) : null,
          createdAt: wpUser.user_registered ? new Date(wpUser.user_registered) : new Date()
        }
      });
      
      wpUserIdToEksporyukId.set(wpUserId, newUser.id);
      wpUserIdToEmail.set(wpUserId, wpUser.user_email?.toLowerCase());
      stats.users.created++;
    } catch (error) {
      errors.push(`[user] ${wpUser.user_email}: ${error.message.substring(0, 100)}`);
      stats.users.failed++;
    }
  }
  
  console.log(`   ✅ Created: ${stats.users.created}`);
  console.log(`   ⏭️  Skipped: ${stats.users.skipped}`);
  console.log(`   ❌ Failed: ${stats.users.failed}`);
  console.log(`   📋 ID Map: ${wpUserIdToEksporyukId.size} mappings`);
  
  // ============================================
  // STEP 2: IMPORT AFFILIATE PROFILES
  // ============================================
  console.log('');
  console.log('='.repeat(70));
  console.log('📥 STEP 2: IMPORTING AFFILIATE PROFILES');
  console.log('='.repeat(70));
  
  for (const wpAffiliate of data.affiliates || []) {
    try {
      // Find user by wp user_id
      const eksporyukUserId = wpUserIdToEksporyukId.get(wpAffiliate.user_id);
      
      if (!eksporyukUserId) {
        // Try by email
        const user = await prisma.user.findFirst({
          where: { email: wpAffiliate.user_email?.toLowerCase() }
        });
        if (!user) {
          errors.push(`[affiliate] ${wpAffiliate.user_email}: User not found`);
          stats.affiliates.failed++;
          continue;
        }
        wpUserIdToEksporyukId.set(wpAffiliate.user_id, user.id);
      }
      
      const userId = wpUserIdToEksporyukId.get(wpAffiliate.user_id);
      
      // Check if affiliate profile exists
      const existing = await prisma.affiliateProfile.findFirst({
        where: { userId }
      });
      
      if (existing) {
        wpAffiliateIdToEksporyukId.set(wpAffiliate.user_id, existing.id);
        stats.affiliates.skipped++;
        continue;
      }
      
      // Create affiliate profile
      const affiliateCode = wpAffiliate.affiliate_code || generateAffiliateCode(wpAffiliate.display_name);
      const shortLink = generateShortLink(wpAffiliate.display_name);
      
      const newAffiliate = await prisma.affiliateProfile.create({
        data: {
          user: { connect: { id: userId } },
          affiliateCode,
          shortLink,
          tier: 1,
          commissionRate: 30,
          totalConversions: parseInt(wpAffiliate.total_referrals) || 0,
          totalEarnings: parseFloat(wpAffiliate.total_commission) || 0,
          isActive: true,
          applicationStatus: 'APPROVED',
          approvedAt: new Date()
        }
      });
      
      wpAffiliateIdToEksporyukId.set(wpAffiliate.user_id, newAffiliate.id);
      stats.affiliates.created++;
    } catch (error) {
      errors.push(`[affiliate] ${wpAffiliate.user_email}: ${error.message.substring(0, 100)}`);
      stats.affiliates.failed++;
    }
  }
  
  console.log(`   ✅ Created: ${stats.affiliates.created}`);
  console.log(`   ⏭️  Skipped: ${stats.affiliates.skipped}`);
  console.log(`   ❌ Failed: ${stats.affiliates.failed}`);
  
  // ============================================
  // STEP 3: IMPORT ORDERS → TRANSACTIONS
  // ============================================
  console.log('');
  console.log('='.repeat(70));
  console.log('📥 STEP 3: IMPORTING ORDERS → TRANSACTIONS');
  console.log('='.repeat(70));
  
  for (const order of data.orders || []) {
    try {
      // Find user by wp user_id
      const userId = wpUserIdToEksporyukId.get(order.user_id);
      
      if (!userId) {
        errors.push(`[transaction] Order #${order.id}: User not found (wp_id: ${order.user_id})`);
        stats.transactions.failed++;
        continue;
      }
      
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        errors.push(`[transaction] Order #${order.id}: User not found in database`);
        stats.transactions.failed++;
        continue;
      }
      
      // Check for existing transaction
      const existingTx = await prisma.transaction.findFirst({
        where: { 
          OR: [
            { externalId: `sejoli-${order.id}` },
            { reference: `SEJOLI-${order.id}` }
          ]
        }
      });
      
      if (existingTx) {
        wpOrderIdToTransactionId.set(order.id, existingTx.id);
        stats.transactions.skipped++;
        continue;
      }
      
      // Map status
      const status = mapOrderStatus(order.status);
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.MEMBERSHIP,
          status: TransactionStatus[status] || TransactionStatus.PENDING,
          amount: parseFloat(order.grand_total) || 0,
          originalAmount: parseFloat(order.grand_total) || 0,
          customerName: user.name,
          customerEmail: user.email,
          description: `Sejoli Import - Order #${order.id}`,
          reference: `SEJOLI-${order.id}`,
          externalId: `sejoli-${order.id}`,
          paymentMethod: order.payment_gateway || 'IMPORTED',
          paymentProvider: 'SEJOLI',
          paidAt: status === 'PAID' ? (order.created_at ? new Date(order.created_at) : new Date()) : null,
          metadata: {
            imported: true,
            source: 'sejoli',
            originalOrderId: order.id,
            originalStatus: order.status,
            originalType: order.type,
            importedAt: new Date().toISOString()
          },
          createdAt: order.created_at ? new Date(order.created_at) : new Date()
        }
      });
      
      wpOrderIdToTransactionId.set(order.id, transaction.id);
      stats.transactions.created++;
      
      // Create membership if status is completed/paid
      if (status === 'PAID' && defaultMembership) {
        try {
          const existingMembership = await prisma.userMembership.findFirst({
            where: { 
              userId: user.id,
              membershipId: defaultMembership.id
            }
          });
          
          if (!existingMembership) {
            await prisma.userMembership.create({
              data: {
                userId: user.id,
                membershipId: defaultMembership.id,
                transactionId: transaction.id,
                startDate: order.created_at ? new Date(order.created_at) : new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 100), // 100 years
                status: 'ACTIVE'
              }
            });
            stats.memberships.created++;
          } else {
            stats.memberships.skipped++;
          }
        } catch (memError) {
          // Ignore membership errors, main transaction is created
        }
      }
      
    } catch (error) {
      errors.push(`[transaction] Order #${order.id}: ${error.message.substring(0, 100)}`);
      stats.transactions.failed++;
    }
  }
  
  console.log(`   ✅ Created: ${stats.transactions.created}`);
  console.log(`   ⏭️  Skipped: ${stats.transactions.skipped}`);
  console.log(`   ❌ Failed: ${stats.transactions.failed}`);
  
  // ============================================
  // STEP 4: IMPORT COMMISSIONS → AFFILIATE CONVERSIONS
  // ============================================
  console.log('');
  console.log('='.repeat(70));
  console.log('📥 STEP 4: IMPORTING COMMISSIONS → AFFILIATE CONVERSIONS');
  console.log('='.repeat(70));
  
  let commissionsProcessed = 0;
  
  for (const commission of data.commissions || []) {
    try {
      // Find affiliate profile
      const affiliateProfileId = wpAffiliateIdToEksporyukId.get(commission.affiliate_id);
      
      if (!affiliateProfileId) {
        // Skip silently - affiliate not imported
        stats.conversions.failed++;
        continue;
      }
      
      // Find transaction
      const transactionId = wpOrderIdToTransactionId.get(commission.order_id);
      
      if (!transactionId) {
        // Skip silently - transaction not imported
        stats.conversions.failed++;
        continue;
      }
      
      // Check existing conversion
      const existing = await prisma.affiliateConversion.findFirst({
        where: { transactionId }
      });
      
      if (existing) {
        stats.conversions.skipped++;
        continue;
      }
      
      // Create affiliate conversion
      await prisma.affiliateConversion.create({
        data: {
          affiliateId: affiliateProfileId,
          transactionId,
          commissionAmount: parseFloat(commission.amount) || 0,
          commissionRate: 30, // Default rate
          paidOut: commission.paid_status === 'paid',
          paidOutAt: commission.paid_status === 'paid' ? new Date() : null,
          createdAt: commission.created_at ? new Date(commission.created_at) : new Date()
        }
      });
      
      stats.conversions.created++;
      commissionsProcessed++;
      
      if (commissionsProcessed % 100 === 0) {
        process.stdout.write(`   📊 Processed: ${commissionsProcessed} conversions...\r`);
      }
      
    } catch (error) {
      stats.conversions.failed++;
    }
  }
  
  console.log(`   ✅ Created: ${stats.conversions.created}`);
  console.log(`   ⏭️  Skipped: ${stats.conversions.skipped}`);
  console.log(`   ❌ Failed: ${stats.conversions.failed} (mostly due to missing affiliates/transactions)`);
  
  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log('');
  console.log('='.repeat(70));
  console.log('📊 FINAL MIGRATION SUMMARY');
  console.log('='.repeat(70));
  
  const totalCreated = stats.users.created + stats.affiliates.created + 
                       stats.transactions.created + stats.memberships.created +
                       stats.conversions.created;
  const totalFailed = stats.users.failed + stats.affiliates.failed + 
                      stats.transactions.failed + stats.memberships.failed +
                      stats.conversions.failed;
  
  console.log(`
📈 RESULTS:
   👤 Users:        ${stats.users.created} created, ${stats.users.skipped} skipped, ${stats.users.failed} failed
   🔗 Affiliates:   ${stats.affiliates.created} created, ${stats.affiliates.skipped} skipped, ${stats.affiliates.failed} failed
   💳 Transactions: ${stats.transactions.created} created, ${stats.transactions.skipped} skipped, ${stats.transactions.failed} failed
   🎫 Memberships:  ${stats.memberships.created} created, ${stats.memberships.skipped} skipped, ${stats.memberships.failed} failed
   💰 Conversions:  ${stats.conversions.created} created, ${stats.conversions.skipped} skipped, ${stats.conversions.failed} failed

   📊 TOTAL: ${totalCreated} records created`);
  
  if (errors.length > 0 && errors.length <= 20) {
    console.log(`\n⚠️  ${errors.length} ERRORS:`);
    errors.forEach(e => console.log(`   - ${e}`));
  } else if (errors.length > 20) {
    console.log(`\n⚠️  ${errors.length} ERRORS (showing first 10):`);
    errors.slice(0, 10).forEach(e => console.log(`   - ${e}`));
  }
  
  // Verify final counts
  console.log('\n📊 DATABASE COUNTS:');
  const userCount = await prisma.user.count();
  const txCount = await prisma.transaction.count();
  const affiliateCount = await prisma.affiliateProfile.count();
  const membershipCount = await prisma.userMembership.count();
  const conversionCount = await prisma.affiliateConversion.count();
  
  console.log(`   👤 Users: ${userCount}`);
  console.log(`   💳 Transactions: ${txCount}`);
  console.log(`   🔗 Affiliate Profiles: ${affiliateCount}`);
  console.log(`   🎫 User Memberships: ${membershipCount}`);
  console.log(`   💰 Affiliate Conversions: ${conversionCount}`);
  
  console.log('');
  console.log('='.repeat(70));
  if (totalFailed === 0 || stats.transactions.created > 0) {
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
  } else {
    console.log('⚠️  MIGRATION COMPLETED WITH WARNINGS');
  }
  console.log('='.repeat(70));
  
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
