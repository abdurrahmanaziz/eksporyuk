// Seed 4 Banners for January 2026 Zoom Events
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Creating 4 banners for January 2026 Zoom Events...')

  // First, get admin user ID
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!admin) {
    console.error('❌ No admin user found. Please create an admin user first.')
    process.exit(1)
  }

  console.log(`✅ Found admin user: ${admin.name} (${admin.id})`)

  // Generate unique IDs
  const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  const banners = [
    {
      id: generateId(),
      title: 'Webinar: Strategi Ekspor ke Eropa 2026',
      description: 'Pelajari strategi dan tips menembus pasar Eropa di tahun 2026. Bersama mentor berpengalaman yang sudah ekspor ke 15+ negara Eropa.',
      linkUrl: '/events/webinar-ekspor-eropa-2026',
      linkText: 'Daftar Sekarang',
      targetRoles: JSON.stringify(['MEMBER_PREMIUM', 'MEMBER_FREE', 'AFFILIATE']),
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#2563EB',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#2563EB',
      priority: 10,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-01-10T23:59:59Z'),
      isActive: true,
      createdBy: admin.id,
      updatedAt: new Date()
    },
    {
      id: generateId(),
      title: 'Live Zoom: Cara Mendapatkan Buyer dari Alibaba',
      description: 'Rahasia mendapatkan buyer internasional dari Alibaba.com. Tips negosiasi dan closing deal yang efektif.',
      linkUrl: '/events/zoom-alibaba-buyer-2026',
      linkText: 'Join Zoom',
      targetRoles: JSON.stringify(['MEMBER_PREMIUM', 'MEMBER_FREE']),
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#7C3AED',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#7C3AED',
      priority: 9,
      startDate: new Date('2026-01-11T00:00:00Z'),
      endDate: new Date('2026-01-18T23:59:59Z'),
      isActive: true,
      createdBy: admin.id,
      updatedAt: new Date()
    },
    {
      id: generateId(),
      title: 'Workshop Online: Dokumen Ekspor Lengkap',
      description: 'Workshop intensif 3 jam mempelajari semua dokumen ekspor: Invoice, Packing List, COO, B/L, dan lainnya.',
      linkUrl: '/events/workshop-dokumen-ekspor',
      linkText: 'Ikuti Workshop',
      targetRoles: JSON.stringify(['MEMBER_PREMIUM']),
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#059669',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#059669',
      priority: 8,
      startDate: new Date('2026-01-19T00:00:00Z'),
      endDate: new Date('2026-01-25T23:59:59Z'),
      isActive: true,
      createdBy: admin.id,
      updatedAt: new Date()
    },
    {
      id: generateId(),
      title: 'Mentoring Session: Q&A Ekspor Pemula',
      description: 'Sesi tanya jawab langsung dengan mentor untuk pemula yang ingin memulai bisnis ekspor. Tanya apapun!',
      linkUrl: '/events/mentoring-qa-ekspor',
      linkText: 'Reservasi Slot',
      targetRoles: JSON.stringify(['MEMBER_PREMIUM', 'MEMBER_FREE', 'AFFILIATE', 'MENTOR']),
      placement: 'DASHBOARD',
      displayType: 'CAROUSEL',
      backgroundColor: '#DC2626',
      textColor: '#FFFFFF',
      buttonColor: '#FFFFFF',
      buttonTextColor: '#DC2626',
      priority: 7,
      startDate: new Date('2026-01-26T00:00:00Z'),
      endDate: new Date('2026-01-31T23:59:59Z'),
      isActive: true,
      createdBy: admin.id,
      updatedAt: new Date()
    }
  ]

  // Delete existing banners for January 2026 (optional cleanup)
  const deleted = await prisma.banner.deleteMany({
    where: {
      startDate: {
        gte: new Date('2026-01-01T00:00:00Z'),
        lte: new Date('2026-01-31T23:59:59Z')
      }
    }
  })
  console.log(`🗑️  Deleted ${deleted.count} existing January 2026 banners`)

  // Create new banners
  for (const banner of banners) {
    const created = await prisma.banner.create({
      data: banner
    })
    console.log(`✅ Created banner: ${created.title}`)
    console.log(`   - ID: ${created.id}`)
    console.log(`   - Period: ${created.startDate.toDateString()} - ${created.endDate.toDateString()}`)
    console.log(`   - Color: ${created.backgroundColor}`)
    console.log('')
  }

  console.log('🎉 All 4 banners created successfully!')
  console.log('')
  console.log('📋 Banner Schedule:')
  console.log('1. Jan 1-10: Webinar Strategi Ekspor ke Eropa (Blue)')
  console.log('2. Jan 11-18: Live Zoom Alibaba Buyer (Purple)')
  console.log('3. Jan 19-25: Workshop Dokumen Ekspor (Green)')
  console.log('4. Jan 26-31: Mentoring Q&A Session (Red)')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
