const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAffiliateFlow() {
  try {
    console.log('='.repeat(80))
    console.log('CEK ALUR PENDAFTARAN AFFILIATE SISTEM EKSPORYUK')
    console.log('='.repeat(80))

    // 1. Cek Setting Auto Approve
    const settings = await prisma.settings.findFirst()
    
    console.log('\n📋 SETTING AUTO APPROVE:')
    console.log('─'.repeat(80))
    if (settings) {
      console.log(`✅ affiliateAutoApprove: ${settings.affiliateAutoApprove ? 'AKTIF (AUTO APPROVE)' : 'NONAKTIF (MANUAL REVIEW)'}`)
      
      if (settings.affiliateAutoApprove) {
        console.log('\n   ℹ️  Mode: AUTO APPROVE')
        console.log('   → Pendaftar langsung disetujui')
        console.log('   → Role langsung jadi AFFILIATE')
        console.log('   → Status: APPROVED')
        console.log('   → isActive: true')
      } else {
        console.log('\n   ℹ️  Mode: MANUAL REVIEW')
        console.log('   → Pendaftar harus menunggu approval admin')
        console.log('   → Role: MEMBER_FREE (sampai approved)')
        console.log('   → Status: PENDING')
        console.log('   → isActive: false')
      }
    } else {
      console.log('❌ Settings tidak ditemukan (default: MANUAL REVIEW)')
    }

    // 2. Cek statistik affiliate
    const totalAffiliates = await prisma.affiliateProfile.count()
    const approvedAffiliates = await prisma.affiliateProfile.count({
      where: { applicationStatus: 'APPROVED' }
    })
    const pendingAffiliates = await prisma.affiliateProfile.count({
      where: { applicationStatus: 'PENDING' }
    })
    const activeAffiliates = await prisma.affiliateProfile.count({
      where: { isActive: true }
    })

    console.log('\n📊 STATISTIK AFFILIATE:')
    console.log('─'.repeat(80))
    console.log(`Total Affiliate Profiles: ${totalAffiliates}`)
    console.log(`  ✅ APPROVED: ${approvedAffiliates}`)
    console.log(`  ⏳ PENDING: ${pendingAffiliates}`)
    console.log(`  �� ACTIVE: ${activeAffiliates}`)

    // 3. Cek user dengan role AFFILIATE
    const affiliateRoleUsers = await prisma.user.count({
      where: { role: 'AFFILIATE' }
    })
    console.log(`\n👥 User dengan Role AFFILIATE: ${affiliateRoleUsers}`)

    // 4. Sample affiliate yang pending (jika ada)
    if (pendingAffiliates > 0) {
      console.log('\n⏳ SAMPLE AFFILIATE PENDING (butuh approval):')
      console.log('─'.repeat(80))
      const pending = await prisma.affiliateProfile.findMany({
        where: { applicationStatus: 'PENDING' },
        include: {
          user: {
            select: { name: true, email: true, role: true }
          }
        },
        take: 5
      })
      
      pending.forEach((aff, i) => {
        console.log(`\n${i + 1}. ${aff.user.name} (${aff.user.email})`)
        console.log(`   Kode: ${aff.affiliateCode}`)
        console.log(`   Status: ${aff.applicationStatus}`)
        console.log(`   Role User: ${aff.user.role}`)
        console.log(`   isActive: ${aff.isActive}`)
        console.log(`   Created: ${aff.createdAt.toISOString()}`)
      })
    }

    // 5. Alur Lengkap
    console.log('\n\n🔄 ALUR PENDAFTARAN AFFILIATE:')
    console.log('='.repeat(80))
    
    console.log('\n1️⃣  PENDAFTARAN PUBLIK (/daftar-affiliate)')
    console.log('   API: POST /api/affiliate/register')
    console.log('   Input: name, email, password, whatsapp, bank info, motivation')
    
    console.log('\n2️⃣  CEK SETTING AUTO APPROVE')
    console.log(`   Current: ${settings?.affiliateAutoApprove ? 'AUTO APPROVE ✅' : 'MANUAL REVIEW ⏳'}`)
    
    if (settings?.affiliateAutoApprove) {
      console.log('\n   JIKA AUTO APPROVE = ON:')
      console.log('   ├─ Create User dengan role: AFFILIATE')
      console.log('   ├─ Create AffiliateProfile dengan status: APPROVED')
      console.log('   ├─ Set isActive: true')
      console.log('   ├─ Set approvedAt: now()')
      console.log('   ├─ Generate affiliateCode')
      console.log('   ├─ Create Wallet')
      console.log('   ├─ Send notifikasi multi-channel (email, WA, push)')
      console.log('   └─ User langsung bisa akses /affiliate/*')
    } else {
      console.log('\n   JIKA AUTO APPROVE = OFF:')
      console.log('   ├─ Create User dengan role: MEMBER_FREE')
      console.log('   ├─ Create AffiliateProfile dengan status: PENDING')
      console.log('   ├─ Set isActive: false')
      console.log('   ├─ Set approvedAt: null')
      console.log('   ├─ Generate affiliateCode')
      console.log('   ├─ Create Wallet')
      console.log('   ├─ Send notifikasi: "Aplikasi sedang direview"')
      console.log('   └─ User TIDAK bisa akses /affiliate/* (menunggu approval)')
    }

    console.log('\n3️⃣  APPROVAL ADMIN (jika manual review)')
    console.log('   Halaman: /admin/affiliates')
    console.log('   Action:')
    console.log('   ├─ Admin klik "Approve" pada affiliate pending')
    console.log('   ├─ Update User role: MEMBER_FREE → AFFILIATE')
    console.log('   ├─ Update AffiliateProfile status: PENDING → APPROVED')
    console.log('   ├─ Set isActive: true')
    console.log('   ├─ Set approvedAt: now()')
    console.log('   ├─ Send notifikasi approval ke user')
    console.log('   └─ User sekarang bisa akses /affiliate/*')

    console.log('\n4️⃣  AKSES MENU AFFILIATE')
    console.log('   Middleware check:')
    console.log('   ├─ User role harus: AFFILIATE')
    console.log('   ├─ AffiliateProfile.isActive harus: true')
    console.log('   ├─ AffiliateProfile.applicationStatus harus: APPROVED')
    console.log('   └─ Jika tidak memenuhi: Redirect ke home dengan error')

    console.log('\n\n📝 KESIMPULAN:')
    console.log('='.repeat(80))
    console.log(`Setting saat ini: ${settings?.affiliateAutoApprove ? '🟢 AUTO APPROVE' : '🟡 MANUAL REVIEW'}`)
    
    if (settings?.affiliateAutoApprove) {
      console.log('\n✅ ALUR OTOMATIS:')
      console.log('   Daftar → Langsung Jadi Affiliate → Bisa Langsung Promosi')
      console.log('   No admin intervention needed!')
    } else {
      console.log('\n⏳ ALUR MANUAL:')
      console.log('   Daftar → Pending → Admin Review → Approval → Jadi Affiliate')
      console.log('   Admin harus approve setiap pendaftar!')
    }

    if (pendingAffiliates > 0) {
      console.log(`\n⚠️  ADA ${pendingAffiliates} AFFILIATE MENUNGGU APPROVAL!`)
      console.log('   Admin perlu approve mereka di /admin/affiliates')
    }

    console.log('\n' + '='.repeat(80))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAffiliateFlow()
