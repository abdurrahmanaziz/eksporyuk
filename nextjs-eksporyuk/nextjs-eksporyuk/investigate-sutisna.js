const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigate() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'azzka42@gmail.com' },
      include: { affiliateProfile: true }
    });
    
    console.log('=== INVESTIGATING SUTISNA COMMISSION ===');
    console.log('User:', user.name, '| Total Earnings:', Number(user.affiliateProfile.totalEarnings).toLocaleString('id-ID'));
    
    // Cek semua produk yang ada
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'legal', mode: 'insensitive' } },
          { name: { contains: 'surat', mode: 'insensitive' } },
          { name: { contains: 'ijin', mode: 'insensitive' } },
          { name: { contains: 'pengurusan', mode: 'insensitive' } },
          { name: { contains: 'badan usaha', mode: 'insensitive' } },
          { name: { contains: 'pt', mode: 'insensitive' } },
          { name: { contains: 'cv', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log('\n=== PRODUK TERKAIT LEGALITAS ===');
    console.log('Total:', products.length);
    products.forEach(p => {
      console.log(`- ${p.name}`);
      console.log(`  Price: Rp ${Number(p.price).toLocaleString('id-ID')}`);
      console.log(`  Affiliate Rate: ${p.affiliateCommissionRate}%`);
      console.log('');
    });
    
    // Cek semua affiliate conversions
    const allConversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: user.affiliateProfile.id },
      include: {
        transaction: {
          include: {
            product: true,
            membership: true
          }
        }
      },
      orderBy: { commissionAmount: 'desc' }
    });
    
    console.log('\n=== ALL CONVERSIONS ANALYSIS ===');
    console.log('Total conversions:', allConversions.length);
    
    // Group by commission amount
    const commissionGroups = {};
    allConversions.forEach(conv => {
      const amount = Number(conv.commissionAmount);
      const key = Math.floor(amount / 1000000) * 1000000; // Group by millions
      if (!commissionGroups[key]) {
        commissionGroups[key] = [];
      }
      commissionGroups[key].push(conv);
    });
    
    console.log('\n=== COMMISSION GROUPS ===');
    Object.keys(commissionGroups).sort((a, b) => Number(b) - Number(a)).forEach(group => {
      const amount = Number(group);
      const count = commissionGroups[group].length;
      console.log(`Rp ${amount.toLocaleString('id-ID')} - ${(amount + 999999).toLocaleString('id-ID')}: ${count} conversions`);
    });
    
    // Cek conversions dengan komisi besar (di atas 1 juta)
    const bigCommissions = allConversions.filter(c => Number(c.commissionAmount) >= 1000000);
    console.log(`\n🎯 CONVERSIONS > Rp 1 JUTA: ${bigCommissions.length}`);
    
    bigCommissions.slice(0, 10).forEach((conv, i) => {
      console.log(`${i+1}. Commission: Rp ${Number(conv.commissionAmount).toLocaleString('id-ID')}`);
      console.log(`   Transaction: ${conv.transactionId}`);
      console.log(`   Amount: Rp ${Number(conv.transaction?.amount || 0).toLocaleString('id-ID')}`);
      console.log(`   Product: ${conv.transaction?.product?.name || 'N/A'}`);
      console.log(`   Membership: ${conv.transaction?.membership?.name || 'N/A'}`);
      console.log(`   Date: ${conv.createdAt?.toLocaleDateString('id-ID')}`);
      console.log('');
    });
    
    // Cari yang sekitar 70 juta
    const seventyMillionRange = allConversions.filter(c => {
      const amount = Number(c.commissionAmount);
      return amount >= 65000000 && amount <= 75000000; // Range 65-75 juta
    });
    
    if (seventyMillionRange.length > 0) {
      console.log('\n🚨 FOUND CONVERSIONS AROUND 70 MILLION:');
      seventyMillionRange.forEach(conv => {
        console.log(`- Transaction ${conv.transactionId}`);
        console.log(`  Commission: Rp ${Number(conv.commissionAmount).toLocaleString('id-ID')}`);
        console.log(`  Transaction Amount: Rp ${Number(conv.transaction?.amount || 0).toLocaleString('id-ID')}`);
        console.log(`  Product: ${conv.transaction?.product?.name || 'N/A'}`);
        console.log(`  Membership: ${conv.transaction?.membership?.name || 'N/A'}`);
        console.log(`  Date: ${conv.createdAt?.toLocaleDateString('id-ID')}`);
        console.log('');
      });
    }
    
    // Hitung total komisi
    const totalCommissionFromConversions = allConversions.reduce((sum, conv) => sum + Number(conv.commissionAmount), 0);
    console.log('\n=== TOTALS ===');
    console.log('Total Commission dari Conversions:', 'Rp', totalCommissionFromConversions.toLocaleString('id-ID'));
    console.log('Total Earnings di Profile:', 'Rp', Number(user.affiliateProfile.totalEarnings).toLocaleString('id-ID'));
    console.log('Selisih:', 'Rp', (Number(user.affiliateProfile.totalEarnings) - totalCommissionFromConversions).toLocaleString('id-ID'));
    
    // Create wallet if not exists
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });
    
    if (!wallet) {
      console.log('\n⚠️  CREATING MISSING WALLET...');
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          balancePending: 0,
          totalEarnings: Number(user.affiliateProfile.totalEarnings),
          totalPayout: 0
        }
      });
      console.log('✅ Wallet created');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigate();