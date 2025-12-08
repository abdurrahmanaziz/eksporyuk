/**
 * Seed Default Email & CTA Templates
 * Run: npm run seed:templates
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default Email Templates
const EMAIL_TEMPLATES = [
  {
    name: 'Welcome New Lead',
    slug: 'welcome-new-lead',
    category: 'WELCOME',
    subject: 'Selamat Datang di Eksporyuk! 🎉',
    body: `
      <p>Hai {name}! 👋</p>
      
      <p>Terima kasih sudah bergabung dengan komunitas ekspor terbesar di Indonesia!</p>
      
      <p>Di Eksporyuk, kamu akan mendapatkan:</p>
      <ul>
        <li>✅ Akses ke database buyer internasional</li>
        <li>✅ Training ekspor dari praktisi berpengalaman</li>
        <li>✅ Komunitas eksportir aktif</li>
        <li>✅ Tools dan template bisnis ekspor</li>
      </ul>
      
      <p><strong>Langkah selanjutnya:</strong></p>
      <p>1. Download ebook gratis: <a href="{ebook_link}">Panduan Ekspor untuk Pemula</a></p>
      <p>2. Join grup WhatsApp: <a href="{wa_group}">Klik di sini</a></p>
      <p>3. Ikuti webinar gratis minggu ini!</p>
      
      <p>Jika ada pertanyaan, langsung reply email ini ya!</p>
      
      <p>Salam ekspor,<br><strong>Tim Eksporyuk</strong></p>
    `,
    previewText: 'Selamat datang! Mari mulai perjalanan ekspor kamu...',
    description: 'Email pertama untuk lead baru yang baru opt-in',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Follow-Up Zoom H+1',
    slug: 'zoom-followup-day-1',
    category: 'ZOOM_FOLLOWUP',
    subject: 'Terima kasih sudah join webinar kemarin! 🎥',
    body: `
      <p>Hai {name}!</p>
      
      <p>Terima kasih sudah ikut webinar <strong>{webinar_title}</strong> kemarin!</p>
      
      <p>Semoga insight yang dibagikan bisa langsung kamu terapkan di bisnis ekspor kamu ya.</p>
      
      <p><strong>Link Rekaman Webinar:</strong><br>
      <a href="{replay_link}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; margin: 10px 0;">Tonton Rekaman</a></p>
      
      <p><strong>Materi & Slide:</strong><br>
      Download materi lengkap di sini: <a href="{materials_link}">Download Materi</a></p>
      
      <p><strong>🎁 PROMO KHUSUS PESERTA WEBINAR:</strong></p>
      <p>Dapatkan diskon <strong>50%</strong> untuk membership Premium!</p>
      <p>Gunakan kode: <strong>{promo_code}</strong></p>
      <p>Berlaku sampai {expiry_date}</p>
      
      <p><a href="{membership_link}" style="display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; margin: 10px 0;">Upgrade Sekarang</a></p>
      
      <p>Pertanyaan? Reply email ini!</p>
      
      <p>Sukses selalu,<br><strong>Tim Eksporyuk</strong></p>
    `,
    previewText: 'Link rekaman & materi webinar sudah tersedia!',
    description: 'Follow-up sehari setelah webinar dengan link replay & promo',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Pending Payment Reminder',
    slug: 'pending-payment-reminder',
    category: 'PENDING_PAYMENT',
    subject: 'Checkout kamu belum selesai - Diskon masih berlaku! ⏰',
    body: `
      <p>Hai {name}!</p>
      
      <p>Kami lihat kamu sudah mulai checkout tapi belum menyelesaikan pembayaran.</p>
      
      <p><strong>Pesanan kamu:</strong></p>
      <ul>
        <li>Produk: {product_name}</li>
        <li>Harga: <strike>Rp {original_price}</strike> <strong>Rp {discounted_price}</strong></li>
        <li>Hemat: Rp {savings}</li>
      </ul>
      
      <p>⚡ <strong>DISKON MASIH BERLAKU!</strong></p>
      <p>Selesaikan pembayaran dalam 24 jam untuk mengamankan harga spesial ini.</p>
      
      <p><a href="{checkout_link}" style="display: inline-block; padding: 14px 28px; background: #F59E0B; color: white; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: bold;">Lanjutkan Pembayaran</a></p>
      
      <p><strong>Kenapa harus join sekarang?</strong></p>
      <ul>
        <li>✅ Akses lifetime ke semua materi</li>
        <li>✅ Update konten terbaru gratis</li>
        <li>✅ Konsultasi dengan mentor</li>
        <li>✅ Certificate resmi</li>
      </ul>
      
      <p>Ada kendala? Hubungi kami di WhatsApp: <a href="{wa_support}">Klik di sini</a></p>
      
      <p>Salam,<br><strong>Tim Eksporyuk</strong></p>
    `,
    previewText: 'Checkout belum selesai? Diskon masih berlaku!',
    description: 'Reminder untuk pembayaran yang pending',
    isDefault: true,
    isActive: true
  },
  {
    name: 'Upsell Membership',
    slug: 'upsell-membership',
    category: 'UPSELL',
    subject: 'Upgrade ke Premium - Bonus Eksklusif Menanti! 🚀',
    body: `
      <p>Hai {name}!</p>
      
      <p>Kamu sudah menjadi bagian dari komunitas Eksporyuk. Sekarang saatnya naik level! 📈</p>
      
      <p><strong>Kenapa harus upgrade ke Premium?</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <th style="padding: 10px; background: #F3F4F6; text-align: left;">Fitur</th>
          <th style="padding: 10px; background: #F3F4F6; text-align: center;">Free</th>
          <th style="padding: 10px; background: #10B981; color: white; text-align: center;">Premium</th>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Akses Kursus</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">3 kursus</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;"><strong>Unlimited</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Database Buyer</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">10/bulan</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;"><strong>Unlimited</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Konsultasi Mentor</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;">-</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center;"><strong>✓</strong></td>
        </tr>
        <tr>
          <td style="padding: 10px;">Sertifikat</td>
          <td style="padding: 10px; text-align: center;">-</td>
          <td style="padding: 10px; text-align: center;"><strong>✓</strong></td>
        </tr>
      </table>
      
      <p>🎁 <strong>BONUS KHUSUS HARI INI:</strong></p>
      <ul>
        <li>Ebook: 100+ Buyer Contact ($97 value)</li>
        <li>Template Dokumen Ekspor Lengkap</li>
        <li>Akses Grup VIP WhatsApp</li>
      </ul>
      
      <p><a href="{upgrade_link}" style="display: inline-block; padding: 16px 32px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: bold; font-size: 16px;">Upgrade ke Premium Sekarang</a></p>
      
      <p><em>Harga spesial: Rp {special_price}/bulan (hemat 40%)</em></p>
      
      <p>Pertanyaan? Chat kami: <a href="{wa_link}">WhatsApp Admin</a></p>
      
      <p>Salam sukses,<br><strong>Tim Eksporyuk</strong></p>
    `,
    previewText: 'Saatnya naik level! Bonus eksklusif menanti...',
    description: 'Email untuk upsell membership dari free ke premium',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Educational - Export Basics',
    slug: 'education-export-basics',
    category: 'EDUCATION',
    subject: '5 Kesalahan Umum Pemula Ekspor (dan Cara Menghindarinya)',
    body: `
      <p>Hai {name}!</p>
      
      <p>Banyak pemula ekspor yang gagal di tahun pertama. Kenapa? Karena mereka melakukan 5 kesalahan ini:</p>
      
      <h3>1. Tidak Riset Pasar dengan Benar</h3>
      <p>Banyak yang langsung terjun tanpa tahu demand pasar. Padahal riset adalah fondasi bisnis ekspor yang sukses.</p>
      <p><strong>Solusi:</strong> Gunakan database buyer kami untuk riset pasar gratis!</p>
      
      <h3>2. Mengabaikan Legalitas Dokumen</h3>
      <p>Dokumen ekspor yang salah = barang ditahan di bea cukai. Rugi besar!</p>
      <p><strong>Solusi:</strong> Download checklist dokumen ekspor lengkap: <a href="{checklist_link}">Klik di sini</a></p>
      
      <h3>3. Pricing yang Tidak Kompetitif</h3>
      <p>Harga terlalu tinggi = tidak laku. Terlalu rendah = rugi.</p>
      <p><strong>Solusi:</strong> Ikuti webinar pricing strategy minggu depan!</p>
      
      <h3>4. Tidak Punya Payment Terms yang Jelas</h3>
      <p>LC, TT, atau DP? Banyak yang bingung dan akhirnya ditipu buyer.</p>
      <p><strong>Solusi:</strong> Baca panduan payment terms: <a href="{guide_link}">Download gratis</a></p>
      
      <h3>5. Tidak Punya Mentor</h3>
      <p>Trial and error bisa menghabiskan waktu bertahun-tahun dan jutaan rupiah.</p>
      <p><strong>Solusi:</strong> Join membership Premium dan dapat akses konsultasi dengan mentor!</p>
      
      <p><a href="{membership_link}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; margin: 15px 0;">Mulai Belajar Sekarang</a></p>
      
      <p>Semoga bermanfaat!</p>
      
      <p>Salam ekspor,<br><strong>Tim Eksporyuk</strong></p>
    `,
    previewText: 'Hindari 5 kesalahan fatal ini di bisnis ekspor...',
    description: 'Email edukasi dengan soft-selling',
    isDefault: false,
    isActive: true
  },
  {
    name: 'Promo Flash Sale',
    slug: 'promo-flash-sale',
    category: 'PROMO',
    subject: '⚡ FLASH SALE! Diskon 60% - 24 Jam Saja!',
    body: `
      <p>Hai {name}!</p>
      
      <div style="background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <h2 style="margin: 0; font-size: 32px;">⚡ FLASH SALE ⚡</h2>
        <p style="font-size: 24px; margin: 10px 0;"><strong>DISKON 60%</strong></p>
        <p style="margin: 0;">Berlaku 24 jam saja!</p>
      </div>
      
      <p><strong>Membership Premium</strong></p>
      <p style="font-size: 24px;">
        <strike style="color: #9CA3AF;">Rp 500.000</strike>
        <strong style="color: #10B981;"> Rp 199.000</strong>
      </p>
      <p><strong>Hemat Rp 301.000!</strong></p>
      
      <p><strong>Yang kamu dapatkan:</strong></p>
      <ul style="line-height: 1.8;">
        <li>✅ Akses ke 50+ kursus ekspor</li>
        <li>✅ Database 10,000+ buyer verified</li>
        <li>✅ Template dokumen lengkap</li>
        <li>✅ Konsultasi with mentor</li>
        <li>✅ Certificate resmi</li>
        <li>✅ Grup VIP WhatsApp</li>
        <li>✅ Update konten selamanya</li>
      </ul>
      
      <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400E;"><strong>⏰ Promo berakhir dalam:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #B45309;">{countdown_timer}</p>
      </div>
      
      <p style="text-align: center;">
        <a href="{checkout_link}" style="display: inline-block; padding: 18px 40px; background: #EF4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0;">AMBIL DISKON SEKARANG</a>
      </p>
      
      <p style="text-align: center; color: #6B7280; font-size: 14px;"><em>Promo terbatas! Hanya tersedia untuk 50 orang pertama.</em></p>
      
      <p>Jangan sampai nyesel!</p>
      
      <p>Salam,<br><strong>Tim Eksporyuk</strong></p>
    `,
    previewText: '⚡ Diskon 60% hanya 24 jam! Buruan sebelum kehabisan...',
    description: 'Email promo flash sale dengan urgency tinggi',
    isDefault: false,
    isActive: true
  }
]

// Default CTA Templates
const CTA_TEMPLATES = [
  {
    name: 'Daftar Membership Premium',
    buttonText: '🚀 Gabung Premium',
    buttonType: 'MEMBERSHIP',
    description: 'CTA untuk upgrade ke membership premium',
    backgroundColor: '#10B981',
    textColor: '#FFFFFF',
    icon: '👑',
    displayOrder: 1
  },
  {
    name: 'Lihat Kursus',
    buttonText: '📚 Lihat Semua Kursus',
    buttonType: 'COURSE',
    description: 'CTA untuk melihat katalog kursus',
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    icon: '📖',
    displayOrder: 2
  },
  {
    name: 'Download Ebook Gratis',
    buttonText: '🎁 Download Ebook Gratis',
    buttonType: 'PRODUCT',
    description: 'Lead magnet - ebook gratis',
    backgroundColor: '#8B5CF6',
    textColor: '#FFFFFF',
    icon: '📥',
    displayOrder: 3
  },
  {
    name: 'Daftar Webinar',
    buttonText: '🎥 Daftar Webinar Gratis',
    buttonType: 'ZOOM',
    description: 'CTA untuk daftar webinar/event',
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    icon: '🎯',
    displayOrder: 4
  },
  {
    name: 'Join Grup WhatsApp',
    buttonText: '💬 Join Grup WhatsApp',
    buttonType: 'WHATSAPP',
    description: 'CTA untuk join grup WA',
    backgroundColor: '#22C55E',
    textColor: '#FFFFFF',
    icon: '📱',
    displayOrder: 5
  },
  {
    name: 'Ambil Lead Magnet',
    buttonText: '✨ Ambil Bonus Gratis',
    buttonType: 'OPTIN',
    description: 'CTA untuk optin form lead magnet',
    backgroundColor: '#EC4899',
    textColor: '#FFFFFF',
    icon: '🎁',
    displayOrder: 6
  },
  {
    name: 'Konsultasi Gratis',
    buttonText: '📞 Chat Admin Sekarang',
    buttonType: 'WHATSAPP',
    description: 'CTA untuk konsultasi via WA',
    backgroundColor: '#14B8A6',
    textColor: '#FFFFFF',
    icon: '💬',
    displayOrder: 7
  },
  {
    name: 'Lihat Produk',
    buttonText: '🛍️ Lihat Produk',
    buttonType: 'PRODUCT',
    description: 'CTA untuk melihat produk digital',
    backgroundColor: '#6366F1',
    textColor: '#FFFFFF',
    icon: '🛒',
    displayOrder: 8
  }
]

async function main() {
  console.log('🌱 Seeding Affiliate Templates...\n')

  // Get admin user for createdById
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!admin) {
    console.error('❌ No admin user found. Please create an admin user first.')
    return
  }

  console.log(`✅ Using admin: ${admin.email}\n`)

  // Seed Email Templates
  console.log('📧 Creating Email Templates...')
  for (const template of EMAIL_TEMPLATES) {
    try {
      const existing = await prisma.affiliateEmailTemplate.findUnique({
        where: { slug: template.slug }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${template.name} (already exists)`)
        continue
      }

      await prisma.affiliateEmailTemplate.create({
        data: {
          ...template,
          createdById: admin.id
        }
      })
      console.log(`✅ Created: ${template.name}`)
    } catch (error) {
      console.error(`❌ Failed to create ${template.name}:`, error)
    }
  }

  console.log('\n🖱️  Creating CTA Templates...')
  for (const template of CTA_TEMPLATES) {
    try {
      await prisma.affiliateCTATemplate.create({
        data: template
      })
      console.log(`✅ Created: ${template.name}`)
    } catch (error) {
      console.error(`❌ Failed to create ${template.name}:`, error)
    }
  }

  console.log('\n✨ Seeding completed!')
  console.log(`📧 ${EMAIL_TEMPLATES.length} email templates created`)
  console.log(`🖱️  ${CTA_TEMPLATES.length} CTA templates created`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
