/**
 * FIX CUSTOMER NAME FROM USER RELATION
 * =====================================
 * 
 * Update customerName dari user.name yang sudah ada di relasi
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCustomerNames() {
    console.log('\n🔧 FIX CUSTOMER NAMES FROM USER RELATION');
    console.log('━'.repeat(60));
    
    try {
        // Get all Sejoli transactions with user relation
        const transactions = await prisma.transaction.findMany({
            where: {
                externalId: {
                    startsWith: 'SEJOLI-'
                },
                OR: [
                    { customerName: null },
                    { customerName: 'Unknown' },
                    { customerName: '' }
                ]
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        whatsapp: true
                    }
                }
            }
        });
        
        console.log(`\n📊 Found ${transactions.length} transactions to fix\n`);
        
        let updated = 0;
        let skipped = 0;
        
        for (const tx of transactions) {
            if (!tx.user) {
                console.log(`⚠️  Transaction ${tx.invoiceNumber} has no user relation`);
                skipped++;
                continue;
            }
            
            try {
                await prisma.transaction.update({
                    where: { id: tx.id },
                    data: {
                        customerName: tx.user.name,
                        customerEmail: tx.user.email || tx.customerEmail,
                        customerPhone: tx.user.phone || tx.customerPhone,
                        customerWhatsapp: tx.user.whatsapp || tx.customerWhatsapp
                    }
                });
                
                updated++;
                
                if (updated % 100 === 0) {
                    console.log(`   ⏳ Updated ${updated}/${transactions.length} transactions...`);
                }
            } catch (error) {
                console.error(`   ❌ Failed to update ${tx.invoiceNumber}: ${error.message}`);
                skipped++;
            }
        }
        
        console.log('\n' + '═'.repeat(60));
        console.log('✅ FIX COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log('═'.repeat(60));
        
        // Verify
        console.log('\n🔍 VERIFICATION - Sample 5 transaksi:\n');
        const samples = await prisma.transaction.findMany({
            where: {
                externalId: { startsWith: 'SEJOLI-' }
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                invoiceNumber: true,
                customerName: true,
                customerEmail: true,
                amount: true
            }
        });
        
        samples.forEach((tx, i) => {
            console.log(`${i+1}. Invoice: ${tx.invoiceNumber}`);
            console.log(`   Customer: ${tx.customerName}`);
            console.log(`   Email: ${tx.customerEmail}`);
            console.log(`   Amount: Rp. ${tx.amount.toLocaleString()}\n`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

fixCustomerNames();
