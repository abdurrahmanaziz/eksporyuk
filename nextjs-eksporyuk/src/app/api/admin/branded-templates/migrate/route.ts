import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const createId = () => randomBytes(16).toString('hex')

export const dynamic = 'force-dynamic'

const DEFAULT_TEMPLATES = [
  // SYSTEM Templates
  {
    id: createId(),
    name: 'Email Verification',
    slug: 'email-verification',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Verifikasi Email Anda - EksporYuk',
    content: 'Halo {name},\n\nTerima kasih telah mendaftar di EksporYuk. Silakan verifikasi email Anda dengan mengklik tautan di bawah:\n\n{url}\n\nKode verifikasi Anda: {code}\n\nTautan ini akan berlaku selama 24 jam.\n\nJika Anda tidak meminta verifikasi ini, abaikan email ini.\n\nTerima kasih,\nTim EksporYuk',
    description: 'Template untuk email verifikasi akun baru',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    variables: { code: '000000', url: 'https://eksporyuk.com/verify' }
  },
  {
    id: createId(),
    name: 'Password Reset',
    slug: 'password-reset',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Reset Password - EksporYuk',
    content: 'Halo {name},\n\nKami menerima permintaan reset password untuk akun Anda. Silakan klik tautan di bawah untuk reset:\n\n{url}\n\nTautan ini akan berlaku selama 1 jam.\n\nJika Anda tidak meminta reset password, abaikan email ini dan password Anda tetap aman.\n\nTerima kasih,\nTim EksporYuk',
    description: 'Template untuk email reset password',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true
  },
  {
    id: createId(),
    name: 'Welcome New User',
    slug: 'welcome-new-user',
    category: 'SYSTEM',
    type: 'EMAIL',
    subject: 'Selamat Datang di EksporYuk!',
    content: 'Halo {name},\n\nSelamat datang di komunitas EksporYuk! Kami senang memiliki Anda bergabung dengan kami.\n\nAkun Anda sudah siap digunakan. Mari jelajahi berbagai fitur dan peluang belajar yang kami sediakan.\n\nKlik di bawah untuk mulai:\n{url}\n\nJika ada pertanyaan, jangan ragu untuk menghubungi kami.\n\nTerima kasih,\nTim EksporYuk',
    description: 'Template untuk welcome email user baru',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: true,
    isActive: true
  },

  // MEMBERSHIP Templates
  {
    id: createId(),
    name: 'Membership Activated',
    slug: 'membership-activated',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Selamat! Member {membershipType} Anda Aktif',
    content: 'Halo {name},\n\nSelamat! Membership Anda telah berhasil diaktifkan.\n\nJenis Member: {membershipType}\nTanggal Mulai: {startDate}\nTanggal Berakhir: {endDate}\n\nAnda sekarang memiliki akses ke semua fitur premium. Nikmati benefit eksklusif:\n{benefits}\n\nAkses dashboard Anda: {url}\n\nTerima kasih atas kepercayaan Anda!\n\nTim EksporYuk',
    description: 'Template untuk aktivasi membership',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    variables: { membershipType: 'Premium', startDate: '01-01-2024', endDate: '31-12-2024', benefits: '• Akses semua kursus\n• Support prioritas\n• Sertifikat resmi' }
  },
  {
    id: createId(),
    name: 'Membership Renewal Reminder',
    slug: 'membership-renewal-reminder',
    category: 'MEMBERSHIP',
    type: 'EMAIL',
    subject: 'Perpanjangan Membership Anda Segera Berakhir - {daysUntilExpiry} Hari Lagi',
    content: 'Halo {name},\n\nMembership Anda akan berakhir pada {endDate}. Jangan lewatkan akses ke fitur premium!\n\nPerpanjang membership Anda sekarang:\n{renewalUrl}\n\nDapatkan diskon spesial untuk perpanjangan yang dilakukan hari ini.\n\nJika ada pertanyaan, hubungi support kami.\n\nTerima kasih,\nTim EksporYuk',
    description: 'Template untuk reminder perpanjangan membership',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true
  },

  // AFFILIATE Templates
  {
    id: createId(),
    name: 'Affiliate Registered',
    slug: 'affiliate-registered',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: 'Pendaftaran Affiliate Berhasil - EksporYuk',
    content: 'Halo {name},\n\nTerima kasih telah mendaftar sebagai affiliate EksporYuk. Pendaftaran Anda telah diterima dan sedang dalam proses review.\n\nTim kami akan meninjau aplikasi Anda dalam 24-48 jam. Anda akan menerima notifikasi status persetujuan via email.\n\nDalam waktu tunggu, silakan:\n1. Lengkapi profil affiliate Anda\n2. Pelajari program komisi kami\n3. Siapkan konten promosi Anda\n\nLink dashboard: {dashboardUrl}\n\nTerima kasih,\nTim EksporYuk',
    description: 'Template untuk notifikasi affiliate registration',
    priority: 'NORMAL',
    isDefault: true,
    isSystem: true,
    isActive: true
  },
  {
    id: createId(),
    name: 'Commission Received',
    slug: 'commission-received',
    category: 'AFFILIATE',
    type: 'EMAIL',
    subject: 'Komisi Anda Telah Masuk - Rp {commissionAmount}',
    content: 'Halo {name},\n\nKomisi dari referral Anda telah masuk ke akun EksporYuk Anda!\n\nJumlah Komisi: Rp {commissionAmount}\nTanggal: {date}\nTotal Earning: Rp {totalEarnings}\n\nLihat detail di dashboard Anda: {dashboardUrl}\n\nKomisi Anda dapat ditarik kapan saja. Gunakan tautan di bawah untuk mengajukan withdrawal:\n{withdrawalUrl}\n\nTerima kasih atas kerja sama Anda!\n\nTim EksporYuk',
    description: 'Template untuk notifikasi komisi masuk',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true,
    variables: { commissionAmount: '1.000.000', totalEarnings: '5.000.000', date: '01-01-2024' }
  },

  // PAYMENT Templates
  {
    id: createId(),
    name: 'Invoice Created',
    slug: 'invoice-created',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: 'Invoice #{invoiceNumber} - Rp {amount}',
    content: 'Halo {name},\n\nInvoice baru telah dibuat untuk transaksi Anda.\n\nNomor Invoice: {invoiceNumber}\nJumlah: Rp {amount}\nTanggal Jatuh Tempo: {dueDate}\n\nDetail Produk:\n{itemDescription}\n\nBayar sekarang:\n{paymentUrl}\n\nJika ada pertanyaan, hubungi support kami.\n\nTerima kasih,\nTim EksporYuk',
    description: 'Template untuk invoice creation',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true
  },
  {
    id: createId(),
    name: 'Payment Success',
    slug: 'payment-success',
    category: 'PAYMENT',
    type: 'EMAIL',
    subject: 'Pembayaran Berhasil - Invoice #{invoiceNumber}',
    content: 'Halo {name},\n\nTerima kasih! Pembayaran Anda telah berhasil diproses.\n\nNomor Invoice: {invoiceNumber}\nJumlah: Rp {amount}\nTanggal: {date}\n\nAkses konten yang telah dibeli: {url}\n\nReceipt terlampir di email ini.\n\nTerima kasih atas pembelian Anda!\n\nTim EksporYuk',
    description: 'Template untuk payment success',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true
  },

  // MARKETING Templates
  {
    id: createId(),
    name: 'Flash Sale Announcement',
    slug: 'flash-sale-announcement',
    category: 'MARKETING',
    type: 'EMAIL',
    subject: '⚡ FLASH SALE - Diskon {discountPercent}% untuk {productName}!',
    content: 'Halo {name},\n\n⚡ FLASH SALE DIMULAI SEKARANG! ⚡\n\nDapatkan diskon hingga {discountPercent}% untuk:\n{productName}\n\nTawarkan terbatas hingga {expiryDate}!\n\nJangan lewatkan kesempatan emas ini:\n{offerUrl}\n\nStock terbatas. Pesan sekarang!\n\nTim EksporYuk',
    description: 'Template untuk flash sale announcement',
    priority: 'URGENT',
    isDefault: true,
    isSystem: true,
    isActive: true
  },

  // NOTIFICATION Templates
  {
    id: createId(),
    name: 'System Maintenance',
    slug: 'system-maintenance',
    category: 'NOTIFICATION',
    type: 'EMAIL',
    subject: '🔧 Maintenance Terjadwal - Akses Terbatas',
    content: 'Halo {name},\n\nKami akan melakukan maintenance sistem untuk meningkatkan layanan.\n\nWaktu: {maintenanceTime}\nDurasi: {estimatedDuration}\n\nSelama maintenance, fitur berikut mungkin tidak dapat diakses:\n{affectedFeatures}\n\nKami akan kembali online segera setelah maintenance selesai.\n\nTerima kasih atas kesabaran Anda!\n\nTim EksporYuk',
    description: 'Template untuk system maintenance notification',
    priority: 'HIGH',
    isDefault: true,
    isSystem: true,
    isActive: true
  }
]

/**
 * POST /api/admin/branded-templates/migrate
 * Initialize default branded templates
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Create or skip existing templates
    for (const template of DEFAULT_TEMPLATES) {
      try {
        const existing = await prisma.brandedTemplate.findFirst({
          where: { slug: template.slug }
        })

        if (existing) {
          results.skipped++
          continue
        }

        await prisma.brandedTemplate.create({
          data: {
            ...template,
            createdBy: session.user.id,
            updatedAt: new Date()
          }
        })

        results.created++
      } catch (error) {
        results.errors.push(`Failed to create ${template.slug}: ${String(error)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Template migration completed',
      results
    })

  } catch (error) {
    console.error('[Template Migration API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to migrate templates', details: String(error) },
      { status: 500 }
    )
  }
}
