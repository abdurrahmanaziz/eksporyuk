/**
 * Seed Support Ticket Email Templates
 * HANYA menambah template baru, TIDAK menghapus yang lama
 * Menggunakan format TEXT biasa (bukan HTML) agar admin mudah edit
 * 
 * Run: node seed-support-ticket-templates.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Template menggunakan TEXT biasa dengan shortcode {{variable}}
const templates = [
  {
    slug: 'support-ticket-created',
    name: 'Tiket Support Dibuat',
    subject: '[{{ticketNumber}}] Tiket Support Anda Telah Diterima',
    category: 'SUPPORT',
    type: 'EMAIL',
    description: 'Email konfirmasi ketika user membuat tiket support baru',
    content: `Halo {{name}},

Terima kasih telah menghubungi tim support kami. Tiket Anda telah berhasil dibuat dan sedang dalam antrian untuk ditinjau.

Detail Tiket:
- Nomor Tiket: {{ticketNumber}}
- Judul: {{ticketTitle}}
- Kategori: {{ticketCategory}}
- Dibuat pada: {{createdAt}}

Pesan Anda:
{{ticketMessage}}

Tim support kami akan segera meninjau tiket Anda dan memberikan tanggapan secepat mungkin. Anda akan menerima notifikasi email ketika ada update pada tiket Anda.

Jika Anda memiliki informasi tambahan, silakan balas langsung melalui halaman tiket Anda.

Salam,
Tim Support Eksporyuk`,
    ctaText: 'Lihat Tiket Saya',
    ctaLink: '{{ticketUrl}}',
    variables: ['name', 'ticketNumber', 'ticketTitle', 'ticketCategory', 'ticketMessage', 'ticketUrl', 'createdAt'],
    isActive: true
  },
  {
    slug: 'support-ticket-admin-reply',
    name: 'Balasan Admin pada Tiket',
    subject: '[{{ticketNumber}}] Balasan Tiket: {{ticketTitle}}',
    category: 'SUPPORT',
    type: 'EMAIL',
    description: 'Email notifikasi ketika admin membalas tiket user',
    content: `Halo {{name}},

Tim support kami telah memberikan balasan pada tiket Anda.

Tiket: {{ticketNumber}}
Judul: {{ticketTitle}}

Balasan dari {{senderName}} ({{repliedAt}}):
---
{{replyMessage}}
---

Silakan login ke dashboard untuk melihat dan membalas tiket Anda.

Jika masalah Anda sudah teratasi, Anda dapat menutup tiket ini melalui halaman tiket.

Salam,
Tim Support Eksporyuk`,
    ctaText: 'Lihat & Balas Tiket',
    ctaLink: '{{ticketUrl}}',
    variables: ['name', 'ticketNumber', 'ticketTitle', 'senderName', 'replyMessage', 'ticketUrl', 'repliedAt'],
    isActive: true
  },
  {
    slug: 'support-ticket-user-reply',
    name: 'Balasan User pada Tiket',
    subject: '[{{ticketNumber}}] Balasan dari User: {{ticketTitle}}',
    category: 'SUPPORT',
    type: 'EMAIL',
    description: 'Email notifikasi ke admin ketika user membalas tiket',
    content: `Halo {{name}},

User telah memberikan balasan baru pada tiket support.

Tiket: {{ticketNumber}}
Judul: {{ticketTitle}}

Balasan dari {{senderName}} ({{repliedAt}}):
---
{{replyMessage}}
---

Silakan segera tinjau dan berikan tanggapan.

Salam,
Sistem Eksporyuk`,
    ctaText: 'Kelola Tiket',
    ctaLink: '{{ticketUrl}}',
    variables: ['name', 'ticketNumber', 'ticketTitle', 'senderName', 'replyMessage', 'ticketUrl', 'repliedAt'],
    isActive: true
  },
  {
    slug: 'support-ticket-status-change',
    name: 'Status Tiket Berubah',
    subject: '[{{ticketNumber}}] Status Tiket Diubah: {{newStatus}}',
    category: 'SUPPORT',
    type: 'EMAIL',
    description: 'Email notifikasi ketika status tiket berubah',
    content: `Halo {{name}},

Status tiket support Anda telah diperbarui.

Tiket: {{ticketNumber}}
Judul: {{ticketTitle}}

Status berubah: {{oldStatus}} → {{newStatus}}

Diubah pada: {{changedAt}}

Silakan login ke dashboard untuk melihat detail tiket Anda.

Salam,
Tim Support Eksporyuk`,
    ctaText: 'Lihat Tiket',
    ctaLink: '{{ticketUrl}}',
    variables: ['name', 'ticketNumber', 'ticketTitle', 'oldStatus', 'newStatus', 'ticketUrl', 'changedAt'],
    isActive: true
  },
  {
    slug: 'support-ticket-resolved',
    name: 'Tiket Diselesaikan',
    subject: '[{{ticketNumber}}] Tiket Anda Telah Diselesaikan',
    category: 'SUPPORT',
    type: 'EMAIL',
    description: 'Email notifikasi ketika tiket ditandai selesai',
    content: `Halo {{name}},

Tiket support Anda telah ditandai sebagai SELESAI.

Tiket: {{ticketNumber}}
Judul: {{ticketTitle}}
Diselesaikan pada: {{resolvedAt}}

Terima kasih telah menghubungi tim support kami. Kami harap masalah Anda telah teratasi dengan baik.

Jika Anda memiliki pertanyaan lain atau masalah belum sepenuhnya teratasi, jangan ragu untuk membuat tiket support baru.

Salam,
Tim Support Eksporyuk`,
    ctaText: 'Lihat Tiket',
    ctaLink: '{{ticketUrl}}',
    variables: ['name', 'ticketNumber', 'ticketTitle', 'ticketUrl', 'resolvedAt'],
    isActive: true
  }
]

async function seedTemplates() {
  console.log('🎫 Seeding support ticket email templates...')
  console.log('⚠️  Mode: UPSERT - hanya update/tambah, tidak hapus yang lama')
  console.log('')
  
  let created = 0
  let updated = 0
  let skipped = 0
  
  for (const template of templates) {
    try {
      // Cek apakah template sudah ada
      const existing = await prisma.brandedTemplate.findFirst({
        where: { slug: template.slug }
      })
      
      if (existing) {
        // Update template yang sudah ada
        await prisma.brandedTemplate.update({
          where: { id: existing.id },
          data: {
            name: template.name,
            subject: template.subject,
            content: template.content,
            description: template.description,
            ctaText: template.ctaText || null,
            ctaLink: template.ctaLink || null,
            variables: template.variables,
            isActive: template.isActive
          }
        })
        console.log(`📝 Updated: ${template.name}`)
        updated++
      } else {
        // Buat template baru
        await prisma.brandedTemplate.create({
          data: {
            slug: template.slug,
            name: template.name,
            subject: template.subject,
            content: template.content,
            category: template.category,
            type: template.type,
            description: template.description,
            ctaText: template.ctaText || null,
            ctaLink: template.ctaLink || null,
            variables: template.variables,
            isActive: template.isActive
          }
        })
        console.log(`✅ Created: ${template.name}`)
        created++
      }
    } catch (error) {
      console.error(`❌ Error processing ${template.name}:`, error.message)
      skipped++
    }
  }
  
  console.log('')
  console.log('📊 Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log('')
  console.log('✨ Support ticket email templates seeded successfully!')
}

seedTemplates()
  .catch((e) => {
    console.error('Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
