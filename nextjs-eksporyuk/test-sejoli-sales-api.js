#!/usr/bin/env node

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🔄 TEST SEJOLI SALES ENDPOINT DENGAN PARAMETERS
async function testSejoliSalesAPI() {
  console.log('🔄 Testing Sejoli Sales API...');
  
  const baseURL = "https://member.eksporyuk.com/wp-json/sejoli-api/v1";
  const auth = {
    username: process.env.SEJOLI_API_USERNAME || "admin_ekspor",
    password: process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#"
  };
  
  try {
    // Test sales endpoint dengan parameter limit
    console.log('1. Testing sales endpoint dengan limit parameter...');
    const salesResponse = await axios.get(`${baseURL}/sales`, {
      auth,
      params: {
        limit: 50,
        offset: 0
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ Sales endpoint berhasil!');
    console.log(`📊 Sales data type:`, typeof salesResponse.data);
    console.log(`📊 Sales data:`, salesResponse.data);
    
    if (Array.isArray(salesResponse.data) && salesResponse.data.length > 0) {
      console.log(`📊 Total sales: ${salesResponse.data.length}`);
      const sample = salesResponse.data[0];
      console.log('📝 Sample sale keys:', Object.keys(sample));
      console.log('📄 Sample sale data:', JSON.stringify(sample, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Sales endpoint failed:', error.response?.status, error.message);
    if (error.response?.data) {
      console.log('📄 Error response:', error.response.data);
    }
  }
  
  try {
    // Test sales dengan specific date range
    console.log('\n2. Testing sales dengan date range...');
    const dateResponse = await axios.get(`${baseURL}/sales`, {
      auth,
      params: {
        limit: 10,
        date_start: '2025-12-01',
        date_end: '2025-12-19'
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ Sales with date range berhasil!');
    console.log(`📊 Sales in range:`, dateResponse.data?.length || 'Unknown');
    
  } catch (error) {
    console.error('❌ Sales date range failed:', error.response?.status, error.message);
  }
  
  try {
    // Test sales by status
    console.log('\n3. Testing sales by status...');
    const statusResponse = await axios.get(`${baseURL}/sales/status/completed`, {
      auth,
      timeout: 30000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ Sales by status berhasil!');
    console.log(`📊 Completed sales:`, statusResponse.data?.length || 'Unknown');
    
  } catch (error) {
    console.error('❌ Sales by status failed:', error.response?.status, error.message);
  }
  
  // Compare dengan database kita
  try {
    console.log('\n4. Comparing dengan database kita...');
    
    const dbStats = await prisma.transaction.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log('📊 Database transaction status:');
    dbStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status}`);
    });
    
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
    
    console.log('\n📊 Recent transactions in our DB:');
    recentTransactions.forEach(tx => {
      console.log(`   ${tx.id}: Rp ${tx.amount?.toLocaleString()} - ${tx.status} - ${tx.createdAt.toISOString()}`);
    });
    
  } catch (error) {
    console.error('❌ Database comparison failed:', error.message);
  }
}

// 🚀 MAIN
async function main() {
  console.log('🔥 SEJOLI SALES API TEST\n');
  
  await testSejoliSalesAPI();
  await prisma.$disconnect();
  
  console.log('\n🎯 Test completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Jika sales API berhasil → buat import function');
  console.log('   2. Jika sales API gagal → gunakan export data existing');
  console.log('   3. Focus pada real-time sync untuk transaksi baru');
}

main().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});