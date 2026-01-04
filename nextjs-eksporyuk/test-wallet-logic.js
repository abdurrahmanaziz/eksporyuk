const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function testWalletLogic() {
  const userId = 'cmjmtotzh001eitz0kq029lk5'; // Abdurrahman Aziz
  
  console.log('=== TESTING NEW WALLET LOGIC ===');
  
  // Get affiliate profile
  const affiliateProfile = await p.affiliateProfile.findUnique({
    where: { userId }
  });
  
  if (!affiliateProfile) {
    console.log('No affiliate profile found');
    await p.$disconnect();
    return;
  }
  
  // Calculate affiliate earnings by status
  const totalConversions = await p.affiliateConversion.aggregate({
    where: { affiliateId: affiliateProfile.id },
    _sum: { commissionAmount: true },
    _count: true
  });
  
  const paidConversions = await p.affiliateConversion.aggregate({
    where: { 
      affiliateId: affiliateProfile.id,
      paidOut: true 
    },
    _sum: { commissionAmount: true },
    _count: true
  });
  
  const pendingConversions = await p.affiliateConversion.aggregate({
    where: { 
      affiliateId: affiliateProfile.id,
      paidOut: false 
    },
    _sum: { commissionAmount: true },
    _count: true
  });
  
  const affiliateEarnings = Number(totalConversions._sum.commissionAmount || 0);
  const affiliatePaidEarnings = Number(paidConversions._sum.commissionAmount || 0);
  const affiliatePendingEarnings = Number(pendingConversions._sum.commissionAmount || 0);
  
  console.log('');
  console.log('=== BREAKDOWN ===');
  console.log('Total Conversions:', totalConversions._count, '= Rp', affiliateEarnings.toLocaleString('id-ID'));
  console.log('Paid Conversions:', paidConversions._count, '= Rp', affiliatePaidEarnings.toLocaleString('id-ID'));
  console.log('Pending Conversions:', pendingConversions._count, '= Rp', affiliatePendingEarnings.toLocaleString('id-ID'));
  
  console.log('');
  console.log('=== NEW WALLET LOGIC ===');
  console.log('Saldo (Available):', 'Rp', affiliatePendingEarnings.toLocaleString('id-ID'));
  console.log('Total Penghasilan:', 'Rp', affiliateEarnings.toLocaleString('id-ID'));
  console.log('Total Penarikan:', 'Rp', affiliatePaidEarnings.toLocaleString('id-ID'));
  
  console.log('');
  console.log('=== VERIFICATION ===');
  console.log('Check: Pending + Paid = Total?');
  console.log(affiliatePendingEarnings + affiliatePaidEarnings, '==', affiliateEarnings, '?', 
    (affiliatePendingEarnings + affiliatePaidEarnings) === affiliateEarnings);
  
  await p.$disconnect();
}

testWalletLogic();