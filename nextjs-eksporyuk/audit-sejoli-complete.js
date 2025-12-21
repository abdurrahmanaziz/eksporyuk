/**
 * AUDIT KOMPREHENSIF SEJOLI REST API vs DATABASE
 * 
 * Script ini akan:
 * 1. Fetch data terbaru dari Sejoli REST API
 * 2. Bandingkan dengan database Next.js
 * 3. Identifikasi gap (tanpa hapus/duplikat)
 * 4. Hitung omset kotor & bersih
 * 5. Verifikasi komisi per affiliate
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sejoli REST API Configuration
const SEJOLI_API_BASE = 'https://member.eksporyuk.com/wp-json/sejoli-api/v1';
const SEJOLI_AUTH = Buffer.from('eksporyuk:wLgP tJjj gyA4 mZPo O2Yz UbRN').toString('base64');

// Product Commission Mapping (54 products)
const PRODUCT_COMMISSION = {
  // LIFETIME MEMBERSHIP
  28: 100000, 93: 150000, 179: 250000, 1529: 200000, 3840: 300000,
  4684: 250000, 6068: 280000, 6810: 250000, 11207: 280000, 13401: 325000,
  15234: 300000, 16956: 280000, 17920: 250000, 19296: 280000, 20852: 280000,
  // 12 BULAN
  8683: 300000, 13399: 250000,
  // 6 BULAN  
  8684: 250000, 13400: 200000,
  // RENEWAL (no commission)
  8910: 0, 8914: 0, 8915: 0,
  // EVENT/WEBINAR
  397: 0, 488: 0, 12994: 50000, 13039: 50000, 13045: 50000,
  16130: 50000, 16860: 50000, 16963: 50000, 17227: 50000, 17322: 50000,
  17767: 50000, 18358: 50000, 18528: 20000, 18705: 50000, 18893: 50000,
  19042: 50000, 20130: 50000, 20336: 50000, 21476: 50000,
  // TOOL/APLIKASI
  2910: 0, 3764: 85000, 4220: 50000, 8686: 0,
  // JASA
  5928: 150000, 5932: 100000, 5935: 100000, 16581: 0, 16587: 0, 16592: 0,
  // GRATIS
  300: 0,
  // LAINNYA
  16826: 0
};

async function fetchSejoliAPI(endpoint, params = {}) {
  const url = new URL(`${SEJOLI_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${SEJOLI_AUTH}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error.message);
    return null;
  }
}

async function fetchAllSales() {
  console.log('\n📡 Fetching dari Sejoli REST API...\n');
  
  let allSales = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    process.stdout.write(`   Fetching page ${page}...`);
    
    const result = await fetchSejoliAPI('/sales', {
      per_page: perPage,
      page: page
    });

    if (!result || !result.data || result.data.length === 0) {
      hasMore = false;
      console.log(' ✓ (last page)');
    } else {
      allSales = allSales.concat(result.data);
      console.log(` ✓ (${result.data.length} orders)`);
      page++;
      
      // Safety limit
      if (page > 250) {
        console.log('   ⚠️ Reached page limit (250)');
        hasMore = false;
      }
    }
  }

  return allSales;
}

async function getDatabaseStats() {
  console.log('\n📊 Mengambil data dari Database...\n');

  // Total transactions
  const totalTransactions = await prisma.transaction.count();
  
  // By status
  const byStatus = await prisma.transaction.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true }
  });

  // Success transactions
  const successTransactions = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: {
      id: true,
      amount: true,
      externalId: true,
      affiliateConversion: {
        select: {
          id: true,
          commissionAmount: true,
          affiliateId: true
        }
      }
    }
  });

  // Affiliate profiles
  const affiliateProfiles = await prisma.affiliateProfile.findMany({
    include: {
      user: { select: { name: true, email: true } },
      conversions: {
        select: { commissionAmount: true, paidOut: true }
      }
    }
  });

  // Total commission
  const totalCommission = await prisma.affiliateConversion.aggregate({
    _sum: { commissionAmount: true },
    _count: true
  });

  return {
    totalTransactions,
    byStatus,
    successTransactions,
    affiliateProfiles,
    totalCommission
  };
}

function analyzeSejoliData(sales) {
  const analysis = {
    total: sales.length,
    byStatus: {},
    withAffiliate: 0,
    totalRevenue: 0,
    totalCommission: 0,
    affiliates: {},
    products: {}
  };

  for (const sale of sales) {
    // Status
    const status = sale.status || 'unknown';
    if (!analysis.byStatus[status]) {
      analysis.byStatus[status] = { count: 0, revenue: 0 };
    }
    analysis.byStatus[status].count++;
    analysis.byStatus[status].revenue += Number(sale.grand_total) || 0;

    // Only completed orders
    if (status === 'completed') {
      analysis.totalRevenue += Number(sale.grand_total) || 0;

      // Affiliate
      if (sale.affiliate_id && sale.affiliate_id > 0) {
        analysis.withAffiliate++;
        
        const affId = sale.affiliate_id;
        const productId = sale.product_id;
        const commission = PRODUCT_COMMISSION[productId] || 0;

        if (!analysis.affiliates[affId]) {
          analysis.affiliates[affId] = {
            id: affId,
            name: sale.affiliate_name || `Affiliate ${affId}`,
            email: sale.affiliate_email || '',
            conversions: 0,
            totalCommission: 0
          };
        }
        analysis.affiliates[affId].conversions++;
        analysis.affiliates[affId].totalCommission += commission;
        analysis.totalCommission += commission;
      }

      // Products
      const pid = sale.product_id;
      if (!analysis.products[pid]) {
        analysis.products[pid] = { count: 0, revenue: 0, commission: PRODUCT_COMMISSION[pid] || 0 };
      }
      analysis.products[pid].count++;
      analysis.products[pid].revenue += Number(sale.grand_total) || 0;
    }
  }

  return analysis;
}

function compareData(sejoliAnalysis, dbStats) {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 HASIL AUDIT KOMPREHENSIF');
  console.log('═'.repeat(70));

  // 1. TRANSAKSI
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ 1️⃣  TRANSAKSI                                                        │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  
  const dbSuccessCount = dbStats.byStatus.find(s => s.status === 'SUCCESS')?._count || 0;
  const sejoliCompleted = sejoliAnalysis.byStatus['completed']?.count || 0;
  
  console.log(`│ Sejoli API (Total)      : ${sejoliAnalysis.total.toLocaleString().padStart(10)} orders              │`);
  console.log(`│ Sejoli API (Completed)  : ${sejoliCompleted.toLocaleString().padStart(10)} orders              │`);
  console.log(`│ Database (Total)        : ${dbStats.totalTransactions.toLocaleString().padStart(10)} orders              │`);
  console.log(`│ Database (SUCCESS)      : ${dbSuccessCount.toLocaleString().padStart(10)} orders              │`);
  
  const transDiff = sejoliCompleted - dbSuccessCount;
  const diffIcon = transDiff === 0 ? '✅' : transDiff > 0 ? '⚠️' : '🔍';
  console.log(`│ Selisih                 : ${transDiff.toLocaleString().padStart(10)} orders  ${diffIcon}           │`);
  console.log('└─────────────────────────────────────────────────────────────────────┘');

  // 2. OMSET
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ 2️⃣  OMSET                                                            │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  
  const dbRevenue = dbStats.byStatus.find(s => s.status === 'SUCCESS')?._sum?.amount || 0;
  
  console.log(`│ Sejoli (Omset Kotor)    : Rp ${sejoliAnalysis.totalRevenue.toLocaleString().padStart(15)}          │`);
  console.log(`│ Database (Omset Kotor)  : Rp ${Number(dbRevenue).toLocaleString().padStart(15)}          │`);
  console.log(`│ Komisi Total (Sejoli)   : Rp ${sejoliAnalysis.totalCommission.toLocaleString().padStart(15)}          │`);
  console.log(`│ Omset Bersih (Sejoli)   : Rp ${(sejoliAnalysis.totalRevenue - sejoliAnalysis.totalCommission).toLocaleString().padStart(15)}          │`);
  
  const revDiff = sejoliAnalysis.totalRevenue - Number(dbRevenue);
  console.log(`│ Selisih Omset           : Rp ${revDiff.toLocaleString().padStart(15)}          │`);
  console.log('└─────────────────────────────────────────────────────────────────────┘');

  // 3. AFFILIATE & KOMISI
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ 3️⃣  AFFILIATE & KOMISI                                               │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  
  const sejoliAffCount = Object.keys(sejoliAnalysis.affiliates).length;
  const dbAffCount = dbStats.affiliateProfiles.length;
  const dbTotalComm = Number(dbStats.totalCommission._sum.commissionAmount) || 0;
  const dbConvCount = dbStats.totalCommission._count || 0;
  
  console.log(`│ Affiliates (Sejoli)     : ${sejoliAffCount.toLocaleString().padStart(10)} orang               │`);
  console.log(`│ Affiliates (Database)   : ${dbAffCount.toLocaleString().padStart(10)} orang               │`);
  console.log(`│ Konversi (Sejoli)       : ${sejoliAnalysis.withAffiliate.toLocaleString().padStart(10)} transaksi           │`);
  console.log(`│ Konversi (Database)     : ${dbConvCount.toLocaleString().padStart(10)} transaksi           │`);
  console.log(`│ Komisi (Sejoli)         : Rp ${sejoliAnalysis.totalCommission.toLocaleString().padStart(15)}          │`);
  console.log(`│ Komisi (Database)       : Rp ${dbTotalComm.toLocaleString().padStart(15)}          │`);
  
  const commDiff = sejoliAnalysis.totalCommission - dbTotalComm;
  const commDiffIcon = commDiff === 0 ? '✅' : commDiff > 0 ? '⚠️' : '🔍';
  console.log(`│ Selisih Komisi          : Rp ${commDiff.toLocaleString().padStart(15)} ${commDiffIcon}        │`);
  console.log('└─────────────────────────────────────────────────────────────────────┘');

  // 4. TOP 10 AFFILIATES FROM SEJOLI
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ 4️⃣  TOP 10 AFFILIATES (dari Sejoli API)                              │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  
  const topAffiliates = Object.values(sejoliAnalysis.affiliates)
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10);

  let rank = 1;
  for (const aff of topAffiliates) {
    const name = (aff.name || 'Unknown').substring(0, 20).padEnd(20);
    const comm = `Rp ${aff.totalCommission.toLocaleString()}`.padStart(15);
    const conv = `${aff.conversions} conv`.padStart(10);
    console.log(`│ ${rank.toString().padStart(2)}. ${name} ${comm} ${conv}     │`);
    rank++;
  }
  console.log('└─────────────────────────────────────────────────────────────────────┘');

  // 5. STATUS BREAKDOWN
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ 5️⃣  STATUS TRANSAKSI (Sejoli)                                        │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  
  for (const [status, data] of Object.entries(sejoliAnalysis.byStatus)) {
    const statusName = status.padEnd(20);
    const count = data.count.toLocaleString().padStart(8);
    const revenue = `Rp ${data.revenue.toLocaleString()}`.padStart(20);
    console.log(`│ ${statusName} : ${count} orders ${revenue}    │`);
  }
  console.log('└─────────────────────────────────────────────────────────────────────┘');

  return {
    transDiff,
    revDiff,
    commDiff,
    sejoliAffCount,
    dbAffCount
  };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║     AUDIT SEJOLI REST API vs DATABASE - 19 Desember 2025              ║');
  console.log('║     Tanpa hapus/duplikat - Verifikasi data lengkap                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');

  try {
    // 1. Fetch from Sejoli API
    const sales = await fetchAllSales();
    
    if (!sales || sales.length === 0) {
      console.log('\n⚠️  Sejoli API tidak mengembalikan data.');
      console.log('    Menggunakan data dari file export sebagai fallback...\n');
      
      // Fallback: use local export file
      const fs = require('fs');
      const exportPath = './scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json';
      
      if (fs.existsSync(exportPath)) {
        const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
        const orders = exportData.orders || [];
        console.log(`   ✓ Loaded ${orders.length} orders from local export\n`);
        
        // Analyze export data
        const sejoliAnalysis = analyzeSejoliData(orders);
        const dbStats = await getDatabaseStats();
        compareData(sejoliAnalysis, dbStats);
      } else {
        console.log('   ❌ File export tidak ditemukan\n');
      }
    } else {
      // 2. Analyze Sejoli data
      const sejoliAnalysis = analyzeSejoliData(sales);
      
      // 3. Get database stats
      const dbStats = await getDatabaseStats();
      
      // 4. Compare and show results
      compareData(sejoliAnalysis, dbStats);
    }

    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('✅ AUDIT SELESAI - Data tidak diubah/dihapus');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
