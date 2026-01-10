/**
 * INSPECT SEJOLI DATA STRUCTURE
 * Lihat struktur data lengkap dari Sejoli API
 */

const axios = require('axios');

async function inspectSejoliData() {
    console.log('🔍 INSPECTING SEJOLI DATA STRUCTURE\n');
    
    try {
        // 1. Fetch sample orders
        const ordersResponse = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
            params: { 'per_page': 5 },
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        });
        
        const orders = ordersResponse.data.orders || [];
        
        console.log('📦 SAMPLE ORDERS (5 terakhir):\n');
        orders.slice(0, 5).forEach((order, i) => {
            console.log(`\n${i+1}. ORDER ID: ${order.ID}`);
            console.log('═'.repeat(60));
            console.log('BUYER INFO:');
            console.log(`  Name: ${order.buyer_name}`);
            console.log(`  Email: ${order.buyer_email}`);
            console.log(`  Phone: ${order.buyer_phone}`);
            console.log(`  User ID: ${order.user_id}`);
            console.log('\nPRODUCT INFO:');
            console.log(`  Product ID: ${order.product_id}`);
            console.log(`  Product Name: ${order.product_name}`);
            console.log('\nPRICING:');
            console.log(`  Grand Total: ${order.grand_total}`);
            console.log(`  Subtotal: ${order.subtotal}`);
            console.log(`  Discount: ${order.discount || 0}`);
            console.log('\nAFFILIATE:');
            console.log(`  Affiliate ID: ${order.affiliate_id || 'None'}`);
            console.log(`  Coupon Code: ${order.coupon_code || 'None'}`);
            console.log('\nSTATUS & DATES:');
            console.log(`  Status: ${order.status}`);
            console.log(`  Created: ${order.created_at}`);
            console.log(`  Updated: ${order.updated_at}`);
            console.log('\nPAYMENT:');
            console.log(`  Payment Info: ${JSON.stringify(order.payment_info, null, 2)}`);
            console.log('\nFULL ORDER DATA:');
            console.log(JSON.stringify(order, null, 2));
        });
        
        // 2. Fetch products with commission
        const productsResponse = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        });
        
        const products = productsResponse.data;
        const productsWithCommission = products.filter(p => p.affiliate && p.affiliate[1] && p.affiliate[1].fee);
        
        console.log('\n\n💰 PRODUCTS WITH COMMISSION:\n');
        productsWithCommission.slice(0, 10).forEach((product, i) => {
            console.log(`\n${i+1}. ${product.name}`);
            console.log('─'.repeat(60));
            console.log(`  ID: ${product.id}`);
            console.log(`  Price: Rp. ${parseFloat(product.price).toLocaleString()}`);
            console.log(`  Commission: ${product.affiliate[1].fee}`);
            console.log(`  Type: ${product.affiliate[1].type || 'N/A'}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

inspectSejoliData();
