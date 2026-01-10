const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importSejoliLive() {
  console.log('🚀 IMPORT DATA SEJOLI LIVE (14 Desember 2025)');
  console.log('═'.repeat(60));
  
  // Read exported files
  const ordersFile = fs.readFileSync(path.join(__dirname, 'sejoli_orders_raw.tsv'), 'utf-8');
  const commissionsFile = fs.readFileSync(path.join(__dirname, 'sejoli_affiliate_commissions.tsv'), 'utf-8');
  const usersFile = fs.readFileSync(path.join(__dirname, 'sejoli_users.tsv'), 'utf-8');
  
  // Parse TSV files
  const parseRows = (content) => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split('\t');
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      const obj = {};
      headers.forEach((h, i) => obj[h.trim()] = values[i]);
      return obj;
    });
  };
  
  const orders = parseRows(ordersFile);
  const commissions = parseRows(commissionsFile);
  const users = parseRows(usersFile);
  
  console.log(`\n📊 DATA DARI DATABASE SEJOLI LIVE:`);
  console.log(`   Total Orders: ${orders.length}`);
  console.log(`   Total Commission Records: ${commissions.length}`);
  console.log(`   Total Users: ${users.length}`);
  
  // Create commission lookup by order_id
  const commissionByOrder = {};
  commissions.forEach(c => {
    if (c.status === 'added') { // Only completed commissions
      commissionByOrder[c.order_id] = {
        affiliateId: parseInt(c.affiliate_id),
        commission: parseFloat(c.commission) || 0
      };
    }
  });
  
  console.log(`\n📈 Commission records with status 'added': ${Object.keys(commissionByOrder).length}`);
  
  // Create user lookup
  const userById = {};
  users.forEach(u => {
    userById[u.ID] = {
      id: parseInt(u.ID),
      login: u.user_login,
      email: u.user_email,
      name: u.display_name
    };
  });
  
  // Separate orders by status
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const pendingOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  
  console.log(`\n📋 Orders by Status:`);
  console.log(`   Completed: ${completedOrders.length}`);
  console.log(`   Cancelled: ${cancelledOrders.length}`);
  console.log(`   Pending/Other: ${pendingOrders.length}`);
  
  // Calculate totals
  const totalOmset = completedOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
  console.log(`\n💰 Total Omset (Completed): Rp ${totalOmset.toLocaleString('id-ID')}`);
  
  // Count orders with affiliate
  const completedWithAffiliate = completedOrders.filter(o => {
    const orderId = o.ID;
    return commissionByOrder[orderId]?.affiliateId > 0;
  });
  console.log(`   Completed with Affiliate: ${completedWithAffiliate.length}`);
  
  // Calculate total commission from completed orders
  let totalCommission = 0;
  completedWithAffiliate.forEach(o => {
    const comm = commissionByOrder[o.ID];
    if (comm) totalCommission += comm.commission;
  });
  console.log(`   Total Komisi: Rp ${totalCommission.toLocaleString('id-ID')}`);
  
  // Verify against screenshot
  console.log('\n═'.repeat(60));
  console.log('📊 VERIFIKASI DENGAN SCREENSHOT (14 Des 2025):');
  console.log('═'.repeat(60));
  console.log(`                | Screenshot      | Database Live`);
  console.log(`   Total Lead   | 19,246          | ${orders.length.toLocaleString('id-ID')}`);
  console.log(`   Total Sales  | 12,839          | ${completedOrders.length.toLocaleString('id-ID')}`);
  console.log(`   Total Omset  | Rp 4.12B        | Rp ${(totalOmset/1e9).toFixed(2)}B`);
  console.log(`   Total Komisi | Rp 1.245B       | Rp ${(totalCommission/1e9).toFixed(3)}B`);
  
  // Start import
  console.log('\n═'.repeat(60));
  console.log('🔄 MULAI IMPORT KE DATABASE...');
  console.log('═'.repeat(60));
  
  // First, clear existing transactions
  console.log('\n1️⃣ Menghapus transaksi lama...');
  await prisma.transaction.deleteMany({});
  console.log('   ✅ Transaksi lama dihapus');
  
  // Get all existing users from our database
  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  const userByEmail = {};
  existingUsers.forEach(u => userByEmail[u.email.toLowerCase()] = u.id);
  console.log(`\n2️⃣ User di database: ${existingUsers.length}`);
  
  // Get membership for transactions
  const memberships = await prisma.membership.findMany();
  const defaultMembership = memberships[0];
  console.log(`   Default Membership: ${defaultMembership?.name || 'None'}`);
  
  // Import orders
  console.log('\n3️⃣ Import transaksi...');
  let imported = 0;
  let skipped = 0;
  let affiliateMatched = 0;
  
  const statusMap = {
    'completed': 'SUCCESS',
    'cancelled': 'FAILED',
    'on-hold': 'PENDING',
    'pending': 'PENDING',
    'payment-confirm': 'PENDING',
    'refunded': 'FAILED'
  };
  
  for (const order of orders) {
    try {
      // Get user from Sejoli
      const sejoliUser = userById[order.user_id];
      if (!sejoliUser) {
        skipped++;
        continue;
      }
      
      // Find matching user in our database
      const localUserId = userByEmail[sejoliUser.email?.toLowerCase()];
      if (!localUserId) {
        skipped++;
        continue;
      }
      
      // Get affiliate info
      const commInfo = commissionByOrder[order.ID];
      let affiliateId = null;
      let commissionAmount = 0;
      
      if (commInfo?.affiliateId > 0) {
        const affSejoliUser = userById[commInfo.affiliateId];
        if (affSejoliUser) {
          affiliateId = userByEmail[affSejoliUser.email?.toLowerCase()];
          if (affiliateId) {
            affiliateMatched++;
            commissionAmount = commInfo.commission;
          }
        }
      }
      
      // Create transaction
      await prisma.transaction.create({
        data: {
          userId: localUserId,
          membershipId: defaultMembership?.id || null,
          amount: parseFloat(order.grand_total) || 0,
          status: statusMap[order.status] || 'PENDING',
          paymentMethod: order.payment_gateway || 'manual',
          affiliateId: affiliateId,
          affiliateCommission: commissionAmount,
          metadata: JSON.stringify({
            sejoliOrderId: parseInt(order.ID),
            sejoliProductId: parseInt(order.product_id),
            sejoliAffiliateId: commInfo?.affiliateId || null,
            importedAt: new Date().toISOString(),
            source: 'sejoli-live-import-20251214'
          }),
          createdAt: new Date(order.created_at),
          updatedAt: new Date()
        }
      });
      
      imported++;
      
      if (imported % 2000 === 0) {
        console.log(`   Imported: ${imported}...`);
      }
    } catch (err) {
      skipped++;
    }
  }
  
  console.log(`\n   ✅ Import selesai!`);
  console.log(`   Total Imported: ${imported.toLocaleString('id-ID')}`);
  console.log(`   Skipped: ${skipped.toLocaleString('id-ID')}`);
  console.log(`   Affiliate Matched: ${affiliateMatched.toLocaleString('id-ID')}`);
  
  // Verify final data
  console.log('\n═'.repeat(60));
  console.log('📊 VERIFIKASI DATA SETELAH IMPORT:');
  console.log('═'.repeat(60));
  
  const finalCount = await prisma.transaction.count();
  const successCount = await prisma.transaction.count({ where: { status: 'SUCCESS' }});
  const withAffiliate = await prisma.transaction.count({ 
    where: { status: 'SUCCESS', affiliateId: { not: null }}
  });
  
  const totalOmsetFinal = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  
  const totalCommissionFinal = await prisma.transaction.aggregate({
    where: { status: 'SUCCESS', affiliateId: { not: null }},
    _sum: { affiliateCommission: true }
  });
  
  console.log(`   Total Transaksi: ${finalCount.toLocaleString('id-ID')}`);
  console.log(`   Completed (SUCCESS): ${successCount.toLocaleString('id-ID')}`);
  console.log(`   With Affiliate: ${withAffiliate.toLocaleString('id-ID')}`);
  console.log(`   Total Omset: Rp ${(totalOmsetFinal._sum.amount || 0).toLocaleString('id-ID')}`);
  console.log(`   Total Komisi: Rp ${(totalCommissionFinal._sum.affiliateCommission || 0).toLocaleString('id-ID')}`);
  
  await prisma.$disconnect();
  console.log('\n✅ IMPORT SELESAI!');
}

importSejoliLive().catch(console.error);
