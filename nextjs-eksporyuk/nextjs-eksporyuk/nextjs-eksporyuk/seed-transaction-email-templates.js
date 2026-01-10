const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const templates = [
  {
    name: 'Email Transaksi Berhasil',
    slug: 'transaction-success',
    description: 'Email notifikasi untuk konfirmasi pembayaran berhasil',
    category: 'TRANSACTION',
    type: 'NOTIFICATION',
    roleTarget: 'MEMBER',
    subject: '✅ Pembayaran Berhasil - {{transactionType}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; }
    .content { padding: 30px 20px; }
    .success-badge { background-color: #10b981; color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .info-box { background-color: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #6b7280; font-weight: 500; }
    .info-value { color: #111827; font-weight: 600; text-align: right; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EksporYuk Logo">
    </div>
    
    <div class="content">
      <h2 style="color: #111827; margin-top: 0;">Halo, {{userName}}! 🎉</h2>
      
      <div class="success-badge">✅ Pembayaran Berhasil</div>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Terima kasih! Pembayaran Anda telah kami terima dan dikonfirmasi. Berikut detail transaksinya:
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Nomor Invoice</span>
          <span class="info-value">{{invoiceNumber}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tipe Transaksi</span>
          <span class="info-value">{{transactionType}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Item</span>
          <span class="info-value">{{itemName}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Jumlah Pembayaran</span>
          <span class="info-value" style="color: #10b981; font-size: 18px;">{{amount}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal</span>
          <span class="info-value">{{transactionDate}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metode Pembayaran</span>
          <span class="info-value">{{paymentMethod}}</span>
        </div>
      </div>
      
      <p style="color: #4b5563; line-height: 1.6; margin-top: 20px;">
        {{accessMessage}}
      </p>
      
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="cta-button">
          Akses Dashboard Saya
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Jika ada pertanyaan, silakan hubungi kami di <a href="mailto:{{footerEmail}}" style="color: #667eea;">{{footerEmail}}</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>{{footerCompany}}</strong><br>
      {{footerAddress}}<br>
      Email: <a href="mailto:{{footerEmail}}">{{footerEmail}}</a> | WA: {{footerPhone}}</p>
      <p style="margin-top: 10px;">
        <a href="{{footerWebsite}}">Website</a> | 
        <a href="{{footerInstagram}}">Instagram</a> | 
        <a href="{{footerFacebook}}">Facebook</a>
      </p>
      <p>{{footerCopyright}}</p>
    </div>
  </div>
</body>
</html>`,
    ctaText: 'Akses Dashboard',
    ctaLink: '{{dashboardUrl}}',
    priority: 'HIGH',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: ['transaction', 'payment', 'success', 'confirmation'],
    variables: {
      userName: 'Nama pengguna',
      invoiceNumber: 'Nomor invoice',
      transactionType: 'Tipe transaksi (Membership/Product)',
      itemName: 'Nama membership/product',
      amount: 'Jumlah pembayaran (Rp format)',
      transactionDate: 'Tanggal transaksi',
      paymentMethod: 'Metode pembayaran',
      accessMessage: 'Pesan akses khusus (membership/product)',
      dashboardUrl: 'URL dashboard'
    },
    previewData: {
      userName: 'Budi Santoso',
      invoiceNumber: 'INV-2025-0001',
      transactionType: 'Membership Premium',
      itemName: 'Membership Premium - 1 Tahun',
      amount: 'Rp 999.000',
      transactionDate: '14 Januari 2025, 10:30 WIB',
      paymentMethod: 'Virtual Account BCA',
      accessMessage: 'Akses membership Anda sudah aktif! Silakan login ke dashboard untuk mulai belajar.',
      dashboardUrl: 'https://app.eksporyuk.com/dashboard'
    }
  },
  
  {
    name: 'Email Transaksi Pending',
    slug: 'transaction-pending',
    description: 'Email notifikasi untuk transaksi yang masih menunggu pembayaran',
    category: 'TRANSACTION',
    type: 'NOTIFICATION',
    roleTarget: 'MEMBER',
    subject: '⏳ Menunggu Pembayaran - {{transactionType}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; }
    .content { padding: 30px 20px; }
    .pending-badge { background-color: #f59e0b; color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .info-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #fde68a; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #92400e; font-weight: 500; }
    .info-value { color: #78350f; font-weight: 600; text-align: right; }
    .alert-box { background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .footer a { color: #f59e0b; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EksporYuk Logo">
    </div>
    
    <div class="content">
      <h2 style="color: #111827; margin-top: 0;">Halo, {{userName}}! ⏳</h2>
      
      <div class="pending-badge">⏳ Menunggu Pembayaran</div>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Transaksi Anda telah dibuat dan sedang menunggu pembayaran. Silakan selesaikan pembayaran Anda sebelum batas waktu berakhir.
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Nomor Invoice</span>
          <span class="info-value">{{invoiceNumber}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tipe Transaksi</span>
          <span class="info-value">{{transactionType}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Item</span>
          <span class="info-value">{{itemName}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Jumlah Pembayaran</span>
          <span class="info-value" style="color: #d97706; font-size: 18px;">{{amount}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Batas Pembayaran</span>
          <span class="info-value" style="color: #dc2626;">{{expiryDate}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metode Pembayaran</span>
          <span class="info-value">{{paymentMethod}}</span>
        </div>
      </div>
      
      <div class="alert-box">
        <p style="margin: 0; color: #92400e; font-weight: 500;">
          ⚠️ <strong>Penting:</strong> Transaksi akan otomatis dibatalkan jika pembayaran tidak diterima sebelum {{expiryDate}}
        </p>
      </div>
      
      <p style="color: #4b5563; line-height: 1.6;">
        {{paymentInstructions}}
      </p>
      
      <div style="text-align: center;">
        <a href="{{paymentUrl}}" class="cta-button">
          Lihat Detail Pembayaran
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Butuh bantuan? Hubungi kami di <a href="mailto:{{footerEmail}}" style="color: #f59e0b;">{{footerEmail}}</a> atau WhatsApp {{footerPhone}}
      </p>
    </div>
    
    <div class="footer">
      <p><strong>{{footerCompany}}</strong><br>
      {{footerAddress}}<br>
      Email: <a href="mailto:{{footerEmail}}">{{footerEmail}}</a> | WA: {{footerPhone}}</p>
      <p style="margin-top: 10px;">
        <a href="{{footerWebsite}}">Website</a> | 
        <a href="{{footerInstagram}}">Instagram</a> | 
        <a href="{{footerFacebook}}">Facebook</a>
      </p>
      <p>{{footerCopyright}}</p>
    </div>
  </div>
</body>
</html>`,
    ctaText: 'Lihat Detail Pembayaran',
    ctaLink: '{{paymentUrl}}',
    priority: 'HIGH',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: ['transaction', 'payment', 'pending', 'reminder'],
    variables: {
      userName: 'Nama pengguna',
      invoiceNumber: 'Nomor invoice',
      transactionType: 'Tipe transaksi',
      itemName: 'Nama item',
      amount: 'Jumlah pembayaran',
      expiryDate: 'Batas waktu pembayaran',
      paymentMethod: 'Metode pembayaran',
      paymentInstructions: 'Instruksi pembayaran',
      paymentUrl: 'URL halaman pembayaran'
    },
    previewData: {
      userName: 'Budi Santoso',
      invoiceNumber: 'INV-2025-0001',
      transactionType: 'Membership Premium',
      itemName: 'Membership Premium - 1 Tahun',
      amount: 'Rp 999.000',
      expiryDate: '15 Januari 2025, 23:59 WIB',
      paymentMethod: 'Virtual Account BCA',
      paymentInstructions: 'Silakan transfer ke nomor Virtual Account yang tertera pada halaman pembayaran.',
      paymentUrl: 'https://app.eksporyuk.com/checkout/payment/INV-2025-0001'
    }
  },
  
  {
    name: 'Email Transaksi Dibatalkan',
    slug: 'transaction-failed',
    description: 'Email notifikasi untuk transaksi yang dibatalkan/gagal',
    category: 'TRANSACTION',
    type: 'NOTIFICATION',
    roleTarget: 'MEMBER',
    subject: '❌ Transaksi Dibatalkan - {{transactionType}}',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; }
    .content { padding: 30px 20px; }
    .failed-badge { background-color: #ef4444; color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .info-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #fecaca; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #991b1b; font-weight: 500; }
    .info-value { color: #7f1d1d; font-weight: 600; text-align: right; }
    .reason-box { background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EksporYuk Logo">
    </div>
    
    <div class="content">
      <h2 style="color: #111827; margin-top: 0;">Halo, {{userName}}</h2>
      
      <div class="failed-badge">❌ Transaksi Dibatalkan</div>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Mohon maaf, transaksi Anda telah dibatalkan. Berikut detail transaksinya:
      </p>
      
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Nomor Invoice</span>
          <span class="info-value">{{invoiceNumber}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tipe Transaksi</span>
          <span class="info-value">{{transactionType}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nama Item</span>
          <span class="info-value">{{itemName}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Jumlah</span>
          <span class="info-value">{{amount}}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Pembatalan</span>
          <span class="info-value">{{cancelDate}}</span>
        </div>
      </div>
      
      <div class="reason-box">
        <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: 600;">Alasan Pembatalan:</p>
        <p style="margin: 0; color: #7f1d1d;">{{cancelReason}}</p>
      </div>
      
      <p style="color: #4b5563; line-height: 1.6;">
        Jangan khawatir! Anda masih dapat melakukan pembelian kembali kapan saja. Jika transaksi ini dibatalkan secara tidak sengaja atau ada kesalahan, silakan hubungi tim support kami.
      </p>
      
      <div style="text-align: center;">
        <a href="{{retryUrl}}" class="cta-button">
          Coba Lagi
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
        Butuh bantuan? Hubungi kami:<br>
        📧 <a href="mailto:{{footerEmail}}" style="color: #667eea;">{{footerEmail}}</a> | 
        📱 WhatsApp: {{footerPhone}}
      </p>
    </div>
    
    <div class="footer">
      <p><strong>{{footerCompany}}</strong><br>
      {{footerAddress}}<br>
      Email: <a href="mailto:{{footerEmail}}">{{footerEmail}}</a> | WA: {{footerPhone}}</p>
      <p style="margin-top: 10px;">
        <a href="{{footerWebsite}}">Website</a> | 
        <a href="{{footerInstagram}}">Instagram</a> | 
        <a href="{{footerFacebook}}">Facebook</a>
      </p>
      <p>{{footerCopyright}}</p>
    </div>
  </div>
</body>
</html>`,
    ctaText: 'Coba Lagi',
    ctaLink: '{{retryUrl}}',
    priority: 'MEDIUM',
    isDefault: false,
    isSystem: true,
    isActive: true,
    tags: ['transaction', 'payment', 'failed', 'cancelled'],
    variables: {
      userName: 'Nama pengguna',
      invoiceNumber: 'Nomor invoice',
      transactionType: 'Tipe transaksi',
      itemName: 'Nama item',
      amount: 'Jumlah pembayaran',
      cancelDate: 'Tanggal pembatalan',
      cancelReason: 'Alasan pembatalan',
      retryUrl: 'URL untuk coba lagi'
    },
    previewData: {
      userName: 'Budi Santoso',
      invoiceNumber: 'INV-2025-0001',
      transactionType: 'Membership Premium',
      itemName: 'Membership Premium - 1 Tahun',
      amount: 'Rp 999.000',
      cancelDate: '14 Januari 2025, 15:30 WIB',
      cancelReason: 'Pembayaran tidak diterima dalam batas waktu yang ditentukan (expired)',
      retryUrl: 'https://app.eksporyuk.com/memberships'
    }
  }
]

async function seedTemplates() {
  console.log('🌱 Seeding Transaction Email Templates...\n')
  
  for (const template of templates) {
    try {
      const existing = await prisma.brandedTemplate.findUnique({
        where: { slug: template.slug }
      })
      
      if (existing) {
        // Update existing
        await prisma.brandedTemplate.update({
          where: { slug: template.slug },
          data: template
        })
        console.log(`✅ Updated: ${template.name} (${template.slug})`)
      } else {
        // Create new
        await prisma.brandedTemplate.create({
          data: template
        })
        console.log(`✅ Created: ${template.name} (${template.slug})`)
      }
    } catch (error) {
      console.error(`❌ Failed to seed ${template.slug}:`, error.message)
    }
  }
  
  console.log('\n✨ Email templates seeded successfully!')
  await prisma.$disconnect()
}

seedTemplates().catch((error) => {
  console.error('Error seeding templates:', error)
  process.exit(1)
})
