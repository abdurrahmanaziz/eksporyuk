const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetailedMembershipCalc() {
  console.log('🔍 Detailed Membership Calculation Check\n');

  try {
    // Get sample 6 and 12 month memberships
    const samples = await prisma.userMembership.findMany({
      where: {
        transaction: {
          invoiceNumber: { startsWith: 'INV' }
        },
        membership: {
          duration: {
            in: ['SIX_MONTHS', 'TWELVE_MONTHS']
          }
        }
      },
      take: 10,
      include: {
        user: { select: { email: true } },
        membership: { select: { name: true, duration: true } },
        transaction: {
          select: { 
            invoiceNumber: true, 
            paidAt: true, 
            createdAt: true,
            metadata: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Checking ${samples.length} sample memberships (6 & 12 bulan)\n`);
    console.log('═'.repeat(100) + '\n');

    const now = new Date();

    samples.forEach((um, idx) => {
      const paidAt = um.transaction.paidAt ? new Date(um.transaction.paidAt) : new Date(um.transaction.createdAt);
      const startDate = new Date(um.startDate);
      const endDate = new Date(um.endDate);
      
      const monthsDuration = um.membership.duration === 'SIX_MONTHS' ? 6 : 12;
      
      // Calculate what endDate SHOULD be from paidAt
      const calculatedEndDate = new Date(paidAt);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + monthsDuration);
      
      // Calculate remaining days
      const totalDays = Math.floor((endDate - paidAt) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.floor((now - paidAt) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
      const remainingMonths = (remainingDays / 30).toFixed(1);

      console.log(`${idx + 1}. ${um.transaction.invoiceNumber} - ${um.user.email}`);
      console.log(`   Tier: ${um.membership.name} (${monthsDuration} bulan)`);
      console.log(`   Paid At: ${paidAt.toLocaleDateString('id-ID')} ${paidAt.toLocaleTimeString('id-ID')}`);
      console.log(`   Start Date: ${startDate.toLocaleDateString('id-ID')}`);
      console.log(`   End Date: ${endDate.toLocaleDateString('id-ID')}`);
      console.log(`   Calculated End: ${calculatedEndDate.toLocaleDateString('id-ID')}`);
      console.log(`   Match: ${endDate.toDateString() === calculatedEndDate.toDateString() ? '✅ YES' : '❌ NO'}`);
      console.log(`   `);
      console.log(`   📊 Timeline:`);
      console.log(`   - Total Duration: ${totalDays} hari (~${monthsDuration} bulan)`);
      console.log(`   - Elapsed Since Payment: ${elapsedDays} hari`);
      console.log(`   - Remaining: ${remainingDays} hari (~${remainingMonths} bulan)`);
      console.log(`   - Progress: ${((elapsedDays / totalDays) * 100).toFixed(1)}% terpakai`);
      
      if (remainingDays < 0) {
        console.log(`   ❌ STATUS: EXPIRED ${Math.abs(remainingDays)} hari lalu!`);
      } else if (remainingDays <= 30) {
        console.log(`   ⚠️ STATUS: Expiring soon (${remainingDays} hari lagi)`);
      } else {
        console.log(`   ✅ STATUS: Active`);
      }
      console.log('');
    });

    console.log('═'.repeat(100));
    console.log('\n📝 KESIMPULAN:\n');
    console.log('Jika "Paid At" adalah tanggal bayar di Sejoli (misalnya Des 2024),');
    console.log('dan sekarang sudah Des 2025, maka:');
    console.log('');
    console.log('❌ MASALAH: User yang bayar 12 bulan di Des 2024 → End Date: Des 2025 (SUDAH HABIS!)');
    console.log('   Padahal mereka seharusnya masih punya sisa waktu jika mereka baru mulai');
    console.log('   pakai membership di web baru pada Des 2025.');
    console.log('');
    console.log('✅ SOLUSI: Hitung dari SEKARANG (tanggal migrasi), bukan dari Paid At.');
    console.log('   Atau: Berikan mereka membership PENUH lagi (fresh start di web baru).');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetailedMembershipCalc();
