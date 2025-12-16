const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTransactionTypeMapping() {
  console.log('🚀 Starting transaction type mapping fix...');

  try {
    // Product categorization based on PRD analysis
    const PRODUCT_TYPE_MAPPING = {
      // MEMBERSHIP PRODUCTS - Core membership packages
      13401: { type: 'MEMBERSHIP', tier: 'LIFETIME' },    // Paket Ekspor Yuk Lifetime
      13400: { type: 'MEMBERSHIP', tier: '6_MONTH' },     // Paket Ekspor Yuk 6 Bulan  
      13399: { type: 'MEMBERSHIP', tier: '12_MONTH' },    // Paket Ekspor Yuk 12 Bulan
      8683: { type: 'MEMBERSHIP', tier: '12_MONTH' },     // Kelas Ekspor Yuk 12 Bulan
      8684: { type: 'MEMBERSHIP', tier: '6_MONTH' },      // Kelas Ekspor Yuk 6 Bulan
      8910: { type: 'MEMBERSHIP', tier: 'LIFETIME' },     // Re Kelas Ekspor Lifetime
      8914: { type: 'MEMBERSHIP', tier: '6_MONTH' },      // Re Kelas 6 Bulan Ekspor Yuk
      8915: { type: 'MEMBERSHIP', tier: '12_MONTH' },     // Re Kelas 12 Bulan Ekspor Yuk
      
      // PROMO MEMBERSHIPS - Special promo prices for memberships
      17920: { type: 'MEMBERSHIP', tier: 'LIFETIME' },    // Promo Lifetime Tahun Baru Islam
      16956: { type: 'MEMBERSHIP', tier: 'LIFETIME' },    // Promo MEI Paket Lifetime 2025  
      15234: { type: 'MEMBERSHIP', tier: 'LIFETIME' },    // Promo Paket Lifetime THR 2025
      19296: { type: 'MEMBERSHIP', tier: 'LIFETIME' },    // Promo Merdeka Ke-80
      20852: { type: 'MEMBERSHIP', tier: 'LIFETIME' },    // Promo 10.10 2025
      11207: { type: 'MEMBERSHIP', tier: '12_MONTH' },    // Promo Juli Happy 1-7 Juli 2024
      3840: { type: 'MEMBERSHIP', tier: '12_MONTH' },     // Bundling Kelas Ekspor + Aplikasi EYA
      6810: { type: 'MEMBERSHIP', tier: '12_MONTH' },     // Promo Kemerdekaan
      6068: { type: 'MEMBERSHIP', tier: 'LIFETIME' },     // Kelas Bimbingan Ekspor Yuk
      4684: { type: 'MEMBERSHIP', tier: 'LIFETIME' },     // Ultah Ekspor Yuk
      179: { type: 'MEMBERSHIP', tier: 'LIFETIME' },      // Kelas Eksporyuk
      93: { type: 'MEMBERSHIP', tier: '6_MONTH' },        // Eksporyuk Prelaunch
      28: { type: 'MEMBERSHIP', tier: '3_MONTH' },        // eksporyuk
      3764: { type: 'MEMBERSHIP', tier: '12_MONTH' },     // Ekspor Yuk Automation

      // EVENT PRODUCTS - Webinars, Workshops, Zoom sessions, Kopdar
      21476: { type: 'EVENT', category: 'WEBINAR' },      // Webinar Ekspor 28 Nov 2025
      20130: { type: 'EVENT', category: 'WEBINAR' },      // Webinar Ekspor 30 Sept 2025  
      19042: { type: 'EVENT', category: 'WEBINAR' },      // Webinar Ekspor 29 Agustus 2025
      18528: { type: 'EVENT', category: 'WEBINAR' },      // Zoom Ekspor 30 Juli 2025
      18358: { type: 'EVENT', category: 'WEBINAR' },      // Zoom Ekspor 11 Juli 2025
      17767: { type: 'EVENT', category: 'WEBINAR' },      // Zoom Ekspor 27 Juni 2025
      17322: { type: 'EVENT', category: 'WEBINAR' },      // Zoom Ekspor 10 Juni 2025
      16963: { type: 'EVENT', category: 'WEBINAR' },      // Zoom Ekspor 30 Mei 2025
      16130: { type: 'EVENT', category: 'WEBINAR' },      // Zoom Ekspor 9 Mei 2025
      488: { type: 'EVENT', category: 'WEBINAR' },        // Webinar Juli 2022
      397: { type: 'EVENT', category: 'WEBINAR' },        // Webinar Juni 2022
      
      // OFFLINE EVENTS
      18705: { type: 'EVENT', category: 'KOPDAR' },       // Kopdar Depok 10 Agustus 2025
      17227: { type: 'EVENT', category: 'KOPDAR' },       // Kopdar Semarang Jawa Tengah
      16860: { type: 'EVENT', category: 'WORKSHOP' },     // Workshop Offline Sukabumi
      13050: { type: 'EVENT', category: 'KOPDAR' },       // Pembelian Tiket Untuk 3 Peserta
      13045: { type: 'EVENT', category: 'KOPDAR' },       // Pembelian Tiket Untuk 2 Peserta
      13039: { type: 'EVENT', category: 'KOPDAR' },       // Kopdar Akbar Ekspor Yuk Feb 2025 #2
      12994: { type: 'EVENT', category: 'KOPDAR' },       // Kopdar Akbar Ekspor Yuk Feb 2025

      // TRADE EXPO EVENTS
      20336: { type: 'EVENT', category: 'TRADE_EXPO' },   // Titip Barang TEI 2025
      18893: { type: 'EVENT', category: 'TRADE_EXPO' },   // DP Trade Expo Indonesia

      // SERVICE PRODUCTS - Jasa dan layanan
      5935: { type: 'PRODUCT', category: 'JASA_WEBSITE' },    // Jasa Website Ekspor Bisnis
      5928: { type: 'PRODUCT', category: 'JASA_WEBSITE' },    // Jasa Website Ekspor Hemat
      16587: { type: 'PRODUCT', category: 'JASA_DESIGN' },    // Jasa Katalog Produk
      16581: { type: 'PRODUCT', category: 'JASA_DESIGN' },    // Jasa Company Profile
      16592: { type: 'PRODUCT', category: 'JASA_DESIGN' },    // Bundling Katalog Produk dan Company Profil
      5932: { type: 'PRODUCT', category: 'JASA_LEGAL' },     // Legalitas Ekspor

      // SPECIAL PRODUCTS
      16826: { type: 'PRODUCT', category: 'UMROH' },         // Paket Umroh 1 Bulan + Cari Buyer Ekspor
      558: { type: 'PRODUCT', category: 'MERCHANDISE' },     // Kaos Eksporyuk
      300: { type: 'MEMBERSHIP', tier: 'FREE' },             // Kelas Ekspor Gratis
      1529: { type: 'PRODUCT', category: 'DONASI' },         // Kelas Donasi
    };

    // Get total transactions count first
    const totalTransactions = await prisma.transaction.count();
    console.log(`📊 Found ${totalTransactions} total transactions to process`);

    // Fetch Sejoli sales data for product mapping
    console.log('📡 Fetching Sejoli sales data...');
    
    let updated = 0;
    let membershipUpdates = 0;
    let eventUpdates = 0;
    let productUpdates = 0;
    let unknownProducts = new Set();

    // Process transactions in batches for better performance
    const BATCH_SIZE = 100;
    let offset = 0;
    
    while (offset < totalTransactions) {
      const transactions = await prisma.transaction.findMany({
        take: BATCH_SIZE,
        skip: offset,
        select: {
          id: true,
          type: true,
          invoiceNumber: true,
          metadata: true
        }
      });

      console.log(`🔄 Processing batch ${Math.floor(offset/BATCH_SIZE) + 1}: ${transactions.length} transactions`);

      for (const transaction of transactions) {
        // Get Sejoli product ID from metadata
        const sejoliProductId = transaction.metadata?.product_id;
        
        if (!sejoliProductId) {
          console.log(`⚠️ No product_id in metadata for ${transaction.invoiceNumber}`);
          continue;
        }

        const productId = parseInt(sejoliProductId);
        const productMapping = PRODUCT_TYPE_MAPPING[productId];

        if (!productMapping) {
          unknownProducts.add(productId);
          continue;
        }

        // Update transaction type and metadata
        const updateData = {
          type: productMapping.type,
          metadata: {
            ...transaction.metadata,
            sejoliProductId: productId,
            originalType: productMapping.type
          }
        };

        // Add membership tier if it's a membership
        if (productMapping.type === 'MEMBERSHIP' && productMapping.tier) {
          updateData.metadata.membershipTier = productMapping.tier;
        }

        // Add event category if it's an event
        if (productMapping.type === 'EVENT' && productMapping.category) {
          updateData.metadata.eventCategory = productMapping.category;
        }

        // Add product category if it's a product/service
        if (productMapping.type === 'PRODUCT' && productMapping.category) {
          updateData.metadata.productCategory = productMapping.category;
        }

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: updateData
        });

        updated++;
        
        // Count by type
        switch (productMapping.type) {
          case 'MEMBERSHIP':
            membershipUpdates++;
            break;
          case 'EVENT':
            eventUpdates++;
            break;
          case 'PRODUCT':
            productUpdates++;
            break;
        }
      }

      offset += BATCH_SIZE;
    }

    // Report unknown products with their names from metadata
    if (unknownProducts.size > 0) {
      console.log('\n⚠️ Unknown product IDs found:');
      
      for (const productId of unknownProducts) {
        // Find a transaction with this product ID to get the name
        const sampleTransaction = await prisma.transaction.findFirst({
          where: {
            metadata: {
              path: ['product_id'],
              equals: productId
            }
          },
          select: {
            metadata: true,
            amount: true
          }
        });
        
        if (sampleTransaction) {
          const productName = sampleTransaction.metadata?.product_name || 'Unknown Product';
          console.log(`- ID ${productId}: "${productName}" (Rp ${parseInt(sampleTransaction.amount).toLocaleString()})`);
        }
      }
    }

    console.log('\n✅ Transaction type mapping completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total updated: ${updated}`);
    console.log(`   - MEMBERSHIP: ${membershipUpdates}`);
    console.log(`   - EVENT: ${eventUpdates}`);
    console.log(`   - PRODUCT: ${productUpdates}`);
    console.log(`   - Unknown products: ${unknownProducts.size}`);

    // Verify final distribution
    const finalStats = await prisma.transaction.groupBy({
      by: ['type'],
      _count: {
        id: true
      }
    });

    console.log('\n📈 Final transaction type distribution:');
    finalStats.forEach(stat => {
      console.log(`   - ${stat.type}: ${stat._count.id} transactions`);
    });

  } catch (error) {
    console.error('❌ Error fixing transaction types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTransactionTypeMapping();