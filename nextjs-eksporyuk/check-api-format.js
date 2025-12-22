/**
 * QUICK API RESPONSE FORMAT CHECK
 */
const axios = require('axios')

async function checkAPIFormat() {
    try {
        console.log('📡 Checking Sejoli API response format...')
        
        const response = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
            params: { 'per_page': 5 },
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        })
        
        console.log('Status:', response.status)
        console.log('Data type:', typeof response.data)
        console.log('Data keys:', Object.keys(response.data || {}))
        console.log('First few characters:', JSON.stringify(response.data).substring(0, 200))
        
        // Check if data has sales property
        if (response.data && response.data.sales) {
            console.log('✅ Found sales array:', response.data.sales.length)
        } else if (Array.isArray(response.data)) {
            console.log('✅ Direct array response:', response.data.length)
        } else {
            console.log('❌ Unexpected format')
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message)
    }
}

checkAPIFormat()