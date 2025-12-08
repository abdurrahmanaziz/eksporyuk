const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedAffiliateDocumentation() {
  console.log('🌱 Seeding affiliate documentation...')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!admin) {
    console.error('❌ No admin user found! Please create an admin user first.')
    process.exit(1)
  }

  console.log(`✅ Using admin: ${admin.email}`)

  const docs = [
    {
      slug: 'affiliate-overview',
      title: 'Ringkasan Sistem Affiliate',
      excerpt: 'Panduan lengkap untuk memahami program affiliate EksporYuk dari A sampai Z.',
      content: `# 📢 Sistem Affiliate EksporYuk

Selamat datang di dokumentasi lengkap **Affiliate Program EksporYuk**! Program ini dirancang untuk membantu Anda menghasilkan komisi dengan mempromosikan membership, produk, dan kursus EksporYuk.

## 🎯 Apa Itu Affiliate EksporYuk?

**Affiliate** adalah mitra promosi EksporYuk yang mendapatkan **komisi** setiap kali ada orang yang membeli membership, produk, atau kursus melalui **link referral** Anda.

### Keuntungan Menjadi Affiliate:

✅ **Komisi Kompetitif** - Hingga 30% per penjualan  
✅ **Multi-Tier System** - Naik tier = komisi lebih besar  
✅ **Dashboard Lengkap** - Tracking real-time klik & konversi  
✅ **Short Link Generator** - Bikin link keren (contoh: \`link.eksporyuk.com/dinda\`)  
✅ **Challenge & Reward** - Ikut tantangan, raih bonus  
✅ **Marketing Tools** - Bio page, optin form, email templates  
✅ **Mini CRM** - Kelola leads & follow-up otomatis  
✅ **Payout Fleksibel** - Tarik komisi kapan saja (min. Rp 100.000)

## 📊 Struktur Tier & Komisi

| Tier | Minimum Sales | Komisi Membership | Komisi Produk | Komisi Kursus |
|------|---------------|-------------------|---------------|---------------|
| **Bronze** | 0 | 15% | 10% | 12% |
| **Silver** | 10 penjualan | 20% | 15% | 18% |
| **Gold** | 25 penjualan | 25% | 20% | 22% |
| **Platinum** | 50 penjualan | 30% | 25% | 28% |

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
6. Tarik komisi`,
      category: 'GETTING_STARTED',
      targetRoles: ['AFFILIATE', 'ADMIN'],
      status: 'PUBLISHED',
      isPublic: true,
      icon: '📢',
      order: 1,
      metaTitle: 'Sistem Affiliate EksporYuk - Panduan Lengkap',
      metaDescription: 'Pelajari cara kerja affiliate program EksporYuk, tier komisi, jenis link, dan cara earning dari komisi.',
      keywords: 'affiliate, komisi, referral, tier, link affiliate',
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      slug: 'affiliate-registration',
      title: 'Pendaftaran & Persetujuan Affiliate',
      excerpt: 'Cara mendaftar sebagai affiliate EksporYuk dan proses approval admin.',
      content: `# 🎯 Pendaftaran Affiliate

## Prasyarat

Sebelum mendaftar, pastikan Anda memiliki:

✅ **Akun Member EksporYuk** - Minimal Member Free (gratis)  
✅ **Email Verified** - Aktifkan email Anda  
✅ **Audience/Network** - Social media atau email list  
✅ **Pemahaman Produk** - Tahu value dari membership EksporYuk

## Langkah Pendaftaran

### 1. Akses Form
- Login ke dashboard EksporYuk
- Klik menu "Affiliate"
- Klik tombol "Daftar Sebagai Affiliate"

### 2. Isi Form
Form akan meminta:
- Nama lengkap
- Email (auto-fill)
- Nomor WhatsApp (wajib)
- Platform promosi (Instagram, Facebook, dll)
- Ukuran audience
- Pengalaman affiliate
- Motivasi (min. 100 karakter)

### 3. Submit & Tunggu Approval
- Centang Terms & Conditions
- Klik "Daftar Affiliate"
- Tunggu review admin 1-2 hari kerja

## Status Pendaftaran

| Status | Deskripsi |
|--------|-----------|
| 🟡 PENDING | Admin sedang review |
| 🟢 APPROVED | Disetujui! Akses aktif |
| 🔴 REJECTED | Ditolak (lihat alasan di email) |

## Tips Approval

1. Upload screenshot stats social media
2. Link ke portfolio promosi
3. Motivasi autentik (bukan copy-paste)
4. Profile photo professional

## Notifikasi Approval

Saat disetujui, Anda akan menerima:
- ✉️ Email approval dengan affiliate code
- 📱 WhatsApp notification
- 🔔 In-app notification

## Setelah Approved

1. Lengkapi profile affiliate
2. Setup bank account (untuk payout)
3. Generate link pertama
4. Mulai promosi!`,
      category: 'GETTING_STARTED',
      targetRoles: ['AFFILIATE', 'ADMIN'],
      status: 'PUBLISHED',
      isPublic: true,
      icon: '🎯',
      order: 2,
      metaTitle: 'Cara Daftar Affiliate EksporYuk',
      metaDescription: 'Panduan lengkap pendaftaran affiliate, proses approval, dan tips meningkatkan peluang diterima.',
      keywords: 'daftar affiliate, registrasi affiliate, approval affiliate',
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      slug: 'affiliate-links-tracking',
      title: 'Sistem Link & Tracking',
      excerpt: 'Cara generate link affiliate, short link, dan tracking klik & konversi.',
      content: `# 🔗 Sistem Link & Tracking

## Jenis Link Affiliate

### 1. Standard Affiliate Link
Link default dengan kode affiliate Anda:
\`\`\`
https://eksporyuk.com/membership/premium?ref=DINDA123
\`\`\`

**Fitur:**
- Auto-generated dari dashboard
- Tracking klik & konversi
- Cookie 30 hari
- Untuk membership, produk, kursus

### 2. Short Link
Link pendek yang lebih profesional:
\`\`\`
https://link.eksporyuk.com/dinda
https://ekspor.link/dinda/promo-akhir-tahun
\`\`\`

**Fitur:**
- Username unik (cek ketersediaan dulu)
- Tambah slug custom
- Multi-domain (pilih domain favorit)
- QR Code auto-generate
- Tracking detail (IP, device, referrer)

### 3. Bio Page Link
Landing page all-in-one:
\`\`\`
https://eksporyuk.com/bio/dinda
\`\`\`

**Fitur:**
- 5 template desain
- Social media links
- CTA buttons (7 jenis)
- Visitor analytics
- Customizable colors

## Cara Generate Link

### Dashboard → Link & Tracking

1. **Pilih Produk**
   - Membership (1, 3, 6, 12 bulan, lifetime)
   - Kursus (Ekspor 101, Advanced Export)
   - Produk Digital (Template, Database)

2. **Custom Short Code (Opsional)**
   - Contoh: \`dinda-promo-desember\`

3. **Notes (Tracking Sendiri)**
   - Contoh: "Post Instagram tanggal 8 Des"

4. **Klik Generate**

## Tracking Analytics

### Dashboard Metrics
- 🖱️ **Clicks** - Total klik link
- 💰 **Conversions** - Total pembelian
- 📈 **Conversion Rate** - Persentase convert
- 💵 **Earnings** - Total komisi

### Per-Link Statistics
- Clicks per link
- Best performing link
- Traffic source (referrer)
- Device breakdown (mobile/desktop)
- Time-based analysis

### Real-Time Tracking
- Monitor klik real-time
- Notifikasi setiap conversion
- Weekly/monthly reports

## Tips Tracking

1. **Gunakan UTM Parameters**
   \`\`\`
   ?ref=DINDA123&utm_source=instagram&utm_campaign=promo_des
   \`\`\`

2. **Buat Link Berbeda Per Platform**
   - Instagram: \`/dinda-ig\`
   - Facebook: \`/dinda-fb\`
   - Email: \`/dinda-email\`

3. **Monitor Best Performers**
   - Double down on link yang convert tinggi
   - Cut link yang ga perform

4. **Test Different Copy**
   - A/B test caption
   - Track mana yang lebih efektif`,
      category: 'FEATURES',
      targetRoles: ['AFFILIATE', 'ADMIN'],
      status: 'PUBLISHED',
      isPublic: false,
      icon: '🔗',
      order: 3,
      metaTitle: 'Cara Generate & Track Link Affiliate',
      metaDescription: 'Panduan membuat affiliate link, short link, bio page, dan tracking performa dengan analytics.',
      keywords: 'affiliate link, short link, tracking, analytics, conversion',
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      slug: 'affiliate-commission-payout',
      title: 'Komisi & Pembayaran',
      excerpt: 'Cara kerja komisi affiliate, perhitungan revenue split, dan proses penarikan saldo.',
      content: `# 💰 Komisi & Pembayaran

## Sistem Komisi

### Tier & Persentase

| Tier | Sales | Membership | Produk | Kursus |
|------|-------|------------|--------|--------|
| Bronze | 0 | 15% | 10% | 12% |
| Silver | 10 | 20% | 15% | 18% |
| Gold | 25 | 25% | 20% | 22% |
| Platinum | 50 | 30% | 25% | 28% |

### Cara Kerja

1. **Customer Beli via Link Anda**
   - Sistem detect link dari cookie/query
   - Transaction created dengan affiliateId

2. **Revenue Split**
   - Affiliate: Sesuai tier (langsung ke balance)
   - Admin: 15% (masuk balancePending)
   - Founder: 60% sisa (masuk balancePending)
   - Co-Founder: 40% sisa (masuk balancePending)

3. **Komisi Masuk Wallet**
   - Langsung masuk \`wallet.balance\`
   - Withdrawable kapan saja
   - Real-time update

### Contoh Perhitungan

**Membership Premium 1 Bulan (Rp 1.000.000)**  
Tier Silver (20%):

\`\`\`
Komisi Affiliate: Rp 200.000 → balance (withdrawable)

Sisa: Rp 800.000
- Admin (15%): Rp 120.000 → balancePending
- Founder (60% dari 680k): Rp 408.000 → balancePending
- Co-Founder (40% dari 680k): Rp 272.000 → balancePending
\`\`\`

## Wallet System

### Balance vs Pending

- **Balance**: Komisi yang bisa ditarik
- **Balance Pending**: Komisi admin/founder yang butuh approval

### Melihat Balance

Dashboard → Earnings → Wallet:
- Current Balance: Rp 2.500.000
- Pending: Rp 0
- Total Earnings: Rp 15.300.000

## Penarikan Saldo (Payout)

### Syarat Payout

- ✅ Minimum: Rp 100.000
- ✅ Balance tersedia (bukan pending)
- ✅ WhatsApp verified
- ✅ Bank account setup

### Proses Payout

1. **Request Payout**
   - Dashboard → Payouts → Request Payout
   - Masukkan jumlah (min. Rp 100.000)
   - Pilih bank account
   - Submit

2. **Admin Review**
   - Status: PENDING
   - Review dalam 1-3 hari kerja
   - Notifikasi via email/WhatsApp

3. **Transfer**
   - Status: PROCESSING
   - Transfer ke rekening Anda
   - Bukti transfer via email

4. **Completed**
   - Status: COMPLETED
   - Saldo terpotong dari balance
   - Record di payout history

### Status Payout

| Status | Deskripsi |
|--------|-----------|
| PENDING | Menunggu review admin |
| APPROVED | Disetujui, siap transfer |
| PROCESSING | Sedang diproses |
| COMPLETED | Transfer selesai |
| REJECTED | Ditolak (lihat notes) |

### Payout History

Semua payout tercatat:
- Tanggal request
- Jumlah
- Status
- Notes (jika ada)
- Bukti transfer (jika completed)

## Komisi Refund

### Jika Customer Refund

- Komisi dikurangi dari balance
- Jika balance tidak cukup, masuk negative
- Negative balance dipotong dari komisi berikutnya

**Contoh:**
\`\`\`
Balance: Rp 500.000
Customer refund: Rp 200.000 komisi

New Balance: Rp 300.000
\`\`\`

## Tips Maksimalkan Komisi

1. **Fokus High-Value Products**
   - Membership 12 bulan (komisi Rp 224k+)
   - Lifetime (komisi Rp 449k+)

2. **Naik Tier ASAP**
   - 10 sales → Silver (20%)
   - 25 sales → Gold (25%)
   - 50 sales → Platinum (30%)

3. **Ikut Challenge**
   - Bonus komisi tambahan
   - Reward tier upgrade
   - Cash bonus

4. **Build Recurring Sales**
   - Focus on membership (renewal)
   - Loyal customers = passive income`,
      category: 'FEATURES',
      targetRoles: ['AFFILIATE', 'ADMIN'],
      status: 'PUBLISHED',
      isPublic: false,
      icon: '💰',
      order: 4,
      metaTitle: 'Sistem Komisi & Payout Affiliate',
      metaDescription: 'Pelajari cara kerja komisi affiliate, tier system, revenue split, dan cara menarik saldo.',
      keywords: 'komisi affiliate, payout, withdrawal, tier, revenue split',
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      slug: 'affiliate-challenges-leaderboard',
      title: 'Challenge & Leaderboard',
      excerpt: 'Ikut tantangan affiliate, raih reward, dan compete di leaderboard.',
      content: `# 🏆 Challenge & Leaderboard

## Apa Itu Affiliate Challenge?

**Challenge** adalah tantangan penjualan dengan target spesifik dan reward menarik. Affiliate yang mencapai target bisa claim reward berupa bonus komisi, tier upgrade, atau cash bonus.

## Jenis Challenge

### 1. Sales Count
Target: Jumlah penjualan

**Contoh:**
- Target: 10 sales
- Reward: Bonus Rp 500.000
- Duration: 30 hari

### 2. Revenue Target
Target: Total omzet

**Contoh:**
- Target: Rp 10.000.000 revenue
- Reward: Naik 1 tier
- Duration: 60 hari

### 3. Conversions
Target: Total konversi

**Contoh:**
- Target: 20 conversions
- Reward: Cash bonus Rp 1.000.000
- Duration: 90 hari

### 4. New Customers
Target: Customer baru

**Contoh:**
- Target: 15 customer baru
- Reward: Bonus komisi 10%
- Duration: 45 hari

## Reward Types

### 1. Bonus Commission
Komisi tambahan masuk wallet:
- Rp 500.000 - Rp 5.000.000
- Langsung withdrawable

### 2. Tier Upgrade
Naik tier permanen:
- Bronze → Silver
- Silver → Gold
- Gold → Platinum

### 3. Cash Bonus
Bonus tunai langsung:
- Transfer ke rekening
- Tidak masuk wallet
- Langsung cair

## Cara Join Challenge

### Dashboard → Challenges

1. **Browse Active Challenges**
   - Lihat list challenge aktif
   - Filter by category/reward

2. **Pilih Challenge**
   - Klik "Detail"
   - Baca syarat & ketentuan

3. **Join Challenge**
   - Klik "Ikut Challenge"
   - Confirm participation

4. **Track Progress**
   - Real-time progress bar
   - Notifikasi milestone (25%, 50%, 75%)

5. **Claim Reward**
   - Saat target tercapai, tombol "Claim" aktif
   - Klik claim → reward masuk wallet/tier update

## Leaderboard

### Real-Time Ranking

Dashboard → Leaderboard:
- Top 10 affiliates per challenge
- Current standing Anda
- Points/progress comparison

### Leaderboard Columns

| Rank | Name | Progress | Status |
|------|------|----------|--------|
| 🥇 1 | Dinda | 25/20 | ✅ Claimed |
| 🥈 2 | Budi | 20/20 | ⏳ Claim Available |
| 🥉 3 | Siti | 18/20 | 🔄 In Progress |
| 4 | You | 15/20 | 🔄 In Progress |

### Filter Leaderboard
- By challenge
- By period (weekly/monthly/all time)
- By tier (compare with same tier)

## Challenge Strategy

### 1. Pilih Challenge Sesuai Strengths

**Strong di Instagram?**
→ Join challenge dengan target cepat (30 hari)

**Punya Email List?**
→ Join challenge revenue (push high-value products)

### 2. Focus on One Challenge

Jangan join banyak sekaligus:
- Fokus 100% ke 1 challenge
- Selesai → join challenge berikutnya

### 3. Early Start Advantage

Join challenge di awal periode:
- Lebih banyak waktu
- Momentum dari awal
- Compound effect

### 4. Track Progress Daily

Check dashboard setiap hari:
- Monitor progress
- Adjust strategy kalau ketinggalan
- Sprint di akhir periode

## Tips Menang Challenge

### 1. Gunakan Semua Tools

- Bio page (landing page)
- Optin form (collect leads)
- Email broadcast (follow-up)
- Automation (nurture sequence)

### 2. Leverage Urgency

"Promo challenge berakhir 3 hari lagi!"
→ Push harder di minggu terakhir

### 3. Collaborate

Ajak affiliate lain:
- Share tips & tricks
- Group accountability
- Win together

### 4. Analyze Winners

Lihat affiliate yang menang:
- Platform apa yang mereka pakai?
- Copy seperti apa yang effective?
- Learn & replicate

## Challenge History

Dashboard → Challenges → History:
- Past challenges yang pernah diikuti
- Result (completed/failed)
- Rewards claimed
- Performance comparison

## Notifikasi Challenge

### Push Notification
- Challenge baru tersedia
- Progress milestone (50%, 75%, 100%)
- 3 hari sebelum deadline
- Reward claimed successfully

### Email Digest
- Weekly challenge summary
- Leaderboard position update
- Tips & best practices

## FAQ Challenge

**Q: Boleh join multiple challenges?**  
A: Boleh, tapi fokus di 1-2 challenge untuk hasil maksimal.

**Q: Reward bisa transfer?**  
A: Tidak. Reward personal dan non-transferable.

**Q: Challenge bisa di-cancel?**  
A: Tidak. Tapi tidak ada penalty jika tidak selesai.

**Q: Tier upgrade permanent?**  
A: Ya! Tier upgrade dari challenge adalah permanent.

**Q: Refund customer affect progress?**  
A: Ya. Jika customer refund, progress dikurangi.`,
      category: 'FEATURES',
      targetRoles: ['AFFILIATE', 'ADMIN'],
      status: 'PUBLISHED',
      isPublic: false,
      icon: '🏆',
      order: 5,
      metaTitle: 'Affiliate Challenge & Leaderboard System',
      metaDescription: 'Cara join challenge affiliate, track progress, claim reward, dan compete di leaderboard.',
      keywords: 'affiliate challenge, leaderboard, reward, bonus, competition',
      publishedAt: new Date(),
      authorId: admin.id
    },
  ]

  console.log(`📝 Creating ${docs.length} documentation records...`)

  for (const doc of docs) {
    try {
      const created = await prisma.documentation.create({
        data: doc
      })
      
      // Create first revision
      await prisma.documentationRevision.create({
        data: {
          documentationId: created.id,
          content: doc.content,
          title: doc.title,
          excerpt: doc.excerpt,
          changedById: admin.id,
          changeNote: 'Initial version',
          version: 1
        }
      })
      
      console.log(`  ✅ Created: ${doc.title}`)
    } catch (error) {
      console.error(`  ❌ Error creating ${doc.title}:`, error.message)
    }
  }

  console.log('\n✨ Seeding completed!')
  
  const count = await prisma.documentation.count()
  console.log(`📊 Total documentation in database: ${count}`)
}

seedAffiliateDocumentation()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
