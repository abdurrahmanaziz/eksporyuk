const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailTemplates = [
  // ========== AUTHENTICATION & ONBOARDING ==========
  {
    id: 'welcome_email',
    name: 'Welcome Email - Pendaftaran Baru',
    subject: 'Selamat Datang di EksporYuk! 🎉',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .feature-item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Selamat Datang! 🎉</h1>
      <p>Terima kasih telah bergabung dengan EksporYuk</p>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Selamat! Akun Anda telah berhasil dibuat. Kami sangat senang Anda bergabung dengan komunitas EksporYuk.</p>
      
      <div class="features">
        <h3>Yang Bisa Anda Lakukan:</h3>
        <div class="feature-item">✅ Akses kelas-kelas ekspor berkualitas</div>
        <div class="feature-item">✅ Download template dokumen ekspor</div>
        <div class="feature-item">✅ Konsultasi dengan mentor berpengalaman</div>
        <div class="feature-item">✅ Bergabung dengan komunitas eksportir</div>
      </div>
      
      <center>
        <a href="{dashboardUrl}" class="button">Mulai Belajar Sekarang</a>
      </center>
      
      <p>Jika ada pertanyaan, jangan ragu untuk menghubungi tim support kami.</p>
      
      <p>Salam hangat,<br><strong>Tim EksporYuk</strong></p>
    </div>
    <div class="footer">
      <p>Email ini dikirim ke {email}</p>
      <p>&copy; 2024 EksporYuk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'email', 'dashboardUrl']),
    isActive: true
  },
  
  {
    id: 'email_verification',
    name: 'Email Verification - Verifikasi Email',
    subject: 'Verifikasi Email Anda - EksporYuk',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .code-box { background: #f5f5f5; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verifikasi Email Anda</h1>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Untuk melengkapi pendaftaran Anda, silakan verifikasi alamat email Anda dengan klik tombol di bawah ini:</p>
      
      <center>
        <a href="{verificationUrl}" class="button">Verifikasi Email Saya</a>
      </center>
      
      <p>Atau gunakan kode verifikasi berikut:</p>
      
      <div class="code-box">{verificationCode}</div>
      
      <div class="warning">
        <strong>⚠️ Penting:</strong> Link ini akan expired dalam 24 jam. Jika tidak melakukan verifikasi, mohon daftar ulang.
      </div>
      
      <p>Jika Anda tidak mendaftar di EksporYuk, abaikan email ini.</p>
      
      <p>Terima kasih,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'verificationUrl', 'verificationCode']),
    isActive: true
  },
  
  {
    id: 'password_reset',
    name: 'Password Reset - Reset Password',
    subject: 'Reset Password Anda - EksporYuk',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .button { display: inline-block; background: #dc3545; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
    .security { background: #ffe7e7; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Password</h1>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah untuk membuat password baru:</p>
      
      <center>
        <a href="{resetUrl}" class="button">Reset Password Saya</a>
      </center>
      
      <div class="info-box">
        <strong>ℹ️ Info:</strong> Link ini akan expired dalam 1 jam untuk keamanan akun Anda.
      </div>
      
      <div class="security">
        <strong>🛡️ Keamanan:</strong>
        <ul>
          <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
          <li>Password Anda masih aman dan tidak berubah</li>
          <li>Jangan bagikan link ini ke siapapun</li>
        </ul>
      </div>
      
      <p>Butuh bantuan? Hubungi support kami.</p>
      
      <p>Salam,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'resetUrl']),
    isActive: true
  },

  // ========== MEMBERSHIP & UPGRADE ==========
  {
    id: 'membership_welcome',
    name: 'Membership Welcome - Selamat Datang Member',
    subject: '🎊 Selamat! Anda Sekarang Member {membershipName}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .badge { background: #ffd700; color: #333; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .benefits { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { padding: 12px; background: white; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f5576c; }
    .button { display: inline-block; background: #f5576c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #999; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎊 Selamat!</h1>
      <div class="badge">{membershipName}</div>
      <p>Anda sekarang adalah member premium kami</p>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Selamat! Aktivasi membership <strong>{membershipName}</strong> Anda telah berhasil. Anda sekarang dapat menikmati semua benefit eksklusif kami.</p>
      
      <div class="benefits">
        <h3>✨ Benefit Membership Anda:</h3>
        <div class="benefit-item">🎓 Akses semua kelas ekspor premium</div>
        <div class="benefit-item">📚 Download semua template & tools</div>
        <div class="benefit-item">👥 Akses grup eksklusif member</div>
        <div class="benefit-item">💬 Konsultasi 1-on-1 dengan mentor</div>
        <div class="benefit-item">🎁 Bonus konten & webinar eksklusif</div>
        <div class="benefit-item">⚡ Priority support 24/7</div>
      </div>
      
      <p><strong>Masa Aktif:</strong> {expiryDate}</p>
      
      <center>
        <a href="{memberAreaUrl}" class="button">Akses Member Area</a>
      </center>
      
      <p>Mulai maksimalkan membership Anda sekarang dan raih kesuksesan di bisnis ekspor!</p>
      
      <p>Salam sukses,<br><strong>Tim EksporYuk</strong></p>
    </div>
    <div class="footer">
      <p>Email: {email} | Membership: {membershipName}</p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'email', 'membershipName', 'expiryDate', 'memberAreaUrl']),
    isActive: true
  },

  {
    id: 'membership_expiring',
    name: 'Membership Expiring - Membership Akan Berakhir',
    subject: '⏰ Membership Anda Akan Berakhir Dalam {daysLeft} Hari',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .countdown { background: white; color: #ff9800; padding: 20px; border-radius: 10px; font-size: 48px; font-weight: bold; margin: 20px 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .warning-box { background: #fff3cd; border: 2px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Perpanjang Membership Anda</h1>
      <div class="countdown">{daysLeft} HARI</div>
      <p>Membership Anda akan berakhir</p>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Membership <strong>{membershipName}</strong> Anda akan berakhir pada <strong>{expiryDate}</strong>.</p>
      
      <div class="warning-box">
        <h3>⚠️ Yang Akan Anda Lewatkan:</h3>
        <ul>
          <li>❌ Akses ke semua kelas premium</li>
          <li>❌ Download template & tools</li>
          <li>❌ Konsultasi dengan mentor</li>
          <li>❌ Akses ke komunitas eksklusif</li>
        </ul>
      </div>
      
      <p><strong>Perpanjang sekarang dan dapatkan:</strong></p>
      <ul>
        <li>✅ Diskon 20% untuk perpanjangan</li>
        <li>✅ Bonus akses ke kelas baru</li>
        <li>✅ Tidak ada gangguan pembelajaran</li>
      </ul>
      
      <center>
        <a href="{renewUrl}" class="button">Perpanjang Membership</a>
      </center>
      
      <p>Jangan sampai kehilangan akses ke semua benefit yang sudah Anda nikmati!</p>
      
      <p>Salam,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'membershipName', 'expiryDate', 'daysLeft', 'renewUrl']),
    isActive: true
  },

  {
    id: 'membership_expired',
    name: 'Membership Expired - Membership Berakhir',
    subject: '😔 Membership Anda Telah Berakhir - Mari Aktifkan Kembali',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6c757d; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .expired-box { background: #f8f9fa; border: 2px dashed #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .offer-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>😔 Membership Berakhir</h1>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <div class="expired-box">
        <h3>Membership Anda Telah Berakhir</h3>
        <p><strong>{membershipName}</strong></p>
        <p>Berakhir pada: {expiryDate}</p>
      </div>
      
      <p>Kami berharap Anda menikmati manfaat membership selama ini. Kami rindu memiliki Anda sebagai bagian dari komunitas premium kami!</p>
      
      <div class="offer-box">
        <h3>🎁 PENAWARAN KHUSUS UNTUK ANDA</h3>
        <p><strong>Reaktivasi sekarang dan dapatkan:</strong></p>
        <ul>
          <li>💰 Diskon 30% untuk bulan pertama</li>
          <li>🎓 Bonus akses 3 kelas premium baru</li>
          <li>📚 Free download 10 template eksklusif</li>
          <li>⚡ Priority support selama 3 bulan</li>
        </ul>
        <p><strong>Penawaran terbatas hanya 7 hari!</strong></p>
      </div>
      
      <center>
        <a href="{reactivateUrl}" class="button">Aktifkan Kembali Sekarang</a>
      </center>
      
      <p>Kami tunggu kembalinya Anda di komunitas EksporYuk!</p>
      
      <p>Salam hangat,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'membershipName', 'expiryDate', 'reactivateUrl']),
    isActive: true
  },

  {
    id: 'membership_upgrade',
    name: 'Membership Upgrade - Upgrade Membership',
    subject: '🚀 Upgrade ke {newMembershipName} dan Dapatkan Lebih Banyak Benefit',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .comparison { display: flex; gap: 20px; margin: 20px 0; }
    .plan { flex: 1; padding: 20px; border-radius: 8px; }
    .current-plan { background: #f8f9fa; border: 2px solid #6c757d; }
    .new-plan { background: #e7f3ff; border: 2px solid #667eea; }
    .feature-list { margin: 15px 0; }
    .feature-list li { padding: 8px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Saatnya Upgrade!</h1>
      <p>Dapatkan akses lebih banyak dengan {newMembershipName}</p>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Anda sudah merasakan manfaat membership kami. Sekarang saatnya upgrade ke level berikutnya!</p>
      
      <h3>📊 Perbandingan Membership:</h3>
      
      <table width="100%" border="1" cellpadding="10" style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <th>Fitur</th>
          <th>Plan Sekarang</th>
          <th>{newMembershipName}</th>
        </tr>
        <tr>
          <td>Jumlah Kelas</td>
          <td>{currentFeatures}</td>
          <td><strong>{newFeatures}</strong> ✨</td>
        </tr>
        <tr>
          <td>Konsultasi Mentor</td>
          <td>Terbatas</td>
          <td><strong>Unlimited</strong> ✨</td>
        </tr>
        <tr>
          <td>Download Template</td>
          <td>10 per bulan</td>
          <td><strong>Unlimited</strong> ✨</td>
        </tr>
        <tr>
          <td>Grup Eksklusif</td>
          <td>-</td>
          <td><strong>✓</strong> ✨</td>
        </tr>
        <tr>
          <td>Priority Support</td>
          <td>-</td>
          <td><strong>✓</strong> ✨</td>
        </tr>
      </table>
      
      <center>
        <a href="{upgradeUrl}" class="button">Upgrade Sekarang</a>
      </center>
      
      <p>Investasi terbaik untuk bisnis ekspor Anda!</p>
      
      <p>Salam sukses,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'newMembershipName', 'currentFeatures', 'newFeatures', 'upgradeUrl']),
    isActive: true
  },

  // ========== PAYMENT & TRANSACTIONS ==========
  {
    id: 'payment_invoice',
    name: 'Payment Invoice - Invoice Pembayaran',
    subject: '🧾 Invoice #{invoiceId} - Menunggu Pembayaran',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .invoice-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 15px; }
    .invoice-details { margin: 20px 0; }
    .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .total-row { background: #f8f9fa; padding: 15px; font-size: 20px; font-weight: bold; margin-top: 10px; border-radius: 5px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧾 INVOICE</h1>
      <p>#{invoiceId}</p>
    </div>
    
    <div class="invoice-box">
      <div class="invoice-header">
        <div>
          <strong>Kepada:</strong><br>
          {name}<br>
          {email}
        </div>
        <div style="text-align: right;">
          <strong>Tanggal:</strong> {date}<br>
          <strong>Jatuh Tempo:</strong> {dueDate}
        </div>
      </div>
      
      <div class="invoice-details">
        <h3>Detail Pembelian:</h3>
        <div class="invoice-row">
          <span>{productName}</span>
          <span><strong>Rp {amount}</strong></span>
        </div>
        
        {discountInfo}
        
        <div class="total-row">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL PEMBAYARAN</span>
            <span>Rp {totalAmount}</span>
          </div>
        </div>
      </div>
      
      <div class="info-box">
        <strong>⏰ Batas Waktu Pembayaran:</strong><br>
        Invoice ini akan expired dalam <strong>24 jam</strong>. Mohon segera lakukan pembayaran agar tidak kehilangan akses.
      </div>
      
      <center>
        <a href="{paymentUrl}" class="button">Bayar Sekarang</a>
      </center>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        Jika ada pertanyaan tentang invoice ini, silakan hubungi support kami.<br>
        Terima kasih telah mempercayai EksporYuk!
      </p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['invoiceId', 'name', 'email', 'date', 'dueDate', 'productName', 'amount', 'discountInfo', 'totalAmount', 'paymentUrl']),
    isActive: true
  },

  {
    id: 'payment_success',
    name: 'Payment Success - Pembayaran Berhasil',
    subject: '✅ Pembayaran Berhasil - Terima Kasih!',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .checkmark { font-size: 64px; margin: 20px 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .receipt { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .next-steps { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✅</div>
      <h1>Pembayaran Berhasil!</h1>
      <p>Terima kasih atas pembayaran Anda</p>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Pembayaran Anda telah berhasil diproses. Berikut detail transaksinya:</p>
      
      <div class="receipt">
        <h3>🧾 Detail Transaksi</h3>
        <div class="receipt-row">
          <span>ID Transaksi</span>
          <span><strong>{transactionId}</strong></span>
        </div>
        <div class="receipt-row">
          <span>Produk</span>
          <span>{productName}</span>
        </div>
        <div class="receipt-row">
          <span>Tanggal</span>
          <span>{date}</span>
        </div>
        <div class="receipt-row">
          <span>Metode Pembayaran</span>
          <span>{paymentMethod}</span>
        </div>
        <div class="receipt-row" style="font-size: 18px; font-weight: bold; border: none; padding-top: 15px;">
          <span>Total Dibayar</span>
          <span>Rp {amount}</span>
        </div>
      </div>
      
      <div class="next-steps">
        <h3>📝 Langkah Selanjutnya:</h3>
        <ol>
          <li>Akses produk yang telah Anda beli</li>
          <li>Download invoice untuk arsip Anda</li>
          <li>Mulai belajar dan kembangkan bisnis ekspor Anda</li>
        </ol>
      </div>
      
      <center>
        <a href="{accessUrl}" class="button">Akses Produk Saya</a>
      </center>
      
      <p>Jika ada pertanyaan, jangan ragu untuk menghubungi kami.</p>
      
      <p>Terima kasih dan selamat belajar!<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'transactionId', 'productName', 'date', 'paymentMethod', 'amount', 'accessUrl']),
    isActive: true
  },

  {
    id: 'payment_failed',
    name: 'Payment Failed - Pembayaran Gagal',
    subject: '❌ Pembayaran Gagal - Silakan Coba Lagi',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .error-box { background: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .help-box { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Pembayaran Gagal</h1>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Maaf, pembayaran Anda tidak dapat diproses.</p>
      
      <div class="error-box">
        <h3>Detail Masalah:</h3>
        <p><strong>ID Transaksi:</strong> {transactionId}</p>
        <p><strong>Alasan:</strong> {failureReason}</p>
        <p><strong>Produk:</strong> {productName}</p>
        <p><strong>Jumlah:</strong> Rp {amount}</p>
      </div>
      
      <div class="help-box">
        <h3>💡 Yang Bisa Anda Lakukan:</h3>
        <ul>
          <li>✓ Pastikan saldo rekening mencukupi</li>
          <li>✓ Periksa limit kartu kredit Anda</li>
          <li>✓ Coba metode pembayaran lain</li>
          <li>✓ Hubungi bank Anda jika masalah berlanjut</li>
        </ul>
      </div>
      
      <center>
        <a href="{retryUrl}" class="button">Coba Bayar Lagi</a>
      </center>
      
      <p>Butuh bantuan? Tim support kami siap membantu Anda 24/7.</p>
      
      <p>Salam,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'transactionId', 'failureReason', 'productName', 'amount', 'retryUrl']),
    isActive: true
  },

  // ========== PRODUCTS & COURSES ==========
  {
    id: 'course_enrollment',
    name: 'Course Enrollment - Pendaftaran Kelas',
    subject: '🎓 Selamat! Anda Terdaftar di Kelas {courseName}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .course-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .timeline { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Selamat Bergabung!</h1>
      <p>Anda telah terdaftar di kelas</p>
      <h2>{courseName}</h2>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Selamat! Anda telah berhasil mendaftar di kelas <strong>{courseName}</strong>. Persiapkan diri Anda untuk pengalaman belajar yang luar biasa!</p>
      
      <div class="course-info">
        <h3>📚 Info Kelas:</h3>
        <p><strong>Instruktur:</strong> {instructorName}</p>
        <p><strong>Durasi:</strong> {duration}</p>
        <p><strong>Level:</strong> {level}</p>
        <p><strong>Total Materi:</strong> {totalLessons} pelajaran</p>
      </div>
      
      <div class="timeline">
        <h3>🚀 Langkah Pertama:</h3>
        <ol>
          <li>Akses dashboard kelas Anda</li>
          <li>Download materi persiapan</li>
          <li>Bergabung dengan grup diskusi</li>
          <li>Mulai pelajaran pertama</li>
        </ol>
      </div>
      
      <center>
        <a href="{courseUrl}" class="button">Mulai Belajar Sekarang</a>
      </center>
      
      <p>Jangan lupa untuk aktif di forum diskusi dan bertanya jika ada yang tidak dipahami!</p>
      
      <p>Selamat belajar,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'courseName', 'instructorName', 'duration', 'level', 'totalLessons', 'courseUrl']),
    isActive: true
  },

  {
    id: 'product_download_ready',
    name: 'Product Download - Produk Siap Diunduh',
    subject: '📦 Produk Anda Siap Diunduh',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .download-box { background: #d4edda; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Produk Siap!</h1>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Produk digital Anda telah siap untuk diunduh!</p>
      
      <div class="download-box">
        <h3>📥 {productName}</h3>
        <p><strong>Format:</strong> {format}</p>
        <p><strong>Ukuran:</strong> {fileSize}</p>
        <p><strong>Masa Akses:</strong> {accessPeriod}</p>
      </div>
      
      <center>
        <a href="{downloadUrl}" class="button">Download Sekarang</a>
      </center>
      
      <div class="info">
        <strong>ℹ️ Catatan Penting:</strong>
        <ul>
          <li>Link download berlaku selama 30 hari</li>
          <li>Anda dapat download maksimal 3x</li>
          <li>Simpan file di tempat yang aman</li>
        </ul>
      </div>
      
      <p>Jika ada kendala saat download, hubungi support kami.</p>
      
      <p>Terima kasih,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'productName', 'format', 'fileSize', 'accessPeriod', 'downloadUrl']),
    isActive: true
  },

  // ========== AFFILIATE PROGRAM ==========
  {
    id: 'affiliate_welcome',
    name: 'Affiliate Welcome - Selamat Datang Affiliator',
    subject: '🤝 Selamat Bergabung dengan Program Affiliate EksporYuk',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .commission-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .code-box { background: #f8f9fa; border: 2px dashed #667eea; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
    .button { display: inline-block; background: #f5576c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤝 Selamat Datang Affiliator!</h1>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <p>Selamat! Anda sekarang adalah bagian dari Program Affiliate EksporYuk. Saatnya mulai menghasilkan passive income!</p>
      
      <div class="commission-box">
        <h2>💰 Komisi Anda</h2>
        <h1 style="font-size: 48px; margin: 10px 0;">{commissionRate}%</h1>
        <p>dari setiap penjualan yang Anda referensikan</p>
      </div>
      
      <h3>🔗 Kode Affiliate Anda:</h3>
      <div class="code-box">{affiliateCode}</div>
      
      <h3>📊 Yang Bisa Anda Lakukan:</h3>
      <ul>
        <li>✅ Promosikan produk & kelas EksporYuk</li>
        <li>✅ Dapatkan komisi dari setiap penjualan</li>
        <li>✅ Track performa di dashboard affiliate</li>
        <li>✅ Withdraw komisi setiap bulan</li>
      </ul>
      
      <center>
        <a href="{affiliateDashboard}" class="button">Akses Dashboard Affiliate</a>
      </center>
      
      <p>Mulai bagikan link affiliate Anda dan raih penghasilan tambahan!</p>
      
      <p>Salam sukses,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'affiliateCode', 'commissionRate', 'affiliateDashboard']),
    isActive: true
  },

  {
    id: 'affiliate_commission_earned',
    name: 'Affiliate Commission - Komisi Didapat',
    subject: '💰 Selamat! Anda Dapat Komisi Rp {commissionAmount}',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .amount-box { background: #d4edda; border: 3px solid #28a745; padding: 30px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .content { background: white; padding: 30px; border: 1px solid #ddd; }
    .stats { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Selamat!</h1>
      <p>Anda mendapatkan komisi baru</p>
    </div>
    <div class="content">
      <p>Halo <strong>{name}</strong>,</p>
      
      <div class="amount-box">
        <h3>Komisi yang Anda Dapatkan:</h3>
        <h1 style="font-size: 48px; color: #28a745; margin: 10px 0;">Rp {commissionAmount}</h1>
      </div>
      
      <p>Seseorang baru saja membeli produk menggunakan link affiliate Anda!</p>
      
      <div class="stats">
        <h3>📊 Detail Transaksi:</h3>
        <p><strong>Produk:</strong> {productName}</p>
        <p><strong>Harga Jual:</strong> Rp {saleAmount}</p>
        <p><strong>Rate Komisi:</strong> {commissionRate}%</p>
        <p><strong>Tanggal:</strong> {date}</p>
      </div>
      
      <p><strong>Total Komisi Bulan Ini:</strong> Rp {monthlyTotal}</p>
      
      <center>
        <a href="{affiliateDashboard}" class="button">Lihat Dashboard</a>
      </center>
      
      <p>Terus promosikan dan tingkatkan penghasilan Anda!</p>
      
      <p>Salam sukses,<br><strong>Tim EksporYuk</strong></p>
    </div>
  </div>
</body>
</html>`,
    variables: JSON.stringify(['name', 'commissionAmount', 'productName', 'saleAmount', 'commissionRate', 'date', 'monthlyTotal', 'affiliateDashboard']),
    isActive: true
  }
];

async function main() {
  console.log('🌱 Seeding email templates...');
  
  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { id: template.id },
      update: template,
      create: template,
    });
    console.log(`✅ Created/Updated: ${template.name}`);
  }
  
  console.log('\n✨ Email templates seeded successfully!');
  console.log(`📧 Total templates: ${emailTemplates.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
