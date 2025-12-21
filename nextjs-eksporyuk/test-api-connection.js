#!/usr/bin/env node

const axios = require('axios');

// 🔥 TEST SEJOLI API CONNECTION
async function testSejoliAPI() {
  console.log('🔍 Testing Sejoli API Connection...');
  
  // Read environment variables
  const SEJOLI_API_URL = process.env.SEJOLI_API_URL || "https://member.eksporyuk.com/wp-json/sejoli-api/v1";
  const SEJOLI_API_USERNAME = process.env.SEJOLI_API_USERNAME || "admin_ekspor";
  const SEJOLI_API_PASSWORD = process.env.SEJOLI_API_PASSWORD || "Eksporyuk2024#";
  
  console.log('📋 Configuration:');
  console.log(`   URL: ${SEJOLI_API_URL}`);
  console.log(`   Username: ${SEJOLI_API_USERNAME}`);
  console.log(`   Password: ${SEJOLI_API_PASSWORD ? '****' : 'NOT SET'}`);
  console.log('');
  
  try {
    console.log('🔗 Testing API endpoint...');
    
    const response = await axios.get(`${SEJOLI_API_URL}/stats`, {
      auth: {
        username: SEJOLI_API_USERNAME,
        password: SEJOLI_API_PASSWORD
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'EksporyukSync/1.0'
      }
    });
    
    console.log('✅ API Connection successful!');
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', response.headers['content-type']);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Connection failed:');
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Headers:', error.response.headers);
      console.log('   Data:', error.response.data);
    } else if (error.request) {
      console.log('   Request made but no response received');
      console.log('   Request:', error.request);
    } else {
      console.log('   Error:', error.message);
    }
    
    console.log('   Full error:', error);
  }
}

// 🔗 TEST DATABASE CONNECTION
async function testDatabase() {
  console.log('\n🗄️  Testing Database Connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    
    // Get some basic stats
    const userCount = await prisma.user.count();
    const transactionCount = await prisma.transaction.count();
    const affiliateCount = await prisma.affiliateProfile.count();
    
    console.log('📊 Database Stats:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Affiliates: ${affiliateCount}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// 🚀 RUN TESTS
async function runTests() {
  console.log('🔥 EKSPORYUK SEJOLI API & DATABASE TEST\n');
  
  await testSejoliAPI();
  await testDatabase();
  
  console.log('\n🎯 Test completed!');
  process.exit(0);
}

runTests().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});