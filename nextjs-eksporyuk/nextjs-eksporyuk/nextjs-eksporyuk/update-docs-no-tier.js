const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateDocs() {
  console.log('🔄 Updating documentation to remove tier references...')

  // Update affiliate-overview
  const overviewContent = `# 📢 Sistem Affiliate EksporYuk

Selamat datang di dokumentasi lengkap **Affiliate Program EksporYuk**! Program ini dirancang untuk membantu Anda menghasilkan komisi dengan mempromosikan membership, produk, dan kursus EksporYuk.

## 🎯 Apa Itu Affiliate EksporYuk?

**Affiliate** adalah mitra promosi EksporYuk yang mendapatkan **komisi** setiap kali ada orang yang membeli membership, produk, atau kursus melalui **link referral** Anda.

### Keuntungan Menjadi Affiliate:

✅ **Komisi Kompetitif** - Dapatkan komisi dari setiap penjualan  
✅ **Dashboard Lengkap** - Tracking real-time klik & konversi  
✅ **Short Link Generator** - Bikin link keren (contoh: \`link.eksporyuk.com/dinda\`)  
✅ **Challenge & Reward** - Ikut tantangan, raih bonus  
✅ **Marketing Tools** - Bio page, optin form, email templates  
✅ **Mini CRM** - Kelola leads & follow-up otomatis  
✅ **Payout Fleksibel** - Tarik komisi kapan saja (min. Rp 100.000)

## 🔗 Jenis Link Affiliate

### 1. Affiliate Link (Standar)
Link default dengan kode affiliate Anda.

### 2. Short Link (Custom)
Link pendek yang lebih profesional dengan tracking lengkap.

### 3. Bio Page Link
Landing page all-in-one untuk affiliate dengan 5 template desain.

## 💰 Cara Kerja Komisi

1. Customer beli via link Anda
2. Sistem detect affiliate dari cookie/query string
3. Komisi langsung masuk wallet (withdrawable)
4. Tarik saldo minimal Rp 100.000

## 🚀 Quick Start

1. Daftar affiliate dari dashboard
2. Tunggu approval admin (1-2 hari)
3. Generate link pertama
4. Promosikan ke audience
5. Track performa di dashboard
6. Tarik komisi`

  await prisma.documentation.updateMany({
    where: { slug: 'affiliate-overview' },
    data: { 
      content: overviewContent,
      excerpt: 'Panduan lengkap untuk memahami program affiliate EksporYuk dari A sampai Z.'
    }
  })
  console.log('✅ Updated affiliate-overview')

  // Update affiliate-commission-payout
  const commissionContent = `# 💰 Komisi & Pembayaran

## Sistem Komisi

Setiap affiliate mendapatkan **komisi yang sama** untuk setiap transaksi yang berhasil melalui link referral mereka.

### Komisi Rate
- **Membership**: Sesuai pengaturan produk (biasanya 10-30%)
- **Produk Digital**: Sesuai pengaturan produk
- **Kursus**: Sesuai pengaturan produk

### Cara Penghitungan
\`\`\`
Harga Produk: Rp 1.000.000
Komisi Rate: 20%
--------------------------------
Komisi Anda: Rp 200.000
\`\`\`

## Revenue Split

Setiap transaksi dibagi sebagai berikut:
1. **Affiliate**: Komisi sesuai rate (langsung ke balance)
2. **Admin Fee**: 15% dari sisa
3. **Founder Share**: 60% dari sisa
4. **Co-Founder Share**: 40% dari sisa

## Wallet & Saldo

### Jenis Saldo
- **Balance**: Saldo yang bisa ditarik
- **Pending**: Menunggu approval admin

### Minimum Withdraw
- Minimal penarikan: **Rp 100.000**
- Proses: 1-3 hari kerja

## Cara Withdraw

1. Buka menu **Penarikan**
2. Pastikan saldo mencukupi
3. Pilih metode pembayaran (Bank Transfer)
4. Masukkan nominal
5. Submit request
6. Tunggu approval admin
7. Dana masuk ke rekening

## Tips Maksimalkan Komisi

1. **Promosi Konsisten** - Share link di berbagai platform
2. **Konten Berkualitas** - Review produk dengan jujur
3. **Follow Up Leads** - Gunakan CRM untuk tracking
4. **Ikut Challenge** - Bonus tambahan untuk achievers`

  await prisma.documentation.updateMany({
    where: { slug: 'affiliate-commission-payout' },
    data: { 
      content: commissionContent,
      excerpt: 'Pelajari cara kerja komisi affiliate dan cara menarik saldo.'
    }
  })
  console.log('✅ Updated affiliate-commission-payout')

  // Update affiliate-challenges-leaderboard
  const challengeContent = `# 🏆 Challenge & Leaderboard

## Apa itu Challenge?

**Challenge** adalah tantangan penjualan dengan target spesifik dan reward menarik. Affiliate yang mencapai target bisa claim reward berupa bonus komisi atau cash bonus.

## Cara Ikut Challenge

1. Buka menu **Tantangan**
2. Pilih challenge yang aktif
3. Klik **Ikut Tantangan**
4. Promosikan dan capai target
5. Claim reward setelah selesai

## Jenis Reward

### 💵 Cash Bonus
Bonus uang tunai langsung ke wallet.

### 🎁 Voucher
Voucher belanja atau diskon produk.

### 🎖️ Badge & Recognition
Badge khusus di profil dan recognition di komunitas.

## Leaderboard

Leaderboard menampilkan ranking affiliate berdasarkan:
- **Total Earnings** - Komisi terbanyak
- **Total Conversions** - Penjualan terbanyak
- **Total Clicks** - Klik terbanyak

### Periode
- Harian
- Mingguan  
- Bulanan
- All-time

## Tips Menang Challenge

1. **Target Realistis** - Pilih challenge sesuai kemampuan
2. **Promosi Intensif** - Fokus selama periode challenge
3. **Multi Channel** - Spread di berbagai platform
4. **Timing** - Manfaatkan momen seperti hari gajian
5. **Engagement** - Respond leads dengan cepat`

  await prisma.documentation.updateMany({
    where: { slug: 'affiliate-challenges-leaderboard' },
    data: { 
      content: challengeContent,
      excerpt: 'Ikuti tantangan dan bersaing dengan affiliate lainnya untuk reward menarik.'
    }
  })
  console.log('✅ Updated affiliate-challenges-leaderboard')

  console.log('\n✨ All documentation updated successfully!')
  await prisma.$disconnect()
}

updateDocs().catch(console.error)
