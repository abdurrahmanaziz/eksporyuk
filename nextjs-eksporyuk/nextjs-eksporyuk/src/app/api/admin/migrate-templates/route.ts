import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

/**
 * POST /api/admin/migrate-templates
 * Convert HTML templates to plain text format
 * Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const results: { slug: string; status: string }[] = []
    
    for (const [slug, data] of Object.entries(templateUpdates)) {
      try {
        // Check if template exists and has HTML content
        const existing = await prisma.brandedTemplate.findFirst({
          where: { slug }
        })
        
        if (!existing) {
          results.push({ slug, status: 'not_found' })
          continue
        }
        
        // Only update if current content contains HTML
        if (existing.content.includes('<!DOCTYPE') || existing.content.includes('<html')) {
          await prisma.brandedTemplate.updateMany({
            where: { slug },
            data: {
              content: data.content,
              ctaText: data.ctaText,
              ctaLink: data.ctaLink
            }
          })
          results.push({ slug, status: 'updated' })
        } else {
          results.push({ slug, status: 'already_plain_text' })
        }
      } catch (error: any) {
        results.push({ slug, status: `error: ${error.message}` })
      }
    }
    
    const updated = results.filter(r => r.status === 'updated').length
    const skipped = results.filter(r => r.status === 'already_plain_text').length
    
    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated: ${updated}, Skipped: ${skipped}`,
      results
    })
  } catch (error: any) {
    console.error('[MIGRATE TEMPLATES] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/migrate-templates
 * Check which templates have HTML content
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find templates with HTML content
    const htmlTemplates = await prisma.brandedTemplate.findMany({
      where: {
        OR: [
          { content: { contains: '<!DOCTYPE' } },
          { content: { contains: '<html' } },
          { content: { contains: '<div' } }
        ]
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    })
    
    return NextResponse.json({
      success: true,
      htmlTemplatesCount: htmlTemplates.length,
      templates: htmlTemplates
    })
  } catch (error: any) {
    console.error('[MIGRATE TEMPLATES CHECK] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
