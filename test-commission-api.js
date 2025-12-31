#!/usr/bin/env node

/**
 * Test Commission Settings API
 * Demonstrates how to use the new commission update endpoints
 */

const BASE_URL = 'http://localhost:3000'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`)
}

async function testCommissionAPI() {
  log(colors.cyan, '\n🚀 Commission Settings API Test\n')

  try {
    // Test 1: Get all commission settings
    log(colors.bright, '📊 Test 1: Get Commission Settings')
    log(colors.blue, '→ Fetching all memberships and products...\n')

    const settingsResponse = await fetch(`${BASE_URL}/api/admin/commission/settings`, {
      headers: {
        'Cookie': 'YOUR_SESSION_COOKIE_HERE' // You need to set actual session
      }
    })

    if (!settingsResponse.ok) {
      log(colors.red, `✗ Failed to fetch settings: ${settingsResponse.status}`)
      console.log('Note: You need to be logged in as ADMIN to test this API')
      console.log('Cookie: Set your session cookie from browser')
      return
    }

    const settingsData = await settingsResponse.json()

    if (settingsData.success) {
      log(colors.green, '✓ Successfully fetched commission settings')
      console.log('\n📈 Statistics:')
      console.log(`  Memberships: ${settingsData.data.statistics.memberships.total}`)
      console.log(`  Products: ${settingsData.data.statistics.products.total}`)
      console.log(`  FLAT Commissions: ${settingsData.data.statistics.combined.flatCommission}`)
      console.log(`  PERCENTAGE Commissions: ${settingsData.data.statistics.combined.percentageCommission}`)

      // Show sample membership
      if (settingsData.data.memberships.length > 0) {
        const sample = settingsData.data.memberships[0]
        console.log(`\n📍 Sample Membership: ${sample.title}`)
        console.log(`  Price: Rp ${sample.price.toLocaleString('id-ID')}`)
        console.log(`  Commission Type: ${sample.commissionType}`)
        console.log(`  Commission Rate: ${sample.commissionType === 'FLAT' ? 'Rp ' + sample.affiliateCommissionRate.toLocaleString('id-ID') : sample.affiliateCommissionRate + '%'}`)
        console.log(`  Equivalent: ${sample.equivalentPercentage}% of price`)
      }
    } else {
      log(colors.red, '✗ Error:', settingsData.error)
    }

    // Test 2: Update single membership commission
    log(colors.bright, '\n💾 Test 2: Update Single Membership Commission (Example)')
    console.log('\n📝 Payload Example:')
    const examplePayload1 = {
      membershipId: 'YOUR_MEMBERSHIP_ID',
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 20
    }
    console.log(JSON.stringify(examplePayload1, null, 2))

    console.log('\n📝 cURL Example:')
    console.log(`curl -X POST ${BASE_URL}/api/admin/commission/update \\`)
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{\n    "membershipId": "YOUR_MEMBERSHIP_ID",\n    "commissionType": "PERCENTAGE",\n    "affiliateCommissionRate": 20\n  }\'')

    // Test 3: Bulk update
    log(colors.bright, '\n📦 Test 3: Bulk Update Commissions (Example)')
    console.log('\n📝 Payload Example (Update all memberships to 15% PERCENTAGE):')
    const examplePayload2 = {
      membershipIds: ['id1', 'id2', 'id3'],
      commissionType: 'PERCENTAGE',
      affiliateCommissionRate: 15
    }
    console.log(JSON.stringify(examplePayload2, null, 2))

    console.log('\n📝 cURL Example:')
    console.log(`curl -X PUT ${BASE_URL}/api/admin/commission/update \\`)
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{\n    "membershipIds": ["id1", "id2", "id3"],\n    "commissionType": "PERCENTAGE",\n    "affiliateCommissionRate": 15\n  }\'')

  } catch (error) {
    log(colors.red, '✗ Error:', error.message)
  }

  // Print helpful info
  log(colors.cyan, '\n📚 Commission System Info:')
  console.log(`
  FLAT Commission:
    - Fixed amount in Rupiah
    - Example: Rp 325,000 per transaction
    - Good for: Predictable income

  PERCENTAGE Commission:
    - Percentage of transaction amount
    - Example: 20% of Rp 2,000,000 = Rp 400,000
    - Good for: Scaling with product price

  Auto-Conversion:
    - When changing commission type, the rate is automatically converted
    - FLAT to PERCENTAGE: Converts to equivalent percentage of price
    - PERCENTAGE to FLAT: Converts to equivalent rupiah amount

  Distribution:
    - Affiliate: Directly to balance (withdrawable)
    - Admin/Founder/Co-Founder: To balancePending (requires approval)
  `)

  log(colors.cyan, '\n✅ To access Commission Settings:')
  console.log('  1. Log in as ADMIN')
  console.log('  2. Navigate to: /admin/commission-settings')
  console.log('  3. Use the UI to manage all commission rates')
  console.log('  4. Changes are saved automatically to database\n')
}

testCommissionAPI()