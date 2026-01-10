const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSutisnaCommission() {
  try {
    console.log('=== CHECKING SUTISNA COMMISSION ISSUE ===\n');
    
    // 1. Cari user Sutisna yang spesifik
    const user = await prisma.user.findFirst({
      where: { 
        email: 'azzka42@gmail.com',
        name: 'Sutisna'
      },
      include: {
        affiliateProfile: true
      }
    });
    
    if (!user) {
      console.log('❌ User Sutisna tidak ditemukan');
      return;
    }
    
    console.log('✅ USER DITEMUKAN');
    console.log('Nama:', user.name);
    console.log('Email:', user.email);
    console.log('User ID:', user.id);
    
    if (user.affiliateProfile) {
      console.log('\n=== AFFILIATE PROFILE ===');
      console.log('Affiliate Code:', user.affiliateProfile.affiliateCode);
      console.log('Total Earnings:', `Rp ${Number(user.affiliateProfile.totalEarnings).toLocaleString('id-ID')}`);
      console.log('Total Sales:', `Rp ${Number(user.affiliateProfile.totalSales).toLocaleString('id-ID')}`);
      console.log('Total Conversions:', user.affiliateProfile.totalConversions);
      console.log('Status:', user.affiliateProfile.isActive ? 'Aktif' : 'Nonaktif');
    }
    
    // 2. Cek wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id }
    });
    
    console.log('\n=== WALLET ===');
    if (wallet) {
      console.log('Balance:', `Rp ${Number(wallet.balance).toLocaleString('id-ID')}`);
      console.log('Balance Pending:', `Rp ${Number(wallet.balancePending).toLocaleString('id-ID')}`);
      console.log('Total Earnings:', `Rp ${Number(wallet.totalEarnings).toLocaleString('id-ID')}`);
      console.log('Total Payout:', `Rp ${Number(wallet.totalPayout).toLocaleString('id-ID')}`);
    } else {
      console.log('❌ Wallet tidak ditemukan');
    }
    
    // 3. Cek produk legalitas
    const legalitasProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'legalitas', mode: 'insensitive' } },
          { name: { contains: 'legal', mode: 'insensitive' } },
          { name: { contains: 'pengurusan', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log('\n=== PRODUK LEGALITAS ===');
    console.log(`Ditemukan ${legalitasProducts.length} produk:`);
    legalitasProducts.forEach((p, i) => {
      console.log(`${i+1}. ${p.name}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Price: Rp ${Number(p.price).toLocaleString('id-ID')}`);
      console.log(`   Affiliate Rate: ${p.affiliateCommissionRate}%`);
      console.log(`   Commission Type: ${p.affiliateCommissionType}`);
      console.log('');
    });
    
    // 4. Cek transaksi affiliate conversions
    if (user.affiliateProfile) {
      const conversions = await prisma.affiliateConversion.findMany({
        where: { affiliateId: user.affiliateProfile.id },
        include: {
          transaction: {
            include: {
              product: true,
              membership: true
            }
          }
        },
        orderBy: { commissionAmount: 'desc' },
        take: 15
      });
      
      console.log('\n=== TOP 15 CONVERSIONS BY COMMISSION ===');
      console.log(`Total conversions: ${conversions.length}`);
      
      let totalCommissionFromConversions = 0;
      conversions.forEach((conv, i) => {
        const commission = Number(conv.commissionAmount);
        totalCommissionFromConversions += commission;
        
        console.log(`${i+1}. Transaction: ${conv.transactionId}`);
        console.log(`   Commission: Rp ${commission.toLocaleString('id-ID')}`);
        console.log(`   Status: ${conv.status}`);
        console.log(`   Product: ${conv.transaction?.product?.name || conv.transaction?.membership?.name || 'N/A'}`);
        console.log(`   Transaction Amount: Rp ${Number(conv.transaction?.amount || 0).toLocaleString('id-ID')}`);
        console.log(`   Date: ${conv.createdAt.toLocaleDateString('id-ID')}`);
        console.log('');
      });
      
      console.log(`TOTAL COMMISSION FROM TOP 15: Rp ${totalCommissionFromConversions.toLocaleString('id-ID')}`);
      
      // 5. Khusus cek transaksi produk legalitas
      if (legalitasProducts.length > 0) {
        const legalitasConversions = await prisma.affiliateConversion.findMany({
          where: {
            affiliateId: user.affiliateProfile.id,
            transaction: {
              productId: { in: legalitasProducts.map(p => p.id) }
            }
          },
          include: {
            transaction: {
              include: { product: true }
            }
          },
          orderBy: { commissionAmount: 'desc' }
        });
        
        console.log('\n=== CONVERSIONS PRODUK LEGALITAS ===');
        console.log(`Total: ${legalitasConversions.length} transaksi`);
        
        if (legalitasConversions.length > 0) {
          let totalLegalitasCommission = 0;
          
          legalitasConversions.forEach((conv, i) => {
            const commission = Number(conv.commissionAmount);
            totalLegalitasCommission += commission;
            
            console.log(`${i+1}. ${conv.transaction?.product?.name}`);
            console.log(`   Transaction ID: ${conv.transactionId}`);
            console.log(`   Amount: Rp ${Number(conv.transaction?.amount).toLocaleString('id-ID')}`);
            console.log(`   Commission: Rp ${commission.toLocaleString('id-ID')}`);
            console.log(`   Status: ${conv.status}`);
            console.log(`   Date: ${conv.createdAt.toLocaleDateString('id-ID')}`);
            
            // Hitung manual berdasarkan produk
            const product = conv.transaction?.product;
            if (product) {
              const expectedCommission = Number(conv.transaction?.amount) * (Number(product.affiliateCommissionRate) / 100);
              if (Math.abs(commission - expectedCommission) > 1) {
                console.log(`   ⚠️  POTENTIAL ISSUE: Expected ${expectedCommission.toLocaleString('id-ID')}, Got ${commission.toLocaleString('id-ID')}`);
              }
            }
            console.log('');
          });
          
          console.log(`🎯 TOTAL KOMISI LEGALITAS: Rp ${totalLegalitasCommission.toLocaleString('id-ID')}`);
          
          // Cek apakah ada yang sekitar 70 juta
          const seventyMillion = 70000000;
          const problematicConversions = legalitasConversions.filter(c => {
            const comm = Number(c.commissionAmount);
            return comm >= seventyMillion - 5000000 && comm <= seventyMillion + 5000000;
          });
          
          if (problematicConversions.length > 0) {
            console.log('\n🚨 FOUND CONVERSIONS AROUND 70 MILLION:');
            problematicConversions.forEach(conv => {
              console.log(`- Transaction ${conv.transactionId}: Rp ${Number(conv.commissionAmount).toLocaleString('id-ID')}`);
              console.log(`  Product: ${conv.transaction?.product?.name}`);
            });
          }
        } else {
          console.log('❌ Tidak ada conversion untuk produk legalitas');
        }
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Total Earnings (AffiliateProfile): Rp ${Number(user.affiliateProfile?.totalEarnings || 0).toLocaleString('id-ID')}`);
    console.log(`Wallet Balance: Rp ${Number(wallet?.balance || 0).toLocaleString('id-ID')}`);
    console.log(`Wallet Total Earnings: Rp ${Number(wallet?.totalEarnings || 0).toLocaleString('id-ID')}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSutisnaCommission();