/**
 * Fetch Latest Sejoli Sales Data
 * Ambil data transaksi terbaru dari Sejoli API
 */

const axios = require('axios')
const fs = require('fs')

const SEJOLI_API_URL = process.env.SEJOLI_API_URL || 'https://member.eksporyuk.com/wp-json/sejoli-api/v1'
const SEJOLI_API_USERNAME = process.env.SEJOLI_API_USERNAME || 'admin_ekspor'
const SEJOLI_API_PASSWORD = process.env.SEJOLI_API_PASSWORD || 'Eksporyuk2024#'

async function fetchSejoliSales() {
  console.log('📡 Fetching sales data from Sejoli API...\n')

  try {
    const auth = Buffer.from(`${SEJOLI_API_USERNAME}:${SEJOLI_API_PASSWORD}`).toString('base64')
    
    const response = await axios.get(`${SEJOLI_API_URL}/sales`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 seconds
    })

    console.log(`✅ API Response Status: ${response.status}`)
    
    // Extract orders from response
    const sales = response.data.orders || []
    
    console.log(`📊 Total Sales Fetched: ${sales.length}`)
    console.log(`📊 Total Records: ${response.data.recordsTotal || 0}`)
    console.log(`📊 Filtered Records: ${response.data.recordsFiltered || 0}`)

    if (sales.length > 0) {
      // Statistics
      console.log('\n📈 Sales Statistics:')
      
      // By status
      const byStatus = sales.reduce((acc, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1
        return acc
      }, {})
      console.log('\nBy Status:')
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })

      // Date range
      const dates = sales.map(s => new Date(s.created_at))
      const oldest = new Date(Math.min(...dates))
      const newest = new Date(Math.max(...dates))
      console.log('\nDate Range:')
      console.log(`   Oldest: ${oldest.toLocaleString('id-ID')}`)
      console.log(`   Newest: ${newest.toLocaleString('id-ID')}`)

      // Total amount
      const totalAmount = sales.reduce((sum, s) => sum + Number(s.grand_total || 0), 0)
      console.log(`\nTotal Amount: Rp ${totalAmount.toLocaleString('id-ID')}`)

      // With affiliate
      const withAffiliate = sales.filter(s => s.affiliate_id && s.affiliate_id !== '0').length
      console.log(`\nWith Affiliate: ${withAffiliate}`)

      // Sample first sale
      console.log('\n📋 Sample Sale (first record):')
      console.log(JSON.stringify(sales[0], null, 2))

      // Save to file
      const filename = `sejoli-sales-${Date.now()}.json`
      fs.writeFileSync(filename, JSON.stringify(sales, null, 2))
      console.log(`\n💾 Data saved to: ${filename}`)

      return sales
    } else {
      console.log('⚠️  No sales data found')
      return []
    }

  } catch (error) {
    console.error('\n❌ Error fetching sales:')
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error(`Message: ${error.response.statusText}`)
      console.error(`Data:`, JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('Error:', error.message)
    }
    throw error
  }
}

fetchSejoliSales()
  .then(() => {
    console.log('\n✅ Fetch completed!')
    process.exit(0)
  })
  .catch(() => {
    console.log('\n❌ Fetch failed!')
    process.exit(1)
  })
