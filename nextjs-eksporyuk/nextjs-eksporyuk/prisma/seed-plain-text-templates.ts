import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Plain text versions of templates (converted from HTML)
const templateUpdates: Record<string, { content: string; ctaText: string; ctaLink: string }> = {
  'affiliate-commission-received': {
    content: `Halo {name},

Selamat! Anda baru saja mendapatkan komisi affiliate.

Detail Komisi:
• Jumlah: Rp {commission.amount}
• Produk: {commission.product}
• Tanggal: {commission.date}
• Status: {commission.status}

Total komisi yang sudah Anda dapatkan: Rp {commission.total}

Terima kasih sudah menjadi affiliate kami!`,
    ctaText: 'Lihat Dashboard Affiliate',
    ctaLink: '{links.affiliate}'
  },
  
  'mentor-commission-received': {
    content: `Halo {name},

Selamat! Anda baru saja mendapatkan komisi mentor.

Detail Komisi:
• Jumlah: Rp {commission.amount}
• Dari: {commission.student}
• Kelas: {commission.course}
• Tanggal: {commission.date}

Total komisi yang sudah Anda dapatkan: Rp {commission.total}

Terima kasih atas dedikasi Anda sebagai mentor!`,
    ctaText: 'Lihat Dashboard Mentor',
    ctaLink: '{links.mentor}'
  },
  
  'admin-fee-pending': {
    content: `Halo Admin,

Ada pendapatan baru yang menunggu persetujuan.

Detail Transaksi:
• ID Transaksi: {transaction.id}
• Jumlah: Rp {transaction.amount}
• Tipe: Admin Fee (15%)
• Dari: {transaction.source}
• Tanggal: {transaction.date}

Silakan review dan setujui pendapatan ini di dashboard admin.`,
    ctaText: 'Review Pendapatan',
    ctaLink: '{links.admin}'
  },
  
  'founder-share-pending': {
    content: `Halo {name},

Ada pembagian pendapatan baru yang menunggu persetujuan.

Detail Pembagian:
• ID Transaksi: {transaction.id}
• Jumlah: Rp {transaction.amount}
• Tipe: {transaction.type}
• Dari: {transaction.source}
• Tanggal: {transaction.date}

Pendapatan ini akan ditambahkan ke saldo Anda setelah disetujui oleh admin.`,
    ctaText: 'Lihat Detail',
    ctaLink: '{links.dashboard}'
  },
  
  'pending-revenue-approved': {
    content: `Halo {name},

Pendapatan Anda telah disetujui!

Detail:
• ID: {revenue.id}
• Jumlah: Rp {revenue.amount}
• Tipe: {revenue.type}
• Tanggal Approval: {revenue.approvedAt}

Dana sudah ditambahkan ke saldo Anda dan siap untuk ditarik.

Saldo Anda saat ini: Rp {wallet.balance}`,
    ctaText: 'Lihat Saldo',
    ctaLink: '{links.wallet}'
  },
  
  'pending-revenue-rejected': {
    content: `Halo {name},

Mohon maaf, pendapatan Anda tidak dapat disetujui.

Detail:
• ID: {revenue.id}
• Jumlah: Rp {revenue.amount}
• Tipe: {revenue.type}
• Alasan: {revenue.reason}

Jika Anda merasa ada kesalahan, silakan hubungi tim support kami.`,
    ctaText: 'Hubungi Support',
    ctaLink: '{links.support}'
  },
  
  'commission-settings-changed': {
    content: `Notifikasi Admin,

Pengaturan komisi telah diubah.

Perubahan:
• Diubah oleh: {admin.name}
• Tanggal: {change.date}
• Detail: {change.description}

Pengaturan baru:
• Komisi Affiliate: {settings.affiliateRate}%
• Komisi Mentor: {settings.mentorRate}%
• Admin Fee: {settings.adminFee}%

Silakan review perubahan ini untuk memastikan sesuai kebijakan.`,
    ctaText: 'Lihat Pengaturan',
    ctaLink: '{links.settings}'
  }
}

async function updateHtmlTemplatesToPlainText() {
  console.log('🔄 Converting HTML templates to plain text...\n')
  
  for (const [slug, data] of Object.entries(templateUpdates)) {
    try {
      // Check if template has HTML content
      const existing = await prisma.brandedTemplate.findFirst({
        where: { slug }
      })
      
      if (!existing) {
        console.log(`⚠️ Template not found: ${slug}`)
        continue
      }
      
      // Only update if current content contains HTML
      if (existing.content.includes('<!DOCTYPE') || existing.content.includes('<html')) {
        const result = await prisma.brandedTemplate.updateMany({
          where: { slug },
          data: {
            content: data.content,
            ctaText: data.ctaText,
            ctaLink: data.ctaLink
          }
        })
        
        console.log(`✅ Updated: ${slug}`)
      } else {
        console.log(`⏭️ Already plain text: ${slug}`)
      }
    } catch (error: any) {
      console.error(`❌ Error updating ${slug}:`, error.message)
    }
  }
  
  console.log('\n✅ Done!')
}

// Run if called directly
updateHtmlTemplatesToPlainText()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

export { updateHtmlTemplatesToPlainText }
