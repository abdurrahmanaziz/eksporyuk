/**
 * Compare Sejoli Data with Next.js Database
 * Fetch real-time data from Sejoli API and compare with database
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

// Sejoli API credentials
const SEJOLI_API_BASE = 'https://member.eksporyuk.com/wp-json/sejoli/v1';
const SEJOLI_API_KEY = 'ck_9ab1f36f56e3c5a5cfa0571593bba04e95a8a2e6';
const SEJOLI_API_SECRET = 'cs_fae5cc4e1c62fb68dd7ed2ca3cce888bf65fe08a';

async function fetchSejoliAPI(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${SEJOLI_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const auth = Buffer.from(`${SEJOLI_API_KEY}:${SEJOLI_API_SECRET}`).toString('base64');
    
    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function compareData() {
  console.log('\n=== COMPARING SEJOLI DATA WITH NEXT.JS DATABASE ===\n');
  console.log('Date:', new Date().toISOString());
  console.log('');

  try {
    // 1. Get Next.js Database counts
    console.log('📊 NEXT.JS DATABASE COUNTS:');
    console.log('─'.repeat(50));
    
    const [
      userCount,
      txTotal,
      txSuccess,
      txPending,
      txFailed,
      affiliateCount,
      conversionCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: 'SUCCESS' } }),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'FAILED' } }),
      prisma.affiliateProfile.count(),
      prisma.affiliateConversion.count()
    ]);

    // Get revenue and commission totals
    const revenueResult = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    });
    
    const commissionResult = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true }
    });

    console.log(`Users: ${userCount.toLocaleString('id-ID')}`);
    console.log(`Total Transactions: ${txTotal.toLocaleString('id-ID')}`);
    console.log(`  - SUCCESS: ${txSuccess.toLocaleString('id-ID')}`);
    console.log(`  - PENDING: ${txPending.toLocaleString('id-ID')}`);
    console.log(`  - FAILED: ${txFailed.toLocaleString('id-ID')}`);
    console.log(`Affiliate Profiles: ${affiliateCount.toLocaleString('id-ID')}`);
    console.log(`Affiliate Conversions: ${conversionCount.toLocaleString('id-ID')}`);
    console.log(`Total Revenue: Rp ${Number(revenueResult._sum.amount || 0).toLocaleString('id-ID')}`);
    console.log(`Total Commission: Rp ${Number(commissionResult._sum.commissionAmount || 0).toLocaleString('id-ID')}`);

    // 2. Try to fetch from Sejoli API
    console.log('\n📡 SEJOLI API DATA:');
    console.log('─'.repeat(50));

    try {
      // Get orders count
      const ordersResponse = await fetchSejoliAPI('/orders', { 
        per_page: 1,
        status: 'completed'
      });
      
      console.log('Sejoli Orders API Response (sample):', 
        JSON.stringify(ordersResponse).substring(0, 500));

      // Try different endpoints
      const endpoints = [
        '/orders',
        '/orders/count',
        '/affiliates',
        '/products'
      ];

      for (const ep of endpoints) {
        try {
          const response = await fetchSejoliAPI(ep, { per_page: 5 });
          console.log(`\n${ep}:`, Array.isArray(response) 
            ? `${response.length} items (total may be more)` 
            : typeof response);
        } catch (e) {
          console.log(`\n${ep}: Error - ${e.message.substring(0, 100)}`);
        }
      }
    } catch (e) {
      console.log('Sejoli API Error:', e.message);
    }

    // 3. Compare with expected values from screenshot
    console.log('\n📸 EXPECTED FROM SEJOLI SCREENSHOT:');
    console.log('─'.repeat(50));
    console.log('Total Lead: 19,299');
    console.log('Total Sales: 12,857');
    console.log('Total Omset: Rp 4,138,916,962');
    console.log('Total Komisi: Rp 1,250,621,000');

    // 4. Calculate differences
    console.log('\n⚠️  DIFFERENCES:');
    console.log('─'.repeat(50));
    
    const expectedUsers = 19299;
    const expectedSales = 12857;
    const expectedRevenue = 4138916962;
    const expectedCommission = 1250621000;

    const userDiff = expectedUsers - userCount;
    const salesDiff = expectedSales - txSuccess;
    const revenueDiff = expectedRevenue - Number(revenueResult._sum.amount || 0);
    const commissionDiff = expectedCommission - Number(commissionResult._sum.commissionAmount || 0);

    console.log(`Users: ${userDiff > 0 ? '+' : ''}${userDiff.toLocaleString('id-ID')} (Missing: ${userDiff})`);
    console.log(`Sales (SUCCESS): ${salesDiff > 0 ? '+' : ''}${salesDiff.toLocaleString('id-ID')} (Missing: ${salesDiff})`);
    console.log(`Revenue: Rp ${revenueDiff > 0 ? '+' : ''}${revenueDiff.toLocaleString('id-ID')}`);
    console.log(`Commission: Rp ${commissionDiff > 0 ? '+' : ''}${commissionDiff.toLocaleString('id-ID')}`);

    // 5. Get latest transactions in database
    console.log('\n📅 LATEST TRANSACTIONS IN DATABASE:');
    console.log('─'.repeat(50));
    
    const latestTx = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        createdAt: true,
        user: { select: { name: true } }
      }
    });

    latestTx.forEach((tx, i) => {
      console.log(`${i+1}. ${tx.invoiceNumber || tx.id.slice(0,8)} | ${tx.user.name} | Rp ${Number(tx.amount).toLocaleString('id-ID')} | ${tx.createdAt.toLocaleDateString('id-ID')}`);
    });

    // 6. Check for December 2025 data specifically (from screenshot)
    console.log('\n📅 DECEMBER 2025 DATA IN DATABASE:');
    console.log('─'.repeat(50));
    
    const dec2025Start = new Date('2025-12-01');
    const dec2025End = new Date('2025-12-31');
    
    const dec2025Tx = await prisma.transaction.count({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: dec2025Start,
          lte: dec2025End
        }
      }
    });

    const dec2025Revenue = await prisma.transaction.aggregate({
      where: {
        status: 'SUCCESS',
        createdAt: {
          gte: dec2025Start,
          lte: dec2025End
        }
      },
      _sum: { amount: true }
    });

    console.log(`December 2025 Transactions: ${dec2025Tx}`);
    console.log(`December 2025 Revenue: Rp ${Number(dec2025Revenue._sum.amount || 0).toLocaleString('id-ID')}`);
    console.log('');
    console.log('Expected from Screenshot:');
    console.log('- Total Sales Dec 2025: 118');
    console.log('- Total Omset Dec 2025: Rp 104,739,000');

    console.log('\n✅ Comparison complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run comparison
compareData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
