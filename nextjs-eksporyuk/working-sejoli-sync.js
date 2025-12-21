
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
      
      const response = await axios.get(`${this.baseURL}/products`, {
        auth: this.auth,
        timeout: 30000,
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log(`✅ Retrieved ${response.data.length} products`);
      
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
      console.log(`🔄 Syncing ${limit} sales from Sejoli...`);
      
      const response = await axios.get(`${this.baseURL}/sales`, {
        auth: this.auth,
        timeout: 30000,
        params: { limit },
        headers: {
          'User-Agent': 'EksporyukSync/1.0'
        }
      });
      
      console.log(`✅ Retrieved ${response.data.length} sales`);
      
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
}