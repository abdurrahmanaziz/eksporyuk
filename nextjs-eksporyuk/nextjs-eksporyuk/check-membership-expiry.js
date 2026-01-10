const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMembershipExpiry() {
  console.log('🔍 Checking Sejoli Membership Expiry Dates...\n');

  try {
    const now = new Date();
    
    // Get all memberships from Sejoli transactions
    const sejoliMemberships = await prisma.userMembership.findMany({
      where: {
        transaction: {
          invoiceNumber: {
            startsWith: 'INV'
          }
        }
      },
      include: {
        user: {
          select: { email: true, name: true }
        },
        membership: {
          select: { name: true, duration: true }
        },
        transaction: {
          select: { 
            invoiceNumber: true, 
            paidAt: true, 
            createdAt: true,
            metadata: true 
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    });

    console.log(`📊 Found ${sejoliMemberships.length} Sejoli memberships\n`);

    const expired = [];
    const expiringSoon = [];
    const active = [];

    sejoliMemberships.forEach(um => {
      const endDate = new Date(um.endDate);
      const startDate = new Date(um.startDate);
      const paidAt = um.transaction.paidAt ? new Date(um.transaction.paidAt) : null;
      const daysSincePayment = paidAt ? Math.floor((now - paidAt) / (1000 * 60 * 60 * 24)) : null;
      const daysUntilExpiry = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));

      const info = {
        invoice: um.transaction.invoiceNumber,
        email: um.user.email,
        tier: um.membership.name,
        paidAt: paidAt ? paidAt.toLocaleDateString('id-ID') : 'N/A',
        startDate: startDate.toLocaleDateString('id-ID'),
        endDate: endDate.toLocaleDateString('id-ID'),
        daysSincePayment,
        daysUntilExpiry,
        isExpired: endDate < now
      };

      if (endDate < now) {
        expired.push(info);
      } else if (daysUntilExpiry <= 30) {
        expiringSoon.push(info);
      } else {
        active.push(info);
      }
    });

    // Show expired memberships
    console.log('❌ EXPIRED MEMBERSHIPS:');
    console.log('─'.repeat(100));
    if (expired.length > 0) {
      expired.slice(0, 10).forEach(m => {
        console.log(`${m.invoice} | ${m.email}`);
        console.log(`  ${m.tier}`);
        console.log(`  Paid: ${m.paidAt} (${m.daysSincePayment} hari lalu)`);
        console.log(`  Period: ${m.startDate} → ${m.endDate}`);
        console.log(`  Status: Expired ${Math.abs(m.daysUntilExpiry)} hari lalu\n`);
      });
      if (expired.length > 10) {
        console.log(`... dan ${expired.length - 10} lagi\n`);
      }
    } else {
      console.log('✅ Tidak ada membership expired\n');
    }

    // Show expiring soon
    console.log('\n⚠️ EXPIRING SOON (dalam 30 hari):');
    console.log('─'.repeat(100));
    if (expiringSoon.length > 0) {
      expiringSoon.forEach(m => {
        console.log(`${m.invoice} | ${m.email}`);
        console.log(`  ${m.tier} - Expires in ${m.daysUntilExpiry} hari (${m.endDate})\n`);
      });
    } else {
      console.log('✅ Tidak ada membership yang akan expire dalam 30 hari\n');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('─'.repeat(100));
    console.log(`Total Sejoli Memberships: ${sejoliMemberships.length}`);
    console.log(`❌ Expired: ${expired.length}`);
    console.log(`⚠️ Expiring Soon (≤30 days): ${expiringSoon.length}`);
    console.log(`✅ Active (>30 days): ${active.length}`);

    // Check if we need to recalculate
    if (expired.length > 0) {
      console.log('\n\n🚨 PROBLEM DETECTED!');
      console.log('─'.repeat(100));
      console.log('Ada membership yang sudah expired padahal seharusnya masih aktif.');
      console.log('Ini karena endDate dihitung dari tanggal bayar Sejoli (paidAt),');
      console.log('bukan dari tanggal migrasi ke web baru.\n');
      console.log('Contoh:');
      console.log('- User bayar 12 bulan di Sejoli: 10 Des 2024');
      console.log('- Migrasi ke web baru: 16 Des 2025');
      console.log('- Script set endDate: 10 Des 2025 ❌ (sudah lewat 6 hari!)');
      console.log('- Seharusnya: User masih punya sisa membership\n');
      console.log('REKOMENDASI: Jalankan script fix-membership-expiry.js untuk memperbaiki.');
    } else {
      console.log('\n✅ Semua membership dates sudah benar!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembershipExpiry();
