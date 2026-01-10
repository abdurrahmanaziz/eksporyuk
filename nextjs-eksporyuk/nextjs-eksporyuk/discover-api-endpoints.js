#!/usr/bin/env node

const axios = require('axios');

// 🔍 DISCOVER WORDPRESS API ENDPOINTS
async function discoverWordPressEndpoints() {
  console.log('🔍 Discovering WordPress API endpoints...');
  
  const baseURL = "https://member.eksporyuk.com";
  
  try {
    // Test WordPress REST API discovery
    console.log('1. Testing WordPress REST API discovery...');
    const apiResponse = await axios.get(`${baseURL}/wp-json/`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ WordPress REST API discovered!');
    console.log('📋 Available namespaces:', Object.keys(apiResponse.data.namespaces || {}));
    
    // Check if sejoli-api exists
    const namespaces = apiResponse.data.namespaces || [];
    if (namespaces.includes('sejoli-api/v1')) {
      console.log('✅ sejoli-api/v1 namespace found!');
    } else {
      console.log('❌ sejoli-api/v1 namespace NOT found');
      console.log('📋 Available namespaces:', namespaces);
    }
    
  } catch (error) {
    console.error('❌ WordPress API discovery failed:', error.message);
  }
  
  try {
    // Test wp-json/wp/v2 (default WordPress API)
    console.log('\n2. Testing default WordPress API...');
    const wpResponse = await axios.get(`${baseURL}/wp-json/wp/v2/posts?per_page=1`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ WordPress posts API works!');
    console.log('📊 Sample post:', wpResponse.data[0]?.title?.rendered || 'No posts');
    
  } catch (error) {
    console.error('❌ WordPress posts API failed:', error.message);
  }
  
  try {
    // Test authentication with WordPress
    console.log('\n3. Testing WordPress authentication...');
    const authResponse = await axios.get(`${baseURL}/wp-json/wp/v2/users/me`, {
      auth: {
        username: process.env.SEJOLI_API_USERNAME || "admin_ekspor",
        password: process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#"
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ WordPress authentication works!');
    console.log('👤 User info:', authResponse.data);
    
  } catch (error) {
    console.error('❌ WordPress authentication failed:', error.message);
  }
  
  try {
    // Check Sejoli plugin endpoints manually
    console.log('\n4. Testing possible Sejoli endpoints...');
    
    const possibleEndpoints = [
      '/wp-json/sejoli/v1',
      '/wp-json/sejoli/v1/orders',
      '/wp-json/sejoli/v1/stats',
      '/wp-json/sejoli-api/v1',
      '/wp-json/sejoli-api/v1/orders',
      '/wp-json/sejoli-api/v1/stats',
      '/wp-json/sejoli-membership/v1',
      '/wp-json/wp/v2/sejoli-product'
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        const response = await axios.get(`${baseURL}${endpoint}`, {
          timeout: 5000,
          headers: {
            'User-Agent': 'EksporyukSync/1.0'
          }
        });
        
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        if (response.data) {
          console.log(`   Data sample:`, JSON.stringify(response.data).substring(0, 100) + '...');
        }
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`🔐 ${endpoint} - Requires authentication`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${endpoint} - Not found`);
        } else {
          console.log(`⚠️  ${endpoint} - Error: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Manual endpoint testing failed:', error.message);
  }
}

// 📊 CHECK EXISTING DATA SYNC STATUS
async function checkDataSyncStatus() {
  console.log('\n📊 Checking current data sync status...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get last 5 transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('🔄 Recent transactions:');
    recentTransactions.forEach(tx => {
      console.log(`   ${tx.id}: Rp ${tx.amount?.toLocaleString()} - ${tx.status} - ${tx.createdAt.toISOString()}`);
    });
    
    // Get affiliate stats
    const affiliateStats = await prisma.affiliateProfile.count();
    const conversionStats = await prisma.affiliateConversion.count();
    
    console.log(`📈 Affiliate stats: ${affiliateStats} profiles, ${conversionStats} conversions`);
    
    // Check if we have commission data
    const totalCommission = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });
    
    console.log(`💰 Total commission: Rp ${totalCommission._sum.commissionAmount?.toLocaleString() || 0}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Data sync status check failed:', error.message);
  }
}

// 🚀 MAIN FUNCTION
async function main() {
  console.log('🔥 EKSPORYUK API ENDPOINT DISCOVERY\n');
  
  await discoverWordPressEndpoints();
  await checkDataSyncStatus();
  
  console.log('\n🎯 Discovery completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Check if Sejoli plugin is installed & activated');
  console.log('   2. Verify API endpoints in WordPress admin');
  console.log('   3. Check plugin documentation for correct endpoint paths');
  console.log('   4. Use existing data until live API is confirmed');
}

main().catch(error => {
  console.error('💥 Discovery failed:', error);
  process.exit(1);
});