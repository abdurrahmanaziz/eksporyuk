const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetTemplates() {
  console.log('🔄 Menghapus template lama...')
  
  // Hapus semua template transaksi yang ada
  const deleted = await prisma.brandedTemplate.deleteMany({
    where: {
      category: 'TRANSACTION'
    }
  })
  
  console.log(`✅ Berhasil menghapus ${deleted.count} template lama`)
  
  console.log('\n📝 Membuat template baru dengan text editor...')
  
  // Template 1: Email Transaksi Berhasil
  const template1 = await prisma.brandedTemplate.create({
    data: {
      name: 'Email Transaksi Berhasil',
      slug: 'email-transaksi-berhasil',
      description: 'Email konfirmasi pembayaran berhasil untuk membership',
      category: 'TRANSACTION',
      type: 'EMAIL',
      roleTarget: 'MEMBER_PREMIUM',
      subject: 'Pembayaran Berhasil - {{invoiceNumber}}',
      content: `Halo {{userName}},

Terima kasih atas pembayaran Anda sebesar {{amount}} untuk paket {{membershipPlan}}.

Nomor Invoice: {{invoiceNumber}}
Tanggal: {{transactionDate}}

Membership Anda telah aktif dan dapat digunakan segera.

Salam hangat,
Tim EksporYuk`,
      ctaText: 'Akses Dashboard',
      ctaLink: 'https://eksporyuk.com/dashboard',
      customBranding: {
        backgroundDesign: 'blue'
      },
      priority: 'HIGH',
      isActive: true,
      isDefault: true,
      previewData: {
        userName: 'John Doe',
        amount: 'Rp 500.000',
        membershipPlan: 'Premium Plan',
        invoiceNumber: 'INV-2025-001',
        transactionDate: '17 Desember 2025'
      }
    }
  })
  
  console.log(`✅ Template 1 dibuat: ${template1.name}`)
  
  // Template 2: Email Transaksi Pending
  const template2 = await prisma.brandedTemplate.create({
    data: {
      name: 'Email Transaksi Pending',
      slug: 'email-transaksi-pending',
      description: 'Email notifikasi pembayaran menunggu konfirmasi',
      category: 'TRANSACTION',
      type: 'EMAIL',
      roleTarget: 'MEMBER_FREE',
      subject: 'Menunggu Pembayaran - {{invoiceNumber}}',
      content: `Halo {{userName}},

Kami telah menerima pesanan Anda untuk paket {{membershipPlan}}.

Nomor Invoice: {{invoiceNumber}}
Total Pembayaran: {{amount}}

Silakan lakukan pembayaran sesuai metode yang Anda pilih. Setelah pembayaran dikonfirmasi, membership Anda akan langsung aktif.

Jika ada pertanyaan, silakan hubungi kami di support@eksporyuk.com

Salam,
Tim EksporYuk`,
      ctaText: 'Lihat Detail Invoice',
      ctaLink: 'https://eksporyuk.com/invoices/{{invoiceNumber}}',
      customBranding: {
        backgroundDesign: 'warm'
      },
      priority: 'NORMAL',
      isActive: true,
      isDefault: false,
      previewData: {
        userName: 'Jane Smith',
        amount: 'Rp 299.000',
        membershipPlan: 'Basic Plan',
        invoiceNumber: 'INV-2025-002'
      }
    }
  })
  
  console.log(`✅ Template 2 dibuat: ${template2.name}`)
  
  // Template 3: Email Transaksi Dibatalkan
  const template3 = await prisma.brandedTemplate.create({
    data: {
      name: 'Email Transaksi Dibatalkan',
      slug: 'email-transaksi-dibatalkan',
      description: 'Email notifikasi transaksi dibatalkan atau expired',
      category: 'TRANSACTION',
      type: 'EMAIL',
      roleTarget: 'ALL',
      subject: 'Transaksi Dibatalkan - {{invoiceNumber}}',
      content: `Halo {{userName}},

Transaksi Anda dengan nomor invoice {{invoiceNumber}} telah dibatalkan.

Paket: {{membershipPlan}}
Total: {{amount}}
Alasan: {{cancelReason}}

Jika ini adalah kesalahan atau Anda ingin mencoba lagi, silakan hubungi tim support kami atau buat pesanan baru.

Terima kasih,
Tim EksporYuk`,
      ctaText: 'Buat Pesanan Baru',
      ctaLink: 'https://eksporyuk.com/membership',
      customBranding: {
        backgroundDesign: 'elegant'
      },
      priority: 'LOW',
      isActive: true,
      isDefault: false,
      previewData: {
        userName: 'Bob Wilson',
        amount: 'Rp 199.000',
        membershipPlan: 'Starter Plan',
        invoiceNumber: 'INV-2025-003',
        cancelReason: 'Pembayaran tidak diterima dalam batas waktu'
      }
    }
  })
  
  console.log(`✅ Template 3 dibuat: ${template3.name}`)
  
  console.log('\n📊 Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Template 1: ${template1.name}`)
  console.log(`  - Slug: ${template1.slug}`)
  console.log(`  - Type: ${template1.type}`)
  console.log(`  - Background: ${template1.customBranding.backgroundDesign}`)
  console.log(`  - Status: ${template1.isActive ? 'Active' : 'Inactive'}`)
  console.log('')
  console.log(`Template 2: ${template2.name}`)
  console.log(`  - Slug: ${template2.slug}`)
  console.log(`  - Type: ${template2.type}`)
  console.log(`  - Background: ${template2.customBranding.backgroundDesign}`)
  console.log(`  - Status: ${template2.isActive ? 'Active' : 'Inactive'}`)
  console.log('')
  console.log(`Template 3: ${template3.name}`)
  console.log(`  - Slug: ${template3.slug}`)
  console.log(`  - Type: ${template3.type}`)
  console.log(`  - Background: ${template3.customBranding.backgroundDesign}`)
  console.log(`  - Status: ${template3.isActive ? 'Active' : 'Inactive'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  console.log('\n✨ Selesai! Template berhasil di-reset dengan text editor sederhana.')
  console.log('💡 Buka /admin/branded-templates untuk melihat hasilnya')
  
  await prisma.$disconnect()
}

resetTemplates().catch(console.error)
