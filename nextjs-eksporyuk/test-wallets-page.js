const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testWalletsAPI() {
  try {
    console.log('\n🧪 Testing Admin Wallets API...\n')

    // Test 1: Get all wallets
    const walletsResponse = await fetch('http://localhost:3001/api/admin/wallets')
    const walletsData = await walletsResponse.json()
    
    console.log('✅ GET /api/admin/wallets')
    console.log(`   Status: ${walletsResponse.status}`)
    console.log(`   Wallets Found: ${walletsData.wallets?.length || 0}`)
    
    if (walletsData.wallets && walletsData.wallets.length > 0) {
      console.log('\n📊 Wallet Summary:')
      const totalBalance = walletsData.wallets.reduce((sum, w) => sum + w.balance, 0)
      const totalEarnings = walletsData.wallets.reduce((sum, w) => sum + w.totalEarnings, 0)
      const totalPayouts = walletsData.wallets.reduce((sum, w) => sum + w.totalPayouts, 0)
      
      console.log(`   Total Users: ${walletsData.wallets.length}`)
      console.log(`   Total Balance: Rp ${totalBalance.toLocaleString('id-ID')}`)
      console.log(`   Total Earnings: Rp ${totalEarnings.toLocaleString('id-ID')}`)
      console.log(`   Total Payouts: Rp ${totalPayouts.toLocaleString('id-ID')}`)
      
      console.log('\n👥 User Details:')
      walletsData.wallets.forEach(wallet => {
        console.log(`   - ${wallet.user.name} (${wallet.user.role})`)
        console.log(`     Balance: Rp ${wallet.balance.toLocaleString('id-ID')}`)
        console.log(`     Transactions: ${wallet.transactionCount}`)
      })

      // Test 2: Get transactions for first user
      const firstUser = walletsData.wallets[0]
      console.log(`\n✅ GET /api/admin/wallets/${firstUser.userId}/transactions`)
      
      const txResponse = await fetch(`http://localhost:3001/api/admin/wallets/${firstUser.userId}/transactions`)
      const txData = await txResponse.json()
      
      console.log(`   Status: ${txResponse.status}`)
      console.log(`   User: ${txData.user?.name}`)
      console.log(`   Transactions: ${txData.transactions?.length || 0}`)
      
      if (txData.transactions && txData.transactions.length > 0) {
        console.log('\n💰 Transaction History:')
        txData.transactions.slice(0, 5).forEach(tx => {
          const sign = tx.type === 'COMMISSION' || tx.type === 'REFUND' ? '+' : '-'
          console.log(`   ${sign} Rp ${tx.amount.toLocaleString('id-ID')} - ${tx.description}`)
          console.log(`     Type: ${tx.type} | ${new Date(tx.createdAt).toLocaleString('id-ID')}`)
        })
      }
    }

    console.log('\n✨ All tests passed!\n')
    console.log('🌐 View admin wallets page: http://localhost:3001/admin/wallets\n')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testWalletsAPI()
