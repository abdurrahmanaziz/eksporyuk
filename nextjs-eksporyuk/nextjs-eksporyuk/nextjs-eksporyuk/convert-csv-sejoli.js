const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function convertCsvToJson(csvFilePath) {
  try {
    const csvData = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
    
    console.log('📄 CSV Headers:', headers)
    
    const transactions = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = []
      let current = ''
      let inQuotes = false
      
      // Parse CSV dengan handling quotes yang proper
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current)
          current = ''
        } else {
          current += char
        }
      }
      values.push(current) // Last value
      
      if (values.length >= headers.length) {
        const transaction = {}
        headers.forEach((header, index) => {
          transaction[header] = values[index]?.replace(/"/g, '') || ''
        })
        
        // Calculate commission based on product type and affiliate
        const commission = calculateCommission(transaction)
        
        // Convert to our API format
        const convertedTxn = {
          id: transaction.INV,
          email: transaction.email,
          customerName: transaction.name,
          phone: transaction.phone,
          productName: transaction.product,
          price: transaction.price,
          status: transaction.status === 'Selesai' ? 'completed' : 'pending',
          date: transaction.created_at,
          affiliateCode: transaction.affiliate_id,
          affiliateName: transaction.affiliate,
          commissionAmount: commission.toString(),
          paymentMethod: transaction.payment,
          quantity: transaction.quantity || '1',
          originalData: transaction
        }
        
        transactions.push(convertedTxn)
      }
    }
    
    console.log(`✅ Converted ${transactions.length} transactions`)
    return transactions
    
  } catch (error) {
    console.error('❌ CSV conversion error:', error)
    return []
  }
}

function calculateCommission(transaction) {
  const price = parseFloat(transaction.price) || 0
  const affiliateId = transaction.affiliate_id
  
  // Commission rates based on product and affiliate
  const commissionRates = {
    'Rahmat Al Fianto': 0.325, // 32.5% untuk Rahmat
    'default': 0.30 // 30% untuk affiliate lain
  }
  
  const affiliateName = transaction.affiliate
  const rate = commissionRates[affiliateName] || commissionRates['default']
  
  return Math.round(price * rate)
}

// Test dengan data sample
async function testCsvConversion() {
  console.log('🧪 Testing CSV to JSON Conversion')
  console.log('=' .repeat(50))
  
  const sampleCsvPath = '/Users/abdurrahmanaziz/Downloads/export-orders-EKSPOR-YUK-2025-12-20-13-11-31-1637.csv'
  
  if (fs.existsSync(sampleCsvPath)) {
    const transactions = await convertCsvToJson(sampleCsvPath)
    
    console.log('\n📊 Conversion Results:')
    console.log(`Total transactions: ${transactions.length}`)
    
    if (transactions.length > 0) {
      console.log('\nSample converted transaction:')
      console.log(JSON.stringify(transactions[0], null, 2))
      
      // Analisis komisi
      const totalSales = transactions.reduce((sum, txn) => sum + parseFloat(txn.price), 0)
      const totalCommission = transactions.reduce((sum, txn) => sum + parseFloat(txn.commissionAmount), 0)
      
      console.log('\n💰 Commission Analysis:')
      console.log(`Total Sales: Rp ${totalSales.toLocaleString()}`)
      console.log(`Total Commission: Rp ${totalCommission.toLocaleString()}`)
      console.log(`Commission Rate: ${((totalCommission / totalSales) * 100).toFixed(2)}%`)
      
      // Group by affiliate
      const affiliateStats = {}
      transactions.forEach(txn => {
        const name = txn.affiliateName
        if (!affiliateStats[name]) {
          affiliateStats[name] = { sales: 0, commission: 0, count: 0 }
        }
        affiliateStats[name].sales += parseFloat(txn.price)
        affiliateStats[name].commission += parseFloat(txn.commissionAmount)
        affiliateStats[name].count += 1
      })
      
      console.log('\n👤 Affiliate Breakdown:')
      Object.entries(affiliateStats).forEach(([name, stats]) => {
        console.log(`${name}:`)
        console.log(`  Sales: Rp ${stats.sales.toLocaleString()} (${stats.count} txn)`)
        console.log(`  Commission: Rp ${stats.commission.toLocaleString()}`)
        console.log(`  Rate: ${((stats.commission / stats.sales) * 100).toFixed(2)}%`)
      })
      
      // Save converted JSON
      const outputPath = '/Users/abdurrahmanaziz/Herd/eksporyuk/nextjs-eksporyuk/converted-sejoli-data.json'
      fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2))
      console.log(`\n💾 Saved converted data to: ${outputPath}`)
      
      return transactions
    }
  } else {
    console.log('❌ CSV file not found:', sampleCsvPath)
  }
  
  return []
}

if (require.main === module) {
  testCsvConversion()
    .then(() => {
      console.log('\n✅ CSV conversion test completed!')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}

module.exports = { convertCsvToJson, calculateCommission }