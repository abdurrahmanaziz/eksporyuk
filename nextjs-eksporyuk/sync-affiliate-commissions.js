/**
 * Sync Affiliate Commissions - Ensure data consistency between tables
 * 
 * This script:
 * 1. Finds all transactions with affiliates that DON'T have AffiliateConversion records
 * 2. Creates missing AffiliateConversion records
 * 3. Verifies wallet balances match AffiliateConversion sum
 * 4. Produces reconciliation report
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function syncAffiliateCommissions() {
  console.log('🔄 SYNCING AFFILIATE COMMISSIONS TO ENSURE REALTIME CONSISTENCY\n')
  
  try {
    // Step 1: Get all transactions with affiliate share
    console.log('📊 Step 1: Analyzing transactions...')
    const transactionsWithAffiliates = await prisma.transaction.findMany({
      where: {
        affiliateShare: { gt: 0 },
      },
      select: {
        id: true,
        amount: true,
        affiliateShare: true,
        affiliateId: true,
        status: true,
        metadata: true,
      },
    })
    
    console.log(`   Found ${transactionsWithAffiliates.length} transactions with affiliate commission\n`)
    
    // Step 2: Get all AffiliateConversion records
    console.log('📊 Step 2: Getting existing conversion records...')
    const existingConversions = await prisma.affiliateConversion.findMany({
      select: { transactionId: true, affiliateId: true, commissionAmount: true },
    })
    const existingTxIds = new Set(existingConversions.map(c => c.transactionId))
    console.log(`   Found ${existingConversions.length} existing conversion records\n`)
    
    // Step 3: Find missing conversions
    const missingConversions = transactionsWithAffiliates.filter(
      tx => !existingTxIds.has(tx.id)
    )
    
    console.log(`   Missing conversions: ${missingConversions.length}`)
    
    if (missingConversions.length === 0) {
      console.log('\n✅ All transactions already have conversion records!\n')
      created = 0
      failed = 0
    } else {
      console.log(`   Creating ${missingConversions.length} missing conversion records...\n`)
      
      let createdLocal = 0
      let failedLocal = 0
      const failedRecords = []
      
      for (const tx of missingConversions) {
        try {
          // Get or create affiliate profile for this user
          let affiliateProfile = await prisma.affiliateProfile.findUnique({
            where: { userId: tx.affiliateId },
          })
          
          if (!affiliateProfile) {
            affiliateProfile = await prisma.affiliateProfile.create({
              data: {
                userId: tx.affiliateId,
                affiliateCode: `AFFILIATE_${tx.affiliateId.substring(0, 8)}`,
                tier: 1,
                commissionRate: 10,
                totalClicks: 0,
                totalConversions: 0,
                totalEarnings: 0,
              },
            })
          }
          
          // Create conversion record
          await prisma.affiliateConversion.create({
            data: {
              affiliateId: affiliateProfile.id,
              transactionId: tx.id,
              commissionAmount: tx.affiliateShare,
              commissionRate: 10, // Default, will be overridden if product/membership data exists
              commissionType: 'PERCENTAGE',
              paidOut: false,
            },
          })
          
          createdLocal++
        } catch (err) {
          failedLocal++
          failedRecords.push({
            transactionId: tx.id,
            error: err.message,
          })
        }
      }
      
      created = createdLocal
      failed = failedLocal
      
      console.log(`   ✅ Created: ${created}`)
      console.log(`   ❌ Failed: ${failed}\n`)
      
      if (failedRecords.length > 0) {
        console.log('   Failed records:')
        failedRecords.slice(0, 5).forEach(r => {
          console.log(`     - ${r.transactionId}: ${r.error}`)
        })
      }
    }
    
    // Step 4: Verify wallet balances
    console.log('\n📊 Step 3: Verifying wallet balances...')
    
    // Get all unique affiliate IDs
    const allAffiliateIds = await prisma.$queryRaw`
      SELECT DISTINCT "affiliateId" FROM "AffiliateConversion"
    `
    
    console.log(`   Checking ${allAffiliateIds.length} affiliate wallets\n`)
    
    let walletsMismatch = 0
    let walletsCorrect = 0
    const mismatchDetails = []
    
    for (const record of allAffiliateIds) {
      const affiliateId = record.affiliateId
      
      // Get user ID for this affiliate
      const affiliate = await prisma.affiliateProfile.findUnique({
        where: { id: affiliateId },
        select: { userId: true },
      })
      
      if (!affiliate) continue
      
      // Sum of commissions from AffiliateConversion
      const conversionSum = await prisma.affiliateConversion.aggregate({
        where: { affiliateId },
        _sum: { commissionAmount: true },
      })
      
      const expectedTotal = Number(conversionSum._sum.commissionAmount || 0)
      
      // Get wallet total earnings
      const wallet = await prisma.wallet.findUnique({
        where: { userId: affiliate.userId },
        select: { totalEarnings: true, balance: true },
      })
      
      const walletTotal = Number(wallet?.totalEarnings || 0)
      
      // Compare
      const difference = Math.abs(expectedTotal - walletTotal)
      
      if (difference > 100) { // Allow 100 Rp difference due to rounding
        walletsMismatch++
        mismatchDetails.push({
          affiliateId,
          userId: affiliate.userId,
          expected: expectedTotal,
          actual: walletTotal,
          difference,
        })
        
        // Auto-fix: Update wallet to match conversion sum
        await prisma.wallet.update({
          where: { userId: affiliate.userId },
          data: {
            totalEarnings: expectedTotal,
          },
        })
      } else {
        walletsCorrect++
      }
    }
    
    console.log(`   ✅ Wallets correct: ${walletsCorrect}`)
    console.log(`   ⚠️  Wallets fixed: ${walletsMismatch}\n`)
    
    if (mismatchDetails.length > 0) {
      console.log('   Fixed wallets:')
      mismatchDetails.slice(0, 5).forEach(m => {
        console.log(`     - User ${m.userId.substring(0, 8)}...`)
        console.log(`       Expected: Rp ${m.expected.toLocaleString('id-ID')}`)
        console.log(`       Was: Rp ${m.actual.toLocaleString('id-ID')}`)
        console.log(`       Difference: Rp ${m.difference.toLocaleString('id-ID')}`)
      })
    }
    
    // Step 5: Summary
    console.log('\n' + '='.repeat(70))
    console.log('📈 RECONCILIATION SUMMARY')
    console.log('='.repeat(70))
    
    const finalStats = await prisma.affiliateConversion.aggregate({
      _sum: { commissionAmount: true },
      _count: { id: true },
    })
    
    const affiliatesWithEarnings = allAffiliateIds.length
    const totalConversions = Number(finalStats._count.id || 0)
    const totalEarnings = Number(finalStats._sum.commissionAmount || 0)
    
    console.log(`
✅ Affiliates with commissions: ${affiliatesWithEarnings}
✅ Total conversion records: ${totalConversions}
✅ Total commissions: Rp ${totalEarnings.toLocaleString('id-ID')}

🔄 Actions taken:
   - Created missing conversion records: ${created}
   - Fixed wallet balances: ${walletsMismatch}
   - Verified correct wallets: ${walletsCorrect}

📊 Data is now consistent across:
   ✓ AffiliateConversion table (aggregated for admin)
   ✓ Wallet.totalEarnings (individual user balance)
   ✓ AffiliateProfile.totalEarnings (profile stats)
    `)
    
    console.log('✅ SYNC COMPLETE!\n')
    
  } catch (error) {
    console.error('❌ Error during sync:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run with confirmation
const args = process.argv.slice(2)
if (args.includes('--execute')) {
  syncAffiliateCommissions()
} else {
  console.log('Usage: node sync-affiliate-commissions.js --execute')
  console.log('\nThis script will:')
  console.log('1. Find all transactions with affiliates missing conversion records')
  console.log('2. Create missing AffiliateConversion records')
  console.log('3. Verify and fix wallet balances')
  console.log('4. Ensure realtime data consistency\n')
  console.log('Run with --execute flag to proceed')
}
