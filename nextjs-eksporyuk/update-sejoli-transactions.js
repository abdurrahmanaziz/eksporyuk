/**
 * UPDATE SEJOLI TRANSACTIONS WITH COMPLETE DATA
 * ==============================================
 * 
 * Update 1,935 transaksi Sejoli yang sudah ada dengan data lengkap:
 * - Invoice number (dari Sejoli order ID)
 * - Customer name, email, phone
 * - Metadata lengkap
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function updateSejoliTransactions() {
    console.log('\n🔄 UPDATE SEJOLI TRANSACTIONS WITH COMPLETE DATA');
    console.log('━'.repeat(60));
    
    try {
        // 1. Fetch all Sejoli orders
        console.log('\n📦 Fetching Sejoli orders...');
        const response = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
            params: { 'per_page': 100 },
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        });
        
        const orders = response.data.orders || [];
        console.log(`✅ Fetched ${orders.length} orders from Sejoli`);
        
        // Build order lookup by ID
        const orderLookup = new Map();
        orders.forEach(order => {
            orderLookup.set(order.ID, order);
        });
        
        // 2. Get all Sejoli transactions from NEON
        console.log('\n📊 Fetching Sejoli transactions from NEON...');
        const transactions = await prisma.transaction.findMany({
            where: {
                externalId: {
                    startsWith: 'SEJOLI-'
                }
            },
            select: {
                id: true,
                externalId: true,
                invoiceNumber: true,
                customerName: true,
                amount: true,
                metadata: true
            }
        });
        
        console.log(`✅ Found ${transactions.length} Sejoli transactions in NEON`);
        
        // 3. Update transactions
        console.log('\n🔄 Updating transactions...');
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const tx of transactions) {
            // Extract Sejoli order ID from externalId (SEJOLI-12345 -> 12345)
            const sejoliOrderId = parseInt(tx.externalId.replace('SEJOLI-', ''));
            const order = orderLookup.get(sejoliOrderId);
            
            if (!order) {
                console.log(`⚠️  Order ${sejoliOrderId} not found in Sejoli data`);
                skipped++;
                continue;
            }
            
            // Check if already updated (has customer name)
            if (tx.customerName) {
                skipped++;
                continue;
            }
            
            try {
                // Update with complete data
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        invoiceNumber: `INV${order.ID}`,
                        customerName: order.buyer_name || 'Unknown',
                        customerEmail: order.buyer_email || null,
                        customerPhone: order.buyer_phone || null,
                        metadata: {
                            ...tx.metadata,
                            sejoliOrderId: order.ID,
                            productId: order.product_id,
                            productName: order.product_name,
                            buyerName: order.buyer_name,
                            buyerEmail: order.buyer_email,
                            buyerPhone: order.buyer_phone,
                            affiliateId: order.affiliate_id || null,
                            couponCode: order.coupon_code || null,
                            status: order.status,
                            paymentInfo: order.payment_info || null
                        }
                    }
                });
                
                updated++;
                
                if (updated % 100 === 0) {
                    console.log(`   ⏳ Updated ${updated}/${transactions.length} transactions...`);
                }
                
            } catch (error) {
                console.error(`   ❌ Failed to update ${tx.externalId}: ${error.message}`);
                errors++;
            }
        }
        
        // Final report
        console.log('\n' + '═'.repeat(60));
        console.log('✅ UPDATE COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`📊 Total transactions: ${transactions.length}`);
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️  Skipped (already complete): ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('═'.repeat(60));
        
    } catch (error) {
        console.error('❌ Update failed:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

updateSejoliTransactions();
