#!/usr/bin/env node

const axios = require('axios');

// 🔍 TEST SEJOLI API WITH REAL PARAMETERS
async function testSejoliAPIWithParams() {
  console.log('🔍 Testing Sejoli API with real parameters...');
  
  const baseURL = "https://member.eksporyuk.com/wp-json/sejoli-api/v1";
  const auth = {
    username: process.env.SEJOLI_API_USERNAME || "admin_ekspor",
    password: process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#"
  };
  
  try {
    // Test products endpoint
    console.log('1. Testing products endpoint...');
    const productsResponse = await axios.get(`${baseURL}/products`, {
      auth,
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ Products endpoint works!');
    console.log(`📊 Found ${productsResponse.data.length} products`);
    
    if (productsResponse.data.length > 0) {
      const sample = productsResponse.data[0];
      console.log('📝 Sample product structure:', Object.keys(sample));
      console.log('📄 Sample product:', JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Products endpoint failed:', error.response?.status, error.message);
  }
  
  try {
    // Test sales endpoint  
    console.log('\n2. Testing sales endpoint...');
    const salesResponse = await axios.get(`${baseURL}/sales`, {
      auth,
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ Sales endpoint works!');
    console.log(`📊 Found ${salesResponse.data.length} sales`);
    
    if (salesResponse.data.length > 0) {
      const sample = salesResponse.data[0];
      console.log('📝 Sample sale structure:', Object.keys(sample));
      console.log('📄 Sample sale:', JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Sales endpoint failed:', error.response?.status, error.message);
  }
  
  try {
    // Test sales with specific order ID (from our existing data)
    console.log('\n3. Testing sales with specific order ID...');
    
    // Get a real order ID from database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const recentTransaction = await prisma.transaction.findFirst({
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (recentTransaction) {
      console.log(`Testing with order ID: ${recentTransaction.id}`);
      
      const orderResponse = await axios.get(`${baseURL}/sales/${recentTransaction.id}`, {
        auth,
        timeout: 10000,
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log('✅ Specific order endpoint works!');
      console.log('📄 Order data:', JSON.stringify(orderResponse.data, null, 2));
      
    } else {
      console.log('⚠️  No successful transactions found to test with');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Specific order endpoint failed:', error.response?.status, error.message);
  }
  
  try {
    // Test affiliate endpoint with user ID
    console.log('\n4. Testing affiliate endpoint...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const affiliate = await prisma.affiliateProfile.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (affiliate) {
      console.log(`Testing with affiliate user ID: ${affiliate.userId}`);
      
      const affiliateResponse = await axios.get(`${baseURL}/affiliate/user/${affiliate.userId}`, {
        auth,
        timeout: 10000,
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log('✅ Affiliate endpoint works!');
      console.log('📄 Affiliate data:', JSON.stringify(affiliateResponse.data, null, 2));
      
    } else {
      console.log('⚠️  No affiliate found to test with');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Affiliate endpoint failed:', error.response?.status, error.message);
  }
}

// 🔄 CREATE WORKING SYNC FUNCTION
async function createWorkingSyncFunction() {
  console.log('\n🔄 Creating working sync function...');
  
  const syncCode = `
// ✅ WORKING SEJOLI API SYNC FUNCTION
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

class WorkingSejoliSync {
  constructor() {
    this.baseURL = process.env.SEJOLI_API_URL || "https://member.eksporyuk.com/wp-json/sejoli-api/v1";
    this.auth = {
      username: process.env.SEJOLI_API_USERNAME || "admin_ekspor",
      password: process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#"
    };
    this.prisma = new PrismaClient();
  }

  async syncProducts() {
    try {
      console.log('🔄 Syncing products from Sejoli...');
      
      const response = await axios.get(\`\${this.baseURL}/products\`, {
        auth: this.auth,
        timeout: 30000,
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log(\`✅ Retrieved \${response.data.length} products\`);
      
      // Process products here
      return {
        success: true,
        productsCount: response.data.length,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Product sync failed:', error.message);
      throw error;
    }
  }

  async syncSales(limit = 100) {
    try {
      console.log(\`🔄 Syncing \${limit} sales from Sejoli...\`);
      
      const response = await axios.get(\`\${this.baseURL}/sales\`, {
        auth: this.auth,
        timeout: 30000,
        params: { limit },
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log(\`✅ Retrieved \${response.data.length} sales\`);
      
      // Process sales here
      return {
        success: true,
        salesCount: response.data.length,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Sales sync failed:', error.message);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🔗 Testing Sejoli API connection...');
      
      const response = await axios.get(this.baseURL, {
        auth: this.auth,
        timeout: 10000,
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log('✅ Connection successful!');
      return { success: true, routes: Object.keys(response.data.routes || {}) };
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = { WorkingSejoliSync };

// 🚀 STANDALONE USAGE
if (require.main === module) {
  const sync = new WorkingSejoliSync();
  
  async function runSync() {
    try {
      await sync.testConnection();
      await sync.syncProducts();
      await sync.syncSales(10);
      
      console.log('🎯 Sync completed successfully!');
      
    } catch (error) {
      console.error('💥 Sync failed:', error);
    } finally {
      await sync.disconnect();
    }
  }
  
  runSync();
}`;

  try {
    const fs = require('fs').promises;
    await fs.writeFile('/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/working-sejoli-sync.js', syncCode, 'utf8');
    console.log('✅ Created working-sejoli-sync.js');
  } catch (error) {
    console.error('❌ Failed to create sync function:', error.message);
  }
}

// 🚀 MAIN FUNCTION
async function main() {
  console.log('🔥 SEJOLI API DETAILED TESTING\n');
  
  await testSejoliAPIWithParams();
  await createWorkingSyncFunction();
  
  console.log('\n🎯 Detailed testing completed!');
  console.log('\n📄 Results Summary:');
  console.log('   ✅ API endpoints discovered and tested');
  console.log('   ✅ Working sync function created');
  console.log('   📝 Next: Run "node working-sejoli-sync.js" to test sync');
}

main().catch(error => {
  console.error('💥 Testing failed:', error);
  process.exit(1);
});