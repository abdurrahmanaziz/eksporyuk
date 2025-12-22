const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function checkSejoliSystemStatus() {
  try {
    console.log('=== SEJOLI SYSTEM STATUS CHECK ===\n');

    // 1. Test Sejoli API connectivity
    console.log('🔗 TESTING SEJOLI API CONNECTIVITY...\n');
    
    const baseURL = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';
    const endpoints = [
      { name: 'Orders', url: `${baseURL}/orders` },
      { name: 'Products', url: `${baseURL}/products` },
      { name: 'Affiliates', url: `${baseURL}/affiliates` },
      { name: 'Commissions', url: `${baseURL}/commissions` }
    ];

    const connectionResults = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}...`);
        const response = await axios.get(endpoint.url, {
          timeout: 10000,
          validateStatus: () => true // Accept all status codes
        });
        
        const result = {
          name: endpoint.name,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          dataSize: response.data ? JSON.stringify(response.data).length : 0,
          error: null
        };
        
        if (result.success) {
          console.log(`✅ ${endpoint.name}: Connected (${response.status}) - ${result.dataSize} bytes`);
        } else {
          console.log(`⚠️ ${endpoint.name}: Status ${response.status}`);
        }
        
        connectionResults.push(result);
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
        connectionResults.push({
          name: endpoint.name,
          status: 0,
          success: false,
          dataSize: 0,
          error: error.message
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log();
    
    // 2. Check Sejoli data availability
    console.log('📊 SEJOLI DATA AVAILABILITY...\n');
    
    const workingEndpoints = connectionResults.filter(r => r.success);
    
    if (workingEndpoints.length === 0) {
      console.log('🚨 CRITICAL: No Sejoli endpoints are accessible!');
      console.log('This means either:');
      console.log('1. Sejoli website is down');
      console.log('2. API endpoints have changed');
      console.log('3. Network connectivity issues');
      console.log('4. Authentication requirements changed');
      console.log();
      return { accessible: false, endpoints: connectionResults };
    }

    // Get sample data from working endpoints
    console.log(`✅ ${workingEndpoints.length}/${endpoints.length} endpoints accessible\n`);
    
    const sejoliData = {};
    
    for (const result of workingEndpoints) {
      try {
        const endpoint = endpoints.find(e => e.name === result.name);
        const response = await axios.get(endpoint.url, { timeout: 10000 });
        
        if (response.data && Array.isArray(response.data)) {
          sejoliData[result.name.toLowerCase()] = {
            count: response.data.length,
            sample: response.data.slice(0, 2), // First 2 items for analysis
            fields: response.data.length > 0 ? Object.keys(response.data[0]) : []
          };
          
          console.log(`📈 ${result.name}: ${response.data.length} records found`);
          if (response.data.length > 0) {
            console.log(`   Fields: ${Object.keys(response.data[0]).join(', ')}`);
          }
        } else if (response.data && typeof response.data === 'object') {
          sejoliData[result.name.toLowerCase()] = {
            count: 1,
            sample: [response.data],
            fields: Object.keys(response.data)
          };
          console.log(`📋 ${result.name}: Single object response`);
          console.log(`   Fields: ${Object.keys(response.data).join(', ')}`);
        } else {
          console.log(`⚠️ ${result.name}: Unexpected data format`);
        }
        
      } catch (error) {
        console.log(`❌ Error parsing ${result.name}: ${error.message}`);
      }
    }

    console.log();

    // 3. Analyze Sejoli vs Eksporyuk data discrepancies
    console.log('🔍 SEJOLI VS EKSPORYUK COMPARISON...\n');
    
    const eksporyukStats = {
      totalUsers: await prisma.user.count(),
      totalAffiliates: await prisma.affiliateProfile.count(),
      totalTransactions: await prisma.transaction.count({ where: { status: 'SUCCESS' } }),
      totalConversions: await prisma.affiliateConversion.count(),
      recentTransactions: await prisma.transaction.count({
        where: {
          status: 'SUCCESS',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      recentConversions: await prisma.affiliateConversion.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    };

    console.log('📊 Eksporyuk Stats:');
    console.log(`- Total Users: ${eksporyukStats.totalUsers.toLocaleString()}`);
    console.log(`- Total Affiliates: ${eksporyukStats.totalAffiliates.toLocaleString()}`);
    console.log(`- Total Transactions: ${eksporyukStats.totalTransactions.toLocaleString()}`);
    console.log(`- Total Conversions: ${eksporyukStats.totalConversions.toLocaleString()}`);
    console.log(`- Recent Transactions (30d): ${eksporyukStats.recentTransactions.toLocaleString()}`);
    console.log(`- Recent Conversions (30d): ${eksporyukStats.recentConversions.toLocaleString()}`);
    console.log();

    if (sejoliData.orders) {
      console.log('📊 Sejoli vs Eksporyuk:');
      console.log(`- Sejoli Orders: ${sejoliData.orders.count.toLocaleString()}`);
      console.log(`- Eksporyuk Transactions: ${eksporyukStats.totalTransactions.toLocaleString()}`);
      
      const orderDiff = sejoliData.orders.count - eksporyukStats.totalTransactions;
      if (orderDiff > 0) {
        console.log(`⚠️ Sejoli has ${orderDiff.toLocaleString()} more orders than Eksporyuk`);
      } else if (orderDiff < 0) {
        console.log(`⚠️ Eksporyuk has ${Math.abs(orderDiff).toLocaleString()} more transactions than Sejoli`);
      } else {
        console.log(`✅ Order counts match perfectly`);
      }
      console.log();
    }

    if (sejoliData.affiliates) {
      console.log(`- Sejoli Affiliates: ${sejoliData.affiliates.count.toLocaleString()}`);
      console.log(`- Eksporyuk Affiliates: ${eksporyukStats.totalAffiliates.toLocaleString()}`);
      
      const affiliateDiff = sejoliData.affiliates.count - eksporyukStats.totalAffiliates;
      if (affiliateDiff > 0) {
        console.log(`⚠️ Sejoli has ${affiliateDiff.toLocaleString()} more affiliates than Eksporyuk`);
      } else if (affiliateDiff < 0) {
        console.log(`⚠️ Eksporyuk has ${Math.abs(affiliateDiff).toLocaleString()} more affiliates than Sejoli`);
      } else {
        console.log(`✅ Affiliate counts match perfectly`);
      }
      console.log();
    }

    // 4. Data quality assessment
    console.log('🎯 DATA QUALITY ASSESSMENT...\n');
    
    const qualityIssues = [];
    
    // Check for missing affiliate conversions
    const transactionsWithoutConversions = await prisma.transaction.count({
      where: {
        status: 'SUCCESS',
        affiliateId: { not: null },
        affiliateConversion: { is: null }
      }
    });

    if (transactionsWithoutConversions > 0) {
      qualityIssues.push(`${transactionsWithoutConversions} transactions with affiliates but no conversion records`);
    }

    // Check for orphaned conversions
    const conversionsWithoutTransactions = await prisma.affiliateConversion.count({
      where: {
        transactionId: null
      }
    });

    if (conversionsWithoutTransactions > 0) {
      qualityIssues.push(`${conversionsWithoutTransactions} conversions without transaction links`);
    }

    // Check for zero commission rates
    const zeroCommissionProducts = await prisma.product.count({
      where: {
        OR: [
          { affiliateCommissionRate: 0 },
          { affiliateCommissionRate: null }
        ]
      }
    });

    const zeroCommissionMemberships = await prisma.membership.count({
      where: {
        OR: [
          { affiliateCommissionRate: 0 },
          { affiliateCommissionRate: null }
        ]
      }
    });

    if (zeroCommissionProducts > 0 || zeroCommissionMemberships > 0) {
      qualityIssues.push(`${zeroCommissionProducts + zeroCommissionMemberships} products/memberships with zero commission rates`);
    }

    if (qualityIssues.length === 0) {
      console.log('✅ No major data quality issues found');
    } else {
      console.log('⚠️ Data Quality Issues Found:');
      qualityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    console.log();

    return {
      accessible: workingEndpoints.length > 0,
      endpoints: connectionResults,
      sejoliData,
      eksporyukStats,
      qualityIssues
    };

  } catch (error) {
    console.error('❌ Error in system check:', error.message);
    console.error('Stack:', error.stack);
    return { accessible: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkSejoliSystemStatus()
    .then((result) => {
      console.log('\n=== CHECK COMPLETE ===');
      if (result.accessible) {
        console.log('✅ System check completed successfully');
        console.log(`📊 Found ${result.qualityIssues?.length || 0} data quality issues to address`);
      } else {
        console.log('❌ System check failed - connectivity issues detected');
      }
    })
    .catch((error) => {
      console.error('\n💥 System check crashed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkSejoliSystemStatus };