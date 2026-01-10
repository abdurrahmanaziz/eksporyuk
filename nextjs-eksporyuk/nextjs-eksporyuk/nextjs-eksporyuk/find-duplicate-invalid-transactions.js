const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function findDuplicateAndInvalidTransactions() {
  try {
    console.log('🔍 MENCARI TRANSAKSI DUPLIKAT & TIDAK VALID\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    
    // Load Sejoli data
    const sejoliData = JSON.parse(fs.readFileSync('scripts/migration/wp-data/sejolisa-full-18000users-1765279985617.json', 'utf8'));
    
    // Create map of valid Sejoli order IDs
    const validSejoliOrderIds = new Set();
    const sejoliOrderMap = {};
    
    for (const order of sejoliData.orders) {
      validSejoliOrderIds.add(String(order.ID));
      sejoliOrderMap[order.ID] = {
        email: order.user_email,
        amount: parseFloat(order.grand_total) || 0,
        status: order.status,
        date: order.order_date
      };
    }
    
    console.log(`✅ Loaded ${validSejoliOrderIds.size.toLocaleString()} valid Sejoli order IDs\n`);
    
    // Get all transactions from database
    const allTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        externalId: true,
        amount: true,
        status: true,
        createdAt: true,
        userId: true,
        user: {
          select: { email: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total transactions in database: ${allTransactions.length.toLocaleString()}\n`);
    
    // Find transactions NOT in Sejoli
    const invalidTransactions = [];
    const duplicateExternalIds = {};
    
    for (const trans of allTransactions) {
      // Check duplicates
      if (trans.externalId) {
        if (!duplicateExternalIds[trans.externalId]) {
          duplicateExternalIds[trans.externalId] = [];
        }
        duplicateExternalIds[trans.externalId].push(trans);
      }
      
      // Check if externalId exists in Sejoli
      if (!trans.externalId || !validSejoliOrderIds.has(trans.externalId)) {
        invalidTransactions.push(trans);
      }
    }
    
    // Find actual duplicates (externalId appears more than once)
    const actualDuplicates = Object.entries(duplicateExternalIds)
      .filter(([id, transactions]) => transactions.length > 1);
    
    console.log('🔴 DUPLIKAT TRANSAKSI (External ID sama muncul >1x):');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    if (actualDuplicates.length > 0) {
      for (const [externalId, transactions] of actualDuplicates) {
        console.log(`\n  External ID: ${externalId} (${transactions.length}x duplicate)`);
        for (const trans of transactions) {
          console.log(`    - Trans ID ${trans.id}: ${trans.status} | Rp ${trans.amount.toLocaleString()} | ${trans.user?.email || 'No email'}`);
        }
      }
      console.log(`\n  Total duplicate groups: ${actualDuplicates.length}`);
      console.log(`  Total duplicate transactions: ${actualDuplicates.reduce((sum, [, trans]) => sum + trans.length, 0) - actualDuplicates.length}`);
    } else {
      console.log('  ✅ Tidak ada duplikat');
    }
    
    console.log('\n🔴 TRANSAKSI TIDAK VALID (Tidak ada di Sejoli WP):');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    if (invalidTransactions.length > 0) {
      console.log(`\n  Total: ${invalidTransactions.length} transaksi tidak valid\n`);
      
      // Group by status
      const byStatus = {};
      for (const trans of invalidTransactions) {
        if (!byStatus[trans.status]) byStatus[trans.status] = [];
        byStatus[trans.status].push(trans);
      }
      
      for (const [status, transactions] of Object.entries(byStatus)) {
        console.log(`\n  ${status}: ${transactions.length} transaksi`);
        
        // Show first 10
        const samples = transactions.slice(0, 10);
        for (const trans of samples) {
          console.log(`    ID ${trans.id} | ExtID: ${trans.externalId || 'NULL'} | Rp ${trans.amount.toLocaleString()} | ${trans.user?.email || 'No user'} | ${trans.createdAt.toISOString().split('T')[0]}`);
        }
        
        if (transactions.length > 10) {
          console.log(`    ... and ${transactions.length - 10} more`);
        }
      }
      
      // Calculate total amount of invalid transactions
      const totalInvalidAmount = invalidTransactions.reduce((sum, t) => sum + t.amount, 0);
      console.log(`\n  💰 Total amount invalid transactions: Rp ${totalInvalidAmount.toLocaleString()}`);
      
    } else {
      console.log('  ✅ Semua transaksi valid (ada di Sejoli)');
    }
    
    // Check memberships without transactions
    console.log('\n\n🎫 MEMBERSHIP TANPA TRANSAKSI:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const membershipsWithoutTrans = await prisma.userMembership.findMany({
      where: {
        transactionId: null
      },
      include: {
        user: { select: { email: true, name: true } },
        membership: { select: { name: true } }
      },
      take: 20
    });
    
    if (membershipsWithoutTrans.length > 0) {
      console.log(`\n  Found ${membershipsWithoutTrans.length} memberships without transaction (showing first 20):\n`);
      for (const mem of membershipsWithoutTrans) {
        console.log(`    User: ${mem.user?.email || 'Unknown'} | ${mem.membership.name} | Start: ${mem.startDate.toISOString().split('T')[0]}`);
      }
    } else {
      console.log('  ✅ Semua membership punya transaction');
    }
    
    // Users with memberships but no SUCCESS transaction
    console.log('\n\n👤 USER DENGAN MEMBERSHIP TAPI TIDAK ADA TRANSAKSI SUCCESS:');
    console.log('───────────────────────────────────────────────────────────────────────────────────────');
    
    const usersWithMembership = await prisma.userMembership.findMany({
      select: {
        userId: true,
        user: { select: { email: true } }
      },
      distinct: ['userId']
    });
    
    let missingTransactions = 0;
    const samples = [];
    
    for (const userMem of usersWithMembership) {
      const successTrans = await prisma.transaction.findFirst({
        where: {
          userId: userMem.userId,
          status: 'SUCCESS'
        }
      });
      
      if (!successTrans) {
        missingTransactions++;
        if (samples.length < 10) {
          samples.push(userMem.user.email);
        }
      }
    }
    
    if (missingTransactions > 0) {
      console.log(`\n  ⚠️  Found ${missingTransactions} users dengan membership tapi tidak ada SUCCESS transaction\n`);
      console.log('  Sample users:');
      for (const email of samples) {
        console.log(`    - ${email}`);
      }
    } else {
      console.log('  ✅ Semua user dengan membership punya SUCCESS transaction');
    }
    
    console.log('\n\n📊 REKOMENDASI PERBAIKAN:');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════');
    
    if (actualDuplicates.length > 0) {
      console.log(`\n  1. ❌ HAPUS ${actualDuplicates.reduce((sum, [, trans]) => sum + trans.length - 1, 0)} transaksi duplikat`);
      console.log('     - Hanya simpan 1 transaksi per External ID');
    }
    
    if (invalidTransactions.length > 0) {
      console.log(`\n  2. ❌ HAPUS ${invalidTransactions.length} transaksi yang tidak ada di Sejoli`);
      console.log('     - Transaksi ini tidak valid dan harus dihapus');
    }
    
    if (missingTransactions > 0) {
      console.log(`\n  3. ✅ BUAT ${missingTransactions} transaksi SUCCESS untuk user dengan membership`);
      console.log('     - User punya membership tapi tidak ada transaction record');
    }
    
    const membershipGap = 12539 - await prisma.userMembership.count();
    if (membershipGap > 0) {
      console.log(`\n  4. ✅ BUAT ${membershipGap} membership yang missing`);
      console.log('     - Seharusnya ada 12,539 membership (sama dengan SUCCESS transactions)');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateAndInvalidTransactions();
