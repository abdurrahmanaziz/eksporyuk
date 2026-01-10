/**
 * Practical test: Try to generate a membership link via smart-generate API
 * This simulates what happens when user clicks "Generate Link" for a membership
 */

import fetch from 'node-fetch'

async function testMembershipLinkGeneration() {
  console.log('\n=== TESTING MEMBERSHIP LINK GENERATION API ===\n')

  // Step 1: Get auth token (simulate login)
  console.log('1️⃣  Attempting to generate membership link via API...')
  console.log('   Note: This test needs a running Next.js server on port 3000')

  const testPayload = {
    targetType: 'membership',
    targetId: 'mem_6bulan_ekspor', // Using the membership ID we found
    couponId: null
  }

  console.log('\n   API Call Details:')
  console.log('   URL: http://localhost:3000/api/affiliate/links/smart-generate')
  console.log('   Method: POST')
  console.log('   Body:', JSON.stringify(testPayload, null, 2))

  try {
    const response = await fetch('http://localhost:3000/api/affiliate/links/smart-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    const data = await response.json()

    console.log('\n   Response Status:', response.status)
    console.log('   Response Body:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\n✅ API call successful!')
      console.log(`   Generated ${data.linksCreated} links`)
      if (data.links && data.links.length > 0) {
        console.log(`\n   Generated links:`)
        data.links.forEach((link, i) => {
          console.log(`   ${i+1}. [${link.linkType}] ${link.code}`)
          console.log(`      URL: ${link.url?.substring(0, 80)}...`)
        })
      }
    } else {
      console.log('\n❌ API call failed!')
      if (data.error) {
        console.log(`   Error: ${data.error}`)
      }
    }

  } catch (error) {
    console.log('\n❌ Connection error:')
    console.log(`   ${error.message}`)
    console.log('   Make sure Next.js server is running: npm run dev')
  }

  console.log('\n=== TEST COMPLETE ===\n')
}

testMembershipLinkGeneration()
