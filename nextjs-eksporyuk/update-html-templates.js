const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Plain text versions of templates
const templateUpdates = {
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
};

async function updateTemplates() {
  console.log('Updating HTML templates to plain text...\n');
  
  for (const [slug, data] of Object.entries(templateUpdates)) {
    try {
      const result = await prisma.brandedTemplate.updateMany({
        where: { slug },
        data: {
          content: data.content,
          ctaText: data.ctaText,
          ctaLink: data.ctaLink
        }
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated: ${slug}`);
      } else {
        console.log(`⚠️ Not found: ${slug}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${slug}:`, error.message);
    }
  }
  
  console.log('\nDone!');
  await prisma.$disconnect();
}

updateTemplates();
