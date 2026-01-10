/**
 * ROLLBACK WRONG SEJOLI IMPORT
 * ==============================
 * 
 * Hapus transaksi Sejoli yang salah import (pakai dummy user)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rollbackWrongImport() {
    console.log('\n⚠️  ROLLBACK WRONG SEJOLI IMPORT');
    console.log('━'.repeat(60));
    
    try {
        // 1. Cek transaksi dengan dummy user
        console.log('\n🔍 Checking transactions with Sejoli Migration User...');
        const dummyUserTransactions = await prisma.transaction.count({
            where: {
                userId: 'SEJOLI-MIGRATION'
            }
        });
        
        console.log(`Found ${dummyUserTransactions} transactions with dummy user`);
        
        // 2. Cek semua transaksi Sejoli
        const sejoliTransactions = await prisma.transaction.count({
            where: {
                externalId: {
                    startsWith: 'SEJOLI-'
                }
            }
        });
        
        console.log(`Found ${sejoliTransactions} total Sejoli transactions`);
        
        // 3. Ask for confirmation
        console.log('\n⚠️  WARNING: This will delete:');
        console.log(`   - ${dummyUserTransactions} transactions with dummy user`);
        console.log(`   - Associated commissions`);
        console.log(`   - Dummy user account`);
        console.log('\n');
        
        // Just delete transactions - wallet transactions will be handled automatically
        console.log('🗑️  Deleting Sejoli transactions with dummy user...');
        const deletedTransactions = await prisma.transaction.deleteMany({
            where: {
                userId: 'SEJOLI-MIGRATION'
            }
        });
        console.log(`   ✅ Deleted ${deletedTransactions.count} transactions`);
        
        // Delete dummy user
        console.log('🗑️  Deleting dummy user...');
        try {
            await prisma.user.delete({
                where: {
                    id: 'SEJOLI-MIGRATION'
                }
            });
            console.log(`   ✅ Deleted dummy user`);
        } catch (e) {
            console.log(`   ⚠️  Dummy user not found or already deleted`);
        }
        
        // Final check
        console.log('\n📊 FINAL CHECK:');
        const remaining = await prisma.transaction.count();
        console.log(`   Total transactions remaining: ${remaining}`);
        
        const sejoliRemaining = await prisma.transaction.count({
            where: {
                externalId: {
                    startsWith: 'SEJOLI-'
                }
            }
        });
        console.log(`   Sejoli transactions remaining: ${sejoliRemaining}`);
        
        console.log('\n✅ ROLLBACK COMPLETE!');
        console.log('   Ready for proper import with real user mapping');
        
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

rollbackWrongImport();
