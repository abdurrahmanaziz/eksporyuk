/**
 * Script untuk mengimpor transaksi dan affiliate dari export Sejoli terbaru
 * 
 * CARA PAKAI:
 * 1. Export data terbaru dari Sejoli (member.eksporyuk.com/wp-admin/admin.php?page=sejoli-orders)
 * 2. Simpan file JSON di: scripts/migration/wp-data/
 * 3. Update variabel SEJOLI_DATA_FILE di bawah dengan nama file baru
 * 4. Jalankan: node import-latest-sejoli-transactions.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// ⚠️ UPDATE INI DENGAN NAMA FILE EXPORT SEJOLI TERBARU
const SEJOLI_DATA_FILE = 'sejolisa-full-18000users-1765279985617.json';

const prisma = new PrismaClient();

async function importLatestSejoliTransactions() {
  console.log('🚀 IMPORT TRANSAKSI DAN AFFILIATE DARI SEJOLI');
  console.log('='.repeat(60));
  
  // Load data
  const dataPath = path.join(__dirname, 'scripts/migration/wp-data', SEJOLI_DATA_FILE);
  if (!fs.existsSync(dataPath)) {
    console.log(`❌ File tidak ditemukan: ${dataPath}`);
    console.log('   Silakan export data dari Sejoli dan simpan di folder scripts/migration/wp-data/');
    return;
  }
  
  const sejoliData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`📁 Loaded ${sejoliData.orders?.length || 0} orders from Sejoli export`);
  
  // Get existing transaction invoice numbers
  const existingTx = await prisma.transaction.findMany({
    select: { invoiceNumber: true }
  });
  const existingInvoices = new Set(existingTx.map(t => t.invoiceNumber));
  console.log(`📊 Database has ${existingInvoices.size} existing transactions`);
  
  // Find new orders not in database
  const newOrders = sejoliData.orders.filter(order => {
    const invoiceNumber = `INV${order.id}`;
    return !existingInvoices.has(invoiceNumber) && order.status === 'completed';
  });
  
  console.log(`🆕 Found ${newOrders.length} new completed orders to import`);
  
  if (newOrders.length === 0) {
    console.log('✅ No new orders to import');
    await prisma.$disconnect();
    return;
  }
  
  // Import new transactions
  let imported = 0;
  let affiliateCreated = 0;
  let errors = [];
  
  for (const order of newOrders) {
    try {
      const invoiceNumber = `INV${order.id}`;
      
      // Find user
      const sejoliUser = sejoliData.users.find(u => u.id === order.user_id);
      let user = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: sejoliUser?.email },
            { name: sejoliUser?.name }
          ]
        }
      });
      
      if (!user) {
        errors.push(`${invoiceNumber}: User not found for ${sejoliUser?.email}`);
        continue;
      }
      
      // Create transaction
      const tx = await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'MEMBERSHIP',
          status: 'SUCCESS',
          amount: order.grand_total || 0,
          customerName: order.buyer_name || user.name,
          customerEmail: order.buyer_email || user.email,
          customerPhone: order.buyer_phone,
          invoiceNumber: invoiceNumber,
          paymentMethod: 'IMPORTED',
          createdAt: new Date(order.created_at || Date.now()),
          paidAt: new Date(order.created_at || Date.now()),
        }
      });
      imported++;
      
      // Create affiliate conversion if affiliate exists
      if (order.affiliate_id && order.affiliate_id !== 0) {
        const sejoliAffiliate = sejoliData.affiliates.find(a => a.affiliate_code === order.affiliate_id);
        
        if (sejoliAffiliate) {
          // Find affiliate in database
          const affiliateProfile = await prisma.affiliateProfile.findFirst({
            where: {
              OR: [
                { affiliateCode: String(sejoliAffiliate.affiliate_code) },
                { user: { email: sejoliAffiliate.email } },
                { user: { name: sejoliAffiliate.name } }
              ]
            }
          });
          
          if (affiliateProfile) {
            // Check if conversion already exists
            const existingConversion = await prisma.affiliateConversion.findUnique({
              where: { transactionId: tx.id }
            });
            
            if (!existingConversion) {
              const commissionAmount = order.affiliate_fee || (order.grand_total * 0.3); // Default 30%
              
              await prisma.affiliateConversion.create({
                data: {
                  affiliateId: affiliateProfile.id,
                  transactionId: tx.id,
                  commissionAmount: commissionAmount,
                  commissionRate: 30,
                  paidOut: false
                }
              });
              affiliateCreated++;
            }
          }
        }
      }
      
      if (imported % 50 === 0) {
        console.log(`  Imported ${imported} transactions, ${affiliateCreated} affiliate conversions...`);
      }
      
    } catch (err) {
      errors.push(`${order.id}: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 HASIL IMPORT:');
  console.log(`✅ Transaksi diimport: ${imported}`);
  console.log(`✅ Affiliate conversions dibuat: ${affiliateCreated}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️ Errors (first 10):');
    errors.slice(0, 10).forEach(e => console.log(`   ${e}`));
  }
  
  await prisma.$disconnect();
}

importLatestSejoliTransactions().catch(console.error);
