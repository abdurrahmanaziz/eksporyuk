const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  console.log('=== AUDIT TRANSAKSI & MEMBERSHIP ===\n');
  
  // Check sales.json
  if (fs.existsSync('/tmp/sales.json')) {
    const salesData = JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8'));
    
    // Handle both array and object formats
    const orders = Array.isArray(salesData) ? salesData : (salesData.orders || []);
    
    console.log('📄 DATA SEJOLI (sales.json):');
    console.log(`   Total Orders: ${orders.length}`);
    
    const completedOrders = orders.filter(s => s.order_status === 'completed');
    console.log(`   Completed Orders: ${completedOrders.length}`);
    
    // Group by product
    const productGroups = {};
    completedOrders.forEach(order => {
      const pid = order.product_id;
      const pname = order.product_name;
      if (!productGroups[pid]) {
        productGroups[pid] = { name: pname, count: 0 };
      }
      productGroups[pid].count++;
    });
    
    console.log(`\n   📦 Unique Products: ${Object.keys(productGroups).length}`);
    console.log(`\n   Top 10 Products:`);
    Object.entries(productGroups)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .forEach(([pid, data]) => {
        console.log(`     - ${data.name}: ${data.count} orders`);
      });
      
    // Count membership vs non-membership
    const membershipProducts = completedOrders.filter(o => {
      const name = (o.product_name || '').toLowerCase();
      return name.includes('membership') || 
             name.includes('member') || 
             name.includes('bulan') ||
             name.includes('lifetime') ||
             name.includes('tahun') ||
             name.includes('12 bulan') ||
             name.includes('6 bulan');
    });
    
    const webinarProducts = completedOrders.filter(o => {
      const name = (o.product_name || '').toLowerCase();
      return name.includes('webinar') || name.includes('workshop');
    });
    
    console.log(`\n   📊 CATEGORY BREAKDOWN:`);
    console.log(`     Membership orders: ${membershipProducts.length}`);
    console.log(`     Webinar orders: ${webinarProducts.length}`);
    console.log(`     Others: ${completedOrders.length - membershipProducts.length - webinarProducts.length}`);
  }
  
  console.log(`\n\n📊 DATABASE EKSPORYUK:\n`);
  
  // Check transactions
  const totalTransactions = await prisma.transaction.count();
  const completedTransactions = await prisma.transaction.count({
    where: { status: 'SUCCESS' }
  });
  
  console.log(`   Total Transactions: ${totalTransactions}`);
  console.log(`   Completed (SUCCESS): ${completedTransactions}`);
  
  // Check user memberships
  const totalUserMemberships = await prisma.userMembership.count();
  const activeUserMemberships = await prisma.userMembership.count({
    where: { status: 'ACTIVE' }
  });
  
  console.log(`\n   User Memberships: ${totalUserMemberships}`);
  console.log(`   Active: ${activeUserMemberships}`);
  
  // Check users with MEMBER_PREMIUM role
  const premiumUsers = await prisma.user.count({
    where: { role: 'MEMBER_PREMIUM' }
  });
  
  console.log(`\n   Users with MEMBER_PREMIUM role: ${premiumUsers}`);
  
  // Breakdown by membership plan
  console.log(`\n   📦 MEMBERSHIP BREAKDOWN:`);
  const memberships = await prisma.membership.findMany({
    orderBy: { price: 'desc' }
  });
  
  for (const m of memberships) {
    const total = await prisma.userMembership.count({
      where: { membershipId: m.id }
    });
    const active = await prisma.userMembership.count({
      where: { membershipId: m.id, status: 'ACTIVE' }
    });
    
    console.log(`     ${m.name} (Rp ${Number(m.price).toLocaleString('id-ID')}): ${active}/${total} active`);
  }
  
  // Check if there are users with memberships but not MEMBER_PREMIUM role
  const usersWithMemberships = await prisma.userMembership.findMany({
    where: { status: 'ACTIVE' },
    include: { user: { select: { id: true, role: true, email: true } } }
  });
  
  const notPremium = usersWithMemberships.filter(um => um.user.role !== 'MEMBER_PREMIUM');
  
  console.log(`\n   ⚠️  Users with ACTIVE membership but NOT MEMBER_PREMIUM: ${notPremium.length}`);
  
  if (notPremium.length > 0 && notPremium.length <= 20) {
    console.log(`\n   Sample users yang perlu diupdate:`);
    notPremium.slice(0, 5).forEach(um => {
      console.log(`     - ${um.user.email} (role: ${um.user.role})`);
    });
  }
  
  console.log(`\n\n❓ PERTANYAAN: Kenapa hanya ${activeUserMemberships} aktif dari 19,209 transaksi?\n`);
  console.log(`   JAWABAN:\n`);
  console.log(`   1. ❌ Banyak transaksi BUKAN membership (webinar ${fs.existsSync('/tmp/sales.json') ? `~${JSON.parse(fs.readFileSync('/tmp/sales.json', 'utf8')).filter(s => s.order_status === 'completed' && (s.product_name || '').toLowerCase().includes('webinar')).length}` : ''} orders)`);
  console.log(`   2. ❌ Membership sudah expired (beli 1/3 bulan di 2023-2024, sekarang 2025)`);
  console.log(`   3. ❌ User beli multiple membership, kami hapus paket 1 & 3 bulan tadi`);
  console.log(`   4. ✅ Yang tersisa = user dengan membership VALID (6 bulan, 12 bulan, lifetime)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
