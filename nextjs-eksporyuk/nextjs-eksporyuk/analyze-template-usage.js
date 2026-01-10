#!/usr/bin/env node

/**
 * Email Template Usage Analytics
 * Usage: node analyze-template-usage.js
 * 
 * Provides analytics on email template performance:
 * - Usage count per template
 * - Last used date
 * - Success rate
 * - Most used templates
 * - Templates that need attention
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeUsage() {
  try {
    console.log('📊 Email Template Usage Analytics\n')
    console.log('=' .repeat(60))

    // Get all templates with usage data
    const templates = await prisma.brandedTemplate.findMany({
      where: {
        category: 'COMMISSION',
      },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        usageCount: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    })

    // Get detailed usage from BrandedTemplateUsage table
    const usage = await prisma.brandedTemplateUsage.groupBy({
      by: ['templateId', 'success'],
      _count: true,
    })

    // Get recent usage
    const recentUsage = await prisma.brandedTemplateUsage.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        templateId: true,
      },
    })

    const recentCount = recentUsage.length

    if (templates.length === 0) {
      console.log('❌ No commission templates found.')
      return
    }

    // Display summary
    const totalUsages = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0)
    const activeCount = templates.filter(t => t.isActive).length
    const inactiveCount = templates.length - activeCount

    console.log(`\n📈 SUMMARY:`)
    console.log(`  Total templates: ${templates.length}`)
    console.log(`  Active: ${activeCount}`)
    console.log(`  Inactive: ${inactiveCount}`)
    console.log(`  Total uses: ${totalUsages}`)
    console.log(`  Uses in last 7 days: ${recentCount}`)

    // Display per-template stats
    console.log(`\n📋 TEMPLATE DETAILS:`)
    console.log('-'.repeat(60))

    let idx = 1
    for (const template of templates) {
      const statusIcon = template.isActive ? '✅' : '⚠️'
      const usageStatus =
        template.usageCount === 0 ? '(NEVER USED)' :
        template.usageCount < 5 ? '(LOW USAGE)' : ''

      console.log(`${idx}. ${statusIcon} ${template.slug}`)
      console.log(`   Uses: ${template.usageCount || 0} ${usageStatus}`)

      if (template.lastUsedAt) {
        const daysAgo = Math.floor(
          (Date.now() - template.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        console.log(`   Last used: ${daysAgo} days ago`)
      } else if (template.usageCount === 0) {
        console.log(`   Last used: Never`)
      }

      console.log('')
      idx++
    }

    // Recommendations
    console.log('-'.repeat(60))
    console.log(`\n💡 RECOMMENDATIONS:`)

    const neverUsed = templates.filter(t => t.usageCount === 0)
    const lowUsage = templates.filter(t => t.usageCount > 0 && t.usageCount < 5)
    const inactive = templates.filter(t => !t.isActive)

    if (neverUsed.length > 0) {
      console.log(`\n🔴 Templates never used (${neverUsed.length}):`)
      neverUsed.forEach(t => {
        console.log(`   - ${t.slug}`)
      })
      console.log(`   ➜ Check if APIs are calling renderBrandedTemplateBySlug()`)
    }

    if (lowUsage.length > 0) {
      console.log(`\n🟡 Templates with low usage (${lowUsage.length}):`)
      lowUsage.forEach(t => {
        console.log(`   - ${t.slug} (${t.usageCount} uses)`)
      })
      console.log(`   ➜ These may need to be triggered more often`)
    }

    if (inactive.length > 0) {
      console.log(`\n⚪ Inactive templates (${inactive.length}):`)
      inactive.forEach(t => {
        console.log(`   - ${t.slug}`)
      })
      console.log(`   ➜ Enable or remove if not needed`)
    }

    // Most used
    const mostUsed = templates.filter(t => t.usageCount > 0).slice(0, 3)
    if (mostUsed.length > 0) {
      console.log(`\n🏆 Most used templates:`)
      mostUsed.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.slug} (${t.usageCount} uses)`)
      })
    }

    console.log(`\n` + '='.repeat(60) + '\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeUsage().then(() => {
  console.log('✅ Analysis complete!')
  process.exit(0)
})
