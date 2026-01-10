const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeConversions(conversions) {
  console.log('\n=== Conversion Analysis ===');
  console.log('Total conversions:', conversions.length);
  
  // Check for duplicates by transactionId
  const txIds = conversions.map(c => c.transactionId);
  const uniqueTxIds = new Set(txIds);
  console.log('Unique transaction IDs:', uniqueTxIds.size);
  console.log('DUPLICATE transactions:', txIds.length - uniqueTxIds.size);
  
  // Sum commissions
  let totalCommission = 0;
  for (const c of conversions) {
    totalCommission += Number(c.commissionAmount || 0);
  }
  console.log('Total commission:', 'Rp', totalCommission.toLocaleString('id-ID'));
  
  // Sample conversions
  console.log('\nSample conversions (first 15):');
  for (const c of conversions.slice(0, 15)) {
    const pn = c.transaction?.metadata?.productName || 'Unknown';
    console.log('  Invoice:', c.transaction?.invoiceNumber, '| Rp', Number(c.commissionAmount).toLocaleString('id-ID'), '| Product:', pn);
  }
  
  // Check commission amounts distribution
  const commissionDist = {};
  for (const c of conversions) {
    const amt = Number(c.commissionAmount);
    commissionDist[amt] = (commissionDist[amt] || 0) + 1;
  }
  
  console.log('\nCommission distribution (top 15):');
  const sorted = Object.entries(commissionDist).sort((a, b) => Number(b[0]) - Number(a[0]));
  for (const [amt, count] of sorted.slice(0, 15)) {
    console.log('  Rp', Number(amt).toLocaleString('id-ID'), ':', count, 'times');
  }
  
  // Find duplicate transaction IDs
  if (txIds.length > uniqueTxIds.size) {
    console.log('\n=== Finding Duplicate Transactions ===');
    const txIdCount = {};
    for (const id of txIds) {
      txIdCount[id] = (txIdCount[id] || 0) + 1;
    }
    
    const duplicates = Object.entries(txIdCount).filter(([id, count]) => count > 1);
    console.log('Number of duplicated transaction IDs:', duplicates.length);
    
    console.log('\nSample duplicates (first 10):');
    for (const [txId, count] of duplicates.slice(0, 10)) {
      const tx = conversions.find(c => c.transactionId === txId)?.transaction;
      console.log('  TX:', tx?.invoiceNumber, '| Count:', count, '| Product:', tx?.metadata?.productName);
    }
  }
}

async function checkSutisna() {
  // Search for users with Sutisna in name
  const users = await prisma.user.findMany({
    where: { 
      name: { contains: 'Sutisna', mode: 'insensitive' }
    },
    include: { affiliateProfile: true }
  });
  
  console.log('=== Users with Sutisna in name ===');
  for (const u of users) {
    console.log('Name:', u.name);
    console.log('Email:', u.email);
    console.log('Has affiliate profile:', u.affiliateProfile ? 'YES' : 'NO');
    if (u.affiliateProfile) {
      console.log('Affiliate ID:', u.affiliateProfile.id);
    }
    console.log('---');
  }
  
  // Check transactions with Sutisna in affiliateName
  const txWithSutisna = await prisma.transaction.findMany({
    where: {
      metadata: {
        path: ['affiliateName'],
        string_contains: 'Sutisna'
      }
    },
    select: { id: true, metadata: true }
  });
  
  console.log('\nTransactions with Sutisna as affiliate:', txWithSutisna.length);
  
  // Get unique affiliate names
  const affiliateNames = new Set();
  for (const tx of txWithSutisna) {
    if (tx.metadata?.affiliateName) {
      affiliateNames.add(tx.metadata.affiliateName);
    }
  }
  
  console.log('Unique affiliate names with Sutisna:');
  for (const name of affiliateNames) {
    console.log('  -', name);
  }
  
  // If no affiliate profile found, stop here
  const sutisna = users.find(u => u.affiliateProfile);
  if (!sutisna?.affiliateProfile) {
    console.log('\nNo user with Sutisna name has affiliate profile!');
    
    // Check conversions anyway
    const allConversions = await prisma.affiliateConversion.findMany({
      include: {
        affiliate: {
          include: { user: true }
        },
        transaction: {
          select: { metadata: true }
        }
      }
    });
    
    const sutisnaConversions = allConversions.filter(c => 
      c.transaction?.metadata?.affiliateName?.includes('Sutisna')
    );
    
    console.log('\nConversions with Sutisna in metadata:', sutisnaConversions.length);
    
    if (sutisnaConversions.length > 0) {
      const affiliateUser = sutisnaConversions[0].affiliate.user;
      console.log('Linked to user:', affiliateUser.name);
      console.log('Affiliate ID:', sutisnaConversions[0].affiliateId);
      
      // Continue analysis with this affiliate
      const conversions = await prisma.affiliateConversion.findMany({
        where: { affiliateId: sutisnaConversions[0].affiliateId },
        include: {
          transaction: {
            select: { 
              id: true, 
              invoiceNumber: true, 
              amount: true,
              metadata: true
            }
          }
        }
      });
      
      await analyzeConversions(conversions);
    }
    
    await prisma.$disconnect();
    return;
  }
  
  // Get all conversions for Sutisna
  const conversions = await prisma.affiliateConversion.findMany({
    where: { affiliateId: sutisna.affiliateProfile.id },
    include: {
      transaction: {
        select: { 
          id: true, 
          invoiceNumber: true, 
          amount: true,
          metadata: true
        }
      }
    }
  });
  
  await analyzeConversions(conversions);
  await prisma.$disconnect();
}

checkSutisna().catch(console.error);
