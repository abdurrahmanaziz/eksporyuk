const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeMissing() {
  console.log('📊 ANALISIS USER YANG TIDAK MATCH:');
  console.log('═'.repeat(60));
  
  // Load data files
  const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
  const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
  const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8').split('\n').slice(1).filter(Boolean);
  
  // Parse sejoli users
  const sejoliUsers = new Map();
  usersRaw.forEach(line => {
    const [id, login, email, name] = line.split('\t');
    sejoliUsers.set(id, { id, login, email: email?.toLowerCase().trim(), name });
  });
  
  // Parse commissions
  const commissions = new Map();
  commissionsRaw.forEach(line => {
    const [orderId, affId, commission, status] = line.split('\t');
    if (status === 'added') {
      commissions.set(orderId, { affiliateId: affId, commission: parseInt(commission) });
    }
  });
  
  // Get local users
  const localUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const localUserEmails = new Set(localUsers.map(u => u.email?.toLowerCase().trim()).filter(Boolean));
  
  console.log(`Sejoli Users: ${sejoliUsers.size}`);
  console.log(`Local Users: ${localUsers.length}`);
  
  // Find missing users with completed orders
  let missingUsersWithCompletedOrders = new Map();
  let missingOmset = 0;
  let missingKomisi = 0;
  let completedOrdersMissing = 0;
  
  ordersRaw.forEach(line => {
    const parts = line.split('\t');
    const orderId = parts[0];
    const userId = parts[2];
    const grandTotal = parseInt(parts[4]) || 0;
    const status = parts[5];
    
    const sejoliUser = sejoliUsers.get(userId);
    if (!sejoliUser || !sejoliUser.email) return;
    
    if (!localUserEmails.has(sejoliUser.email)) {
      // User missing
      if (!missingUsersWithCompletedOrders.has(userId)) {
        missingUsersWithCompletedOrders.set(userId, {
          ...sejoliUser,
          completedOrders: 0,
          totalAmount: 0,
          totalCommission: 0
        });
      }
      
      const userData = missingUsersWithCompletedOrders.get(userId);
      if (status === 'completed') {
        userData.completedOrders++;
        userData.totalAmount += grandTotal;
        completedOrdersMissing++;
        missingOmset += grandTotal;
        
        const comm = commissions.get(orderId);
        if (comm?.commission) {
          userData.totalCommission += comm.commission;
          missingKomisi += comm.commission;
        }
      }
    }
  });
  
  console.log(`\nMissing Users: ${missingUsersWithCompletedOrders.size}`);
  console.log(`Completed Orders Missing: ${completedOrdersMissing}`);
  console.log(`Missing Omset: Rp ${missingOmset.toLocaleString('id-ID')}`);
  console.log(`Missing Komisi: Rp ${missingKomisi.toLocaleString('id-ID')}`);
  
  // Expected values
  const expectedOmset = 4122334962;
  const expectedKomisi = 1245421000;
  const currentOmset = expectedOmset - missingOmset;
  const currentKomisi = expectedKomisi - missingKomisi;
  
  console.log(`\n📈 BREAKDOWN:`);
  console.log(`Expected Omset: Rp ${expectedOmset.toLocaleString('id-ID')}`);
  console.log(`Current Omset:  Rp ${currentOmset.toLocaleString('id-ID')}`);
  console.log(`Selisih Omset:  Rp ${missingOmset.toLocaleString('id-ID')}`);
  
  // Sort by amount
  const sortedMissing = [...missingUsersWithCompletedOrders.values()]
    .filter(u => u.completedOrders > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);
  
  console.log(`\n📋 TOP 20 MISSING USERS BY OMSET:`);
  sortedMissing.slice(0, 20).forEach((u, i) => {
    console.log(`${i+1}. ${u.email || 'NO EMAIL'} - Orders: ${u.completedOrders}, Omset: Rp ${u.totalAmount.toLocaleString('id-ID')}, Komisi: Rp ${u.totalCommission.toLocaleString('id-ID')}`);
  });
  
  // Save missing users to file for import
  const missingUserData = sortedMissing.map(u => ({
    sejoliId: u.id,
    email: u.email,
    name: u.name,
    login: u.login,
    completedOrders: u.completedOrders,
    totalAmount: u.totalAmount,
    totalCommission: u.totalCommission
  }));
  
  fs.writeFileSync('missing-users.json', JSON.stringify(missingUserData, null, 2));
  console.log(`\n✅ Saved ${missingUserData.length} missing users to missing-users.json`);
  
  await prisma.$disconnect();
}

analyzeMissing();
