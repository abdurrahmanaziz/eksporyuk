/**
 * COMMISSION DISCREPANCY ANALYSIS
 * =================================
 * 
 * Our calculation shows Rp. 3.6B commissions vs Sejoli dashboard Rp. 1.3B
 * Let's investigate the actual commission distribution in Sejoli
 */

const axios = require('axios')

async function analyzeSejoli() {
    console.log('\n🔍 COMMISSION DISCREPANCY ANALYSIS')
    console.log('━'.repeat(50))
    
    try {
        // Fetch sales data
        console.log('\n📊 Fetching Sejoli sales data...')
        const salesResponse = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
            params: {
                'per_page': 50, // Test with smaller sample
                'status': 'completed'
            },
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        })
        
        const sales = salesResponse.data.orders || salesResponse.data || []
        console.log(`✅ Fetched ${sales.length} sales records`)
        
        if (!sales || sales.length === 0) {
            console.log('⚠️ No sales data received, checking response structure...')
            console.log('Response status:', salesResponse.status)
            console.log('Response keys:', Object.keys(salesResponse.data || {}))
            return
        }
        
        // Fetch products data  
        console.log('\n📦 Fetching products data...')
        const productsResponse = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot', 
                'Accept': 'application/json'
            }
        })
        
        const products = productsResponse.data
        console.log(`✅ Fetched ${products.length} products`)
        
        // Build commission lookup
        const commissionLookup = new Map()
        let productsWithCommission = 0
        
        for (const product of products) {
            if (product.affiliate && product.affiliate[1] && product.affiliate[1].fee) {
                const fee = product.affiliate[1].fee
                
                // Parse commission value - fee might be string or number
                let commissionValue = 0
                const feeStr = String(fee)
                
                if (feeStr.includes('%')) {
                    // Percentage commission
                    commissionValue = parseFloat(feeStr.replace('%', '')) / 100
                    commissionLookup.set(product.id, { 
                        type: 'percentage', 
                        value: commissionValue,
                        price: parseFloat(product.price) || 0
                    })
                } else {
                    // Flat commission
                    commissionValue = parseFloat(feeStr.replace(/[^\d]/g, '')) || 0
                    commissionLookup.set(product.id, { 
                        type: 'flat', 
                        value: commissionValue,
                        price: parseFloat(product.price) || 0
                    })
                }
                productsWithCommission++
            }
        }
        
        console.log(`\n💰 Commission lookup built: ${productsWithCommission} products with commission data`)
        
        // Analyze sales commission patterns
        console.log('\n🧮 ANALYZING ACTUAL COMMISSION PATTERNS:')
        console.log('━'.repeat(50))
        
        let totalRevenue = 0
        let totalCommissions = 0
        let ordersWithCommission = 0
        let ordersWithoutCommission = 0
        let commissionDetails = []
        
        for (const sale of sales) {
            const amount = parseFloat(sale.grand_total) || 0
            totalRevenue += amount
            
            // Check if this product has commission
            const productId = sale.product_id
            const commissionData = commissionLookup.get(productId)
            
            if (commissionData) {
                let commission = 0
                if (commissionData.type === 'flat') {
                    commission = commissionData.value
                } else {
                    commission = amount * commissionData.value
                }
                
                totalCommissions += commission
                ordersWithCommission++
                
                // Store details for analysis
                commissionDetails.push({
                    product: sale.product_name,
                    amount: amount,
                    commission: commission,
                    type: commissionData.type,
                    rate: commissionData.type === 'flat' ? 
                        (commission / amount * 100).toFixed(1) + '%' : 
                        (commissionData.value * 100).toFixed(1) + '%'
                })
            } else {
                ordersWithoutCommission++
                
                // Log products without commission data
                console.log(`⚠️ No commission data: ${sale.product_name} (ID: ${productId})`)
            }
        }
        
        console.log(`\n📊 SAMPLE ANALYSIS RESULTS:`)
        console.log('━'.repeat(30))
        console.log(`💰 Total revenue (sample): Rp. ${totalRevenue.toLocaleString()}`)
        console.log(`🏆 Total commissions (sample): Rp. ${totalCommissions.toLocaleString()}`)
        console.log(`📈 Commission rate: ${(totalCommissions/totalRevenue*100).toFixed(1)}%`)
        console.log(`✅ Orders with commission: ${ordersWithCommission}`)
        console.log(`❌ Orders without commission: ${ordersWithoutCommission}`)
        
        // Show top commission examples
        console.log(`\n💎 TOP COMMISSION EXAMPLES:`)
        commissionDetails
            .sort((a, b) => b.commission - a.commission)
            .slice(0, 10)
            .forEach((detail, i) => {
                console.log(`  ${i+1}. ${detail.product}`)
                console.log(`     Revenue: Rp. ${detail.amount.toLocaleString()}`)
                console.log(`     Commission: Rp. ${detail.commission.toLocaleString()} (${detail.rate})`)
                console.log(`     Type: ${detail.type.toUpperCase()}`)
            })
        
        // Project to full dataset
        const projectedFullCommissionRate = totalCommissions / totalRevenue
        console.log(`\n🔮 PROJECTION TO FULL DATASET:`)
        console.log('━'.repeat(40))
        console.log(`📊 Projected commission rate: ${(projectedFullCommissionRate*100).toFixed(1)}%`)
        console.log(`💰 Full dataset revenue: Rp. 4,155,014,001`)
        console.log(`🏆 Projected commissions: Rp. ${(4155014001 * projectedFullCommissionRate).toLocaleString()}`)
        console.log(`🎯 Sejoli dashboard: Rp. 1,256,771,000`)
        console.log(`📊 Accuracy: ${(1256771000 / (4155014001 * projectedFullCommissionRate) * 100).toFixed(1)}%`)
        
        // Investigate possible causes of discrepancy
        console.log(`\n🕵️ POSSIBLE DISCREPANCY CAUSES:`)
        console.log('━'.repeat(40))
        console.log(`1. Not all transactions have affiliate commissions`)
        console.log(`2. Some transactions may be from direct sales (no affiliate)`)
        console.log(`3. Commission rules may have changed over time`)
        console.log(`4. Some products may have disabled commissions`)
        console.log(`5. Sejoli dashboard might filter by paid/approved commissions only`)
        
    } catch (error) {
        console.error('❌ Error:', error.message)
        if (error.response) {
            console.error('Response:', error.response.status, error.response.statusText)
        }
    }
}

analyzeSejoli()