const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importAll() {
  console.log('🚀 IMPORT 100% AKURAT - 14 Desember 2025');
  console.log('═'.repeat(60));
  
  // Read and parse files
  const ordersRaw = fs.readFileSync('sejoli_orders_raw.tsv', 'utf-8');
  const usersRaw = fs.readFileSync('sejoli_users.tsv', 'utf-8');
  const commissionsRaw = fs.readFileSync('sejoli_affiliate_commissions.tsv', 'utf-8');
  
  // Parse TSV properly using headers
  function parseOrders(content) {
    const lines = content.trim().split('\n');
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Find tab positions for reliable parsing
      const parts = line.split('\t');
      if (parts.length >= 10) {
        results.push({
          ID: parts[0],
          product_id: parts[1],
          user_id: parts[2],
          affiliate_id: parts[3],
          coupon_id: parts[4],
          quantity: parts[5],
          grand_total: parts[6],
          status: parts[7],
          created_at: parts[8],
          payment_gateway: parts[9]
        });
      }
    }
    return results;
  }
  
  function parseUsers(content) {
    const lines = content.trim().split('\n');
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      results.push({
        ID: parts[0],
        user_login: parts[1],
        user_email: parts[2]?.toLowerCase().trim(),
        display_name: parts[3]
      });
    }
    return results;
  }
  
  function parseCommissions(content) {
    const lines = content.trim().split('\n');
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split('\t');
      results.push({
        order_id: parts[0],
        affiliate_id: parts[1],
        commission: parts[2],
        status: parts[3]
      });
    }
    return results;
  }
  
  const orders = parseOrders(ordersRaw);
  const sejoliUsers = parseUsers(usersRaw);
  const commissions = parseCommissions(commissionsRaw);
  
  console.log(`\n📊 DATA LOADED:`);
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Users: ${sejoliUsers.length}`);
  console.log(`   Commissions: ${commissions.length}`);
  
  // Create lookups
  const sejoliUserById = {};
  sejoliUsers.forEach(u => {
    sejoliUserById[u.ID] = u;
  });
  
  const commissionByOrder = {};
  commissions.forEach(c => {
    if (c.status === 'added') {
      commissionByOrder[c.order_id] = {
        affiliateId: c.affiliate_id,
        commission: parseFloat(c.commission) || 0
      };
    }
  });
  
  // Count by status
  const statusCount = {};
  orders.forEach(o => {
    statusCount[o.status] = (statusCount[o.status] || 0) + 1;
  });
  console.log('\n📋 Orders by Status:');
  Object.entries(statusCount).forEach(([s, c]) => console.log(`   ${s}: ${c}`));
  
  // Verify completed orders match screenshot
  const completedOrders = orders.filter(o => o.status === 'completed');
  let totalOmset = 0;
  completedOrders.forEach(o => {
    totalOmset += parseFloat(o.grand_total) || 0;
  });
  console.log(`\n✅ Completed Orders: ${completedOrders.length}`);
  console.log(`✅ Total Omset: Rp ${totalOmset.toLocaleString('id-ID')}`);
  
  // Get local users
  const localUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const localUserByEmail = {};
  localUsers.forEach(u => {
    if (u.email) {
      localUserByEmail[u.email.toLowerCase().trim()] = u.id;
    }
  });
  console.log(`\n📋 Local Users: ${localUsers.length}`);
  
  // Clear transactions
  console.log('\n═'.repeat(60));
  console.log('🔄 DELETING OLD TRANSACTIONS...');
  await prisma.transaction.deleteMany({});
  console.log('✅ Old transactions deleted');
  
  // Import
  console.log('\n🔄 IMPORTING...');
  
  const statusMap = {
    'completed': 'SUCCESS',
    'cancelled': 'FAILED',
    'on-hold': 'PENDING',
    'pending': 'PENDING',
    'payment-confirm': 'PENDING',
    'refunded': 'FAILED'
  };
  
  let imported = 0;
  let skipped = 0;
  let importedOmset = 0;
  let importedKomisi = 0;
  let importedCompleted = 0;
  
  // Collect missing users to create
  const missingUsers = new Map();
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    
    // Get sejoli user
    const sejoliUser = sejoliUserById[order.user_id];
    if (!sejoliUser || !sejoliUser.user_email) {
      skipped++;
      continue;
    }
    
    // Find local user
    let localUserId = localUserByEmail[sejoliUser.user_email];
    
    // If no local user, we need to create one
    if (!localUserId) {
      if (!missingUsers.has(sejoliUser.user_email)) {
        missingUsers.set(sejoliUser.user_email, {
          email: sejoliUser.user_email,
          name: sejoliUser.display_name || sejoliUser.user_login,
          sejoliId: sejoliUser.ID
        });
      }
      skipped++;
      continue;
    }
    
    // Get commission
    const commInfo = commissionByOrder[order.ID];
    let affiliateLocalId = null;
    let commission = 0;
    
    if (commInfo?.affiliateId && commInfo.affiliateId !== '0') {
      const affUser = sejoliUserById[commInfo.affiliateId];
      if (affUser?.user_email) {
        affiliateLocalId = localUserByEmail[affUser.user_email];
        if (affiliateLocalId) {
          commission = commInfo.commission;
        }
      }
    }
    
    const amount = parseFloat(order.grand_total) || 0;
    const status = statusMap[order.status] || 'PENDING';
    
    try {
      await prisma.transaction.create({
        data: {
          userId: localUserId,
          type: 'MEMBERSHIP',
          amount: amount,
          status: status,
          paymentMethod: order.payment_gateway || 'manual',
          affiliateId: affiliateLocalId,
          affiliateShare: commission,
          metadata: {
            sejoliOrderId: parseInt(order.ID),
            sejoliProductId: parseInt(order.product_id),
            importSource: 'sejoli-100persen',
            importedAt: new Date().toISOString()
          },
          createdAt: new Date(order.created_at),
          updatedAt: new Date()
        }
      });
      
      imported++;
      if (status === 'SUCCESS') {
        importedOmset += amount;
        importedKomisi += commission;
        importedCompleted++;
      }
      
      if (imported % 2000 === 0) {
        console.log(`   Progress: ${imported}/${orders.length} (${((imported/orders.length)*100).toFixed(1)}%)`);
      }
    } catch (err) {
      skipped++;
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported.toLocaleString('id-ID')}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Missing Users: ${missingUsers.size}`);
  
  // Save missing users
  if (missingUsers.size > 0) {
    fs.writeFileSync('missing-users-to-create.json', JSON.stringify([...missingUsers.values()], null, 2));
    console.log(`   Saved missing users to missing-users-to-create.json`);
  }
  
  // Verify
  console.log('\n═'.repeat(60));
  console.log('📊 VERIFIKASI:');
  console.log('═'.repeat(60));
  
  const dbCompleted = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
  const dbOmset = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  const dbKomisi = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { affiliateShare: true }
  });
  
  console.log(`                | Screenshot      | Database         | Match`);
  console.log(`   Total Sales  | 12,839          | ${dbCompleted.toLocaleString('id-ID').padEnd(16)} | ${dbCompleted === 12839 ? '✅' : '❌'}`);
  console.log(`   Total Omset  | 4,122,334,962   | ${Number(dbOmset._sum.amount).toLocaleString('id-ID').padEnd(16)} | ${Number(dbOmset._sum.amount) === 4122334962 ? '✅' : '❌'}`);
  console.log(`   Total Komisi | 1,245,421,000   | ${Number(dbKomisi._sum.affiliateShare).toLocaleString('id-ID').padEnd(16)} | ${Number(dbKomisi._sum.affiliateShare) === 1245421000 ? '✅' : '❌'}`);
  
  const omsetMatch = ((Number(dbOmset._sum.amount) / 4122334962) * 100).toFixed(2);
  const komisiMatch = ((Number(dbKomisi._sum.affiliateShare) / 1245421000) * 100).toFixed(2);
  
  console.log(`\n🎯 AKURASI: Omset ${omsetMatch}% | Komisi ${komisiMatch}%`);
  
  await prisma.$disconnect();
}

importAll().catch(console.error);
