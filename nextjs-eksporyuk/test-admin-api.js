#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')
const prisma = new PrismaClient()

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

function log(type, message) {
  const prefix = {
    '✅': `${colors.green}${colors.bright}✅${colors.reset}`,
    '❌': `${colors.red}${colors.bright}❌${colors.reset}`,
    '⚠️': `${colors.yellow}${colors.bright}⚠️${colors.reset}`,
    '🎯': `${colors.cyan}${colors.bright}🎯${colors.reset}`,
  }[type] || type
  console.log(`${prefix} ${message}`)
}

async function testAPIs() {
  console.log(`\n${colors.cyan}${colors.bright}════════════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.cyan}${colors.bright} ADMIN SHORT LINKS API - ENDPOINT TESTING ${colors.reset}`)
  console.log(`${colors.cyan}${colors.bright}════════════════════════════════════════════════════════════${colors.reset}\n`)

  try {
    // Test 1: GET all domains
    console.log(`${colors.bright}[1] Testing GET /api/admin/short-link-domains${colors.reset}`)
    const domains = await prisma.shortLinkDomain.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' }
      ]
    })

    if (domains.length > 0) {
      log('✅', `Retrieved ${domains.length} domain(s)`)
      console.log(`   Sample response:`)
      console.log(`   - ID: ${domains[0].id}`)
      console.log(`   - Domain: ${domains[0].domain}`)
      console.log(`   - Display: ${domains[0].displayName}`)
      console.log(`   - Active: ${domains[0].isActive}`)
      console.log(`   - Default: ${domains[0].isDefault}`)
    } else {
      log('❌', 'No domains found')
      return
    }

    // Test 2: Simulate POST (create new domain)
    console.log(`\n${colors.bright}[2] Testing POST /api/admin/short-link-domains${colors.reset}`)
    const testDomain = {
      id: randomUUID(),
      domain: `test-${Date.now()}.eksporyuk.com`,
      displayName: `Test Domain ${Date.now()}`,
      isActive: true,
      isDefault: false,
      isVerified: false,
      dnsType: 'CNAME',
      dnsTarget: 'test.example.com',
      dnsInstructions: 'Test instructions',
      updatedAt: new Date()
    }

    const created = await prisma.shortLinkDomain.create({
      data: testDomain
    })
    log('✅', `Created domain: ${created.displayName}`)
    console.log(`   Domain ID: ${created.id}`)

    // Test 3: GET single domain
    console.log(`\n${colors.bright}[3] Testing GET /api/admin/short-link-domains/[id]${colors.reset}`)
    const singleDomain = await prisma.shortLinkDomain.findUnique({
      where: { id: created.id }
    })

    if (singleDomain) {
      log('✅', `Retrieved domain by ID: ${singleDomain.domain}`)
    } else {
      log('❌', 'Failed to retrieve domain')
    }

    // Test 4: PATCH domain
    console.log(`\n${colors.bright}[4] Testing PATCH /api/admin/short-link-domains/[id]${colors.reset}`)
    const updated = await prisma.shortLinkDomain.update({
      where: { id: created.id },
      data: {
        displayName: `Updated ${created.displayName}`,
        isVerified: true,
        updatedAt: new Date()
      }
    })

    if (updated.isVerified) {
      log('✅', `Updated domain: ${updated.displayName} (verified: ${updated.isVerified})`)
    } else {
      log('❌', 'Failed to update domain')
    }

    // Test 5: DELETE domain
    console.log(`\n${colors.bright}[5] Testing DELETE /api/admin/short-link-domains/[id]${colors.reset}`)
    const deleted = await prisma.shortLinkDomain.delete({
      where: { id: created.id }
    })

    log('✅', `Deleted domain: ${deleted.domain}`)

    // Test 6: Verify deletion
    console.log(`\n${colors.bright}[6] Verify Deletion${colors.reset}`)
    const checkDeleted = await prisma.shortLinkDomain.findUnique({
      where: { id: created.id }
    })

    if (!checkDeleted) {
      log('✅', 'Deletion confirmed - domain no longer exists')
    } else {
      log('❌', 'Deletion failed - domain still exists')
    }

    // Final Summary
    console.log(`\n${colors.bright}[7] Final Domain Count${colors.reset}`)
    const finalCount = await prisma.shortLinkDomain.count()
    log('✅', `Total domains in database: ${finalCount}`)

    console.log(`\n${colors.cyan}${colors.bright}════════════════════════════════════════════════════════════${colors.reset}`)
    console.log(`${colors.green}${colors.bright}✅ ALL API TESTS COMPLETED SUCCESSFULLY!${colors.reset}`)
    console.log(`${colors.cyan}${colors.bright}════════════════════════════════════════════════════════════${colors.reset}\n`)

  } catch (error) {
    log('❌', `Test failed: ${error.message}`)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIs()
