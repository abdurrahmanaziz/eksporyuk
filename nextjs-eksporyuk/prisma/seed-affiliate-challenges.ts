import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Seeding Complete Affiliate Challenges System...')
  console.log('')

  // Get available products
  const memberships = await prisma.membership.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
    take: 3
  })

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    take: 3
  })

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    take: 3
  })

  console.log('📦 Produk yang ditemukan:')
  console.log(`   - Memberships: ${memberships.length} (${memberships.map(m => m.name).join(', ') || 'tidak ada'})`)
  console.log(`   - Products: ${products.length} (${products.map(p => p.name).join(', ') || 'tidak ada'})`)
  console.log(`   - Courses: ${courses.length} (${courses.map(c => c.title).join(', ') || 'tidak ada'})`)
  console.log('')

  const now = new Date()
  const challenges = []

  // ============================================
  // CHALLENGE 1: Penjualan Membership Mingguan
  // ============================================
  const membership1 = memberships[0]
  const challenge1 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-weekly-membership-sales' },
    update: {
      membershipId: membership1?.id || null,
      title: membership1 
        ? `Flash Sale: Jual 5 ${membership1.name}!`
        : 'Flash Sale: Jual 5 Membership!',
      description: membership1 
        ? `🔥 Tantangan Mingguan! Raih 5 penjualan ${membership1.name} dalam 7 hari. Setiap penjualan = 1 poin. Capai target dan klaim bonus Rp 150.000!`
        : '🔥 Tantangan Mingguan! Raih 5 penjualan membership dalam 7 hari untuk mendapatkan bonus Rp 150.000!',
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-weekly-membership-sales',
      title: membership1 
        ? `Flash Sale: Jual 5 ${membership1.name}!`
        : 'Flash Sale: Jual 5 Membership!',
      description: membership1 
        ? `🔥 Tantangan Mingguan! Raih 5 penjualan ${membership1.name} dalam 7 hari. Setiap penjualan = 1 poin. Capai target dan klaim bonus Rp 150.000!`
        : '🔥 Tantangan Mingguan! Raih 5 penjualan membership dalam 7 hari untuk mendapatkan bonus Rp 150.000!',
      targetType: 'SALES_COUNT',
      targetValue: 5,
      rewardType: 'BONUS_COMMISSION',
      rewardValue: 150000,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      membershipId: membership1?.id || null,
    }
  })
  challenges.push({ ...challenge1, productName: membership1?.name || 'Semua Membership' })
  console.log('✅ Challenge 1: Flash Sale Membership')

  // ============================================
  // CHALLENGE 2: Revenue Hunter Bulanan
  // ============================================
  const challenge2 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-monthly-revenue-hunter' },
    update: {
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-monthly-revenue-hunter',
      title: '💰 Revenue Hunter: Rp 5 Juta!',
      description: '🏆 Capai total penjualan Rp 5.000.000 dari SEMUA produk dalam 1 bulan. Revenue dari membership, produk digital, dan kelas semuanya dihitung. Naik tier = komisi lebih besar!',
      targetType: 'REVENUE',
      targetValue: 5000000,
      rewardType: 'TIER_UPGRADE',
      rewardValue: 1,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      // Tidak ada product link = berlaku untuk semua produk
    }
  })
  challenges.push({ ...challenge2, productName: 'Semua Produk' })
  console.log('✅ Challenge 2: Revenue Hunter')

  // ============================================
  // CHALLENGE 3: New Customer Acquisition
  // ============================================
  const membership2 = memberships[1] || memberships[0]
  const challenge3 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-new-customers' },
    update: {
      membershipId: membership2?.id || null,
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-new-customers',
      title: '👥 Customer Hunter: 10 Pembeli Baru!',
      description: membership2
        ? `🎯 Rekrut 10 pembeli baru untuk ${membership2.name} dalam 2 minggu! Fokus pada prospek yang belum pernah beli. Setiap pembeli baru = 1 poin. Bonus cash Rp 200.000!`
        : '🎯 Rekrut 10 pembeli baru dalam 2 minggu! Fokus pada prospek yang belum pernah beli. Bonus cash Rp 200.000!',
      targetType: 'NEW_CUSTOMERS',
      targetValue: 10,
      rewardType: 'CASH_BONUS',
      rewardValue: 200000,
      startDate: now,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
      membershipId: membership2?.id || null,
    }
  })
  challenges.push({ ...challenge3, productName: membership2?.name || 'Semua Membership' })
  console.log('✅ Challenge 3: Customer Hunter')

  // ============================================
  // CHALLENGE 4: Conversion Master (Produk Digital)
  // ============================================
  const product1 = products[0]
  const challenge4 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-conversion-master' },
    update: {
      productId: product1?.id || null,
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-conversion-master',
      title: '🎯 Conversion Master: 15 Sales!',
      description: product1
        ? `📈 Buktikan skill marketing-mu! Capai 15 penjualan "${product1.name}" dalam 3 minggu. Setiap penjualan = 1 konversi. Bonus Rp 300.000 untuk yang berhasil!`
        : '📈 Buktikan skill marketing-mu! Capai 15 konversi penjualan produk dalam 3 minggu. Bonus Rp 300.000!',
      targetType: 'CONVERSIONS',
      targetValue: 15,
      rewardType: 'BONUS_COMMISSION',
      rewardValue: 300000,
      startDate: now,
      endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      isActive: true,
      productId: product1?.id || null,
    }
  })
  challenges.push({ ...challenge4, productName: product1?.name || 'Semua Produk Digital' })
  console.log('✅ Challenge 4: Conversion Master')

  // ============================================
  // CHALLENGE 5: Course Champion (Kelas Online)
  // ============================================
  const course1 = courses[0]
  const challenge5 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-course-champion' },
    update: {
      courseId: course1?.id || null,
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-course-champion',
      title: '📚 Course Champion: 8 Pendaftar!',
      description: course1
        ? `🏅 Promosikan kelas "${course1.title}" dan dapatkan 8 pendaftar dalam 2 minggu! Setiap pendaftar = 1 poin. Reward: Naik Tier!`
        : '🏅 Promosikan kelas online dan dapatkan 8 pendaftar dalam 2 minggu! Reward: Naik Tier!',
      targetType: 'SALES_COUNT',
      targetValue: 8,
      rewardType: 'TIER_UPGRADE',
      rewardValue: 1,
      startDate: now,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
      courseId: course1?.id || null,
    }
  })
  challenges.push({ ...challenge5, productName: course1?.title || 'Semua Kelas' })
  console.log('✅ Challenge 5: Course Champion')

  // ============================================
  // CHALLENGE 6: Super Seller (Revenue Tinggi)
  // ============================================
  const membership3 = memberships[2] || memberships[0]
  const challenge6 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-super-seller' },
    update: {
      membershipId: membership3?.id || null,
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-super-seller',
      title: '⭐ Super Seller: Rp 10 Juta Revenue!',
      description: membership3
        ? `🌟 Challenge Level Master! Capai revenue Rp 10.000.000 dari penjualan ${membership3.name} dalam 1 bulan. Reward: Bonus komisi Rp 500.000 + Naik Tier!`
        : '🌟 Challenge Level Master! Capai revenue Rp 10.000.000 dalam 1 bulan. Reward: Bonus komisi Rp 500.000!',
      targetType: 'REVENUE',
      targetValue: 10000000,
      rewardType: 'BONUS_COMMISSION',
      rewardValue: 500000,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
      membershipId: membership3?.id || null,
    }
  })
  challenges.push({ ...challenge6, productName: membership3?.name || 'Semua Membership' })
  console.log('✅ Challenge 6: Super Seller')

  // ============================================
  // CHALLENGE 7: Quick Start (Untuk Affiliate Baru)
  // ============================================
  const challenge7 = await prisma.affiliateChallenge.upsert({
    where: { id: 'challenge-quick-start' },
    update: {
      isActive: true,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'challenge-quick-start',
      title: '🚀 Quick Start: Penjualan Pertama!',
      description: '🎉 Baru jadi affiliate? Tantangan ini untuk kamu! Capai 3 penjualan APAPUN dalam minggu pertama. Semua produk dihitung. Bonus Rp 50.000 untuk memotivasi start-mu!',
      targetType: 'SALES_COUNT',
      targetValue: 3,
      rewardType: 'BONUS_COMMISSION',
      rewardValue: 50000,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      // No product link = all products
    }
  })
  challenges.push({ ...challenge7, productName: 'Semua Produk' })
  console.log('✅ Challenge 7: Quick Start')

  // ============================================
  // SUMMARY
  // ============================================
  console.log('')
  console.log('=' .repeat(60))
  console.log('🎉 AFFILIATE CHALLENGES SEEDING COMPLETE!')
  console.log('=' .repeat(60))
  console.log('')
  console.log('📋 Daftar Challenge Aktif:')
  console.log('')
  
  for (let i = 0; i < challenges.length; i++) {
    const c = challenges[i]
    const typeEmoji = {
      'SALES_COUNT': '🛒',
      'REVENUE': '💰',
      'CONVERSIONS': '📊',
      'NEW_CUSTOMERS': '👥',
      'CLICKS': '👆'
    }[c.targetType] || '🎯'
    
    const rewardEmoji = {
      'BONUS_COMMISSION': '💵',
      'TIER_UPGRADE': '⬆️',
      'CASH_BONUS': '💸'
    }[c.rewardType] || '🎁'

    console.log(`${i + 1}. ${c.title}`)
    console.log(`   ${typeEmoji} Target: ${c.targetType} (${c.targetValue.toLocaleString()})`)
    console.log(`   ${rewardEmoji} Reward: ${c.rewardType} (Rp ${Number(c.rewardValue).toLocaleString()})`)
    console.log(`   📦 Produk: ${c.productName}`)
    console.log(`   ⏰ Berakhir: ${new Date(c.endDate).toLocaleDateString('id-ID')}`)
    console.log('')
  }

  console.log('💡 Tips:')
  console.log('   - Affiliate harus KLIK "Ikuti Challenge" untuk bergabung')
  console.log('   - Progress terupdate otomatis saat ada konversi/penjualan')
  console.log('   - Reward bisa diklaim setelah challenge selesai')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding challenges:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
