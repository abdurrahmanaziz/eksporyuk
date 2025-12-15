const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Load product mapping
const mappingPath = path.join(__dirname, 'scripts/migration/product-membership-mapping.js');
const PRODUCT_MAPPING = require('./scripts/migration/product-membership-mapping.js');

async function validateProductMapping() {
  console.log('🔍 VALIDASI PRODUCT-MEMBERSHIP MAPPING');
  console.log('========================================');

  // 1. Cek total produk dalam mapping
  const totalMappedProducts = Object.keys(PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING).length;
  console.log('📊 Total Produk dalam Mapping:', totalMappedProducts);

  // 2. Cek kategori produk
  const categories = {};
  Object.values(PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING).forEach(product => {
    categories[product.type] = (categories[product.type] || 0) + 1;
  });

  console.log('\n📋 KATEGORI PRODUK:');
  Object.entries(categories).forEach(([type, count]) => {
    console.log(`- ${type}: ${count} produk`);
  });

  // 3. Cek produk dengan komisi tertinggi
  const highCommissionProducts = Object.entries(PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING)
    .filter(([id, product]) => product.commissionFlat > 200000)
    .sort((a, b) => b[1].commissionFlat - a[1].commissionFlat);

  console.log('\n💰 TOP 10 PRODUK KOMISI TERTINGGI:');
  highCommissionProducts.slice(0, 10).forEach(([id, product], i) => {
    console.log(`${i+1}. Product ${id}: ${product.name} - Rp ${product.commissionFlat.toLocaleString('id-ID')}`);
  });

  // 4. Cek apakah ada transaksi dengan external ID yang ada di mapping
  const externalIds = Object.keys(PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING);
  const transactionsInMapping = await prisma.transaction.count({
    where: {
      externalId: {
        in: externalIds
      }
    }
  });

  console.log('\n📊 Transaksi dengan External ID dalam Mapping:', transactionsInMapping);

  // 5. Sample transaksi dengan komisi tinggi
  const sampleHighCommissionTx = await prisma.transaction.findMany({
    where: {
      externalId: {
        in: Object.keys(PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING).filter(id => 
          PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING[id].commissionFlat > 300000
        )
      }
    },
    include: {
      affiliateConversion: true
    },
    take: 5
  });

  console.log('\n🎯 SAMPLE TRANSAKSI KOMISI TINGGI:');
  sampleHighCommissionTx.forEach((tx, i) => {
    const expectedCommission = PRODUCT_MAPPING.PRODUCT_MEMBERSHIP_MAPPING[tx.externalId]?.commissionFlat || 0;
    const actualCommission = tx.affiliateConversion?.commissionAmount || 0;
    const match = expectedCommission == actualCommission ? '✅' : '❌';
    
    console.log(`${i+1}. ${match} Product ${tx.externalId} | Expected: Rp ${expectedCommission.toLocaleString('id-ID')} | Actual: Rp ${actualCommission.toString()}`);
  });

  await prisma.$disconnect();
}

validateProductMapping().catch(console.error);