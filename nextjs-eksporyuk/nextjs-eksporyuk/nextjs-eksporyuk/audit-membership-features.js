const fs = require('fs')
const path = require('path')

console.log('🔍 AUDIT FITUR MEMBERSHIP SISTEM\n')
console.log('=' .repeat(80))

// Helper function to check if file exists
const fileExists = (filePath) => fs.existsSync(path.join(__dirname, filePath))

// Helper function to check if directory exists
const dirExists = (dirPath) => fs.existsSync(path.join(__dirname, dirPath))

const features = {
  '📊 DATABASE MODELS': [
    { name: 'Membership Model', path: 'prisma/schema.prisma', check: () => fileExists('prisma/schema.prisma') && fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8').includes('model Membership') },
    { name: 'UserMembership Model', path: 'prisma/schema.prisma', check: () => fileExists('prisma/schema.prisma') && fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8').includes('model UserMembership') },
    { name: 'MembershipGroup Model', path: 'prisma/schema.prisma', check: () => fileExists('prisma/schema.prisma') && fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8').includes('model MembershipGroup') },
    { name: 'MembershipCourse Model', path: 'prisma/schema.prisma', check: () => fileExists('prisma/schema.prisma') && fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8').includes('model MembershipCourse') },
    { name: 'MembershipProduct Model', path: 'prisma/schema.prisma', check: () => fileExists('prisma/schema.prisma') && fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8').includes('model MembershipProduct') },
    { name: 'MembershipUpgradeLog Model', path: 'prisma/schema.prisma', check: () => fileExists('prisma/schema.prisma') && fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8').includes('model MembershipUpgradeLog') },
  ],
  
  '🎯 API ENDPOINTS - ADMIN': [
    { name: 'GET/POST /api/admin/membership', path: 'src/app/api/admin/membership/route.ts', check: () => fileExists('src/app/api/admin/membership/route.ts') },
    { name: 'GET /api/admin/membership/plans', path: 'src/app/api/admin/membership/plans/route.ts', check: () => fileExists('src/app/api/admin/membership/plans/route.ts') },
    { name: 'PATCH/DELETE /api/admin/membership/[id]', path: 'src/app/api/admin/membership/[id]/route.ts', check: () => fileExists('src/app/api/admin/membership/[id]/route.ts') },
    { name: 'POST /api/admin/membership/[id]/extend', path: 'src/app/api/admin/membership/[id]/extend/route.ts', check: () => fileExists('src/app/api/admin/membership/[id]/extend/route.ts') },
    { name: 'POST /api/admin/membership/sync-features', path: 'src/app/api/admin/membership/sync-features/route.ts', check: () => fileExists('src/app/api/admin/membership/sync-features/route.ts') },
  ],
  
  '🎯 API ENDPOINTS - PUBLIC': [
    { name: 'GET /api/memberships/packages', path: 'src/app/api/memberships/packages/route.ts', check: () => fileExists('src/app/api/memberships/packages/route.ts') },
    { name: 'POST /api/memberships/upgrade', path: 'src/app/api/memberships/upgrade/route.ts', check: () => fileExists('src/app/api/memberships/upgrade/route.ts') },
    { name: 'GET /api/memberships/user', path: 'src/app/api/memberships/user/route.ts', check: () => fileExists('src/app/api/memberships/user/route.ts') },
    { name: 'Membership Package API [id]', path: 'src/app/api/memberships/packages/[id]/route.ts', check: () => fileExists('src/app/api/memberships/packages/[id]/route.ts') },
  ],
  
  '🖥️ ADMIN UI PAGES': [
    { name: 'Admin Membership Management', path: 'src/app/(dashboard)/admin/membership/page.tsx', check: () => fileExists('src/app/(dashboard)/admin/membership/page.tsx') },
  ],
  
  '👤 USER-FACING PAGES': [
    { name: 'Public Membership Page', path: 'src/app/membership/[slug]/page.tsx', check: () => fileExists('src/app/membership/[slug]/page.tsx') },
    { name: 'User Dashboard - My Membership', path: 'src/app/(dashboard)/my-dashboard/page.tsx', check: () => fileExists('src/app/(dashboard)/my-dashboard/page.tsx') },
    { name: 'Upgrade Page', path: 'src/app/(dashboard)/dashboard/upgrade/page.tsx', check: () => fileExists('src/app/(dashboard)/dashboard/upgrade/page.tsx') },
    { name: 'Checkout Unified Page', path: 'src/app/(public)/checkout-unified/page.tsx', check: () => fileExists('src/app/(public)/checkout-unified/page.tsx') },
  ],
  
  '🔧 LIBRARIES & UTILITIES': [
    { name: 'Membership Features Logic', path: 'src/lib/membership-features.ts', check: () => fileExists('src/lib/membership-features.ts') },
    { name: 'Auto-assign Features Function', path: 'src/lib/membership-features.ts', check: () => {
      if (!fileExists('src/lib/membership-features.ts')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/lib/membership-features.ts'), 'utf8')
      return content.includes('autoAssignMembershipFeatures')
    }},
    { name: 'Sync Features Function', path: 'src/lib/membership-features.ts', check: () => {
      if (!fileExists('src/lib/membership-features.ts')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/lib/membership-features.ts'), 'utf8')
      return content.includes('syncUserMembershipFeatures')
    }},
  ],
  
  '📱 SIDEBAR MENU': [
    { name: 'Admin - Kelola Membership Menu', path: 'src/components/layout/DashboardSidebar.tsx', check: () => {
      if (!fileExists('src/components/layout/DashboardSidebar.tsx')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/components/layout/DashboardSidebar.tsx'), 'utf8')
      return content.includes('Kelola Membership') && content.includes('/admin/membership')
    }},
    { name: 'Member - My Dashboard Menu', path: 'src/components/layout/DashboardSidebar.tsx', check: () => {
      if (!fileExists('src/components/layout/DashboardSidebar.tsx')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/components/layout/DashboardSidebar.tsx'), 'utf8')
      return content.includes('My Dashboard') && content.includes('/my-dashboard')
    }},
    { name: 'Member - Upgrade Menu', path: 'src/components/layout/DashboardSidebar.tsx', check: () => {
      if (!fileExists('src/components/layout/DashboardSidebar.tsx')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/components/layout/DashboardSidebar.tsx'), 'utf8')
      return content.includes('Upgrade') || content.includes('Jadi Premium')
    }},
  ],
  
  '🔄 INTEGRATION POINTS': [
    { name: 'Sales Integration', path: 'src/app/api/sales/route.ts', check: () => {
      if (!fileExists('src/app/api/sales/route.ts')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/app/api/sales/route.ts'), 'utf8')
      return content.includes('membership')
    }},
    { name: 'Transaction Integration', path: 'src/app/api/transactions/route.ts', check: () => {
      if (!fileExists('src/app/api/transactions/route.ts')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/app/api/transactions/route.ts'), 'utf8')
      return content.includes('membership')
    }},
    { name: 'Webhook Integration', path: 'src/app/api/webhooks/xendit/route.ts', check: () => {
      if (!fileExists('src/app/api/webhooks/xendit/route.ts')) return false
      const content = fs.readFileSync(path.join(__dirname, 'src/app/api/webhooks/xendit/route.ts'), 'utf8')
      return content.includes('membership')
    }},
  ],
}

// Check all features
let totalFeatures = 0
let implementedFeatures = 0
let missingFeatures = []

Object.entries(features).forEach(([category, items]) => {
  console.log(`\n${category}`)
  console.log('-'.repeat(80))
  
  items.forEach(item => {
    totalFeatures++
    const status = item.check()
    
    if (status) {
      implementedFeatures++
      console.log(`✅ ${item.name}`)
      console.log(`   ${item.path}`)
    } else {
      console.log(`❌ ${item.name}`)
      console.log(`   ${item.path}`)
      missingFeatures.push({ category, name: item.name, path: item.path })
    }
  })
})

// Summary
console.log('\n' + '='.repeat(80))
console.log('\n📊 SUMMARY AUDIT')
console.log(`Total Fitur: ${totalFeatures}`)
console.log(`✅ Sudah Ada: ${implementedFeatures} (${Math.round(implementedFeatures/totalFeatures*100)}%)`)
console.log(`❌ Belum Ada: ${totalFeatures - implementedFeatures} (${Math.round((totalFeatures - implementedFeatures)/totalFeatures*100)}%)`)

if (missingFeatures.length > 0) {
  console.log('\n⚠️  FITUR YANG BELUM DIIMPLEMENTASI:')
  missingFeatures.forEach((item, idx) => {
    console.log(`\n${idx + 1}. ${item.name}`)
    console.log(`   Kategori: ${item.category}`)
    console.log(`   Path: ${item.path}`)
  })
  
  console.log('\n🔧 REKOMENDASI:')
  console.log('1. Prioritaskan fitur core user-facing (My Dashboard, Upgrade Page)')
  console.log('2. Lengkapi API endpoints yang belum ada')
  console.log('3. Pastikan integrasi dengan sales & transaction berjalan')
  console.log('4. Test webhook untuk auto-activation membership')
} else {
  console.log('\n🎉 SEMUA FITUR SUDAH DIIMPLEMENTASI!')
}

console.log('\n' + '='.repeat(80))
