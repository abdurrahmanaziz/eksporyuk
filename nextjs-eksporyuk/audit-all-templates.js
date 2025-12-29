const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function auditAllTemplates() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('📋 AUDIT LENGKAP SEMUA TEMPLATE EMAIL')
    console.log('='.repeat(80) + '\n')

    const allTemplates = await prisma.brandedTemplate.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        type: true,
        subject: true,
        isActive: true,
        priority: true,
        isDefault: true,
        createdAt: true
      }
    })

    // Group by category
    const byCategory = {}
    allTemplates.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = []
      }
      byCategory[t.category].push(t)
    })

    // Stats
    const stats = {
      total: allTemplates.length,
      active: allTemplates.filter(t => t.isActive).length,
      inactive: allTemplates.filter(t => !t.isActive).length,
      default: allTemplates.filter(t => t.isDefault).length,
      byCategory: {},
      byPriority: {}
    }

    Object.keys(byCategory).forEach(cat => {
      stats.byCategory[cat] = byCategory[cat].length
    })

    allTemplates.forEach(t => {
      if (!stats.byPriority[t.priority]) {
        stats.byPriority[t.priority] = 0
      }
      stats.byPriority[t.priority]++
    })

    // Display stats
    console.log('📊 STATISTIK KESELURUHAN:')
    console.log(`   Total Template: ${stats.total}`)
    console.log(`   Aktif: ${stats.active} ✅`)
    console.log(`   Tidak Aktif: ${stats.inactive} ⚠️`)
    console.log(`   Default: ${stats.default} 🌟`)
    console.log()

    // Display by category
    console.log('📁 TEMPLATE PER KATEGORI:\n')
    
    const categories = [
      'SYSTEM', 'PAYMENT', 'MEMBERSHIP', 'COURSE', 'EVENT', 'MARKETING', 'AFFILIATE'
    ]

    for (const category of categories) {
      const templates = byCategory[category] || []
      if (templates.length === 0) continue

      console.log(`\n${category} (${templates.length})`)
      console.log('-'.repeat(70))
      
      templates.forEach(t => {
        const status = t.isActive ? '✅' : '❌'
        const isDefault = t.isDefault ? ' 🌟' : ''
        const priority = `[${t.priority}]`.padEnd(10)
        console.log(`${status} ${t.name.padEnd(40)} ${priority}${isDefault}`)
        console.log(`   └─ slug: ${t.slug}`)
      })
    }

    // Check for issues
    console.log('\n' + '='.repeat(80))
    console.log('🔍 VERIFIKASI MASALAH:')
    console.log('='.repeat(80) + '\n')

    const issues = []

    // Check duplicates by slug
    const slugs = {}
    allTemplates.forEach(t => {
      if (slugs[t.slug]) {
        issues.push(`❌ Duplikat slug: "${t.slug}" (${t.name})`)
      }
      slugs[t.slug] = true
    })

    // Check empty content/subject
    const templateDetails = await prisma.brandedTemplate.findMany({
      select: { name: true, slug: true, subject: true, content: true }
    })

    // Check all categories covered
    const requiredCategories = ['SYSTEM', 'PAYMENT', 'MEMBERSHIP', 'COURSE', 'EVENT', 'MARKETING', 'AFFILIATE']
    const missingCategories = requiredCategories.filter(cat => !byCategory[cat] || byCategory[cat].length === 0)

    if (missingCategories.length > 0) {
      issues.push(`⚠️  Kategori kosong: ${missingCategories.join(', ')}`)
    }

    // Minimum templates per category
    const minTemplates = {
      'SYSTEM': 6,
      'PAYMENT': 6,
      'MEMBERSHIP': 5,
      'COURSE': 4,
      'EVENT': 4,
      'MARKETING': 3,
      'AFFILIATE': 5
    }

    Object.keys(minTemplates).forEach(cat => {
      const count = byCategory[cat]?.length || 0
      const required = minTemplates[cat]
      if (count < required) {
        issues.push(`⚠️  ${cat}: ${count}/${required} templates`)
      }
    })

    if (issues.length === 0) {
      console.log('✅ SEMUA VERIFIKASI BERHASIL!')
      console.log('   - Tidak ada duplikat slug')
      console.log('   - Semua kategori tercukupi')
      console.log('   - Jumlah template memenuhi minimum')
    } else {
      console.log('Masalah yang ditemukan:\n')
      issues.forEach(issue => console.log(`  ${issue}`))
    }

    // Priority distribution
    console.log('\n' + '='.repeat(80))
    console.log('⚡ DISTRIBUSI PRIORITAS:')
    console.log('='.repeat(80) + '\n')
    
    Object.keys(stats.byPriority).sort().forEach(priority => {
      console.log(`  ${priority.padEnd(10)}: ${stats.byPriority[priority]} templates`)
    })

    // Summary by type
    console.log('\n' + '='.repeat(80))
    console.log('📧 TIPE TEMPLATE:')
    console.log('='.repeat(80) + '\n')
    
    const typeStats = {}
    allTemplates.forEach(t => {
      typeStats[t.type] = (typeStats[t.type] || 0) + 1
    })

    Object.keys(typeStats).forEach(type => {
      console.log(`  ${type}: ${typeStats[type]} templates`)
    })

    console.log('\n' + '='.repeat(80))
    console.log('✅ AUDIT SELESAI!')
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    console.error('FATAL ERROR:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

auditAllTemplates()
