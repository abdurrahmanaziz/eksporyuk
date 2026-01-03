#!/usr/bin/env node

/**
 * Verify and create missing commission email templates
 * Usage: node verify-commission-templates.js
 * 
 * Checks if all required commission email templates exist in database
 * Creates them from defaults if missing
 */

import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Define all required commission templates
const REQUIRED_TEMPLATES = [
  {
    slug: 'affiliate-commission-received',
    category: 'COMMISSION',
    description: 'Email notification when affiliate receives commission',
  },
  {
    slug: 'mentor-commission-received',
    category: 'COMMISSION',
    description: 'Email notification when mentor receives course commission',
  },
  {
    slug: 'admin-fee-pending',
    category: 'COMMISSION',
    description: 'Admin fee pending approval notification',
  },
  {
    slug: 'founder-share-pending',
    category: 'COMMISSION',
    description: 'Founder share pending approval notification',
  },
  {
    slug: 'cofounder-share-pending',
    category: 'COMMISSION',
    description: 'Co-founder share pending approval notification',
  },
  {
    slug: 'pending-revenue-approved',
    category: 'COMMISSION',
    description: 'Notification when pending revenue is approved',
  },
  {
    slug: 'pending-revenue-rejected',
    category: 'COMMISSION',
    description: 'Notification when pending revenue is rejected',
  },
  {
    slug: 'commission-settings-changed',
    category: 'COMMISSION',
    description: 'Notification when commission settings are updated',
  },
]

// Default template content for missing templates
const DEFAULT_TEMPLATE_CONTENT = {
  subject: 'Commission Payment Notification - {site_name}',
  content: 'Hello {name},\n\nYou have received a commission payment.\n\nPlease log in to your dashboard to view details.\n\nBest regards,\n{site_name} Team',
  ctaText: 'View Dashboard',
  ctaLink: '{dashboard_url}',
}

async function verifyTemplates() {
  try {
    console.log('🔍 Verifying commission email templates...\n')

    let missingCount = 0
    let existingCount = 0
    const results = []

    // Check each template
    for (const template of REQUIRED_TEMPLATES) {
      const exists = await prisma.brandedTemplate.findFirst({
        where: {
          slug: template.slug,
          category: template.category,
        },
      })

      if (exists) {
        console.log(`✅ ${template.slug} - EXISTS (Usage: ${exists.usageCount}, Active: ${exists.isActive})`)
        results.push({
          slug: template.slug,
          status: 'exists',
          usageCount: exists.usageCount,
          isActive: exists.isActive,
        })
        existingCount++
      } else {
        console.log(`❌ ${template.slug} - MISSING`)
        results.push({
          slug: template.slug,
          status: 'missing',
        })
        missingCount++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`  Existing: ${existingCount}/${REQUIRED_TEMPLATES.length}`)
    console.log(`  Missing: ${missingCount}/${REQUIRED_TEMPLATES.length}`)

    if (missingCount === 0) {
      console.log('\n✅ All commission templates exist!')
      return results
    }

    // Ask to create missing templates
    console.log('\n⚠️  Missing templates detected. Creating with default content...\n')

    let createdCount = 0
    for (const template of REQUIRED_TEMPLATES) {
      const exists = await prisma.brandedTemplate.findFirst({
        where: {
          slug: template.slug,
          category: template.category,
        },
      })

      if (!exists) {
        try {
          await prisma.brandedTemplate.create({
            data: {
              id: randomBytes(16).toString('hex'),
              slug: template.slug,
              name: template.slug
                .split('-')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
              category: template.category,
              description: template.description,
              subject: DEFAULT_TEMPLATE_CONTENT.subject,
              content: DEFAULT_TEMPLATE_CONTENT.content,
              ctaText: DEFAULT_TEMPLATE_CONTENT.ctaText,
              ctaLink: DEFAULT_TEMPLATE_CONTENT.ctaLink,
              type: 'EMAIL',
              isActive: true,
              usageCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })
          console.log(`  ✓ Created: ${template.slug}`)
          createdCount++
        } catch (error) {
          console.error(`  ✗ Failed to create ${template.slug}: ${error.message}`)
        }
      }
    }

    console.log(`\n✅ Template creation complete!`)
    console.log(`  Successfully created: ${createdCount}`)
    console.log(`\n💡 Note: Templates were created with default content.`)
    console.log(`   Please customize them via the admin dashboard for better results.\n`)

    return results
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyTemplates().then(() => {
  console.log('Done!')
  process.exit(0)
})
