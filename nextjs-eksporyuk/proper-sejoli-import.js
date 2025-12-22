/**
 * PROPER SEJOLI IMPORT TO NEON
 * =============================
 * 
 * Import transaksi Sejoli dengan benar:
 * 1. Map user Sejoli ke user NEON (by email/username)
 * 2. Skip duplikat yang sudah ada
 * 3. Komisi sesuai data produk
 * 4. Nama user asli, bukan dummy
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function properSejoliImport() {
    console.log('\n🚀 PROPER SEJOLI IMPORT TO NEON');
    console.log('━'.repeat(60));
    
    try {
        // 1. Fetch semua user dari NEON untuk mapping
        console.log('\n📊 Fetching NEON users for mapping...');
        const neonUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                name: true
            }
        });
        
        // Build user lookup by email
        const userByEmail = new Map();
        const userByUsername = new Map();
        neonUsers.forEach(user => {
            if (user.email) userByEmail.set(user.email.toLowerCase(), user.id);
            if (user.username) userByUsername.set(user.username.toLowerCase(), user.id);
        });
        
        console.log(`✅ Loaded ${neonUsers.length} NEON users for mapping`);
        
        // 2. Fetch existing Sejoli transactions to prevent duplicates
        console.log('\n📋 Checking existing Sejoli transactions...');
        const existing = await prisma.transaction.findMany({
            where: {
                externalId: {
                    startsWith: 'SEJOLI-'
                }
            },
            select: {
                externalId: true
            }
        });
        
        const existingIds = new Set(existing.map(t => t.externalId));
        console.log(`✅ Found ${existingIds.size} existing Sejoli transactions`);
        
        // 3. Fetch commission lookup from products
        console.log('\n💰 Building commission lookup...');
        const productsResponse = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/products', {
            headers: {
                'User-Agent': 'Eksporyuk Migration Bot',
                'Accept': 'application/json'
            }
        });
        
        const products = productsResponse.data;
        const commissionLookup = new Map();
        
        for (const product of products) {
            if (product.affiliate && product.affiliate[1] && product.affiliate[1].fee) {
                const fee = product.affiliate[1].fee;
                const feeStr = String(fee);
                
                if (feeStr.includes('%')) {
                    const percentage = parseFloat(feeStr.replace('%', '')) / 100;
                    commissionLookup.set(product.id, {
                        type: 'percentage',
                        value: percentage
                    });
                } else {
                    const flatAmount = parseFloat(feeStr.replace(/[^\d]/g, '')) || 0;
                    commissionLookup.set(product.id, {
                        type: 'flat',
                        value: flatAmount
                    });
                }
            }
        }
        
        console.log(`✅ Commission data loaded for ${commissionLookup.size} products`);
        
        // 4. Fetch Sejoli sales data
        console.log('\n📦 Fetching Sejoli sales data...');
        let allOrders = [];
        let page = 1;
        let hasMore = true;
        const perPage = 100;
        
        while (hasMore && page <= 200) { // Safety limit: max 200 pages
            const response = await axios.get('https://member.eksporyuk.com/wp-json/sejoli-api/v1/sales', {
                params: {
                    'per_page': perPage,
                    'page': page
                },
                headers: {
                    'User-Agent': 'Eksporyuk Migration Bot',
                    'Accept': 'application/json'
                }
            });
            
            const orders = response.data.orders || [];
            
            // Sejoli API returns all orders regardless of pagination
            // So we need to check if we got the same data
            if (page === 1) {
                allOrders = orders;
                console.log(`   ✅ Fetched all ${orders.length} orders from Sejoli`);
                hasMore = false; // API returns everything in first call
            } else if (orders.length === 0 || orders.length < perPage) {
                hasMore = false;
            } else {
                // Only add new orders not already in array
                const existingOrderIds = new Set(allOrders.map(o => o.ID));
                const newOrders = orders.filter(o => !existingOrderIds.has(o.ID));
                
                if (newOrders.length === 0) {
                    hasMore = false; // No new orders, stop
                } else {
                    allOrders = allOrders.concat(newOrders);
                    console.log(`   Fetched page ${page}: ${newOrders.length} new orders (Total: ${allOrders.length})`);
                    page++;
                }
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`\n✅ Total Sejoli orders fetched: ${allOrders.length}`);
        
        // 5. Process and import
        console.log('\n🔄 Processing orders for import...');
        
        let stats = {
            total: allOrders.length,
            skipped: 0,
            imported: 0,
            failed: 0,
            userNotFound: 0,
            withCommission: 0,
            withoutCommission: 0
        };
        
        for (const order of allOrders) {
            const externalId = `SEJOLI-${order.ID}`;
            
            // Skip if already exists
            if (existingIds.has(externalId)) {
                stats.skipped++;
                continue;
            }
            
            try {
                // Map user
                let userId = null;
                const buyerEmail = order.buyer_email?.toLowerCase();
                const buyerName = order.buyer_name;
                
                if (buyerEmail && userByEmail.has(buyerEmail)) {
                    userId = userByEmail.get(buyerEmail);
                } else {
                    // Create new user if not found
                    const newUser = await prisma.user.create({
                        data: {
                            email: order.buyer_email || `sejoli-${order.user_id}@eksporyuk.com`,
                            name: buyerName || 'Sejoli User',
                            username: `sejoli-${order.user_id}`,
                            password: 'MIGRATED', // Will need to reset password
                            role: 'MEMBER_FREE',
                            whatsapp: order.buyer_phone || null
                        }
                    });
                    userId = newUser.id;
                    userByEmail.set(newUser.email.toLowerCase(), newUser.id);
                    
                    console.log(`   ✨ Created new user: ${newUser.name} (${newUser.email})`);
                }
                
                // Calculate commission
                const amount = parseFloat(order.grand_total) || 0;
                let commissionAmount = 0;
                
                if (commissionLookup.has(order.product_id)) {
                    const commData = commissionLookup.get(order.product_id);
                    if (commData.type === 'flat') {
                        commissionAmount = commData.value;
                    } else {
                        commissionAmount = amount * commData.value;
                    }
                    stats.withCommission++;
                } else {
                    stats.withoutCommission++;
                }
                
                // Map status
                const sejoliStatus = order.status?.toLowerCase() || '';
                let neonStatus = 'PENDING';
                if (sejoliStatus === 'completed') neonStatus = 'SUCCESS';
                else if (sejoliStatus === 'on-hold') neonStatus = 'PENDING';
                else if (sejoliStatus === 'cancelled' || sejoliStatus === 'refunded') neonStatus = 'FAILED';
                
                // Create transaction
                const transaction = await prisma.transaction.create({
                    data: {
                        userId: userId,
                        type: 'MEMBERSHIP',
                        amount: amount,
                        status: neonStatus,
                        paymentMethod: order.payment_info?.bank || 'UNKNOWN',
                        externalId: externalId,
                        metadata: {
                            source: 'sejoli',
                            sejoliOrderId: order.ID,
                            productId: order.product_id,
                            productName: order.product_name,
                            buyerName: buyerName,
                            buyerEmail: order.buyer_email,
                            buyerPhone: order.buyer_phone,
                            affiliateId: order.affiliate_id || null,
                            couponCode: order.coupon_code || null,
                            commission: commissionAmount
                        },
                        createdAt: new Date(order.created_at),
                        updatedAt: order.updated_at && order.updated_at !== '0000-00-00 00:00:00' 
                            ? new Date(order.updated_at) 
                            : new Date(order.created_at)
                    }
                });
                
                stats.imported++;
                
                if (stats.imported % 100 === 0) {
                    console.log(`   ⏳ Imported ${stats.imported}/${stats.total - stats.skipped} transactions...`);
                }
                
            } catch (error) {
                console.error(`   ❌ Failed to import order ${order.ID}: ${error.message}`);
                stats.failed++;
            }
        }
        
        // Final report
        console.log('\n' + '═'.repeat(60));
        console.log('✅ IMPORT COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`📊 Total Sejoli orders: ${stats.total}`);
        console.log(`⏭️  Skipped (already exists): ${stats.skipped}`);
        console.log(`✅ Successfully imported: ${stats.imported}`);
        console.log(`❌ Failed: ${stats.failed}`);
        console.log(`💰 With commission: ${stats.withCommission}`);
        console.log(`📦 Without commission: ${stats.withoutCommission}`);
        console.log('═'.repeat(60));
        
    } catch (error) {
        console.error('❌ Import failed:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

properSejoliImport();
