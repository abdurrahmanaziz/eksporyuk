const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRahmat() {
  // Find Rahmat Al Fianto
  const rahmat = await prisma.user.findFirst({
    where: { name: { contains: 'Rahmat Al Fianto', mode: 'insensitive' } },
    include: { affiliateProfile: true }
  });
  
  if (!rahmat || !rahmat.affiliateProfile) {
    console.log('Rahmat Al Fianto tidak punya affiliate profile');
    await prisma.$disconnect();
    return;
  }
  
  console.log('=== Rahmat Al Fianto Commission Analysis ===\n');
  console.log('User:', rahmat.name);
  console.log('Email:', rahmat.email);
  console.log('Affiliate Code:', rahmat.affiliateProfile.affiliateCode);
  
  // Get all conversions
  const conversions = await prisma.affiliateConversion.findMany({
    where: { affiliateId: rahmat.affiliateProfile.id },
    include: {
      transaction: {
        select: { 
          invoiceNumber: true, 
          amount: true,
          metadata: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('\nTotal Sales:', conversions.length);
  
  // Calculate totals
  let totalCommission = 0;
  for (const c of conversions) {
    totalCommission += Number(c.commissionAmount || 0);
  }
  
  console.log('Total Commission (ALL TIME):', 'Rp', totalCommission.toLocaleString('id-ID'));
  
  // Monthly breakdown
  const months = {
    'Dec 2025': { start: new Date('2025-12-01'), end: new Date('2025-12-31'), count: 0, total: 0 },
    'Nov 2025': { start: new Date('2025-11-01'), end: new Date('2025-11-30'), count: 0, total: 0 },
    'Oct 2025': { start: new Date('2025-10-01'), end: new Date('2025-10-31'), count: 0, total: 0 }
  };
  
  for (const c of conversions) {
    const date = new Date(c.createdAt);
    const comm = Number(c.commissionAmount || 0);
    
    for (const [monthName, monthData] of Object.entries(months)) {
      if (date >= monthData.start && date <= monthData.end) {
        monthData.count++;
        monthData.total += comm;
        break;
      }
    }
  }
  
  console.log('\n=== Monthly Breakdown ===');
  for (const [monthName, data] of Object.entries(months)) {
    console.log(monthName + ':', data.count, 'sales | Rp', data.total.toLocaleString('id-ID'));
  }
  
  // Sample recent transactions
  console.log('\n=== Recent 15 Transactions ===');
  for (const c of conversions.slice(0, 15)) {
    const pn = c.transaction?.metadata?.productName || 'Unknown';
    const amt = Number(c.transaction?.amount || 0);
    const comm = Number(c.commissionAmount || 0);
    const pct = amt > 0 ? (comm / amt * 100).toFixed(1) : 0;
    const date = new Date(c.createdAt).toLocaleDateString('id-ID');
    console.log('\n' + date + ' | ' + c.transaction?.invoiceNumber);
    console.log('  Product:', pn);
    console.log('  Amount: Rp', amt.toLocaleString('id-ID'));
    console.log('  Commission: Rp', comm.toLocaleString('id-ID'), '(' + pct + '%)');
  }
  
  // Compare with screenshot
  console.log('\n=== Comparison with Screenshot ===');
  console.log('Screenshot shows:');
  console.log('  All Time: Rp 172.295.000');
  console.log('  Oct 2025: Rp 11.025.000');
  console.log('  Nov 2025: Rp 7.125.000');
  console.log('  Dec 2025: Rp 5.825.000');
  console.log('\nActual in Database:');
  console.log('  All Time: Rp', totalCommission.toLocaleString('id-ID'));
  console.log('  Oct 2025: Rp', months['Oct 2025'].total.toLocaleString('id-ID'));
  console.log('  Nov 2025: Rp', months['Nov 2025'].total.toLocaleString('id-ID'));
  console.log('  Dec 2025: Rp', months['Dec 2025'].total.toLocaleString('id-ID'));
  
  console.log('\nDiscrepancy:');
  console.log('  All Time:', totalCommission === 172295000 ? '✅ MATCH' : '❌ DIFFERENT (Rp ' + (172295000 - totalCommission).toLocaleString('id-ID') + ')');
  console.log('  Oct 2025:', months['Oct 2025'].total === 11025000 ? '✅ MATCH' : '❌ DIFFERENT');
  console.log('  Nov 2025:', months['Nov 2025'].total === 7125000 ? '✅ MATCH' : '❌ DIFFERENT');
  console.log('  Dec 2025:', months['Dec 2025'].total === 5825000 ? '✅ MATCH' : '❌ DIFFERENT');
  
  await prisma.$disconnect();
}

checkRahmat().catch(console.error);
