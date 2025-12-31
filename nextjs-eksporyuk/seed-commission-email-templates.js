#!/usr/bin/env node

/**
 * Seed Commission Notification Email Templates
 * Creates email templates for:
 * - Affiliate Commission Received
 * - Mentor Commission Received
 * - Event Creator Commission Received
 * - Admin Fee Pending
 * - Founder Share Pending
 * - Co-Founder Share Pending
 * - Pending Revenue Approved
 * - Pending Revenue Rejected
 * - Commission Settings Changed (for Admins)
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const templates = [
  // ==================== AFFILIATE COMMISSION ====================
  {
    name: 'Affiliate Commission Received',
    slug: 'affiliate-commission-received',
    category: 'AFFILIATE',
    type: 'EMAIL',
    roleTarget: 'AFFILIATE',
    subject: '💰 Komisi Affiliate Baru Diterima!',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .content h2 { color: #333; margin-top: 0; }
    .amount { background: #f0f9ff; border-left: 4px solid #f97316; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .amount-value { font-size: 32px; font-weight: bold; color: #f97316; }
    .amount-label { color: #666; margin-top: 5px; }
    .details { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .details-row:last-child { border-bottom: none; }
    .details-label { color: #666; }
    .details-value { font-weight: bold; color: #333; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Komisi Baru Diterima!</h1>
    </div>
    <div class="content">
      <h2>Halo {userName},</h2>
      <p>Selamat! Anda baru saja mendapatkan komisi dari penjualan affiliate Anda.</p>
      
      <div class="amount">
        <div class="amount-label">Komisi yang Anda Terima</div>
        <div class="amount-value">Rp {commissionAmount}</div>
      </div>
      
      <div class="details">
        <div class="details-row">
          <span class="details-label">Tipe Produk:</span>
          <span class="details-value">{productName}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Komisi Type:</span>
          <span class="details-value">{commissionType}</span>
        </div>
        <div class="details-row">
          <span class="details-label">Komisi Rate:</span>
          <span class="details-value">{commissionRate}%</span>
        </div>
        <div class="details-row">
          <span class="details-label">Status:</span>
          <span class="details-value">✅ Langsung Withdrawable</span>
        </div>
      </div>
      
      <p>Komisi ini sudah masuk ke saldo affiliate Anda dan siap untuk di-withdraw kapan saja.</p>
      
      <a href="{ctaLink}" class="button">Lihat Saldo Saya</a>
      
      <p>Terus semangat mempromosikan produk kami! Semakin banyak penjualan, semakin besar komisi Anda. 🚀</p>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    ctaText: 'Lihat Saldo Saya',
    ctaLink: '/affiliate/earnings',
    isActive: true,
    tags: ['affiliate', 'commission', 'earnings'],
    variables: JSON.stringify({
      userName: 'Nama affiliate',
      commissionAmount: 'Rp 325,000',
      productName: 'Paket Lifetime',
      commissionType: 'FLAT',
      commissionRate: '16.25'
    }),
    updatedAt: new Date()
  },

  // ==================== MENTOR COMMISSION ====================
  {
    name: 'Mentor Commission Received',
    slug: 'mentor-commission-received',
    category: 'AFFILIATE',
    type: 'EMAIL',
    roleTarget: 'MENTOR',
    subject: '💰 Komisi Mentor Diterima!',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .amount { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .amount-value { font-size: 32px; font-weight: bold; color: #8b5cf6; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Komisi Mentor Diterima!</h1>
    </div>
    <div class="content">
      <h2>Halo {userName},</h2>
      <p>Selamat! Anda telah menerima komisi mentor dari penjualan kelas Anda.</p>
      
      <div class="amount">
        <div style="color: #666; margin-bottom: 5px;">Komisi Mentor</div>
        <div class="amount-value">Rp {commissionAmount}</div>
      </div>
      
      <p>Komisi ini sudah masuk ke saldo Anda dan siap untuk di-withdraw.</p>
      
      <a href="{ctaLink}" class="button">Cek Saldo & Earnings</a>
      
      <p>Terima kasih telah berbagi ilmu dengan komunitas kami! 🙏</p>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    ctaText: 'Cek Saldo & Earnings',
    ctaLink: '/dashboard/earnings',
    isActive: true,
    tags: ['mentor', 'commission', 'earnings'],
    updatedAt: new Date()
  },

  // ==================== ADMIN FEE PENDING ====================
  {
    name: 'Admin Fee Pending Approval',
    slug: 'admin-fee-pending',
    category: 'TRANSACTION',
    type: 'EMAIL',
    roleTarget: 'ADMIN',
    subject: '📋 Admin Fee Menunggu Approval',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .pending-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .pending-amount { font-size: 28px; font-weight: bold; color: #f59e0b; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Admin Fee Pending</h1>
    </div>
    <div class="content">
      <h2>Halo {userName},</h2>
      <p>Ada admin fee baru yang menunggu approval Anda.</p>
      
      <div class="pending-box">
        <div style="color: #666; margin-bottom: 5px;">Jumlah Admin Fee</div>
        <div class="pending-amount">Rp {amount}</div>
        <div style="color: #666; margin-top: 10px; font-size: 14px;">Status: ⏳ Menunggu Approval</div>
      </div>
      
      <p>Silakan review dan approve/reject admin fee ini di dashboard Anda.</p>
      
      <a href="{ctaLink}" class="button">Review Pending Revenue</a>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    ctaText: 'Review Pending Revenue',
    ctaLink: '/admin/pending-revenue',
    isActive: true,
    tags: ['admin', 'fee', 'pending'],
    updatedAt: new Date()
  },

  // ==================== FOUNDER SHARE PENDING ====================
  {
    name: 'Founder Share Pending Approval',
    slug: 'founder-share-pending',
    category: 'TRANSACTION',
    type: 'EMAIL',
    roleTarget: 'FOUNDER',
    subject: '💼 Revenue Share Founder Menunggu Approval',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .pending-box { background: #ecf0ff; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .pending-amount { font-size: 28px; font-weight: bold; color: #06b6d4; }
    .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💼 Revenue Share Founder</h1>
    </div>
    <div class="content">
      <h2>Halo {userName},</h2>
      <p>Revenue share founder Anda menunggu approval dari admin.</p>
      
      <div class="pending-box">
        <div style="color: #666; margin-bottom: 5px;">Jumlah Revenue Share (60%)</div>
        <div class="pending-amount">Rp {amount}</div>
        <div style="color: #666; margin-top: 10px; font-size: 14px;">Status: ⏳ Menunggu Approval</div>
      </div>
      
      <p>Admin akan melihat dan approve revenue share Anda di dashboard.</p>
      
      <a href="{ctaLink}" class="button">Lihat Detail</a>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    ctaText: 'Lihat Detail',
    ctaLink: '/admin/wallets',
    isActive: true,
    tags: ['founder', 'revenue-share', 'pending'],
    updatedAt: new Date()
  },

  // ==================== PENDING REVENUE APPROVED ====================
  {
    name: 'Pending Revenue Approved',
    slug: 'pending-revenue-approved',
    category: 'TRANSACTION',
    type: 'EMAIL',
    subject: '✅ Revenue Disetujui!',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .success-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .approved-amount { font-size: 28px; font-weight: bold; color: #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Revenue Disetujui!</h1>
    </div>
    <div class="content">
      <h2>Halo {userName},</h2>
      <p>Selamat! Revenue Anda telah disetujui dan ditransfer ke saldo Anda.</p>
      
      <div class="success-box">
        <div style="color: #666; margin-bottom: 5px;">Jumlah yang Ditransfer</div>
        <div class="approved-amount">Rp {amount}</div>
        <div style="color: #666; margin-top: 10px; font-size: 14px;">Status: ✅ Approved & Transferred</div>
      </div>
      
      <p>Dana ini sekarang tersedia di saldo Anda dan siap untuk di-withdraw.</p>
      
      <a href="{ctaLink}" class="button">Lihat Saldo Saya</a>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    ctaText: 'Lihat Saldo Saya',
    ctaLink: '/admin/wallets',
    isActive: true,
    tags: ['approved', 'revenue', 'payout'],
    updatedAt: new Date()
  },

  // ==================== PENDING REVENUE REJECTED ====================
  {
    name: 'Pending Revenue Rejected',
    slug: 'pending-revenue-rejected',
    category: 'TRANSACTION',
    type: 'EMAIL',
    subject: '❌ Revenue Ditolak',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .rejected-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .rejected-amount { font-size: 28px; font-weight: bold; color: #ef4444; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Revenue Ditolak</h1>
    </div>
    <div class="content">
      <h2>Halo {userName},</h2>
      <p>Maaf, revenue Anda telah ditolak oleh admin.</p>
      
      <div class="rejected-box">
        <div style="color: #666; margin-bottom: 5px;">Jumlah yang Ditolak</div>
        <div class="rejected-amount">Rp {amount}</div>
        <div style="color: #666; margin-top: 10px; font-size: 14px;">Status: ❌ Rejected</div>
      </div>
      
      <p><strong>Alasan Penolakan:</strong></p>
      <p style="background: #f9fafb; padding: 15px; border-radius: 5px; color: #666;">{adjustmentNote}</p>
      
      <p>Jika ada pertanyaan, silakan hubungi support kami.</p>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    isActive: true,
    tags: ['rejected', 'revenue'],
    updatedAt: new Date()
  },

  // ==================== COMMISSION SETTINGS CHANGED ====================
  {
    name: 'Commission Settings Changed (Admin Notification)',
    slug: 'commission-settings-changed',
    category: 'SYSTEM',
    type: 'EMAIL',
    roleTarget: 'ADMIN',
    subject: '⚙️ Commission Settings Updated',
    content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px; }
    .change-box { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .change-row { margin: 15px 0; }
    .change-label { color: #666; font-size: 14px; }
    .change-from { color: #ef4444; font-weight: bold; }
    .change-to { color: #10b981; font-weight: bold; }
    .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚙️ Commission Settings Updated</h1>
    </div>
    <div class="content">
      <h2>Halo Admin,</h2>
      <p>Commission settings telah diperbarui oleh admin lain.</p>
      
      <div class="change-box">
        <div style="margin-bottom: 15px;">
          <strong>Item:</strong> {itemName} ({itemType})
        </div>
        
        <div class="change-row">
          <div class="change-label">Dari:</div>
          <div class="change-from">{previousCommissionType} {previousRate}</div>
        </div>
        
        <div class="change-row">
          <div style="color: #888; text-align: center; padding: 5px 0;">↓</div>
        </div>
        
        <div class="change-row">
          <div class="change-label">Ke:</div>
          <div class="change-to">{newCommissionType} {newRate}</div>
        </div>
        
        <div class="change-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <div class="change-label">Diubah oleh:</div>
          <div style="font-weight: bold;">{changedBy}</div>
        </div>
      </div>
      
      <a href="{ctaLink}" class="button">Lihat Semua Settings</a>
    </div>
    <div class="footer">
      <p>© 2025 EksporYuk. Semua hak dilindungi.</p>
    </div>
  </div>
</body>
</html>
    `,
    ctaText: 'Lihat Semua Settings',
    ctaLink: '/admin/commission-settings',
    isActive: true,
    tags: ['commission', 'settings', 'admin'],
    updatedAt: new Date()
  }
]

async function seedTemplates() {
  console.log('🌱 Seeding Commission Notification Email Templates...\n')

  let successCount = 0
  let errorCount = 0

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await prisma.brandedTemplate.findFirst({
        where: { slug: template.slug }
      })

      if (existing) {
        console.log(`⏭️  Template "${template.name}" sudah ada (skip)`)
        continue
      }

      // Create template with unique ID
      const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const created = await prisma.brandedTemplate.create({
        data: {
          ...template,
          id: templateId
        }
      })

      console.log(`✅ Template "${template.name}" berhasil dibuat`)
      successCount++
    } catch (error) {
      console.error(`❌ Error creating template "${template.name}":`, error.message)
      errorCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully created: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`\n✨ Commission notification email templates ready!`)
  console.log(`📍 Access at: /admin/branded-templates`)

  await prisma.$disconnect()
}

seedTemplates().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})