const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeAffiliateMigration() {
  try {
    console.log('=== COMPLETE AFFILIATE MIGRATION ANALYSIS ===\n');

    // 1. Get current migration status
    console.log('📊 Current Migration Status...\n');
    
    const migrationStats = await prisma.affiliateProfile.findMany({
      include: {
        user: true,
        conversions: true
      }
    });

    console.log(`👥 Total Affiliate Profiles: ${migrationStats.length}`);

    let migratedCount = 0;
    let unmigratedCount = 0;
    let totalHistoricalEarnings = 0;
    let totalMigratedEarnings = 0;

    console.log('\n📋 Affiliate Migration Details:\n');

    const unmigrated = [];
    const partiallyMigrated = [];

    migrationStats.forEach((affiliate, index) => {
      const historicalEarnings = parseFloat(affiliate.totalEarnings);
      const migratedEarnings = affiliate.conversions.reduce((sum, conv) => sum + parseFloat(conv.commissionAmount), 0);
      const conversionCount = affiliate.conversions.length;
      
      totalHistoricalEarnings += historicalEarnings;
      totalMigratedEarnings += migratedEarnings;

      console.log(`${index + 1}. ${affiliate.user.name || affiliate.user.email}`);
      console.log(`   Code: ${affiliate.affiliateCode}`);
      console.log(`   Historical: Rp ${historicalEarnings.toLocaleString('id-ID')} (${affiliate.totalConversions} conversions)`);
      console.log(`   Migrated: Rp ${migratedEarnings.toLocaleString('id-ID')} (${conversionCount} records)`);
      
      if (conversionCount === 0) {
        console.log(`   ❌ NOT MIGRATED - Zero conversion records`);
        unmigratedCount++;
        unmigrated.push(affiliate);
      } else if (conversionCount < affiliate.totalConversions) {
        console.log(`   ⚠️ PARTIALLY MIGRATED - ${conversionCount}/${affiliate.totalConversions} records`);
        partiallyMigrated.push(affiliate);
        migratedCount++;
      } else {
        console.log(`   ✅ FULLY MIGRATED`);
        migratedCount++;
      }
      console.log();
    });

    // 2. Migration Summary
    console.log('=== MIGRATION SUMMARY ===\n');
    
    const migrationPercentage = (migratedCount / migrationStats.length) * 100;
    const earningsCoverage = (totalMigratedEarnings / totalHistoricalEarnings) * 100;
    
    console.log('📈 Migration Statistics:');
    console.log(`- Total Affiliates: ${migrationStats.length}`);
    console.log(`- Fully/Partially Migrated: ${migratedCount} (${migrationPercentage.toFixed(1)}%)`);
    console.log(`- Not Migrated: ${unmigratedCount} (${((unmigratedCount / migrationStats.length) * 100).toFixed(1)}%)`);
    console.log(`- Partially Migrated: ${partiallyMigrated.length}`);
    console.log();
    
    console.log('💰 Earnings Coverage:');
    console.log(`- Historical Total: Rp ${totalHistoricalEarnings.toLocaleString('id-ID')}`);
    console.log(`- Migrated Total: Rp ${totalMigratedEarnings.toLocaleString('id-ID')}`);
    console.log(`- Coverage: ${earningsCoverage.toFixed(1)}%`);
    console.log(`- Missing: Rp ${(totalHistoricalEarnings - totalMigratedEarnings).toLocaleString('id-ID')}`);
    console.log();

    // 3. Analyze unmigrated affiliates
    if (unmigrated.length > 0) {
      console.log('🔍 UNMIGRATED AFFILIATES ANALYSIS:\n');
      
      unmigrated.forEach((affiliate, index) => {
        console.log(`${index + 1}. ${affiliate.user.name || affiliate.user.email}`);
        console.log(`   Email: ${affiliate.user.email}`);
        console.log(`   Code: ${affiliate.affiliateCode}`);
        console.log(`   Historical Earnings: Rp ${affiliate.totalEarnings.toLocaleString('id-ID')}`);
        console.log(`   Historical Conversions: ${affiliate.totalConversions}`);
        console.log(`   User ID: ${affiliate.userId}`);
        console.log(`   Created: ${affiliate.createdAt}`);
        console.log(`   Last Updated: ${affiliate.updatedAt}`);
        console.log();
      });
    }

    // 4. Check for transactions that should create affiliate conversions
    console.log('💳 CHECKING FOR MISSING AFFILIATE CONVERSIONS...\n');
    
    // Get all transactions from 2024 onwards that have affiliate data but no conversion record
    const transactionsWithoutConversions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        affiliateId: {
          not: null
        },
        createdAt: {
          gte: new Date('2024-01-01')
        },
        affiliateConversion: {
          is: null
        }
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`🚨 Found ${transactionsWithoutConversions.length} successful transactions without affiliate conversion records:`);
    
    if (transactionsWithoutConversions.length > 0) {
      console.log('\nTransactions missing affiliate conversions:');
      transactionsWithoutConversions.forEach((trans, index) => {
        console.log(`${index + 1}. Transaction ${trans.id}`);
        console.log(`   User: ${trans.user?.email || 'Unknown'}`);
        console.log(`   Amount: Rp ${parseFloat(trans.amount).toLocaleString('id-ID')}`);
        console.log(`   Affiliate ID: ${trans.affiliateId}`);
        console.log(`   Affiliate Share: Rp ${parseFloat(trans.affiliateShare || 0).toLocaleString('id-ID')}`);
        console.log(`   Date: ${trans.createdAt}`);
        console.log();
      });
    }

    // 5. Check system integration health
    console.log('⚙️ SYSTEM INTEGRATION HEALTH CHECK...\n');
    
    // Check recent transactions to see if new ones are creating conversions properly
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        affiliateConversion: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 Recent successful transactions (last 30 days): ${recentTransactions.length}`);
    
    let withConversions = 0;
    let withoutConversions = 0;
    
    recentTransactions.forEach(trans => {
      if (trans.affiliateConversion) {
        withConversions++;
      } else {
        withoutConversions++;
      }
    });

    console.log(`- With affiliate conversions: ${withConversions}`);
    console.log(`- Without affiliate conversions: ${withoutConversions}`);
    
    if (recentTransactions.length > 0) {
      const conversionRate = (withConversions / recentTransactions.length) * 100;
      console.log(`- Conversion creation rate: ${conversionRate.toFixed(1)}%`);
    }
    console.log();

    // 6. Action Plan
    console.log('=== MIGRATION ACTION PLAN ===\n');
    
    console.log('🎯 CURRENT STATUS:');
    console.log(`✅ ${migratedCount} affiliates have conversion records`);
    console.log(`❌ ${unmigratedCount} affiliates have zero conversion records`);
    console.log(`⚠️ ${partiallyMigrated.length} affiliates partially migrated`);
    console.log(`🔄 ${transactionsWithoutConversions.length} transactions missing conversions`);
    console.log();

    if (unmigratedCount > 0 || transactionsWithoutConversions.length > 0) {
      console.log('🔧 RECOMMENDED ACTIONS:');
      console.log();
      
      if (unmigratedCount > 0) {
        console.log('📋 For unmigrated affiliates:');
        console.log('1. These affiliates have historical earnings but no conversion records');
        console.log('2. They represent historical WordPress/Sejoli data');
        console.log('3. No action needed unless full historical sync is required');
        console.log('4. New activity will automatically create conversion records');
        console.log();
      }
      
      if (transactionsWithoutConversions.length > 0) {
        console.log('🚨 For transactions without conversions:');
        console.log('1. These are recent transactions that should have conversion records');
        console.log('2. This indicates a potential issue in the commission system');
        console.log('3. Need to investigate why conversions were not created');
        console.log('4. May need to manually create missing conversion records');
        console.log();
      }
    } else {
      console.log('✅ MIGRATION STATUS: HEALTHY');
      console.log('- All affiliates with recent activity have conversion records');
      console.log('- Historical data is preserved in AffiliateProfile');
      console.log('- New transactions are creating conversions properly');
      console.log('- System is functioning as designed');
    }

    console.log('💡 MAINTENANCE RECOMMENDATIONS:');
    console.log('1. Monitor new transactions to ensure conversion creation');
    console.log('2. Set up alerts for transactions without affiliate conversions');
    console.log('3. Regular health checks on commission system');
    console.log('4. Consider historical data import only if business requires it');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

completeAffiliateMigration();