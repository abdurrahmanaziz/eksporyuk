const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const templates = [
  {
    name: 'Membership Active',
    slug: 'membership-active',
    description: 'Notifikasi membership berhasil diaktifkan',
    type: 'EMAIL',
    subject: 'Selamat! Membership {{membershipName}} Anda Aktif',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Membership Aktif!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Selamat! Membership <strong>{{membershipName}}</strong> Anda telah berhasil diaktifkan.
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                <p style="color: #333333; font-size: 14px; margin: 0 0 10px;"><strong>Detail Membership:</strong></p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">Nama: {{membershipName}}</p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">Berlaku hingga: {{expiryDate}}</p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">Invoice: {{invoiceNumber}}</p>
              </div>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Sekarang Anda dapat menikmati semua benefit membership termasuk akses ke kursus, webinar, dan komunitas eksklusif.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboardUrl}}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Masuk ke Dashboard</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Salam hangat,<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'MEMBERSHIP'
  },
  {
    name: 'Membership Expiring Soon',
    slug: 'membership-expiring',
    description: 'Pengingat membership akan segera expired',
    type: 'EMAIL',
    subject: '⏰ Membership Anda Akan Berakhir dalam {{daysLeft}} Hari',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Perpanjang Membership</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Membership <strong>{{membershipName}}</strong> Anda akan berakhir dalam <strong>{{daysLeft}} hari</strong>.
              </p>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0 0 10px;"><strong>⚠️ Jangan sampai kehilangan akses!</strong></p>
                <p style="color: #856404; font-size: 14px; margin: 5px 0;">Tanggal berakhir: {{expiryDate}}</p>
              </div>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Perpanjang sekarang untuk tetap menikmati semua benefit membership tanpa gangguan.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{renewUrl}}" style="display: inline-block; background-color: #f5576c; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Perpanjang Sekarang</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Butuh bantuan? Hubungi support kami.<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'MEMBERSHIP'
  },
  {
    name: 'Event Ticket Confirmed',
    slug: 'event-ticket-confirmed',
    description: 'Konfirmasi tiket event berhasil dibeli',
    type: 'EMAIL',
    subject: '🎟️ Tiket {{eventName}} Anda Telah Dikonfirmasi',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎟️ Tiket Terkonfirmasi</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Tiket Anda untuk <strong>{{eventName}}</strong> telah dikonfirmasi!
              </p>
              <div style="background-color: #e7f3ff; border: 2px dashed #4facfe; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #333333; font-size: 14px; margin: 0 0 10px;"><strong>Detail Event:</strong></p>
                <p style="color: #666666; font-size: 16px; margin: 5px 0;"><strong>{{eventName}}</strong></p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">📅 {{eventDate}}</p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">🕐 {{eventTime}}</p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">📍 {{eventLocation}}</p>
                <div style="margin: 20px 0;">
                  <p style="color: #333333; font-size: 12px; margin: 5px 0;">Kode Tiket:</p>
                  <p style="color: #4facfe; font-size: 24px; font-weight: bold; margin: 5px 0; letter-spacing: 2px;">{{ticketCode}}</p>
                </div>
              </div>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Simpan email ini sebagai bukti pendaftaran. Tunjukkan kode tiket saat check-in.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{ticketUrl}}" style="display: inline-block; background-color: #4facfe; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Lihat Tiket Digital</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Sampai jumpa di event!<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'EVENT'
  },
  {
    name: 'Credit Top Up Success',
    slug: 'credit-topup-success',
    description: 'Konfirmasi top up kredit berhasil',
    type: 'EMAIL',
    subject: '✅ Top Up Kredit Berhasil - Rp {{amount}}',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Top Up Berhasil</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Top up kredit Anda sebesar <strong>Rp {{amount}}</strong> telah berhasil diproses!
              </p>
              <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0;">
                <p style="color: #155724; font-size: 14px; margin: 0 0 10px;"><strong>Detail Transaksi:</strong></p>
                <p style="color: #155724; font-size: 14px; margin: 5px 0;">Jumlah: Rp {{amount}}</p>
                <p style="color: #155724; font-size: 14px; margin: 5px 0;">Saldo Sebelum: Rp {{previousBalance}}</p>
                <p style="color: #155724; font-size: 14px; margin: 5px 0;">Saldo Sekarang: Rp {{newBalance}}</p>
                <p style="color: #155724; font-size: 14px; margin: 5px 0;">Tanggal: {{date}}</p>
                <p style="color: #155724; font-size: 14px; margin: 5px 0;">Invoice: {{invoiceNumber}}</p>
              </div>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Kredit Anda sudah dapat digunakan untuk melakukan transaksi di platform EksporYuk.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{walletUrl}}" style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Lihat Wallet</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Terima kasih,<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'TRANSACTION'
  },
  {
    name: 'Payout Approved',
    slug: 'payout-approved',
    description: 'Notifikasi pencairan dana disetujui',
    type: 'EMAIL',
    subject: '💰 Pencairan Dana Disetujui - Rp {{amount}}',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💰 Pencairan Disetujui</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Permintaan pencairan dana Anda sebesar <strong>Rp {{amount}}</strong> telah disetujui!
              </p>
              <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 20px; margin: 20px 0;">
                <p style="color: #0c5460; font-size: 14px; margin: 0 0 10px;"><strong>Detail Pencairan:</strong></p>
                <p style="color: #0c5460; font-size: 14px; margin: 5px 0;">Jumlah: Rp {{amount}}</p>
                <p style="color: #0c5460; font-size: 14px; margin: 5px 0;">Metode: {{payoutMethod}}</p>
                <p style="color: #0c5460; font-size: 14px; margin: 5px 0;">Nomor Rekening: {{accountNumber}}</p>
                <p style="color: #0c5460; font-size: 14px; margin: 5px 0;">Nama Bank: {{bankName}}</p>
                <p style="color: #0c5460; font-size: 14px; margin: 5px 0;">Atas Nama: {{accountName}}</p>
                <p style="color: #0c5460; font-size: 14px; margin: 5px 0;">Ref: {{referenceNumber}}</p>
              </div>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0;">
                  ⏱️ Dana akan diproses dalam 1-3 hari kerja
                </p>
              </div>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Anda akan menerima notifikasi setelah dana berhasil ditransfer ke rekening Anda.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{transactionUrl}}" style="display: inline-block; background-color: #fa709a; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Lihat Detail Transaksi</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Terima kasih atas kepercayaan Anda,<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'PAYOUT'
  },
  {
    name: 'Membership Upgrade Prompt',
    slug: 'membership-upgrade-prompt',
    description: 'Promosi upgrade membership untuk member free',
    type: 'EMAIL',
    subject: '🚀 Upgrade ke Premium dan Raih Lebih Banyak Manfaat!',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚀 Upgrade ke Premium</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Sudah {{daysSinceJoin}} hari Anda bergabung dengan EksporYuk! Kami harap Anda menikmati pengalaman belajar bersama kami.
              </p>
              <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #333333; font-size: 16px; margin: 0 0 15px;"><strong>Dengan upgrade ke Premium, Anda akan mendapatkan:</strong></p>
                <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>✅ Akses ke semua kursus dan materi pembelajaran</li>
                  <li>✅ Webinar eksklusif dengan mentor berpengalaman</li>
                  <li>✅ Komunitas premium untuk networking</li>
                  <li>✅ Sertifikat untuk setiap kursus yang diselesaikan</li>
                  <li>✅ Konsultasi 1-on-1 dengan mentor</li>
                  <li>✅ Akses ke template dan tools eksklusif</li>
                </ul>
              </div>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; font-size: 14px; margin: 0;">
                  🎁 <strong>Special Offer:</strong> {{discountText}}
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{upgradeUrl}}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Upgrade Sekarang</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Investasi terbaik adalah investasi pada diri sendiri!<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.<br>
                <a href="{{unsubscribeUrl}}" style="color: #999999; text-decoration: underline;">Berhenti menerima email promosi</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'MARKETING'
  },
  {
    name: 'Event Reminder',
    slug: 'event-reminder',
    description: 'Pengingat event akan segera dimulai',
    type: 'EMAIL',
    subject: '🔔 Reminder: {{eventName}} Dimulai {{timeUntilEvent}}',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔔 Reminder Event</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Halo <strong>{{userName}}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Ini pengingat bahwa event <strong>{{eventName}}</strong> akan dimulai {{timeUntilEvent}}!
              </p>
              <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
                <p style="color: #333333; font-size: 14px; margin: 0 0 10px;"><strong>📅 Detail Event:</strong></p>
                <p style="color: #666666; font-size: 16px; margin: 5px 0;"><strong>{{eventName}}</strong></p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">📅 {{eventDate}}</p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">🕐 {{eventTime}}</p>
                <p style="color: #666666; font-size: 14px; margin: 5px 0;">📍 {{eventLocation}}</p>
              </div>
              <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0;">
                <p style="color: #0c5460; font-size: 14px; margin: 0;">
                  💡 <strong>Tips:</strong> Siapkan pertanyaan Anda dan jangan lupa bawa notebook untuk mencatat!
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{eventUrl}}" style="display: inline-block; background-color: #f5576c; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">Lihat Detail Event</a>
              </div>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Sampai jumpa di event!<br>
                <strong>Tim EksporYuk</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 EksporYuk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    isActive: true,
    category: 'EVENT'
  }
]

async function main() {
  console.log('\n🚀 Creating remaining email templates...\n')
  
  let created = 0
  let skipped = 0
  
  for (const tmpl of templates) {
    try {
      const existing = await prisma.brandedTemplate.findUnique({ 
        where: { slug: tmpl.slug } 
      })
      
      if (existing) {
        console.log(`⏭️  Skip: ${tmpl.name} (already exists)`)
        skipped++
        continue
      }
      
      await prisma.brandedTemplate.create({ data: tmpl })
      console.log(`✅ Created: ${tmpl.name}`)
      created++
    } catch (error) {
      console.error(`❌ Error creating ${tmpl.name}:`, error.message)
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📝 Total templates: ${templates.length}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
