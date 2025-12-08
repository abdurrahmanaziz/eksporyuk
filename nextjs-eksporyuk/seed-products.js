const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedProducts() {
  try {
    console.log('🌱 Seeding Products...\n')

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!admin) {
      console.error('❌ Admin user not found. Please create admin first.')
      return
    }

    console.log(`✅ Admin found: ${admin.email}\n`)

    // 1. DIGITAL PRODUCT - Ebook/Template
    const digitalProduct = await prisma.product.create({
      data: {
        name: 'Template Invoice & Packing List Ekspor',
        slug: 'template-invoice-packing-list-ekspor',
        description: `Template lengkap untuk dokumen ekspor yang sudah sesuai standar internasional.

📄 **Yang Anda Dapatkan:**
- Invoice Template (Word & Excel)
- Packing List Template (Word & Excel)
- Certificate of Origin Template
- Bill of Lading Sample
- Panduan Pengisian Dokumen

✅ **Keuntungan:**
- Hemat waktu pembuatan dokumen
- Format profesional & standar internasional
- Editable sesuai kebutuhan
- Lifetime access & updates

🎯 **Cocok untuk:**
- Pemula yang baru mulai ekspor
- UMKM yang perlu dokumen standar
- Trader yang butuh template cepat`,
        price: 150000,
        productType: 'DIGITAL',
        isActive: true,
        isFeatured: true,
        enableUpsale: true,
        upsaleMessage: 'Upgrade ke Bundle Ekspor Pro dan hemat 40%! Dapatkan semua template + video tutorial',
        upsaleDiscount: 40,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30,
        soldCount: 0,
        creator: {
          connect: { id: admin.id }
        }
      }
    })
    console.log('✅ Digital Product created:', digitalProduct.name)

    // 2. EVENT/WEBINAR
    const webinarProduct = await prisma.product.create({
      data: {
        name: 'Webinar: Strategi Ekspor ke Eropa 2025',
        slug: 'webinar-strategi-ekspor-eropa-2025',
        description: `Webinar eksklusif bersama praktisi ekspor berpengalaman 15+ tahun.

🎯 **Materi yang Dibahas:**
- Riset pasar Eropa yang efektif
- Regulasi & standar produk EU
- Cara negosiasi dengan buyer Eropa
- Logistik & pengiriman ke EU
- Studi kasus sukses ekspor ke Eropa

👨‍🏫 **Pembicara:**
Expert eksportir dengan track record 50+ container/tahun ke Eropa

⏰ **Jadwal:**
- Tanggal: 15 Januari 2025
- Waktu: 19.00 - 21.00 WIB
- Platform: Zoom (link dikirim H-1)

🎁 **Bonus:**
- Recording webinar (7 hari)
- Slide materi (PDF)
- Template dokumen ekspor
- Grup diskusi peserta`,
        price: 250000,
        productType: 'EVENT',
        eventDate: new Date('2025-01-15T19:00:00'),
        eventEndDate: new Date('2025-01-15T21:00:00'),
        eventDuration: 120,
        eventUrl: null, // Will be updated closer to date
        meetingId: null,
        meetingPassword: null,
        eventVisibility: 'PUBLIC',
        maxParticipants: 100,
        isActive: true,
        isFeatured: true,
        enableUpsale: true,
        upsaleMessage: 'Dapatkan akses ke semua webinar 2025 + konsultasi private!',
        upsaleDiscount: 50,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 25,
        soldCount: 0,
        creator: {
          connect: { id: admin.id }
        }
      }
    })
    console.log('✅ Webinar Product created:', webinarProduct.name)

    // 3. BUNDLE KELAS
    // First, get available courses
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      take: 3,
      select: { id: true, title: true }
    })

    let bundleProduct
    if (courses.length > 0) {
      bundleProduct = await prisma.product.create({
        data: {
          name: 'Bundle Ekspor Mastery - 3 Kelas Premium',
          slug: 'bundle-ekspor-mastery-3-kelas',
          description: `Paket lengkap 3 kelas premium untuk menguasai ekspor dari nol hingga mahir.

📚 **Kelas yang Termasuk:**
${courses.map((c, i) => `${i + 1}. ${c.title}`).join('\n')}

💎 **Total Nilai: Rp 2.500.000**
🎉 **Harga Bundle: Rp 1.500.000** (HEMAT 40%)

✨ **Keuntungan Bundle:**
- Akses lifetime ke semua kelas
- Dapat sertifikat untuk 3 kelas
- Prioritas support dari mentor
- Akses ke grup eksklusif alumni
- Update materi gratis selamanya

🎯 **Cocok untuk:**
- Pemula yang serius ingin ekspor
- Pelaku UMKM yang ingin scale up
- Profesional yang ingin expertise ekspor`,
          price: 1500000,
          productType: 'COURSE_BUNDLE',
          isActive: true,
          isFeatured: true,
          enableUpsale: true,
          upsaleMessage: 'Upgrade ke Pro Membership dan akses SEMUA kelas + konsultasi unlimited!',
          upsaleDiscount: 30,
          commissionType: 'PERCENTAGE',
          affiliateCommissionRate: 20,
          soldCount: 0,
          creator: {
            connect: { id: admin.id }
          }
        }
      })

      // Link courses to bundle
      if (courses.length > 0) {
        await prisma.productCourse.createMany({
          data: courses.map(course => ({
            productId: bundleProduct.id,
            courseId: course.id
          }))
        })
      }

      console.log('✅ Bundle Product created:', bundleProduct.name)
      console.log(`   - Linked ${courses.length} courses`)
    } else {
      console.log('⚠️ No courses found, skipping bundle creation')
    }

    // 4. EBOOK
    const ebookProduct = await prisma.product.create({
      data: {
        name: 'Ebook: Panduan Lengkap Ekspor untuk Pemula',
        slug: 'ebook-panduan-lengkap-ekspor-pemula',
        description: `Ebook komprehensif 150+ halaman untuk memulai bisnis ekspor dari nol.

📖 **Isi Ebook:**
- Bab 1: Persiapan Mental & Modal Ekspor
- Bab 2: Riset Produk & Pasar Ekspor
- Bab 3: Legalitas & Perizinan Ekspor
- Bab 4: Cara Mencari Buyer Internasional
- Bab 5: Negosiasi & Kontrak Ekspor
- Bab 6: Dokumentasi & Pengiriman
- Bab 7: Payment & Risk Management
- Bab 8: Studi Kasus Real 10 Eksportir Sukses

✅ **Format:**
- PDF (dapat dibaca di semua device)
- Desain full color profesional
- Checklist & worksheet interaktif
- Link referensi & resource tambahan

🎁 **Bonus:**
- Template dokumen ekspor
- Daftar 50+ marketplace B2B global
- Checklist persiapan ekspor

💾 **Download:** Instant setelah pembelian`,
        price: 97000,
        productType: 'EBOOK',
        isActive: true,
        isFeatured: false,
        enableUpsale: true,
        upsaleMessage: 'Dapatkan video course lengkap + konsultasi 1-on-1!',
        upsaleDiscount: 25,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 35,
        soldCount: 0,
        creator: {
          connect: { id: admin.id }
        }
      }
    })
    console.log('✅ Ebook Product created:', ebookProduct.name)

    // 5. TEMPLATE/RESOURCE
    const templateProduct = await prisma.product.create({
      data: {
        name: 'Master Template Dokumen Ekspor (20+ Files)',
        slug: 'master-template-dokumen-ekspor',
        description: `Koleksi lengkap 20+ template dokumen ekspor yang siap pakai dan editable.

📋 **Daftar Template:**

**Dokumen Transaksi:**
- Commercial Invoice
- Proforma Invoice
- Packing List
- Bill of Lading (B/L)
- Airway Bill (AWB)

**Surat & Kontrak:**
- Sales Contract Template
- Purchase Order
- Letter of Credit (L/C) Guide
- Business Inquiry Letter
- Offer Letter

**Sertifikat:**
- Certificate of Origin (COO)
- Quality Certificate
- Fumigation Certificate
- Halal Certificate Template

**Administrasi:**
- Export Checklist
- Cost Calculation Sheet
- Shipping Instruction
- Delivery Note

**Plus Bonus:**
- Panduan pengisian setiap dokumen
- Contoh kasus nyata
- Tips & best practices

📁 **Format:** Word (.docx) & Excel (.xlsx) - Fully Editable
💾 **Total Size:** ~15 MB
🔄 **Updates:** Lifetime free updates`,
        price: 299000,
        productType: 'TEMPLATE',
        isActive: true,
        isFeatured: true,
        enableUpsale: true,
        upsaleMessage: 'Upgrade ke Bundle Ekspor Lengkap: Template + Ebook + Video Tutorial!',
        upsaleDiscount: 35,
        commissionType: 'PERCENTAGE',
        affiliateCommissionRate: 30,
        soldCount: 0,
        creator: {
          connect: { id: admin.id }
        }
      }
    })
    console.log('✅ Template Product created:', templateProduct.name)

    console.log('\n✅ All products seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - Digital Product: ${digitalProduct.name}`)
    console.log(`   - Webinar: ${webinarProduct.name}`)
    if (bundleProduct) console.log(`   - Bundle: ${bundleProduct.name}`)
    console.log(`   - Ebook: ${ebookProduct.name}`)
    console.log(`   - Template: ${templateProduct.name}`)

  } catch (error) {
    console.error('❌ Error seeding products:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedProducts()
  .then(() => {
    console.log('\n✅ Seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
