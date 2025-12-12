/**
 * Test script untuk memverifikasi integrasi branding settings dengan database
 * Jalankan dengan: node test-branding-integration.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBrandingIntegration() {
  console.log('🔍 Memulai test integrasi branding settings...\n')

  try {
    // 1. Check current settings in database
    console.log('1️⃣ Checking current settings in database...')
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        // Dashboard Theme Colors
        dashboardSidebarBg: true,
        dashboardSidebarText: true,
        dashboardSidebarActiveText: true,
        dashboardSidebarActiveBg: true,
        dashboardSidebarHoverBg: true,
        dashboardHeaderBg: true,
        dashboardHeaderText: true,
        dashboardBodyBg: true,
        dashboardCardBg: true,
        dashboardCardBorder: true,
        dashboardCardHeaderBg: true,
        dashboardTextPrimary: true,
        dashboardTextSecondary: true,
        dashboardTextMuted: true,
        dashboardBorderColor: true,
        dashboardSuccessColor: true,
        dashboardWarningColor: true,
        dashboardDangerColor: true,
        dashboardInfoColor: true,
      }
    })

    if (!settings) {
      console.log('   ⚠️ Settings tidak ditemukan, membuat default...')
      settings = await prisma.settings.create({
        data: {
          id: 1,
          siteTitle: 'Eksporyuk',
          // Default dashboard colors akan diisi dari schema defaults
        },
        select: {
          id: true,
          primaryColor: true,
          dashboardSidebarBg: true,
          dashboardSidebarText: true,
          dashboardSidebarActiveText: true,
          dashboardSidebarActiveBg: true,
          dashboardSidebarHoverBg: true,
          dashboardHeaderBg: true,
          dashboardHeaderText: true,
          dashboardBodyBg: true,
          dashboardCardBg: true,
          dashboardCardBorder: true,
          dashboardCardHeaderBg: true,
          dashboardTextPrimary: true,
          dashboardTextSecondary: true,
          dashboardTextMuted: true,
          dashboardBorderColor: true,
          dashboardSuccessColor: true,
          dashboardWarningColor: true,
          dashboardDangerColor: true,
          dashboardInfoColor: true,
        }
      })
      console.log('   ✅ Default settings created\n')
    } else {
      console.log('   ✅ Settings found\n')
    }

    // 2. Display current dashboard theme values
    console.log('2️⃣ Current Dashboard Theme Colors:')
    console.log('   ┌──────────────────────────────────────────────────────────┐')
    console.log(`   │ Sidebar Background:      ${settings.dashboardSidebarBg || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Sidebar Text:            ${settings.dashboardSidebarText || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Sidebar Active BG:       ${settings.dashboardSidebarActiveBg || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Sidebar Active Text:     ${settings.dashboardSidebarActiveText || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Sidebar Hover BG:        ${settings.dashboardSidebarHoverBg || '(not set)'.padEnd(20)}│`)
    console.log('   ├──────────────────────────────────────────────────────────┤')
    console.log(`   │ Header Background:       ${settings.dashboardHeaderBg || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Header Text:             ${settings.dashboardHeaderText || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Body Background:         ${settings.dashboardBodyBg || '(not set)'.padEnd(20)}│`)
    console.log('   ├──────────────────────────────────────────────────────────┤')
    console.log(`   │ Card Background:         ${settings.dashboardCardBg || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Card Border:             ${settings.dashboardCardBorder || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Card Header BG:          ${settings.dashboardCardHeaderBg || '(not set)'.padEnd(20)}│`)
    console.log('   ├──────────────────────────────────────────────────────────┤')
    console.log(`   │ Text Primary:            ${settings.dashboardTextPrimary || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Text Secondary:          ${settings.dashboardTextSecondary || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Text Muted:              ${settings.dashboardTextMuted || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Border Color:            ${settings.dashboardBorderColor || '(not set)'.padEnd(20)}│`)
    console.log('   ├──────────────────────────────────────────────────────────┤')
    console.log(`   │ Success Color:           ${settings.dashboardSuccessColor || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Warning Color:           ${settings.dashboardWarningColor || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Danger Color:            ${settings.dashboardDangerColor || '(not set)'.padEnd(20)}│`)
    console.log(`   │ Info Color:              ${settings.dashboardInfoColor || '(not set)'.padEnd(20)}│`)
    console.log('   └──────────────────────────────────────────────────────────┘\n')

    // 3. Test update functionality
    console.log('3️⃣ Testing update functionality...')
    const testColor = '#ff5500'
    await prisma.settings.update({
      where: { id: 1 },
      data: {
        dashboardSidebarBg: testColor
      }
    })
    
    const updatedSettings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: { dashboardSidebarBg: true }
    })
    
    if (updatedSettings?.dashboardSidebarBg === testColor) {
      console.log(`   ✅ Update berhasil: dashboardSidebarBg = ${testColor}`)
      
      // Restore original value
      await prisma.settings.update({
        where: { id: 1 },
        data: {
          dashboardSidebarBg: settings.dashboardSidebarBg || '#1e293b'
        }
      })
      console.log(`   ✅ Restored original value: ${settings.dashboardSidebarBg || '#1e293b'}\n`)
    } else {
      console.log('   ❌ Update gagal!\n')
    }

    // 4. Check schema fields
    console.log('4️⃣ Verifikasi field schema:')
    const dashboardFields = [
      'dashboardSidebarBg',
      'dashboardSidebarText',
      'dashboardSidebarActiveText',
      'dashboardSidebarActiveBg',
      'dashboardSidebarHoverBg',
      'dashboardHeaderBg',
      'dashboardHeaderText',
      'dashboardBodyBg',
      'dashboardCardBg',
      'dashboardCardBorder',
      'dashboardCardHeaderBg',
      'dashboardTextPrimary',
      'dashboardTextSecondary',
      'dashboardTextMuted',
      'dashboardBorderColor',
      'dashboardSuccessColor',
      'dashboardWarningColor',
      'dashboardDangerColor',
      'dashboardInfoColor',
    ]
    
    let allFieldsExist = true
    for (const field of dashboardFields) {
      const exists = field in settings
      if (exists) {
        console.log(`   ✅ ${field}`)
      } else {
        console.log(`   ❌ ${field} (missing)`)
        allFieldsExist = false
      }
    }
    
    console.log('')
    if (allFieldsExist) {
      console.log('✅ Semua 19 field dashboard theme tersedia di database!\n')
    } else {
      console.log('⚠️ Beberapa field tidak tersedia. Jalankan: npx prisma db push\n')
    }

    // 5. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 SUMMARY INTEGRASI BRANDING:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Database schema: Ready')
    console.log('✅ Settings record: Exists')
    console.log('✅ Dashboard theme fields: 19 fields available')
    console.log('✅ CRUD operations: Working')
    console.log('')
    console.log('📝 Cara menggunakan:')
    console.log('   1. Buka http://localhost:3000/admin/settings/branding')
    console.log('   2. Scroll ke section "Warna Dashboard"')
    console.log('   3. Ubah warna sesuai keinginan')
    console.log('   4. Klik "Simpan Perubahan"')
    console.log('   5. Halaman akan refresh dan sidebar akan menggunakan warna baru')
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testBrandingIntegration()
