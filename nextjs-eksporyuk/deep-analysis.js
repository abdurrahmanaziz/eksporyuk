const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepAnalysis() {
  console.log('📊 DEEP ANALYSIS:');
  console.log('═'.repeat(60));
  
  // Load data files
  const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
  const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
  const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
  
  // Parse sejoli users
  const sejoliUsers = new Map();
  usersRaw.forEach(line => {
    const [id, login, email, name] = line.split('\t');
    sejoliUsers.set(id, { id, login, email: email?.toLowerCase().trim(), name });
  });
  
  // Parse orders
  let sejoliTotalOmset = 0;
  let sejoliCompleted = 0;
  
  ordersRaw.forEach(line => {
    const parts = line.split('\t');
    const status = parts[5];
    const grandTotal = parseInt(parts[4]) || 0;
    
    if (status === 'completed') {
      sejoliCompleted++;
      sejoliTotalOmset += grandTotal;
    }
  });
  
  // Parse commissions - only status=added
  let sejoliTotalKomisi = 0;
  let addedCommissions = 0;
  commissionsRaw.forEach(line => {
    const [orderId, affId, commission, status] = line.split('\t');
    if (status === 'added') {
      addedCommissions++;
      sejoliTotalKomisi += parseInt(commission) || 0;
    }
  });
  
  console.log('\n📈 DARI FILE TSV (Live Sejoli Export):');
  console.log(`   Completed Orders: ${sejoliCompleted.toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${sejoliTotalOmset.toLocaleString('id-ID')}`);
  console.log(`   Commission Records (added): ${addedCommissions.toLocaleString('id-ID')}`);
  console.log(`   Total Komisi: Rp ${sejoliTotalKomisi.toLocaleString('id-ID')}`);
  
  // Get data from Postgres database
  const dbTotal = await prisma.transaction.count();
  const dbCompleted = await prisma.transaction.count({ where: { status: 'SUCCESS' } });
  const dbOmset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  const dbKomisi = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { affiliateShare: true }
  });
  
  console.log('\n📈 DARI DATABASE POSTGRES (Setelah Import):');
  console.log(`   Total Transactions: ${dbTotal.toLocaleString('id-ID')}`);
  console.log(`   Completed (SUCCESS): ${dbCompleted.toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${Number(dbOmset._sum.amount || 0).toLocaleString('id-ID')}`);
  console.log(`   Total Komisi: Rp ${Number(dbKomisi._sum.affiliateShare || 0).toLocaleString('id-ID')}`);
  
  // Screenshot values
  console.log('\n📈 DARI SCREENSHOT (Target):');
  console.log(`   Total Lead: 19,246`);
  console.log(`   Total Sales: 12,839`);
  console.log(`   Total Omset: Rp 4,122,334,962`);
  console.log(`   Total Komisi: Rp 1,245,421,000`);
  
  // Differences
  const omsetDiff = sejoliTotalOmset - Number(dbOmset._sum.amount || 0);
  const komisiDiff = sejoliTotalKomisi - Number(dbKomisi._sum.affiliateShare || 0);
  const completedDiff = sejoliCompleted - dbCompleted;
  
  console.log('\n📊 SELISIH:');
  console.log(`   Completed Orders: ${completedDiff} (${sejoliCompleted} - ${dbCompleted})`);
  console.log(`   Omset: Rp ${omsetDiff.toLocaleString('id-ID')}`);
  console.log(`   Komisi: Rp ${komisiDiff.toLocaleString('id-ID')}`);
  
  // Find the missing completed orders
  console.log('\n🔍 MENCARI ORDERS COMPLETED YANG TIDAK TER-IMPORT:');
  
  // Get all imported sejoliOrderIds from metadata
  const importedOrders = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { metadata: true }
  });
  
  const importedOrderIds = new Set();
  importedOrders.forEach(tx => {
    if (tx.metadata?.sejoliOrderId) {
      importedOrderIds.add(String(tx.metadata.sejoliOrderId));
    }
  });
  
  console.log(`   Imported Order IDs: ${importedOrderIds.size}`);
  
  // Find missing completed orders
  let missingOrders = [];
  let missingOmset = 0;
  let missingKomisi = 0;
  
  ordersRaw.forEach(line => {
    const parts = line.split('\t');
    const orderId = parts[0];
    const userId = parts[2];
    const grandTotal = parseInt(parts[4]) || 0;
    const status = parts[5];
    
    if (status === 'completed' && !importedOrderIds.has(orderId)) {
      const sejoliUser = sejoliUsers.get(userId);
      missingOrders.push({
        orderId,
        userId,
        userEmail: sejoliUser?.email || 'no email',
        grandTotal,
        status
      });
      missingOmset += grandTotal;
    }
  });
  
  console.log(`\n   Missing Completed Orders: ${missingOrders.length}`);
  console.log(`   Missing Omset: Rp ${missingOmset.toLocaleString('id-ID')}`);
  
  if (missingOrders.length > 0) {
    console.log('\n   📋 Sample Missing Orders (10 pertama):');
    missingOrders.slice(0, 10).forEach((o, i) => {
      console.log(`   ${i+1}. Order #${o.orderId}: User ${o.userId} (${o.userEmail}), Amount: Rp ${o.grandTotal.toLocaleString('id-ID')}`);
    });
    
    // Check why these orders weren't imported - is it email mismatch?
    console.log('\n   🔍 ANALISIS KENAPA TIDAK TER-IMPORT:');
    
    // Get local users
    const localUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    const localUserEmails = new Set(localUsers.map(u => u.email?.toLowerCase().trim()).filter(Boolean));
    
    let noSejoliUser = 0;
    let noSejoliEmail = 0;
    let emailNotInLocal = 0;
    
    missingOrders.forEach(o => {
      const su = sejoliUsers.get(o.userId);
      if (!su) {
        noSejoliUser++;
      } else if (!su.email) {
        noSejoliEmail++;
      } else if (!localUserEmails.has(su.email)) {
        emailNotInLocal++;
      }
    });
    
    console.log(`   - No Sejoli User record: ${noSejoliUser}`);
    console.log(`   - Sejoli user has no email: ${noSejoliEmail}`);
    console.log(`   - Email not in local DB: ${emailNotInLocal}`);
    console.log(`   - Other reason: ${missingOrders.length - noSejoliUser - noSejoliEmail - emailNotInLocal}`);
  }
  
  await prisma.$disconnect();
}

deepAnalysis();
